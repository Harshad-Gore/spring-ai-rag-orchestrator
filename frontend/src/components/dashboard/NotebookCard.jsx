import { useState, useRef, useEffect } from 'react'
import {
  BookOpen,
  FileText,
} from 'lucide-react'

function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export default function NotebookCard({ notebook, allTags = [], onOpen, onRename, onDelete, onUpdateTags, viewMode = 'grid', onContextMenu, forceEdit, onRenameStart, isSelected, onSelect }) {
  const [renaming, setRenaming] = useState(false)
  const [renameValue, setRenameValue] = useState(notebook.title)
  const renameInputRef = useRef(null)

  useEffect(() => {
    if (forceEdit) {
      setRenaming(true)
      setRenameValue(notebook.title)
      if (onRenameStart) onRenameStart()
    }
  }, [forceEdit, notebook.title, onRenameStart])

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

  const docCount = notebook.documentCount ?? notebook.documents?.length ?? 0

  const isList = viewMode.startsWith('list')
  const isLarge = viewMode === 'grid-large'
  const isMedium = viewMode === 'grid'
  const isSmall = viewMode === 'grid-compact'

  // Windows-style sizing
  let iconSizeClass = 'size-6' // default list
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
    // List modes
    layoutClass = viewMode === 'list-compact' ? 'flex-row items-center gap-2 py-0.5 px-2' : 'flex-row items-center gap-3 py-1.5 px-2'
    containerWidth = 'w-[250px]'
  }

  return (
    <div
      draggable
      onDragStart={(e) => {
        e.stopPropagation()
        e.dataTransfer.setData('notebookId', notebook.id) // fallback
        e.dataTransfer.setData('application/json', JSON.stringify({ id: notebook.id, type: 'notebook' }))
      }}
      className={`group relative flex cursor-pointer rounded border transition-colors ${
        isSelected 
          ? 'bg-[#58d68d]/20 border-[#58d68d]/50' 
          : 'border-transparent hover:bg-white/10 hover:border-white/5'
      } ${layoutClass} ${containerWidth}`}
      onClick={(e) => {
        if (!renaming && onSelect) onSelect(e, notebook)
      }}
      onContextMenu={(e) => onContextMenu && onContextMenu(e, notebook)}
      onDoubleClick={(e) => {
        e.stopPropagation()
        if (!renaming) onOpen(notebook.id)
      }}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' && !renaming) onOpen(notebook.id)
        if (e.key === 'F2' && !renaming) {
          e.stopPropagation()
          setRenaming(true)
          setRenameValue(notebook.title)
          if (onRenameStart) onRenameStart()
        }
      }}
      aria-label={`Open notebook ${notebook.title}`}
    >
      {/* Notebook Icon */}
      <div className={`flex ${iconSizeClass} shrink-0 items-center justify-center rounded-lg text-[#58d68d]`}>
        <FileText aria-hidden="true" className={iconChildSizeClass} />
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
                setRenameValue(notebook.title)
                setRenaming(false)
              }
            }}
            onClick={(e) => e.stopPropagation()}
            className="w-full min-w-[60px] rounded border border-[#58d68d] bg-black px-1 text-sm text-white outline-none"
          />
        ) : (
          <div className="flex flex-col">
            <span className={`truncate text-sm text-white drop-shadow-md ${isList ? '' : 'line-clamp-2 whitespace-normal leading-tight'}`} title={notebook.title}>
              {notebook.title}
            </span>
            {!isList && notebookTags.length > 0 && (
              <div 
                className="mt-1 flex flex-wrap gap-1 cursor-pointer hover:opacity-80"
                onClick={(e) => { e.stopPropagation(); if(onManageTags) onManageTags(notebook); }}
              >
                {notebookTags.slice(0, 3).map((t) => (
                  <span key={t.id} className="size-2 rounded-full" style={{ backgroundColor: t.colorHex || '#58d68d' }} title={t.name} />
                ))}
                {notebookTags.length > 3 && <span className="text-[10px] text-[#a2a8a5] leading-none">+{notebookTags.length - 3}</span>}
              </div>
            )}
          </div>
        )}
        
        {/* Additional info for list views */}
        {isList && (
          <div className="flex items-center gap-2 mt-1 truncate">
            {notebookTags.length > 0 && (
              <div 
                className="flex items-center gap-1 shrink-0 cursor-pointer hover:opacity-80"
                onClick={(e) => { e.stopPropagation(); if(onManageTags) onManageTags(notebook); }}
              >
                {notebookTags.slice(0, 2).map((t) => (
                  <span key={t.id} className="rounded px-1.5 py-0.5 text-[10px] font-medium" style={{ backgroundColor: `${t.colorHex || '#58d68d'}20`, color: t.colorHex || '#58d68d', border: `1px solid ${t.colorHex || '#58d68d'}40` }}>
                    {t.name}
                  </span>
                ))}
                {notebookTags.length > 2 && <span className="text-[10px] text-[#a2a8a5]">+{notebookTags.length - 2}</span>}
              </div>
            )}
            <span className="text-[11px] text-[#a2a8a5] truncate">
              {docCount} {docCount === 1 ? 'doc' : 'docs'} • {formatDate(notebook.createdAt)}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
