import { Folder, MoreVertical, Edit2, Trash2, Pencil } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'

export default function FolderCard({ folder, onClick, onRename, onDelete, onDropNotebook }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [isDragOver, setIsDragOver] = useState(false)
  const [renaming, setRenaming] = useState(false)
  const [renameValue, setRenameValue] = useState(folder.name)
  const menuRef = useRef(null)
  const renameInputRef = useRef(null)

  useEffect(() => {
    if (renaming && renameInputRef.current) {
      renameInputRef.current.focus()
      renameInputRef.current.select()
    }
  }, [renaming])

  function handleRenameSubmit() {
    const trimmed = renameValue.trim()
    if (trimmed && trimmed !== folder.name) {
      onRename(folder, trimmed)
    } else {
      setRenameValue(folder.name)
    }
    setRenaming(false)
  }

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

  return (
    <div
      onClick={(e) => {
        if (!renaming) onClick(e)
      }}
      onDragOver={(e) => {
        e.preventDefault()
        setIsDragOver(true)
      }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={(e) => {
        e.preventDefault()
        setIsDragOver(false)
        const notebookId = e.dataTransfer.getData('notebookId')
        if (notebookId) {
          onDropNotebook(notebookId, folder.id)
        }
      }}
      className={`group relative flex cursor-pointer flex-col overflow-hidden rounded-xl border transition-all ${
        isDragOver 
          ? 'border-[#58d68d] bg-[#1a2f22]' 
          : 'border-[#242424] bg-[#0d0d0d] hover:border-[#333] hover:bg-[#121212]'
      }`}
    >
      <div className="flex flex-col p-5">
        <div className="flex items-start justify-between">
          <div className="flex size-10 items-center justify-center rounded-lg bg-[#1a1a1a] text-[#58d68d]">
            <Folder className="size-5" />
          </div>
          <div className="relative" ref={menuRef} onClick={e => e.stopPropagation()}>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex size-8 items-center justify-center rounded-md text-[#657069] opacity-0 transition-opacity hover:bg-[#1a1a1a] hover:text-[#c8cdc9] group-hover:opacity-100"
            >
              <MoreVertical className="size-4" />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-full z-30 mt-1 w-40 overflow-hidden rounded-lg border border-[#242424] bg-[#111] shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    setMenuOpen(false)
                    setRenaming(true)
                    setRenameValue(folder.name)
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
                    onDelete(folder.id)
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
                setRenameValue(folder.name)
                setRenaming(false)
              }
            }}
            onClick={(e) => e.stopPropagation()}
            className="mt-4 w-full rounded-md border border-[#dffdee]/30 bg-[#111] px-2 py-1 text-sm font-semibold text-white outline-none focus:ring-2 focus:ring-[#b9f7d3]/25"
          />
        ) : (
          <h3 className="mt-4 truncate text-base font-semibold text-[#dffdee]">
            {folder.name}
          </h3>
        )}
        <div className="mt-1 flex items-center gap-2">
          <p className="text-xs text-[#657069]">Folder</p>
        </div>
      </div>
    </div>
  )
}
