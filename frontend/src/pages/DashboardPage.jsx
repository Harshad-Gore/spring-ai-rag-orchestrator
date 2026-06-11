import { useState, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.js'
import { getStoredAuthToken } from '../services/authApi.js'
import DashboardNavbar from '../components/dashboard/DashboardNavbar.jsx'
import NotebookLibrary from '../components/dashboard/NotebookLibrary.jsx'
import NotebookWorkspace from '../components/dashboard/NotebookWorkspace.jsx'
import UploadModal from '../components/dashboard/UploadModal.jsx'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
let nextId = 1
function uid() {
  return `msg-${Date.now()}-${nextId++}`
}

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080').replace(/\/+$/, '')

function authHeaders() {
  const token = getStoredAuthToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

async function apiFetch(path, options = {}) {
  return fetch(`${API_BASE_URL}${path}`, {
    credentials: 'include',
    ...options,
    headers: {
      ...authHeaders(),
      ...(options.headers || {}),
    },
  })
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
function DashboardPage() {
  const navigate = useNavigate()
  const { logout } = useAuth()

  // Core state
  const [notebooks, setNotebooks] = useState([])
  const [activeNotebookId, setActiveNotebookId] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [isLoadingNotebooks, setIsLoadingNotebooks] = useState(true)

  // Fetch notebooks from database on mount
  useEffect(() => {
    async function fetchNotebooks() {
      try {
        const res = await apiFetch('/api/notebooks')
        if (res.ok) {
          const data = await res.json()
          setNotebooks(
            data.map((nb) => ({ ...nb, documents: [], chatHistory: [] })),
          )
        }
      } catch (err) {
        console.error('Failed to fetch notebooks:', err)
      } finally {
        setIsLoadingNotebooks(false)
      }
    }
    fetchNotebooks()
  }, [])

  // Derived
  const activeNotebook = activeNotebookId
    ? notebooks.find((nb) => nb.id === activeNotebookId) ?? null
    : null

  // ------- Notebook CRUD -------

  const handleCreateNotebook = useCallback(async () => {
    try {
      const res = await apiFetch('/api/notebooks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Untitled Notebook' }),
      })
      if (!res.ok) throw new Error(`Create failed: ${res.statusText}`)
      const nb = await res.json()
      setNotebooks((prev) => [
        { ...nb, documents: [], chatHistory: [] },
        ...prev,
      ])
      setActiveNotebookId(nb.id)
      setSearchQuery('')
    } catch (err) {
      console.error('Failed to create notebook:', err)
    }
  }, [])

  const handleOpenNotebook = useCallback(async (id) => {
    setActiveNotebookId(id)
    setSearchQuery('')
    try {
      const res = await apiFetch(`/api/documents?notebookId=${encodeURIComponent(id)}`)
      if (res.ok) {
        const docs = await res.json()
        setNotebooks((prev) =>
          prev.map((nb) =>
            nb.id === id
              ? {
                  ...nb,
                  documents: docs.map((d) => ({ id: d.id, title: d.fileName })),
                }
              : nb,
          ),
        )
      }
    } catch (err) {
      console.error('Failed to fetch documents:', err)
    }
  }, [])

  const handleRenameNotebook = useCallback(async (id, newTitle) => {
    try {
      const res = await apiFetch(`/api/notebooks/${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle }),
      })
      if (!res.ok) throw new Error(`Rename failed: ${res.statusText}`)
      const updated = await res.json()
      setNotebooks((prev) =>
        prev.map((nb) =>
          nb.id === id ? { ...nb, title: updated.title } : nb,
        ),
      )
    } catch (err) {
      console.error('Failed to rename notebook:', err)
    }
  }, [])

  const handleDeleteNotebook = useCallback(
    async (id) => {
      try {
        const res = await apiFetch(`/api/notebooks/${encodeURIComponent(id)}`, {
          method: 'DELETE',
        })
        if (!res.ok) throw new Error(`Delete failed: ${res.statusText}`)
        setNotebooks((prev) => prev.filter((nb) => nb.id !== id))
        if (activeNotebookId === id) setActiveNotebookId(null)
      } catch (err) {
        console.error('Failed to delete notebook:', err)
      }
    },
    [activeNotebookId],
  )

  const handleGoHome = useCallback(() => {
    setActiveNotebookId(null)
  }, [])

  // ------- Documents -------

  const handleUploadFiles = useCallback(
    async (files) => {
      if (!activeNotebookId) return

      try {
        const formData = new FormData()
        Array.from(files).forEach((file) => formData.append('files', file))
        formData.append('notebookId', activeNotebookId)

        const response = await apiFetch('/api/documents/ingest', {
          method: 'POST',
          body: formData,
        })

        if (!response.ok) {
          throw new Error(`Upload failed: ${response.statusText}`)
        }

        const returnedDocs = await response.json()
        const newDocs = returnedDocs.map((d) => ({
          id: d.id,
          title: d.fileName,
        }))

        setNotebooks((prev) =>
          prev.map((nb) =>
            nb.id === activeNotebookId
              ? { ...nb, documents: [...nb.documents, ...newDocs] }
              : nb,
          ),
        )
        setShowUploadModal(false)
        alert('Upload successful')
      } catch (error) {
        console.error(error)
        alert(`Upload failed: ${error.message}`)
      }
    },
    [activeNotebookId],
  )

  const handleRemoveDocument = useCallback(
    async (docId) => {
      if (!activeNotebookId) return

      try {
        const res = await apiFetch(`/api/documents/${encodeURIComponent(docId)}`, {
          method: 'DELETE',
        })
        if (!res.ok) throw new Error(`Delete failed: ${res.statusText}`)

        setNotebooks((prev) =>
          prev.map((nb) =>
            nb.id === activeNotebookId
              ? { ...nb, documents: nb.documents.filter((d) => d.id !== docId) }
              : nb,
          ),
        )
      } catch (err) {
        console.error('Failed to delete document:', err)
      }
    },
    [activeNotebookId],
  )

  // ------- Chat -------

  const handleSendMessage = useCallback(
    async (text) => {
      if (!activeNotebookId) return

      const userMsg = { id: uid(), role: 'user', content: text, citations: [] }

      setNotebooks((prev) =>
        prev.map((nb) =>
          nb.id === activeNotebookId
            ? { ...nb, chatHistory: [...nb.chatHistory, userMsg] }
            : nb,
        ),
      )

      try {
        const response = await apiFetch('/api/chat/ask', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: text, notebookId: activeNotebookId }),
        })

        if (!response.ok) {
          throw new Error('Network response was not ok')
        }

        const data = await response.json()

        const aiMsg = {
          id: uid(),
          role: 'assistant',
          content: data.response,
          citations: data.citations || [],
        }

        setNotebooks((prev) =>
          prev.map((nb) =>
            nb.id === activeNotebookId
              ? { ...nb, chatHistory: [...nb.chatHistory, aiMsg] }
              : nb,
          ),
        )
      } catch (error) {
        console.error(error)
        const errorMsg = {
          id: uid(),
          role: 'assistant',
          content: 'System Error: Unable to connect to the knowledge engine.',
          citations: [],
        }

        setNotebooks((prev) =>
          prev.map((nb) =>
            nb.id === activeNotebookId
              ? { ...nb, chatHistory: [...nb.chatHistory, errorMsg] }
              : nb,
          ),
        )
      }
    },
    [activeNotebookId],
  )

  // ------- Auth -------

  async function handleLogout() {
    await logout()
    navigate('/', { replace: true })
  }

  // ------- Render -------

  return (
    <main className="min-h-svh bg-[#090909] text-white">
      <DashboardNavbar
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        onCreateNotebook={handleCreateNotebook}
        onGoHome={handleGoHome}
        onLogout={handleLogout}
      />

      {activeNotebook ? (
        <>
          <NotebookWorkspace
            notebook={activeNotebook}
            onBack={handleGoHome}
            onOpenUpload={() => setShowUploadModal(true)}
            onRemoveDocument={handleRemoveDocument}
            onSendMessage={handleSendMessage}
          />

          {showUploadModal && (
            <UploadModal
              onClose={() => setShowUploadModal(false)}
              onUpload={handleUploadFiles}
            />
          )}
        </>
      ) : (
        <section className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6">
          <div className="overflow-hidden rounded-[10px] border border-[#242424] bg-[#0d0d0d]">
            <NotebookLibrary
              notebooks={notebooks}
              searchQuery={searchQuery}
              onOpenNotebook={handleOpenNotebook}
              onCreateNotebook={handleCreateNotebook}
              onRenameNotebook={handleRenameNotebook}
              onDeleteNotebook={handleDeleteNotebook}
            />
          </div>
        </section>
      )}
    </main>
  )
}

export default DashboardPage
