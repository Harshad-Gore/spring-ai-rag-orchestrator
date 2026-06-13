import { useState, useRef, useEffect } from 'react'
import { Folder } from 'lucide-react'

export default function FolderCard({ folder, onOpen, onRename, onDelete, onDropItem, onContextMenu, viewMode = 'grid', forceEdit, onRenameStart, isSelected, onSelect }) {
  const [isDragOver, setIsDragOver] = useState(false)
  const [renaming, setRenaming] = useState(false)
  const [renameValue, setRenameValue] = useState(folder.name)
  const renameInputRef = useRef(null)

  useEffect(() => {
    if (forceEdit) {
      setRenaming(true)
      setRenameValue(folder.name)
      if (onRenameStart) onRenameStart()
    }
  }, [forceEdit, folder.name, onRenameStart])

  useEffect(() => {
    if (renaming && renameInputRef.current) {
      renameInputRef.current.focus()
      renameInputRef.current.select()
    }
  }, [renaming])

  function handleRenameSubmit() {
    const trimmed = renameValue.trim()
    if (trimmed && trimmed !== folder.name) {
      onRename(folder.id, trimmed)
    } else {
      setRenameValue(folder.name)
    }
    setRenaming(false)
  }

  const isList = viewMode.startsWith('list')
  const isLarge = viewMode === 'grid-large'
  const isMedium = viewMode === 'grid'
  const isSmall = viewMode === 'grid-compact'

  let iconSizeClass = 'size-6'
  let iconChildSizeClass = 'size-4'
  let layoutClass = 'flex-row items-center gap-3 py-1 px-2'
  let textAlignment = 'text-left'
  let containerWidth = 'w-full'

  if (isLarge) {
    iconSizeClass = 'size-24'
    iconChildSizeClass = 'size-12'
    layoutClass = 'flex-col items-center gap-2 p-3'
    textAlignment = 'text-center'
    containerWidth = 'w-[140px]'
  } else if (isMedium) {
    iconSizeClass = 'size-16'
    iconChildSizeClass = 'size-8'
    layoutClass = 'flex-col items-center gap-1.5 p-2'
    textAlignment = 'text-center'
    containerWidth = 'w-[100px]'
  } else if (isSmall) {
    iconSizeClass = 'size-12'
    iconChildSizeClass = 'size-6'
    layoutClass = 'flex-col items-center gap-1 p-2'
    textAlignment = 'text-center'
    containerWidth = 'w-[80px]'
  } else if (isList) {
    layoutClass = viewMode === 'list-compact' ? 'flex-row items-center gap-2 py-0.5 px-2' : 'flex-row items-center gap-3 py-1.5 px-2'
    containerWidth = 'w-[250px]'
  }

  return (
    <div
      onClick={(e) => {
        if (!renaming && onSelect) onSelect(e, folder)
      }}
      onContextMenu={(e) => onContextMenu && onContextMenu(e, folder)}
      onDoubleClick={(e) => {
        e.stopPropagation()
        if (!renaming && onOpen) onOpen(folder.id)
      }}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' && !renaming && onOpen) onOpen(folder.id)
        if (e.key === 'F2' && !renaming) {
          e.stopPropagation()
          setRenaming(true)
          setRenameValue(folder.name)
          if (onRenameStart) onRenameStart()
        }
      }}
      onDragOver={(e) => {
        e.preventDefault()
        setIsDragOver(true)
      }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={(e) => {
        e.preventDefault()
        setIsDragOver(false)
        try {
          const data = JSON.parse(e.dataTransfer.getData('application/json'))
          if (data && data.id && data.id !== folder.id) {
            onDropItem(data.id, data.type)
          }
        } catch (err) {
          // fallback
          const notebookId = e.dataTransfer.getData('notebookId')
          if (notebookId) onDropItem(notebookId, 'notebook')
        }
      }}
      draggable
      onDragStart={(e) => {
        e.stopPropagation()
        e.dataTransfer.setData('application/json', JSON.stringify({ id: folder.id, type: 'folder' }))
      }}
      className={`group relative flex cursor-pointer rounded border transition-colors ${layoutClass} ${containerWidth} ${
        isDragOver 
          ? 'border-[#58d68d] bg-[#ffffff15]' 
          : isSelected 
            ? 'bg-[#eccb45]/20 border-[#eccb45]/50'
            : 'border-transparent hover:bg-white/10 hover:border-white/5'
      }`}
    >
      <div className={`flex ${iconSizeClass} shrink-0 items-center justify-center rounded-lg text-[#eccb45]`}>
        <Folder fill="currentColor" fillOpacity={0.2} aria-hidden="true" className={iconChildSizeClass} />
      </div>

      <div className={`flex flex-col min-w-0 flex-1 ${textAlignment}`}>
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
            className="w-full min-w-[60px] rounded border border-[#58d68d] bg-black px-1 text-sm text-white outline-none"
          />
        ) : (
          <span className={`truncate text-sm text-white drop-shadow-md ${isList ? '' : 'line-clamp-2 whitespace-normal leading-tight'}`} title={folder.name}>
            {folder.name}
          </span>
        )}
        
        {isList && (
          <span className="text-[11px] text-[#a2a8a5] truncate">File folder</span>
        )}
      </div>
    </div>
  )
}
