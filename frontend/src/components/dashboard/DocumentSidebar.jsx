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

function DocumentSidebar({ notebook, isCollapsed, onToggleCollapse, onBack, backLabel = 'Back', onOpenUpload, onRemoveDocument, onRenameNotebook, pinnedDocIds, onTogglePin, onOpenShare, readOnly }) {
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
    <aside className="flex h-full flex-col border-r border-[#242424] bg-[#0f0f0f] overflow-hidden">
      {/* Header */}
      <div className={`shrink-0 border-b border-[#242424] flex flex-col ${isCollapsed ? 'p-2 gap-3' : 'p-3 gap-3'}`}>
        
        {/* Top bar: Back */}
        <div className={`flex items-center ${isCollapsed ? 'justify-center' : ''}`}>
          {isCollapsed ? (
            <button
              type="button"
              onClick={onBack}
              title="Back"
              className="flex size-8 items-center justify-center rounded bg-[#111] text-[#657069] transition hover:bg-[#1a1a1a] hover:text-white focus:outline-none"
            >
              <ChevronLeft aria-hidden="true" className="size-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center gap-1 rounded px-1.5 py-1 text-xs font-medium text-[#657069] transition hover:bg-[#1a1a1a] hover:text-white focus:outline-none"
            >
              <ChevronLeft aria-hidden="true" className="size-3.5" />
              {backLabel}
            </button>
          )}
        </div>

        {/* Title Area (only when expanded) */}
        {!isCollapsed && (
          <div className="group flex items-center justify-between gap-2 px-1">
            {isEditing ? (
              <input
                ref={inputRef}
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                onBlur={handleRenameSubmit}
                onKeyDown={handleKeyDown}
                className="w-full rounded border border-[#eccb45]/30 bg-[#111] px-1.5 py-0.5 text-sm font-semibold text-white outline-none focus:border-[#eccb45]/60"
              />
            ) : (
              <>
                <h2
                  className="min-w-0 flex-1 truncate text-sm font-semibold text-white cursor-pointer"
                  onDoubleClick={() => setIsEditing(true)}
                  title="Double-click to rename"
                >
                  {notebook?.title ?? 'Notebook'}
                </h2>
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="flex size-5 shrink-0 items-center justify-center rounded text-[#657069] opacity-0 transition group-hover:opacity-100 hover:bg-[#1a1a1a] hover:text-white focus:outline-none"
                  aria-label="Rename notebook"
                >
                  <Pencil aria-hidden="true" className="size-3" />
                </button>
              </>
            )}
          </div>
        )}

        {/* Collapsed Avatar Title */}
        {isCollapsed && (
          <div className="flex justify-center pb-0.5">
            <div 
              className="flex size-8 items-center justify-center rounded bg-[#111] border border-[#242424] text-[#eccb45] font-semibold text-xs select-none"
              title={notebook?.title ?? 'Notebook'}
            >
              {getInitials(notebook?.title)}
            </div>
          </div>
        )}
      </div>

      {/* Action buttons */}
      {!readOnly && (
        <div className={`shrink-0 py-2.5 flex gap-1.5 ${isCollapsed ? 'px-2 flex-col' : 'px-3'}`}>
          <button
            type="button"
            onClick={onOpenUpload}
            title="Upload Source"
            className={`flex items-center justify-center rounded border border-[#242424] bg-[#111] text-[#a2a8a5] transition-colors hover:border-[#333] hover:bg-[#1a1a1a] hover:text-white ${isCollapsed ? 'w-full p-1.5' : 'flex-1 p-1.5 text-xs'}`}
          >
            <Upload aria-hidden="true" className="size-3.5" />
            {!isCollapsed && <span className="ml-1.5">Upload</span>}
          </button>
          <button
            type="button"
            onClick={onOpenShare}
            title="Share Notebook"
            className={`flex items-center justify-center rounded border transition-colors ${isCollapsed ? 'w-full p-1.5 border-[#eccb45]/20 bg-[#eccb45]/10 text-[#eccb45] hover:bg-[#eccb45]/20' : 'flex-1 p-1.5 text-xs border-[#eccb45]/20 bg-[#eccb45]/10 text-[#eccb45] hover:bg-[#eccb45]/20'}`}
          >
            <Share2 aria-hidden="true" className="size-3.5" />
            {!isCollapsed && <span className="ml-1.5">Share</span>}
          </button>
        </div>
      )}

      {/* Document list */}
      <div className="flex-1 overflow-y-auto px-1.5 pb-2">
        {documents.length === 0 ? (
          <div className={`flex flex-col items-center gap-2 py-8 text-center ${isCollapsed ? 'px-1' : 'px-4'}`}>
            <div className="flex size-8 items-center justify-center rounded border border-[#242424] bg-[#111]" title="No sources uploaded yet">
              <FileText aria-hidden="true" className="size-3.5 text-[#657069]" />
            </div>
            {!isCollapsed && <p className="text-xs text-[#657069]">No sources</p>}
          </div>
        ) : (
          <ul className="space-y-0.5 py-1">
            {documents.map((doc, i) => (
              <li
                key={doc.id}
                title={doc.title}
                style={{ animationDelay: `${i * 30}ms` }}
                className={`animate-fade-in group flex items-center rounded transition-colors hover:bg-[#1a1a1a] ${isCollapsed ? 'justify-center p-1.5' : 'gap-2 px-2 py-1.5'}`}
              >
                <div className="scale-90">
                  {getDocIcon(doc)}
                </div>
                {!isCollapsed && (
                  <>
                    <div className="min-w-0 flex-1 flex flex-col justify-center">
                      <span className={`truncate text-xs transition-colors ${doc.status === 'FAILED' ? 'text-red-400' : 'text-[#a2a8a5] group-hover:text-white'}`}>
                        {doc.title}
                      </span>
                      {doc.status === 'FAILED' && (
                        <span className="text-[9px] text-red-500/80 uppercase tracking-wide font-medium mt-0.5">Processing Failed</span>
                      )}
                      {doc.status === 'PENDING' && (
                        <span className="text-[9px] text-[#eccb45]/80 uppercase tracking-wide font-medium mt-0.5">Processing...</span>
                      )}
                    </div>
                    {/* Pin checkbox */}
                    {!readOnly && (
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); onTogglePin(doc.id) }}
                        title={pinnedDocIds.has(doc.id) ? 'Unpin from context' : 'Pin to context'}
                        className={`flex size-3.5 shrink-0 items-center justify-center rounded-[3px] border transition focus:outline-none ${
                          pinnedDocIds.has(doc.id)
                            ? 'border-[#eccb45] bg-[#eccb45]/20 text-[#eccb45]'
                            : 'border-[#333] bg-transparent text-transparent hover:border-[#eccb45]/50'
                        }`}
                        aria-label={pinnedDocIds.has(doc.id) ? `Unpin ${doc.title}` : `Pin ${doc.title}`}
                      >
                        {pinnedDocIds.has(doc.id) && (
                          <svg viewBox="0 0 10 10" className="size-2" fill="none">
                            <path d="M1.5 5.5L4 8l4.5-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                      </button>
                    )}
                    {!readOnly && (
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); onRemoveDocument(doc.id); }}
                        className="flex size-5 shrink-0 items-center justify-center rounded text-[#657069] opacity-0 transition group-hover:opacity-100 hover:bg-red-500/10 hover:text-red-400 focus:opacity-100 focus:outline-none ml-0.5"
                        aria-label={`Remove ${doc.title}`}
                      >
                        <Trash2 aria-hidden="true" className="size-3" />
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
      <div className={`shrink-0 border-t border-[#242424] flex ${isCollapsed ? 'justify-center p-2' : 'justify-end p-2'}`}>
        <button
          type="button"
          onClick={onToggleCollapse}
          title={isCollapsed ? `Expand Sidebar (${notebook?.title || 'Notebook'})` : "Collapse Sidebar"}
          className="flex size-7 items-center justify-center rounded text-[#657069] transition hover:bg-[#1a1a1a] hover:text-white focus:outline-none"
        >
          {isCollapsed ? <PanelLeftOpen aria-hidden="true" className="size-4" /> : <PanelLeftClose aria-hidden="true" className="size-4" />}
        </button>
      </div>
    </aside>
  )
}

export default DocumentSidebar
