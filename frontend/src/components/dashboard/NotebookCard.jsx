import { useState, useRef, useEffect } from 'react'
import {
  BookOpen,
  FileText,
  MoreVertical,
  Pencil,
  Trash2,
} from 'lucide-react'

function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function NotebookCard({ notebook, onOpen, onRename, onDelete }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [renaming, setRenaming] = useState(false)
  const [renameValue, setRenameValue] = useState(notebook.title)
  const menuRef = useRef(null)
  const renameInputRef = useRef(null)

  // Close menu on outside click
  useEffect(() => {
    if (!menuOpen) return

    function handleClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [menuOpen])

  // Focus rename input when entering rename mode
  useEffect(() => {
    if (renaming && renameInputRef.current) {
      renameInputRef.current.focus()
      renameInputRef.current.select()
    }
  }, [renaming])

  function handleRenameSubmit() {
    const trimmed = renameValue.trim()
    if (trimmed && trimmed !== notebook.title) {
      onRename(notebook.id, trimmed)
    } else {
      setRenameValue(notebook.title)
    }
    setRenaming(false)
  }

  const docCount = notebook.documents?.length ?? 0

  return (
    <div
      className="group relative flex cursor-pointer flex-col gap-4 rounded-[10px] border border-[#242424] bg-[#0d0d0d] p-5 transition-all duration-200 hover:border-[#3a3a3a] hover:shadow-[0_4px_24px_rgba(0,0,0,0.3)]"
      onClick={() => !renaming && onOpen(notebook.id)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' && !renaming) onOpen(notebook.id)
      }}
      aria-label={`Open notebook ${notebook.title}`}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-[#2d2d2d] bg-[#141414]">
            <BookOpen aria-hidden="true" className="size-4 text-[#dffdee]/60" />
          </div>

          {renaming ? (
            <input
              ref={renameInputRef}
              type="text"
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onBlur={handleRenameSubmit}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleRenameSubmit()
                if (e.key === 'Escape') {
                  setRenameValue(notebook.title)
                  setRenaming(false)
                }
              }}
              onClick={(e) => e.stopPropagation()}
              className="min-w-0 flex-1 rounded-md border border-[#dffdee]/30 bg-[#111] px-2 py-1 text-sm font-semibold text-white outline-none focus:ring-2 focus:ring-[#b9f7d3]/25"
            />
          ) : (
            <h3 className="truncate text-[15px] font-semibold text-white">
              {notebook.title}
            </h3>
          )}
        </div>

        {/* Options menu */}
        <div ref={menuRef} className="relative shrink-0">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              setMenuOpen((prev) => !prev)
            }}
            className="flex size-7 items-center justify-center rounded-md text-[#657069] opacity-0 transition hover:bg-white/[0.06] hover:text-white group-hover:opacity-100 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-[#b9f7d3]/25"
            aria-label="Notebook options"
            aria-expanded={menuOpen}
          >
            <MoreVertical aria-hidden="true" className="size-4" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-full z-30 mt-1 w-40 overflow-hidden rounded-lg border border-[#242424] bg-[#111] shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  setMenuOpen(false)
                  setRenaming(true)
                  setRenameValue(notebook.title)
                }}
                className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-[#c8cdc9] transition hover:bg-white/[0.06] hover:text-white"
              >
                <Pencil aria-hidden="true" className="size-3.5" />
                Rename
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  setMenuOpen(false)
                  onDelete(notebook.id)
                }}
                className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-red-400 transition hover:bg-red-500/10 hover:text-red-300"
              >
                <Trash2 aria-hidden="true" className="size-3.5" />
                Delete
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Footer meta */}
      <div className="flex items-center gap-4 text-xs text-[#657069]">
        <span>{formatDate(notebook.createdAt)}</span>
        <span className="flex items-center gap-1">
          <FileText aria-hidden="true" className="size-3" />
          {docCount} {docCount === 1 ? 'Document' : 'Documents'}
        </span>
      </div>
    </div>
  )
}

export default NotebookCard
