import { useState, useRef, useEffect } from 'react'
import {
  BookOpen,
  FileText,
  MoreVertical,
  Pencil,
  Trash2,
  Tag as TagIcon
} from 'lucide-react'
import TagSelectionModal from './TagSelectionModal.jsx'

function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function NotebookCard({ notebook, allTags = [], onOpen, onRename, onDelete, onUpdateTags, viewMode = 'grid' }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [renaming, setRenaming] = useState(false)
  const [tagMenuOpen, setTagMenuOpen] = useState(false)
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

  const notebookTags = (notebook.tagIds || [])
    .map(id => allTags.find(t => t.id === id))
    .filter(Boolean)

  const docCount = notebook.documents?.length ?? 0

  const isList = viewMode.startsWith('list')
  const isCompact = viewMode.endsWith('-compact')
  const isLarge = viewMode.endsWith('-large')

  const paddingClass = isList 
    ? (isCompact ? 'p-2 px-3 gap-3' : 'p-3 px-4 gap-4') 
    : (isCompact ? 'p-3 gap-3' : isLarge ? 'p-6 gap-5' : 'p-5 gap-4')

  const titleClass = isLarge ? 'text-[17px]' : (isCompact ? 'text-[13px]' : 'text-[15px]')
  const iconSizeClass = isCompact ? 'size-7' : (isLarge ? 'size-11' : 'size-9')
  const iconChildSizeClass = isCompact ? 'size-3.5' : (isLarge ? 'size-5' : 'size-4')
  const dateClass = isCompact ? 'text-[10px]' : (isLarge ? 'text-[13px]' : 'text-xs')

  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('notebookId', notebook.id)
      }}
      className={`group relative flex cursor-pointer rounded-[10px] border border-[#242424] bg-[#0d0d0d] transition-all duration-200 hover:border-[#3a3a3a] hover:bg-[#121212] hover:shadow-[0_4px_24px_rgba(0,0,0,0.3)] ${
        isList ? `flex-row items-center justify-between ${paddingClass}` : `flex-col ${paddingClass}`
      }`}
      onClick={() => !renaming && onOpen(notebook.id)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' && !renaming) onOpen(notebook.id)
      }}
      aria-label={`Open notebook ${notebook.title}`}
    >
      <div className={`flex items-start justify-between gap-3 ${isList ? 'flex-1 min-w-0' : 'w-full'}`}>
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className={`flex ${iconSizeClass} shrink-0 items-center justify-center rounded-lg border border-[#2d2d2d] bg-[#141414] shadow-sm`}>
            <BookOpen aria-hidden="true" className={`${iconChildSizeClass} text-[#dffdee]/70`} />
          </div>

          <div className="flex flex-col min-w-0">
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
                className="min-w-0 w-full rounded-md border border-[#dffdee]/30 bg-[#111] px-2 py-1 text-sm font-semibold text-white outline-none focus:ring-2 focus:ring-[#b9f7d3]/25"
              />
            ) : (
              <h3 className={`truncate font-semibold text-white transition-colors group-hover:text-[#dffdee] ${titleClass}`}>
                {notebook.title}
              </h3>
            )}
            {isList && notebook.clonedFromEmail && (
              <div className="text-[11px] text-[#58d68d]/80 truncate mt-0.5" title={`Cloned from: ${notebook.clonedFromEmail}`}>
                Cloned from {notebook.clonedFromEmail}
              </div>
            )}
            {notebookTags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1.5">
                {notebookTags.map(tag => (
                  <span 
                    key={tag.id} 
                    className="text-[10px] px-1.5 py-0.5 rounded-full font-medium whitespace-nowrap"
                    style={{ backgroundColor: `${tag.colorHex}20`, color: tag.colorHex, border: `1px solid ${tag.colorHex}40` }}
                  >
                    {tag.name}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Options menu for Grid view (top right) */}
        {!isList && (
          <div ref={menuRef} className="relative shrink-0">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                setMenuOpen((prev) => !prev)
              }}
              className="flex size-7 items-center justify-center rounded-md text-[#657069] opacity-0 transition hover:bg-white/[0.08] hover:text-white group-hover:opacity-100 focus:opacity-100 focus:outline-none"
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
                    setTagMenuOpen(true)
                  }}
                  className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-[#c8cdc9] transition hover:bg-white/[0.06] hover:text-white"
                >
                  <TagIcon aria-hidden="true" className="size-3.5" />
                  Tags
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
        )}
      </div>

      <div className={`flex shrink-0 ${isList ? 'items-center ml-4 gap-4' : 'flex-col w-full'}`}>
        <div className={`flex items-center justify-between text-[#657069] ${dateClass} ${isList ? '' : 'w-full'}`}>
          <div className="flex items-center gap-4">
            <span>{formatDate(notebook.createdAt)}</span>
            <span className="flex items-center gap-1">
              <FileText aria-hidden="true" className={isCompact ? 'size-2.5' : 'size-3'} />
              {docCount} {isList && !isCompact ? (docCount === 1 ? 'Document' : 'Documents') : 'Docs'}
            </span>
          </div>
          
          {!isList && notebook.clonedFromEmail && (
            <div className="flex items-center text-[10px] text-[#58d68d]/80 bg-[#1a3023]/50 px-1.5 py-0.5 rounded max-w-[110px]" title={`Cloned from: ${notebook.clonedFromEmail}`}>
              <span className="truncate">From {notebook.clonedFromEmail.split('@')[0]}</span>
            </div>
          )}
        </div>

        {/* Options menu for List view (right side) */}
        {isList && (
          <div ref={menuRef} className="relative shrink-0 ml-2">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                setMenuOpen((prev) => !prev)
              }}
              className="flex size-7 items-center justify-center rounded-md text-[#657069] opacity-0 transition hover:bg-white/[0.08] hover:text-white group-hover:opacity-100 focus:opacity-100 focus:outline-none"
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
                    setTagMenuOpen(true)
                  }}
                  className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-[#c8cdc9] transition hover:bg-white/[0.06] hover:text-white"
                >
                  <TagIcon aria-hidden="true" className="size-3.5" />
                  Tags
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
        )}
      </div>

      {tagMenuOpen && (
        <TagSelectionModal
          isOpen={tagMenuOpen}
          onClose={() => setTagMenuOpen(false)}
          notebook={notebook}
          allTags={allTags}
          onUpdateTags={onUpdateTags}
        />
      )}
    </div>
  )
}

export default NotebookCard
