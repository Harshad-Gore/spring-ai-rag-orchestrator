import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getStoredAuthToken } from '../services/authApi.js'
import DashboardNavbar from '../components/dashboard/DashboardNavbar.jsx'
import DocumentSidebar from '../components/dashboard/DocumentSidebar.jsx'
import ChatArena from '../components/dashboard/ChatArena.jsx'
import { Loader2, AlertTriangle, Download, RefreshCw } from 'lucide-react'
import { Button } from '../components/ui/button.jsx'
import { useToast } from '../components/ui/toast.jsx'

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

function SharedNotebookPage() {
  const { shareToken } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()

  const [notebook, setNotebook] = useState(null)
  const [error, setError] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isCloning, setIsCloning] = useState(false)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)

  useEffect(() => {
    async function loadSharedNotebook() {
      try {
        const [nbRes, docsRes, chatRes] = await Promise.all([
          apiFetch(`/api/shared/notebooks/${shareToken}`),
          apiFetch(`/api/shared/notebooks/${shareToken}/documents`),
          apiFetch(`/api/shared/notebooks/${shareToken}/history`),
        ])

        if (!nbRes.ok) throw new Error('Shared notebook not found or access revoked.')

        const nb = await nbRes.json()
        const docs = docsRes.ok ? await docsRes.json() : []
        const history = (chatRes.ok ? await chatRes.json() : []).map((msg) => ({
          id: msg.id,
          role: msg.role,
          content: msg.content,
          citations: [],
          done: true
        }))

        setNotebook({
          ...nb,
          documents: docs.map((d) => ({ id: d.id, title: d.fileName, contentType: d.contentType })),
          chatHistory: history,
        })
      } catch (err) {
        setError(err.message)
      } finally {
        setIsLoading(false)
      }
    }
    loadSharedNotebook()
  }, [shareToken])

  const handleClone = async () => {
    setIsCloning(true)
    try {
      const res = await apiFetch(`/api/shared/notebooks/${shareToken}/clone`, {
        method: 'POST'
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.message || 'Failed to clone notebook')
      }
      const data = await res.json()
      toast({ type: 'success', message: 'Notebook cloned successfully!' })
      // Pass existing chat + docs as seed state so dashboard shows them instantly
      navigate(`/dashboard/${data.newNotebookId}`, {
        state: {
          seedChatHistory: notebook.chatHistory,
          seedDocuments: notebook.documents,
        }
      })
    } catch (err) {
      toast({ type: 'error', message: err.message })
    } finally {
      setIsCloning(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-[#090909]">
        <Loader2 className="size-8 animate-spin text-[#58d68d]" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center bg-[#090909] p-4 text-center">
        <AlertTriangle className="size-12 text-red-500 mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">Access Denied</h2>
        <p className="text-[#9aa39f] max-w-md">{error}</p>
        <Button onClick={() => navigate('/dashboard')} className="mt-6">Return to Dashboard</Button>
      </div>
    )
  }

  const canClone = notebook.shareType === 'CLONE'

  return (
    <div className="flex h-svh flex-col bg-[#090909]">
      <DashboardNavbar
        isSharedView={true}
        ownerEmail={notebook.ownerEmail}
        onGoHome={() => navigate('/dashboard')}
        onLogout={() => {}} // Could wire this up to useAuth if needed, but standard Dashboard uses it
        searchValue=""
        onSearchChange={() => {}}
        isCreatingNotebook={false}
        onCreateNotebook={() => {}}
      />
      {canClone && (
        <div className="flex items-center justify-between border-b border-[#242424] bg-[#58d68d]/10 px-6 py-2 shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold uppercase tracking-widest text-[#58d68d]">
              Clone Available
            </span>
            <p className="text-sm text-[#c8cdc9]">You can clone this notebook to your account.</p>
          </div>
          <Button onClick={handleClone} disabled={isCloning} className="h-8 bg-[#58d68d] text-[#090909] hover:bg-[#46b876]">
            {isCloning ? <Loader2 className="size-3.5 animate-spin mr-2" /> : <RefreshCw className="size-3.5 mr-2" />}
            Clone Notebook
          </Button>
        </div>
      )}
      <div className="flex flex-1 overflow-hidden">
        <div className={`shrink-0 border-r border-[#242424] transition-all duration-300 ${isSidebarCollapsed ? 'w-16' : 'w-80'}`}>
          <DocumentSidebar
            notebook={notebook}
            isCollapsed={isSidebarCollapsed}
            onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            onBack={() => navigate('/dashboard')}
            readOnly={true}
            pinnedDocIds={new Set(notebook.documents.map(d => d.id))}
            onTogglePin={() => {}}
            onRemoveDocument={() => {}}
            onRenameNotebook={() => {}}
            onOpenUpload={() => {}}
            onOpenShare={() => {}}
          />
        </div>
        <div className="flex-1 overflow-hidden">
          <ChatArena
            chatHistory={notebook.chatHistory || []}
            readOnly={true}
            pinnedDocIds={new Set()}
            onSendMessage={() => {}}
            onRegenerate={() => {}}
          />
        </div>
      </div>
    </div>
  )
}

export default SharedNotebookPage
