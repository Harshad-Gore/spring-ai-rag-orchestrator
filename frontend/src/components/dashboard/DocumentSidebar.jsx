import { useState, useRef, useEffect } from 'react'
import { ChevronLeft, ChevronRight, FileText, Globe, Pencil, Trash2, Upload, Video, Home, PanelLeftClose, PanelLeftOpen, Share2 } from 'lucide-react'
import { Button } from '../ui/button.jsx'

function getDocIcon(doc) {
  if (doc.contentType === 'video/youtube') return <Video aria-hidden="true" className="size-5 shrink-0 text-red-400" />
  if (doc.contentType === 'text/html') return <Globe aria-hidden="true" className="size-5 shrink-0 text-[#5dade2]" />
  return <FileText aria-hidden="true" className="size-5 shrink-0 text-[#dffdee]/50" />
}

function getInitials(title) {
  if (!title) return 'N'
  const words = title.trim().split(/\s+/)
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase()
  }
  return title.slice(0, 2).toUpperCase()
}

function DocumentSidebar({ notebook, isCollapsed, onToggleCollapse, onBack, onOpenUpload, onRemoveDocument, onRenameNotebook, pinnedDocIds, onTogglePin, onOpenShare, readOnly }) {
  const documents = notebook?.documents ?? []
  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(notebook?.title ?? '')
  const inputRef = useRef(null)

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  useEffect(() => {
    setEditTitle(notebook?.title ?? '')
  }, [notebook?.title])

  function handleRenameSubmit() {
    const trimmed = editTitle.trim()
    if (trimmed && trimmed !== notebook?.title && onRenameNotebook) {
      onRenameNotebook(notebook.id, trimmed)
    } else {
      setEditTitle(notebook?.title ?? '')
    }
    setIsEditing(false)
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleRenameSubmit()
    } else if (e.key === 'Escape') {
      setEditTitle(notebook?.title ?? '')
      setIsEditing(false)
    }
  }

  return (
    <aside className="flex h-full flex-col border-r border-[#1a1a1a] bg-[#0d0d0d] overflow-hidden">
      {/* Header */}
      <div className={`shrink-0 border-b border-[#1a1a1a] flex flex-col ${isCollapsed ? 'p-3 gap-4' : 'p-4 gap-4'}`}>
        
        {/* Top bar: Back */}
        <div className={`flex items-center ${isCollapsed ? 'justify-center' : ''}`}>
          {isCollapsed ? (
            <button
              type="button"
              onClick={onBack}
              title="Back"
              className="flex size-10 items-center justify-center rounded-xl bg-[#111] text-[#9aa39f] transition hover:bg-[#1a1a1a] hover:text-white focus:outline-none"
            >
              <ChevronLeft aria-hidden="true" className="size-5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center gap-1.5 rounded-md px-1 py-1 text-sm font-medium text-[#9aa39f] transition hover:bg-[#1a1a1a] hover:text-white focus:outline-none"
            >
              <ChevronLeft aria-hidden="true" className="size-4" />
              Back
            </button>
          )}
        </div>

        {/* Title Area (only when expanded) */}
        {!isCollapsed && (
          <div className="group flex items-center justify-between gap-2 px-1.5">
            {isEditing ? (
              <input
                ref={inputRef}
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                onBlur={handleRenameSubmit}
                onKeyDown={handleKeyDown}
                className="w-full rounded-md border border-[#dffdee]/30 bg-[#111] px-2 py-1 text-lg font-bold text-white outline-none focus:border-[#dffdee]/50"
              />
            ) : (
              <>
                <h2
                  className="min-w-0 flex-1 truncate text-lg font-bold text-white cursor-pointer"
                  onDoubleClick={() => setIsEditing(true)}
                  title="Double-click to rename"
                >
                  {notebook?.title ?? 'Notebook'}
                </h2>
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="flex size-6 shrink-0 items-center justify-center rounded-md text-[#657069] opacity-0 transition group-hover:opacity-100 hover:bg-[#1a1a1a] hover:text-white focus:outline-none"
                  aria-label="Rename notebook"
                >
                  <Pencil aria-hidden="true" className="size-3.5" />
                </button>
              </>
            )}
          </div>
        )}

        {/* Collapsed Avatar Title */}
        {isCollapsed && (
          <div className="flex justify-center pt-2 pb-1">
            <div 
              className="flex size-10 items-center justify-center rounded-[10px] bg-gradient-to-b from-[#242424] to-[#111] border border-[#1a1a1a] text-[#dffdee] font-bold text-[13px] shadow-sm select-none"
              title={notebook?.title ?? 'Notebook'}
            >
              {getInitials(notebook?.title)}
            </div>
          </div>
        )}
      </div>

      {/* Action buttons */}
      {!readOnly && (
        <div className={`shrink-0 py-3 flex gap-2 ${isCollapsed ? 'px-2 flex-col' : 'px-4'}`}>
          <Button
            type="button"
            variant="outline"
            onClick={onOpenUpload}
            title="Upload Source"
            className={isCollapsed ? 'w-full px-0 flex justify-center border-[#1a1a1a] bg-[#111] text-[#c8cdc9] hover:border-[#333] hover:bg-[#1a1a1a] hover:text-white' : 'flex-1 border-[#1a1a1a] bg-[#111] text-[#c8cdc9] hover:border-[#333] hover:bg-[#1a1a1a] hover:text-white'}
          >
            <Upload aria-hidden="true" className="size-4" />
            {!isCollapsed && <span className="ml-2">Upload</span>}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onOpenShare}
            title="Share Notebook"
            className={isCollapsed ? 'w-full px-0 flex justify-center border-[#2a4a34] bg-gradient-to-br from-[#1a3023] to-[#142519] text-[#58d68d] hover:border-[#3a6044] hover:to-[#1e3a2a] shadow-[0_2px_12px_rgba(0,0,0,0.3)]' : 'flex-1 border-[#2a4a34] bg-gradient-to-br from-[#1a3023] to-[#142519] text-[#58d68d] hover:border-[#3a6044] hover:to-[#1e3a2a] shadow-[0_2px_12px_rgba(0,0,0,0.3)]'}
          >
            <Share2 aria-hidden="true" className="size-4" />
            {!isCollapsed && <span className="ml-2">Share</span>}
          </Button>
        </div>
      )}

      {/* Document list */}
      <div className="flex-1 overflow-y-auto px-2">
        {documents.length === 0 ? (
          <div className={`flex flex-col items-center gap-2 py-10 text-center ${isCollapsed ? 'px-1' : 'px-4'}`}>
            <div className="flex size-10 items-center justify-center rounded-lg border border-[#2d2d2d] bg-[#111]" title="No sources uploaded yet">
              <FileText aria-hidden="true" className="size-4 text-[#657069]" />
            </div>
            {!isCollapsed && <p className="text-sm text-[#657069]">No sources</p>}
          </div>
        ) : (
          <ul className="space-y-1 py-1">
            {documents.map((doc, i) => (
              <li
                key={doc.id}
                title={doc.title}
                style={{ animationDelay: `${i * 40}ms` }}
                className={`animate-fade-in group flex items-center rounded-lg transition-colors hover:bg-[#1a1a1a] ${isCollapsed ? 'justify-center p-2' : 'gap-2.5 px-3 py-2.5'}`}
              >
                {getDocIcon(doc)}
                {!isCollapsed && (
                  <>
                    <div className="min-w-0 flex-1 flex flex-col justify-center">
                      <span className={`truncate text-sm transition-colors ${doc.status === 'FAILED' ? 'text-red-400' : 'text-[#a2a8a5] group-hover:text-[#dffdee]'}`}>
                        {doc.title}
                      </span>
                      {doc.status === 'FAILED' && (
                        <span className="text-[10px] text-red-500/80 uppercase tracking-wide font-semibold mt-0.5">Processing Failed</span>
                      )}
                      {doc.status === 'PENDING' && (
                        <span className="text-[10px] text-yellow-500/80 uppercase tracking-wide font-semibold mt-0.5">Processing...</span>
                      )}
                    </div>
                    {/* Pin checkbox */}
                    {!readOnly && (
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); onTogglePin(doc.id) }}
                        title={pinnedDocIds.has(doc.id) ? 'Unpin from context' : 'Pin to context'}
                        className={`flex size-4 shrink-0 items-center justify-center rounded border transition mr-1 focus:outline-none ${
                          pinnedDocIds.has(doc.id)
                            ? 'border-[#58d68d] bg-[#58d68d]/20 text-[#58d68d]'
                            : 'border-[#333] bg-transparent text-transparent hover:border-[#58d68d]/50'
                        }`}
                        aria-label={pinnedDocIds.has(doc.id) ? `Unpin ${doc.title}` : `Pin ${doc.title}`}
                      >
                        {pinnedDocIds.has(doc.id) && (
                          <svg viewBox="0 0 10 10" className="size-2.5" fill="none">
                            <path d="M1.5 5.5L4 8l4.5-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                      </button>
                    )}
                    {!readOnly && (
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); onRemoveDocument(doc.id); }}
                        className="flex size-6 shrink-0 items-center justify-center rounded-md text-[#657069] opacity-0 transition group-hover:opacity-100 hover:bg-red-500/10 hover:text-red-400 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-[#b9f7d3]/25"
                        aria-label={`Remove ${doc.title}`}
                      >
                        <Trash2 aria-hidden="true" className="size-3.5" />
                      </button>
                    )}
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Footer Toggle */}
      <div className={`shrink-0 border-t border-[#1a1a1a] flex ${isCollapsed ? 'justify-center p-3' : 'justify-end p-3'}`}>
        <button
          type="button"
          onClick={onToggleCollapse}
          title={isCollapsed ? `Expand Sidebar (${notebook?.title || 'Notebook'})` : "Collapse Sidebar"}
          className="flex size-8 items-center justify-center rounded-md text-[#657069] transition hover:bg-[#1a1a1a] hover:text-white focus:outline-none"
        >
          {isCollapsed ? <PanelLeftOpen aria-hidden="true" className="size-5" /> : <PanelLeftClose aria-hidden="true" className="size-5" />}
        </button>
      </div>
    </aside>
  )
}

export default DocumentSidebar
