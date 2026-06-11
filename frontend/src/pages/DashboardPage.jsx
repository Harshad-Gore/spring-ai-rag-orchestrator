import { useState, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.js'
import { getStoredAuthToken } from '../services/authApi.js'
import DashboardNavbar from '../components/dashboard/DashboardNavbar.jsx'
import NotebookLibrary from '../components/dashboard/NotebookLibrary.jsx'
import NotebookWorkspace from '../components/dashboard/NotebookWorkspace.jsx'
import UploadModal from '../components/dashboard/UploadModal.jsx'
import { ConfirmationDialog } from '../components/ui/confirmation-dialog.jsx'
import { useToast } from '../components/ui/toast.jsx'

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
  const { toast } = useToast()

  // Core state
  const [notebooks, setNotebooks] = useState([])
  const [activeNotebookId, setActiveNotebookId] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [isLoadingNotebooks, setIsLoadingNotebooks] = useState(true)
  const [confirmConfig, setConfirmConfig] = useState({
    isOpen: false,
    title: '',
    description: '',
    onConfirm: () => {},
    isDestructive: false,
  })

  const closeConfirm = () => setConfirmConfig((prev) => ({ ...prev, isOpen: false }))

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
      toast({ type: 'success', message: 'Notebook created successfully' })
    } catch (err) {
      console.error('Failed to create notebook:', err)
      toast({ type: 'error', message: `Failed to create notebook: ${err.message}` })
    }
  }, [toast])

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
      toast({ type: 'success', message: 'Notebook renamed successfully' })
    } catch (err) {
      console.error('Failed to rename notebook:', err)
      toast({ type: 'error', message: `Failed to rename notebook: ${err.message}` })
    }
  }, [toast])

  const handleDeleteNotebook = useCallback((id) => {
    setConfirmConfig({
      isOpen: true,
      title: 'Delete Notebook',
      description: 'Are you sure you want to delete this notebook? All uploaded documents and chat history will be permanently deleted. This action cannot be undone.',
      isDestructive: true,
      onConfirm: async () => {
        closeConfirm()
        try {
          const res = await apiFetch(`/api/notebooks/${encodeURIComponent(id)}`, {
            method: 'DELETE',
          })
          if (!res.ok) throw new Error(`Delete failed: ${res.statusText}`)
          setNotebooks((prev) => prev.filter((nb) => nb.id !== id))
          if (activeNotebookId === id) setActiveNotebookId(null)
          toast({ type: 'success', message: 'Notebook deleted successfully' })
        } catch (err) {
          console.error('Failed to delete notebook:', err)
          toast({ type: 'error', message: `Failed to delete notebook: ${err.message}` })
        }
      }
    })
  }, [activeNotebookId, toast])

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
        toast({ type: 'success', message: 'Upload successful' })
      } catch (error) {
        console.error(error)
        toast({ type: 'error', message: `Upload failed: ${error.message}` })
      }
    },
    [activeNotebookId],
  )

  const handleRemoveDocument = useCallback((docId) => {
    if (!activeNotebookId) return

    setConfirmConfig({
      isOpen: true,
      title: 'Delete Document',
      description: 'Are you sure you want to delete this document? The context will be removed from your notebook. This cannot be undone.',
      isDestructive: true,
      onConfirm: async () => {
        closeConfirm()
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
          toast({ type: 'success', message: 'Document deleted successfully' })
        } catch (err) {
          console.error('Failed to delete document:', err)
          toast({ type: 'error', message: `Failed to delete document: ${err.message}` })
        }
      }
    })
  }, [activeNotebookId, toast])

  // ------- Chat (streaming SSE) -------

  const handleSendMessage = useCallback(
    async (text, streamingMsgId) => {
      if (!activeNotebookId) return

      const notebookIdAtSend = activeNotebookId

      // Add user message + empty AI placeholder immediately
      const userMsg = { id: uid(), role: 'user', content: text, citations: [] }
      const aiMsgId = streamingMsgId ?? uid()
      const aiMsg = { id: aiMsgId, role: 'assistant', content: '', citations: [], done: false }

      setNotebooks((prev) =>
        prev.map((nb) =>
          nb.id === notebookIdAtSend
            ? { ...nb, chatHistory: [...nb.chatHistory, userMsg, aiMsg] }
            : nb,
        ),
      )

      const patchAi = (updater) =>
        setNotebooks((prev) =>
          prev.map((nb) =>
            nb.id === notebookIdAtSend
              ? { ...nb, chatHistory: nb.chatHistory.map((m) => m.id === aiMsgId ? { ...m, ...updater(m) } : m) }
              : nb,
          ),
        )

      try {
        const token = getStoredAuthToken()
        const res = await fetch(`${API_BASE_URL}/api/chat/stream`, {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ query: text, notebookId: notebookIdAtSend }),
        })

        if (!res.ok) throw new Error(`Stream failed: ${res.status}`)

        const reader = res.body.getReader()
        const decoder = new TextDecoder()
        let rawBuffer = ''

        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          rawBuffer += decoder.decode(value, { stream: true })

          // Split on double-newline (SSE block separator)
          const blocks = rawBuffer.split('\n\n')
          rawBuffer = blocks.pop() ?? ''

          for (const block of blocks) {
            if (!block.trim()) continue
            const lines = block.split('\n')
            const eventType = lines.find(l => l.startsWith('event:'))?.slice(6).trim()
            const data = lines.find(l => l.startsWith('data:'))?.slice(5).trim() ?? ''

            if (eventType === 'token') {
              try {
                const textChunk = JSON.parse(data)
                patchAi((m) => ({ content: m.content + textChunk }))
              } catch { /* ignore */ }
            } else if (eventType === 'citations') {
              try { patchAi(() => ({ citations: JSON.parse(data) })) } catch { /* ignore */ }
            } else if (eventType === 'done') {
              patchAi(() => ({ done: true }))
            } else if (eventType === 'error') {
              patchAi(() => ({ content: data || 'An error occurred.', done: true }))
            }
          }
        }
        // Ensure done is set even if backend didn't emit 'done' event
        patchAi((m) => ({ done: m.done || true }))

      } catch (error) {
        console.error('Stream error:', error)
        patchAi(() => ({
          content: 'Unable to connect to the knowledge engine. Please try again.',
          done: true,
        }))
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
            onRenameNotebook={handleRenameNotebook}
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

      <ConfirmationDialog
        isOpen={confirmConfig.isOpen}
        title={confirmConfig.title}
        description={confirmConfig.description}
        isDestructive={confirmConfig.isDestructive}
        onConfirm={confirmConfig.onConfirm}
        onCancel={closeConfirm}
      />
    </main>
  )
}

export default DashboardPage
