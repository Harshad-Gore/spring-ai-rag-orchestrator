import { useEffect, useRef, useState } from 'react'
import { Files, Folder, MoreVertical, Pencil, Trash2 } from 'lucide-react'

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`
}

export default function FolderCard({
  folder,
  folderStats = {
    directItemCount: 0,
    notebookCount: 0,
    totalSizeBytes: 0,
  },
  viewMode = 'grid',
  onClick,
  onRename,
  onDelete,
  onDropNotebook,
  onDropFolder,
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [isDragOver, setIsDragOver] = useState(false)
  const [renaming, setRenaming] = useState(false)
  const [renameValue, setRenameValue] = useState(folder.name)
  const menuRef = useRef(null)
  const renameInputRef = useRef(null)

  const isList = viewMode.startsWith('list')
  const isCompact = viewMode.endsWith('-compact')
  const isLarge = viewMode.endsWith('-large')

  const paddingClass = isList
    ? (isCompact ? 'p-2 px-3 gap-3' : 'p-3 px-4 gap-4')
    : (isCompact ? 'p-3 gap-3' : isLarge ? 'p-6 gap-5' : 'p-5 gap-4')
  const titleClass = isLarge ? 'text-[17px]' : (isCompact ? 'text-[13px]' : 'text-[15px]')
  const iconSizeClass = isCompact ? 'size-7' : (isLarge ? 'size-11' : 'size-9')
  const iconChildSizeClass = isCompact ? 'size-3.5' : (isLarge ? 'size-5' : 'size-4')
  const metaClass = isCompact ? 'text-[10px]' : (isLarge ? 'text-[13px]' : 'text-xs')

  useEffect(() => {
    if (renaming && renameInputRef.current) {
      renameInputRef.current.focus()
      renameInputRef.current.select()
    }
  }, [renaming])

  useEffect(() => {
    if (!menuOpen) return

    function handleClick(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [menuOpen])

  function handleRenameSubmit() {
    const trimmed = renameValue.trim()
    if (trimmed && trimmed !== folder.name) {
      onRename(folder, trimmed)
    } else {
      setRenameValue(folder.name)
    }
    setRenaming(false)
  }

  function handleDrop(event) {
    event.preventDefault()
    setIsDragOver(false)

    const notebookId = event.dataTransfer.getData('notebookId')
    const folderId = event.dataTransfer.getData('folderId')

    if (notebookId) {
      onDropNotebook(notebookId, folder.id)
      return
    }

    if (folderId && folderId !== folder.id) {
      onDropFolder(folderId, folder.id)
    }
  }

  return (
    <div
      draggable
      onDragStart={(event) => {
        event.dataTransfer.setData('folderId', folder.id)
      }}
      onClick={(event) => {
        if (!renaming) onClick(event)
      }}
      onDragOver={(event) => {
        event.preventDefault()
        setIsDragOver(true)
      }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={handleDrop}
      className={`group relative flex cursor-pointer rounded-[10px] border transition-all duration-200 ${
        isList ? `flex-row items-center justify-between ${paddingClass}` : `flex-col ${paddingClass}`
      } ${
        isDragOver
          ? 'border-[#58d68d] bg-[#142019] shadow-[0_0_0_1px_rgba(88,214,141,0.2)]'
          : 'border-[#242424] bg-[#0d0d0d] hover:border-[#333] hover:bg-[#121212] hover:shadow-[0_4px_24px_rgba(0,0,0,0.3)]'
      }`}
    >
      <div className={`flex items-start justify-between gap-3 ${isList ? 'min-w-0 flex-1' : 'w-full'}`}>
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <div className={`flex ${iconSizeClass} shrink-0 items-center justify-center rounded-lg border border-[#2d2d2d] bg-[#141414] shadow-sm`}>
            <Folder className={`${iconChildSizeClass} text-[#58d68d]`} />
          </div>

          <div className="min-w-0 flex-1">
            {renaming ? (
              <input
                ref={renameInputRef}
                type="text"
                value={renameValue}
                onChange={(event) => setRenameValue(event.target.value)}
                onBlur={handleRenameSubmit}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') handleRenameSubmit()
                  if (event.key === 'Escape') {
                    setRenameValue(folder.name)
                    setRenaming(false)
                  }
                }}
                onClick={(event) => event.stopPropagation()}
                className="min-w-0 w-full rounded-md border border-[#dffdee]/30 bg-[#111] px-2 py-1 text-sm font-semibold text-white outline-none focus:ring-2 focus:ring-[#b9f7d3]/25"
              />
            ) : (
              <h3 className={`truncate font-semibold text-[#dffdee] ${titleClass}`}>
                {folder.name}
              </h3>
            )}

            <div className={`mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[#657069] ${metaClass}`}>
              <span className="inline-flex items-center gap-1">
                <Files className={isCompact ? 'size-2.5' : 'size-3'} />
                {folderStats.directItemCount} {folderStats.directItemCount === 1 ? 'Item' : 'Items'}
              </span>
              <span>{folderStats.notebookCount} {folderStats.notebookCount === 1 ? 'Notebook' : 'Notebooks'}</span>
              <span>{formatSize(folderStats.totalSizeBytes)}</span>
            </div>
          </div>
        </div>

        <div ref={menuRef} className={`relative shrink-0 ${isList ? 'ml-2' : ''}`} onClick={(event) => event.stopPropagation()}>
          <button
            onClick={() => setMenuOpen((open) => !open)}
            className="flex size-8 items-center justify-center rounded-md text-[#657069] opacity-0 transition hover:bg-[#1a1a1a] hover:text-[#c8cdc9] group-hover:opacity-100 focus:opacity-100 focus:outline-none"
          >
            <MoreVertical className="size-4" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-full z-30 mt-1 w-40 overflow-hidden rounded-lg border border-[#242424] bg-[#111] shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation()
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
                onClick={(event) => {
                  event.stopPropagation()
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
    </div>
  )
}
