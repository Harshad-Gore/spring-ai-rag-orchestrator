import { useState, useCallback, useEffect, useRef } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.js'
import { getStoredAuthToken } from '../services/authApi.js'
import DashboardNavbar from '../components/dashboard/DashboardNavbar.jsx'
import ExplorerView from '../components/dashboard/ExplorerView.jsx'
import FolderTreeSidebar from '../components/dashboard/FolderTreeSidebar.jsx'
import DocumentSidebar from '../components/dashboard/DocumentSidebar.jsx'
import ChatArena from '../components/dashboard/ChatArena.jsx'
import AppSelector from '../components/dashboard/AppSelector.jsx'
import UploadModal from '../components/dashboard/UploadModal.jsx'
import ShareModal from '../components/dashboard/ShareModal.jsx'
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
  const { notebookId: activeNotebookId, appId } = useParams()
  const [notebooks, setNotebooks] = useState([])
  const [folders, setFolders] = useState([])
  const [tags, setTags] = useState([])
  const [searchParams, setSearchParams] = useSearchParams()
  const activeFolderId = searchParams.get('folder') || null

  const setActiveFolderId = useCallback((id) => {
    setSearchParams(prev => {
      if (id) prev.set('folder', id)
      else prev.delete('folder')
      return prev
    })
  }, [setSearchParams])
  const [searchQuery, setSearchQuery] = useState('')
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => localStorage.getItem('sidebar_collapsed') === 'true')
  const [sidebarWidth, setSidebarWidth] = useState(() => Number(localStorage.getItem('sidebar_width')) || 320)
  const [isDragging, setIsDragging] = useState(false)
  const [folderSidebarWidth, setFolderSidebarWidth] = useState(() => Number(localStorage.getItem('folder_sidebar_width')) || 256)
  const [isFolderDragging, setIsFolderDragging] = useState(false)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)
  const [isLoadingNotebooks, setIsLoadingNotebooks] = useState(true)
  const [isLoadingNotebook, setIsLoadingNotebook] = useState(false)
  const [pinnedDocIds, setPinnedDocIds] = useState(() => new Set())
  const [isCreatingNotebook, setIsCreatingNotebook] = useState(false)
  const [confirmConfig, setConfirmConfig] = useState({
    isOpen: false,
    title: '',
    description: '',
    onConfirm: () => {},
    isDestructive: false,
  })

  const closeConfirm = () => setConfirmConfig((prev) => ({ ...prev, isOpen: false }))

  useEffect(() => {
    localStorage.setItem('sidebar_collapsed', isSidebarCollapsed)
  }, [isSidebarCollapsed])

  useEffect(() => {
    localStorage.setItem('sidebar_width', sidebarWidth)
  }, [sidebarWidth])

  useEffect(() => {
    localStorage.setItem('folder_sidebar_width', folderSidebarWidth)
  }, [folderSidebarWidth])

  const sidebarRef = useRef(null)
  const folderSidebarRef = useRef(null)

  useEffect(() => {
    if (!isDragging) return
    let animationFrameId
    const handleMouseMove = (e) => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId)
      animationFrameId = requestAnimationFrame(() => {
        let newWidth = e.clientX
        if (newWidth < 200) newWidth = 200
        if (newWidth > 600) newWidth = 600
        if (sidebarRef.current) sidebarRef.current.style.width = `${newWidth}px`
      })
    }
    const handleMouseUp = (e) => {
      let newWidth = e.clientX
      if (newWidth < 200) newWidth = 200
      if (newWidth > 600) newWidth = 600
      setSidebarWidth(newWidth)
      setIsDragging(false)
    }
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId)
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging])

  useEffect(() => {
    if (!isFolderDragging) return
    let animationFrameId
    const handleMouseMove = (e) => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId)
      animationFrameId = requestAnimationFrame(() => {
        let newWidth = e.clientX
        if (newWidth < 180) newWidth = 180
        if (newWidth > 500) newWidth = 500
        if (folderSidebarRef.current) folderSidebarRef.current.style.width = `${newWidth}px`
      })
    }
    const handleMouseUp = (e) => {
      let newWidth = e.clientX
      if (newWidth < 180) newWidth = 180
      if (newWidth > 500) newWidth = 500
      setFolderSidebarWidth(newWidth)
      setIsFolderDragging(false)
    }
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId)
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isFolderDragging])





  // Derived
  const activeNotebook = activeNotebookId
    ? notebooks.find((nb) => nb.id === activeNotebookId) ?? null
    : null

  // ------- Notebook CRUD -------

  const handleCreateNotebook = useCallback(async () => {
    setIsCreatingNotebook(true)
    try {
      const res = await apiFetch('/api/notebooks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'New Notebook' }),
      })
      if (!res.ok) throw new Error(`Create failed: ${res.statusText}`)
      let newNb = await res.json()

      if (activeFolderId) {
        const moveRes = await apiFetch(`/api/notebooks/${encodeURIComponent(newNb.id)}/folder`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ folderId: activeFolderId }),
        })
        if (moveRes.ok) {
          newNb = await moveRes.json()
        }
      }

      setNotebooks((prev) => [newNb, ...prev])
      toast({ type: 'success', message: 'Notebook created' })
      return newNb
    } catch (err) {
      console.error('Failed to create notebook:', err)
      toast({ type: 'error', message: err.message })
    } finally {
      setIsCreatingNotebook(false)
    }
  }, [activeFolderId, toast])

  const handleOpenNotebook = useCallback((id) => {
    navigate(activeFolderId ? `/notebook/${id}?folder=${activeFolderId}` : `/notebook/${id}`)
    setSearchQuery('')
  }, [navigate, activeFolderId])

  // Fetch notebooks, folders, and tags from database on mount
  const fetchDashboardData = useCallback(async () => {
    try {
      const [nbRes, fRes, tRes] = await Promise.all([
        apiFetch('/api/notebooks'),
        apiFetch('/api/folders'),
        apiFetch('/api/tags')
      ])
      if (nbRes.ok) {
        const data = await nbRes.json()
        setNotebooks((prev) => 
          data.map((newNb) => {
            const existing = prev.find(p => p.id === newNb.id)
            return {
              ...newNb,
              documents: existing?.documents,
              chatHistory: existing?.chatHistory || [],
            }
          })
        )
      }
      if (fRes.ok) {
        const data = await fRes.json()
        setFolders(data)
      }
      if (tRes.ok) {
        const data = await tRes.json()
        setTags(data)
      }
    } catch (err) {
      console.error('Failed to fetch data:', err)
    } finally {
      setIsLoadingNotebooks(false)
    }
  }, [])

  useEffect(() => {
    fetchDashboardData()
  }, [fetchDashboardData])

  const loadedNotebookIdRef = useRef(null)

  useEffect(() => {
    if (activeNotebookId && activeNotebookId !== loadedNotebookIdRef.current && notebooks.some(n => n.id === activeNotebookId)) {
      loadedNotebookIdRef.current = activeNotebookId
      handleOpenNotebookCore(activeNotebookId)
    } else if (!activeNotebookId) {
      loadedNotebookIdRef.current = null
    }
  }, [activeNotebookId, notebooks])

  const handleOpenNotebookCore = useCallback(async (id) => {
    setIsLoadingNotebook(true)
    try {
      const [docsRes, chatRes] = await Promise.all([
        apiFetch(`/api/documents?notebookId=${encodeURIComponent(id)}`),
        apiFetch(`/api/chat/notebook/${encodeURIComponent(id)}/history`)
      ])
      const docs = docsRes.ok ? await docsRes.json() : []
      const history = (chatRes.ok ? await chatRes.json() : []).map((msg) => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        citations: [],
        done: true
      }))
      setNotebooks((prev) =>
        prev.map((nb) =>
          nb.id === id
            ? {
                ...nb,
                documents: docs.map((d) => ({ id: d.id, title: d.fileName, contentType: d.contentType })),
                documentCount: docs.length,
                chatHistory: history,
              }
            : nb,
        ),
      )
      setPinnedDocIds(new Set(docs.map((d) => d.id)))
    } catch (err) {
      console.error('Failed to fetch notebook data:', err)
    } finally {
      setIsLoadingNotebook(false)
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
        prev.map((nb) => (nb.id === id ? { ...nb, title: updated.title } : nb)),
      )
      toast({ type: 'success', message: 'Notebook renamed' })
    } catch (err) {
      console.error('Failed to rename notebook:', err)
      toast({ type: 'error', message: err.message })
    }
  }, [toast])

  const handleDeleteNotebook = useCallback((id) => {
    setConfirmConfig({
      isOpen: true,
      title: 'Delete Notebook',
      description: 'Are you sure you want to delete this notebook? This action cannot be undone.',
      isDestructive: true,
      onConfirm: async () => {
        try {
          const res = await apiFetch(`/api/notebooks/${encodeURIComponent(id)}`, {
            method: 'DELETE',
          })
          if (!res.ok) throw new Error(`Delete failed: ${res.statusText}`)
          setNotebooks((prev) => prev.filter((nb) => nb.id !== id))
          if (activeNotebookId === id) {
            const targetFolderId = activeFolderId || activeNotebook?.folderId
            navigate(targetFolderId ? `/dashboard?folder=${targetFolderId}` : '/dashboard')
          }
          toast({ type: 'success', message: 'Notebook deleted' })
          closeConfirm()
        } catch (err) {
          console.error('Failed to delete notebook:', err)
          toast({ type: 'error', message: err.message })
          closeConfirm()
        }
      },
    })
  }, [activeNotebookId, navigate, toast, activeFolderId, activeNotebook?.folderId])

  const handleBulkDelete = useCallback((selectedIds) => {
    setConfirmConfig({
      isOpen: true,
      title: 'Delete Multiple Items',
      description: `Are you sure you want to delete ${selectedIds.size} items? This action cannot be undone.`,
      isDestructive: true,
      onConfirm: async () => {
        try {
          const promises = []
          for (const id of selectedIds) {
            const isFolder = folders.some(f => f.id === id)
            if (isFolder) {
              promises.push(apiFetch(`/api/folders/${encodeURIComponent(id)}`, { method: 'DELETE' }))
            } else {
              promises.push(apiFetch(`/api/notebooks/${encodeURIComponent(id)}`, { method: 'DELETE' }))
            }
          }
          await Promise.all(promises)
          
          setFolders(prev => prev.filter(f => !selectedIds.has(f.id)))
          setNotebooks(prev => prev.filter(nb => !selectedIds.has(nb.id)))
          
          if (activeNotebookId && selectedIds.has(activeNotebookId)) {
            const targetFolderId = activeFolderId || activeNotebook?.folderId
            navigate(targetFolderId ? `/dashboard?folder=${targetFolderId}` : '/dashboard')
          } else if (activeFolderId && selectedIds.has(activeFolderId)) {
            navigate('/dashboard')
          }
          
          toast({ type: 'success', message: `${selectedIds.size} items deleted` })
          closeConfirm()
        } catch (err) {
          console.error('Failed to bulk delete:', err)
          toast({ type: 'error', message: 'Some items failed to delete' })
          closeConfirm()
        }
      }
    })
  }, [folders, activeNotebookId, activeFolderId, activeNotebook, navigate, toast])

  const handleBulkRename = useCallback(async (selectedIds, baseName) => {
    let count = 1
    try {
      for (const id of selectedIds) {
        const isFolder = folders.some(f => f.id === id)
        const newName = count === 1 ? baseName : `${baseName} (${count})`
        
        if (isFolder) {
          const res = await apiFetch(`/api/folders/${encodeURIComponent(id)}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: newName }),
          })
          if (res.ok) {
            const updated = await res.json()
            setFolders(prev => prev.map(f => f.id === id ? updated : f))
          }
        } else {
          const res = await apiFetch(`/api/notebooks/${encodeURIComponent(id)}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title: newName }),
          })
          if (res.ok) {
            const updated = await res.json()
            setNotebooks(prev => prev.map(nb => nb.id === id ? { ...nb, title: updated.title } : nb))
          }
        }
        count++
      }
      toast({ type: 'success', message: `${selectedIds.size} items renamed` })
    } catch (err) {
      console.error(err)
      toast({ type: 'error', message: 'Failed to rename some items' })
    }
  }, [folders, toast])

  // ------- Folder CRUD & Drop -------

  const handleCreateFolder = useCallback(async () => {
    try {
      const res = await apiFetch('/api/folders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'New Folder', parentId: activeFolderId || null }),
      })
      if (!res.ok) throw new Error(`Create folder failed`)
      const newFolder = await res.json()
      setFolders((prev) => [...prev, newFolder])
      toast({ type: 'success', message: 'Folder created' })
      return newFolder
    } catch (err) {
      console.error('Failed to create folder:', err)
      toast({ type: 'error', message: err.message })
    }
  }, [activeFolderId, toast])

  const handleRenameFolder = useCallback(async (id, newName) => {
    try {
      const res = await apiFetch(`/api/folders/${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName }),
      })
      if (!res.ok) throw new Error(`Rename failed`)
      const updated = await res.json()
      setFolders((prev) => prev.map((f) => (f.id === id ? updated : f)))
      toast({ type: 'success', message: 'Folder renamed' })
    } catch (err) {
      console.error('Failed to rename folder:', err)
      toast({ type: 'error', message: err.message })
    }
  }, [toast])

  const handleDeleteFolder = useCallback((id) => {
    setConfirmConfig({
      isOpen: true,
      title: 'Delete Folder',
      description: 'Are you sure you want to delete this folder? All notebooks and subfolders inside it will be permanently deleted.',
      isDestructive: true,
      onConfirm: async () => {
        try {
          const res = await apiFetch(`/api/folders/${encodeURIComponent(id)}`, {
            method: 'DELETE',
          })
          if (!res.ok) throw new Error(`Delete failed`)
          
          setFolders((prev) => prev.filter((f) => f.id !== id))
          setNotebooks((prev) => prev.filter((nb) => nb.folderId !== id))
          
          if (activeFolderId === id) {
            setActiveFolderId(null)
          }
          closeConfirm()
          toast({ type: 'success', message: 'Folder and its contents deleted' })
        } catch (err) {
          console.error('Failed to delete folder:', err)
          toast({ type: 'error', message: err.message })
          closeConfirm()
        }
      },
    })
  }, [activeFolderId, toast])

  const handleDropItem = useCallback(async (itemId, itemType, targetFolderId) => {
    try {
      if (itemType === 'notebook') {
        const res = await apiFetch(`/api/notebooks/${encodeURIComponent(itemId)}/folder`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ folderId: targetFolderId }),
        })
        if (!res.ok) throw new Error(`Move notebook failed`)
        setNotebooks((prev) =>
          prev.map((nb) => (nb.id === itemId ? { ...nb, folderId: targetFolderId } : nb)),
        )
      } else if (itemType === 'folder') {
        const res = await apiFetch(`/api/folders/${encodeURIComponent(itemId)}/move`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ parentId: targetFolderId }),
        })
        if (!res.ok) throw new Error(`Move folder failed`)
        setFolders((prev) =>
          prev.map((f) => (f.id === itemId ? { ...f, parentId: targetFolderId } : f)),
        )
      }
      toast({ type: 'success', message: 'Moved successfully' })
    } catch (err) {
      console.error('Failed to move item:', err)
      toast({ type: 'error', message: err.message })
    }
  }, [toast])

  const handleUpdateNotebookTags = useCallback(async (notebookId, tagIds) => {
    try {
      const res = await apiFetch(`/api/notebooks/${encodeURIComponent(notebookId)}/tags`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tagIds }),
      })
      if (!res.ok) throw new Error(`Update tags failed`)
      const updated = await res.json()
      setNotebooks((prev) =>
        prev.map((nb) => (nb.id === notebookId ? { ...nb, tagIds: updated.tagIds } : nb)),
      )
      toast({ type: 'success', message: 'Tags saved' })
    } catch (err) {
      console.error('Failed to update tags:', err)
      toast({ type: 'error', message: err.message })
    }
  }, [toast])

  const handleCreateTag = useCallback(async (name, colorHex) => {
    try {
      const res = await apiFetch('/api/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, colorHex }),
      })
      if (!res.ok) throw new Error(`Create tag failed`)
      const newTag = await res.json()
      setTags((prev) => [...prev, newTag])
      toast({ type: 'success', message: 'Tag created' })
    } catch (err) {
      console.error('Failed to create tag:', err)
      toast({ type: 'error', message: err.message })
    }
  }, [toast])

  const handleDeleteTag = useCallback((id) => {
    setConfirmConfig({
      isOpen: true,
      title: 'Delete Tag',
      description: 'Are you sure you want to delete this tag? It will be removed from all notebooks.',
      isDestructive: true,
      onConfirm: async () => {
        try {
          const res = await apiFetch(`/api/tags/${encodeURIComponent(id)}`, {
            method: 'DELETE',
          })
          if (!res.ok) throw new Error(`Delete tag failed`)
          setTags((prev) => prev.filter((t) => t.id !== id))
          setNotebooks((prev) => prev.map(nb => ({
            ...nb,
            tagIds: (nb.tagIds || []).filter(tid => tid !== id)
          })))
          toast({ type: 'success', message: 'Tag deleted' })
          closeConfirm()
        } catch (err) {
          console.error('Failed to delete tag:', err)
          toast({ type: 'error', message: err.message })
          closeConfirm()
        }
      },
    })
  }, [toast])

  const handleTogglePin = useCallback((docId) => {
    setPinnedDocIds((prev) => {
      const next = new Set(prev)
      if (next.has(docId)) {
        // Keep at least one pinned
        if (next.size === 1) return prev
        next.delete(docId)
      } else {
        next.add(docId)
      }
      return next
    })
  }, [])

  const handleLogoClick = useCallback(() => {
    navigate('/dashboard')
  }, [navigate])

  const handleBackToFolder = useCallback(() => {
    if (appId) {
      navigate(activeFolderId ? `/notebook/${activeNotebookId}?folder=${activeFolderId}` : `/notebook/${activeNotebookId}`)
    } else {
      const targetFolderId = activeFolderId || activeNotebook?.folderId
      navigate(targetFolderId ? `/dashboard?folder=${targetFolderId}` : '/dashboard', { state: { highlightedNotebookId: activeNotebookId } })
    }
  }, [navigate, activeFolderId, activeNotebook, activeNotebookId, appId])

  const handleShareNotebook = useCallback(async (shareType, sharedResources) => {
    if (!activeNotebookId) return
    try {
      const res = await apiFetch(`/api/notebooks/${encodeURIComponent(activeNotebookId)}/share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shareType, sharedResources }),
      })
      if (!res.ok) throw new Error(`Failed to share: ${res.statusText}`)
      const data = await res.json()
      setNotebooks((prev) =>
        prev.map((nb) =>
          nb.id === activeNotebookId
            ? { ...nb, shareToken: data.shareToken, shareType, sharedResources }
            : nb,
        ),
      )
      toast({ type: 'success', message: 'Share link generated!' })
    } catch (err) {
      console.error(err)
      toast({ type: 'error', message: err.message })
    }
  }, [activeNotebookId, toast])

  const handleRevokeShare = useCallback(async () => {
    if (!activeNotebookId) return
    try {
      const res = await apiFetch(`/api/notebooks/${encodeURIComponent(activeNotebookId)}/revoke`, {
        method: 'POST'
      })
      if (!res.ok) throw new Error(`Failed to revoke: ${res.statusText}`)
      setNotebooks((prev) =>
        prev.map((nb) =>
          nb.id === activeNotebookId
            ? { ...nb, shareToken: null, shareType: null, sharedResources: null }
            : nb,
        ),
      )
      toast({ type: 'success', message: 'Share link revoked!' })
      setShowShareModal(false)
    } catch (err) {
      console.error(err)
      toast({ type: 'error', message: err.message })
    }
  }, [activeNotebookId, toast])

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
          contentType: d.contentType,
        }))

        setNotebooks((prev) =>
          prev.map((nb) =>
            nb.id === activeNotebookId
              ? { 
                  ...nb, 
                  documents: [...(nb.documents || []), ...newDocs],
                  documentCount: (nb.documentCount || 0) + newDocs.length
                }
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

  const handleAddUrl = useCallback(
    async (url) => {
      if (!activeNotebookId) return
      try {
        const response = await apiFetch('/api/documents/ingest-url', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url, notebookId: activeNotebookId }),
        })
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.error || `Failed: ${response.statusText}`)
        }
        const doc = await response.json()
        setNotebooks((prev) =>
          prev.map((nb) =>
            nb.id === activeNotebookId
              ? { 
                  ...nb, 
                  documents: [...(nb.documents || []), { id: doc.id, title: doc.fileName, contentType: doc.contentType }],
                  documentCount: (nb.documentCount || 0) + 1
                }
              : nb,
          ),
        )
        toast({ type: 'success', message: 'Source added successfully' })
        return true
      } catch (error) {
        console.error(error)
        toast({ type: 'error', message: `Failed to add source: ${error.message}` })
        return false
      }
    },
    [activeNotebookId, toast],
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
                ? { 
                  ...nb, 
                  documents: (nb.documents || []).filter((d) => d.id !== docId),
                  documentCount: Math.max(0, (nb.documentCount || 1) - 1)
                } : nb,
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
    async (text, model, streamingMsgId) => {
      if (!activeNotebookId) return

      const notebookIdAtSend = activeNotebookId
      const pinnedAtSend = [...pinnedDocIds]

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
          body: JSON.stringify({ query: text, notebookId: notebookIdAtSend, model, pinnedDocIds: pinnedAtSend }),
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
    [activeNotebookId, pinnedDocIds],
  )

  const handleRegenerate = useCallback(async (notebookId, text, model, streamingMsgId) => {
    if (!notebookId) return

    const notebookIdAtSend = notebookId
    const pinnedAtSend = [...pinnedDocIds]
    const aiMsgId = streamingMsgId ?? `stream-${Date.now()}`
    const aiMsg = { id: aiMsgId, role: 'assistant', content: '', citations: [], done: false }

    setNotebooks((prev) =>
      prev.map((nb) =>
        nb.id === notebookIdAtSend
          ? { ...nb, chatHistory: [...nb.chatHistory, aiMsg] }
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
      const res = await fetch(`${API_BASE_URL}/api/chat/regenerate`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ query: text, notebookId: notebookIdAtSend, model, pinnedDocIds: pinnedAtSend }),
      })

      if (!res.ok) throw new Error(`Stream failed: ${res.status}`)

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let rawBuffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        rawBuffer += decoder.decode(value, { stream: true })

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
      patchAi((m) => ({ done: m.done || true }))
    } catch (e) {
      console.error('Failed to regenerate stream', e)
      patchAi(() => ({ content: `Error: ${e.message}`, done: true }))
    }
  }, [pinnedDocIds])

  // ------- Render Helpers -------

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
        onGoHome={handleLogoClick}
        onLogout={handleLogout}
        isCreatingNotebook={isCreatingNotebook}
        isLoading={isLoadingNotebook}
      />

      {activeNotebook ? (
        <div
          key={activeNotebook.id}
          className={`flex h-[calc(100svh-4rem)] relative animate-fade-in ${isDragging ? 'select-none cursor-col-resize' : ''}`}
        >
          <div
            ref={sidebarRef}
            className={`shrink-0 border-r border-[#1a1a1a] transition-[width] duration-300 ${isDragging ? 'transition-none' : ''}`}
            style={{ width: isSidebarCollapsed ? 64 : sidebarWidth }}
          >
            <DocumentSidebar
              notebook={activeNotebook}
              isCollapsed={isSidebarCollapsed}
              onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              onBack={handleBackToFolder}
              backLabel={appId ? 'Apps' : 'Explorer'}
              onOpenUpload={() => setShowUploadModal(true)}
              onOpenShare={() => setShowShareModal(true)}
              onRemoveDocument={handleRemoveDocument}
              onSendMessage={handleSendMessage}
              onRegenerate={handleRegenerate}
              onRenameNotebook={handleRenameNotebook}
              pinnedDocIds={pinnedDocIds}
              onTogglePin={handleTogglePin}
            />
          </div>
          {!isSidebarCollapsed && (
            <div 
              className="w-1 cursor-col-resize hover:bg-[#dffdee]/50 active:bg-[#b9f7d3] shrink-0 z-10 transition-colors"
              onMouseDown={() => setIsDragging(true)}
            />
          )}
          <div className="flex-1 overflow-hidden">
            {!appId && <AppSelector notebookId={activeNotebook.id} />}
            {appId === 'chat' && (
              <ChatArena
                chatHistory={activeNotebook.chatHistory || []}
                onSendMessage={handleSendMessage}
                onRegenerate={(text, model, msgId) => handleRegenerate(activeNotebook.id, text, model, msgId)}
                pinnedDocIds={pinnedDocIds}
                onRenameNotebook={handleRenameNotebook}
                isLoading={isLoadingNotebook}
              />
            )}
            {appId !== 'chat' && appId && (
              <div className="flex items-center justify-center h-full w-full text-[#c8cdc9]">
                <p>The {appId} app is currently under construction.</p>
              </div>
            )}
          </div>

          {showUploadModal && (
            <UploadModal
              onClose={() => setShowUploadModal(false)}
              onUpload={handleUploadFiles}
              onAddUrl={handleAddUrl}
            />
          )}

          {showShareModal && activeNotebook && (
            <ShareModal
              notebook={activeNotebook}
              onClose={() => setShowShareModal(false)}
              onShare={handleShareNotebook}
              onRevoke={handleRevokeShare}
            />
          )}
        </div>
      ) : (
        <section className={`flex h-[calc(100svh-4rem)] overflow-hidden ${isFolderDragging ? 'select-none cursor-col-resize' : ''}`}>
          <div 
            className={`shrink-0 h-full border-r border-[#242424] transition-[width] duration-300 ${isFolderDragging ? 'transition-none' : ''}`}
            style={{ width: folderSidebarWidth }}
          >
            <FolderTreeSidebar 
              folders={folders}
              activeFolderId={activeFolderId}
              onSelect={setActiveFolderId}
              onDrop={handleDropItem}
            />
          </div>
          <div 
            className="w-1 h-full cursor-col-resize hover:bg-[#dffdee]/50 active:bg-[#b9f7d3] shrink-0 z-10 transition-colors"
            onMouseDown={() => setIsFolderDragging(true)}
          />
          <div className="flex-1 h-full overflow-hidden">
            <ExplorerView
              notebooks={notebooks}
              folders={folders}
              tags={tags}
              activeFolderId={activeFolderId}
              setActiveFolderId={setActiveFolderId}
              searchQuery={searchQuery}
              onOpenNotebook={handleOpenNotebook}
              onCreateNotebook={handleCreateNotebook}
              onRenameNotebook={handleRenameNotebook}
              onDeleteNotebook={handleDeleteNotebook}
              onCreateFolder={handleCreateFolder}
              onRenameFolder={handleRenameFolder}
              onDeleteFolder={handleDeleteFolder}
              onDropItem={handleDropItem}
              onUpdateNotebookTags={handleUpdateNotebookTags}
              onCreateTag={handleCreateTag}
              onDeleteTag={handleDeleteTag}
              onRefresh={fetchDashboardData}
              onBulkDelete={handleBulkDelete}
              onBulkRename={handleBulkRename}
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
