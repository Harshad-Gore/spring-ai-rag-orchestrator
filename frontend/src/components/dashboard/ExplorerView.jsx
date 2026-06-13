import { useState, useEffect, useRef } from 'react'
import NotebookCard from './NotebookCard.jsx'
import FolderCard from './FolderCard.jsx'
import EmptyState from './EmptyState.jsx'
import ManageTagsModal from './ManageTagsModal.jsx'
import TagSelectionModal from './TagSelectionModal.jsx'
import ContextMenu from './ContextMenu.jsx'
import { PromptDialog } from '../ui/prompt-dialog.jsx'
import { LayoutGrid, List as ListIcon, ChevronDown, Check, ChevronRight, FolderPlus, FilePlus, Tags, ArrowLeft, ArrowRight, ArrowUp, Folder, FileText, Monitor, Grid, AlignLeft, AlignJustify, ArrowDownUp, RotateCw, Plus } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

function formatSize(notebook) {
  const count = notebook.documentCount ?? notebook.documents?.length ?? 0
  return count === 1 ? '1 doc' : `${count} docs`
}

function formatDate(isoString) {
  if (!isoString) return ''
  const d = new Date(isoString)
  return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export default function ExplorerView({
  notebooks = [],
  folders = [],
  tags = [],
  activeFolderId,
  setActiveFolderId,
  searchQuery,
  onOpenNotebook,
  onCreateNotebook,
  onRenameNotebook,
  onDeleteNotebook,
  onCreateFolder,
  onRenameFolder,
  onDeleteFolder,
  onDropItem,
  onUpdateNotebookTags,
  onCreateTag,
  onDeleteTag,
  onRefresh,
  onBulkDelete,
  onBulkRename,
}) {
  const navigate = useNavigate()
  const [showManageTags, setShowManageTags] = useState(false)
  const [tagSelectionItem, setTagSelectionItem] = useState(null)
  const [contextMenu, setContextMenu] = useState(null)
  const [promptConfig, setPromptConfig] = useState({ isOpen: false, title: '', description: '', onConfirm: null })
  
  const [sortField, setSortField] = useState(() => localStorage.getItem('explorerSortField') || 'name')
  const [sortDirection, setSortDirection] = useState(() => localStorage.getItem('explorerSortDirection') || 'asc')

  useEffect(() => {
    localStorage.setItem('explorerSortField', sortField)
  }, [sortField])

  useEffect(() => {
    localStorage.setItem('explorerSortDirection', sortDirection)
  }, [sortDirection])
  const [sortMenuOpen, setSortMenuOpen] = useState(false)
  const [newMenuOpen, setNewMenuOpen] = useState(false)
  const sortMenuRef = useRef(null)
  
  const [selectedIds, setSelectedIds] = useState(new Set())
  const [lastSelectedId, setLastSelectedId] = useState(null)
  const prevFolderIdRef = useRef(activeFolderId)

  useEffect(() => {
    if (prevFolderIdRef.current !== activeFolderId) {
      const oldId = prevFolderIdRef.current
      if (oldId) {
        const oldFolder = folders.find(f => f.id === oldId)
        if (oldFolder && (oldFolder.parentId === activeFolderId || (!oldFolder.parentId && !activeFolderId))) {
          setSelectedIds(new Set([oldId]))
          setLastSelectedId(oldId)
        } else {
          setSelectedIds(new Set())
          setLastSelectedId(null)
        }
      } else {
        setSelectedIds(new Set())
        setLastSelectedId(null)
      }
      prevFolderIdRef.current = activeFolderId
    }
  }, [activeFolderId, folders])

  // For inline renaming
  const [editingItem, setEditingItem] = useState(null) // { id, type, name }
  const editInputRef = useRef(null)

  const filteredNotebooks = searchQuery
    ? notebooks.filter((nb) => nb.title.toLowerCase().includes(searchQuery.toLowerCase()))
    : notebooks.filter((nb) => nb.folderId === activeFolderId)

  let filteredFolders = searchQuery
    ? folders.filter((f) => f.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : folders.filter((f) => (activeFolderId ? f.parentId === activeFolderId : !f.parentId))

  // Sort logic
  const sortData = (a, b, isFolder) => {
    let aVal, bVal
    if (sortField === 'name') {
      aVal = isFolder ? a.name : a.title
      bVal = isFolder ? b.name : b.title
    } else if (sortField === 'date') {
      aVal = new Date(a.createdAt || 0).getTime()
      bVal = new Date(b.createdAt || 0).getTime()
    } else if (sortField === 'size') {
      aVal = isFolder ? 0 : (a.documentCount ?? a.documents?.length ?? 0)
      bVal = isFolder ? 0 : (b.documentCount ?? b.documents?.length ?? 0)
    } else {
      aVal = a.id; bVal = b.id;
    }
    
    if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1
    if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1
    return 0
  }

  filteredFolders.sort((a, b) => sortData(a, b, true))
  filteredNotebooks.sort((a, b) => sortData(a, b, false))

  const breadcrumbs = []
  let curr = activeFolderId ? folders.find(f => f.id === activeFolderId) : null
  while (curr) {
    breadcrumbs.unshift(curr)
    curr = curr.parentId ? folders.find(f => f.id === curr.parentId) : null
  }

  const handleUp = () => {
    if (!activeFolderId) return
    const currentFolder = folders.find(f => f.id === activeFolderId)
    setActiveFolderId(currentFolder?.parentId || null)
  }

  const [viewMode, setViewMode] = useState(() => localStorage.getItem('explorerViewMode') || 'details')
  const [viewMenuOpen, setViewMenuOpen] = useState(false)
  const viewMenuRef = useRef(null)

  useEffect(() => {
    localStorage.setItem('explorerViewMode', viewMode)
  }, [viewMode])

  useEffect(() => {
    if (!viewMenuOpen) return
    function handleClick(e) {
      if (viewMenuRef.current && !viewMenuRef.current.contains(e.target)) {
        setViewMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [viewMenuOpen])

  useEffect(() => {
    if (!sortMenuOpen) return
    function handleClick(e) {
      if (sortMenuRef.current && !sortMenuRef.current.contains(e.target)) {
        setSortMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [sortMenuOpen])

  useEffect(() => {
    if (editingItem && editInputRef.current) {
      editInputRef.current.focus()
      editInputRef.current.select()
    }
  }, [editingItem?.id])

  const viewOptions = [
    { id: 'grid-large', label: 'Extra Large Icons', icon: Monitor },
    { id: 'grid', label: 'Medium Icons', icon: Grid },
    { id: 'grid-compact', label: 'Small Icons', icon: LayoutGrid },
    { id: 'list', label: 'List', icon: ListIcon },
    { id: 'list-compact', label: 'Compact List', icon: AlignLeft },
    { id: 'details', label: 'Details', icon: AlignJustify },
  ]

  const handleContextMenu = (e, item = null) => {
    e.preventDefault()
    e.stopPropagation()
    // If the item clicked isn't in selection, select only this item
    if (item && !selectedIds.has(item.id)) {
      setSelectedIds(new Set([item.id]))
      setLastSelectedId(item.id)
    }
    setContextMenu({
      position: { x: e.clientX, y: e.clientY },
      item
    })
  }

  const handleItemClick = (e, item) => {
    e.stopPropagation()
    const id = item.id
    if (e.ctrlKey || e.metaKey) {
      setSelectedIds(prev => {
        const next = new Set(prev)
        if (next.has(id)) next.delete(id)
        else next.add(id)
        return next
      })
      setLastSelectedId(id)
    } else if (e.shiftKey && lastSelectedId) {
      const allItems = [...filteredFolders.map(f => f.id), ...filteredNotebooks.map(n => n.id)]
      const startIdx = allItems.indexOf(lastSelectedId)
      const endIdx = allItems.indexOf(id)
      if (startIdx !== -1 && endIdx !== -1) {
        const next = new Set(selectedIds)
        const min = Math.min(startIdx, endIdx)
        const max = Math.max(startIdx, endIdx)
        for(let i = min; i <= max; i++) next.add(allItems[i])
        setSelectedIds(next)
      }
    } else {
      setSelectedIds(new Set([id]))
      setLastSelectedId(id)
    }
  }

  const handleContainerClick = () => {
    setSelectedIds(new Set())
    setContextMenu(null)
    setViewMenuOpen(false)
    setSortMenuOpen(false)
    setNewMenuOpen(false)
  }

  const handleRenameSubmit = () => {
    if (!editingItem) return
    if (editingItem.name.trim()) {
      if (editingItem.type === 'folder') {
        onRenameFolder(editingItem.id, editingItem.name.trim())
      } else {
        onRenameNotebook(editingItem.id, editingItem.name.trim())
      }
    }
    setEditingItem(null)
  }

  // Handle double click for inline rename
  const handleDoubleClick = (e, item) => {
    e.stopPropagation()
    setEditingItem({
      id: item.id,
      type: item.type,
      name: item.type === 'folder' ? item.name : item.title
    })
  }

  const renderDetailsTable = () => (
    <div className="min-w-full">
      <div className="grid grid-cols-12 gap-4 px-4 py-2 text-xs font-semibold text-[#657069] border-b border-[#242424]">
        <div className="col-span-6">Name</div>
        <div className="col-span-3">Date modified</div>
        <div className="col-span-2">Type</div>
        <div className="col-span-1">Size</div>
      </div>
      <div className="flex flex-col">
        {filteredFolders.map(folder => (
          <div 
            key={folder.id}
            className={`grid grid-cols-12 gap-4 px-4 py-2 text-sm text-[#a2a8a5] cursor-pointer items-center border-b border-[#242424]/50 transition-colors ${
              selectedIds.has(folder.id) ? 'bg-[#eccb45]/20 text-[#dffdee]' : 'hover:bg-[#1a1a1a] hover:text-[#dffdee]'
            }`}
            onClick={(e) => handleItemClick(e, folder)}
            onContextMenu={(e) => handleContextMenu(e, { ...folder, type: 'folder' })}
            onDoubleClick={(e) => { e.stopPropagation(); setActiveFolderId(folder.id); }}
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData('application/json', JSON.stringify({ id: folder.id, type: 'folder' }))
            }}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault(); e.stopPropagation();
              const data = JSON.parse(e.dataTransfer.getData('application/json'));
              if (data.id !== folder.id) onDropItem(data.id, data.type, folder.id)
            }}
          >
            <div className="col-span-6 flex items-center gap-3">
              <Folder className="w-5 h-5 text-[#eccb45] shrink-0" fill="currentColor" fillOpacity={0.2} />
              {editingItem?.id === folder.id ? (
                <input
                  ref={editInputRef}
                  value={editingItem.name}
                  onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                  onBlur={handleRenameSubmit}
                  onKeyDown={(e) => e.key === 'Enter' && handleRenameSubmit()}
                  onClick={(e) => e.stopPropagation()}
                  className="bg-[#242424] text-white px-2 py-0.5 rounded outline-none w-full"
                />
              ) : (
                <span className="truncate">{folder.name}</span>
              )}
            </div>
            <div className="col-span-3 truncate">{formatDate(folder.createdAt)}</div>
            <div className="col-span-2 truncate">File folder</div>
            <div className="col-span-1"></div>
          </div>
        ))}
        {filteredNotebooks.map(nb => (
          <div 
            key={nb.id}
            className={`grid grid-cols-12 gap-4 px-4 py-2 text-sm text-[#a2a8a5] cursor-pointer items-center border-b border-[#242424]/50 transition-colors ${
              selectedIds.has(nb.id) ? 'bg-[#58d68d]/20 text-[#dffdee]' : 'hover:bg-[#1a1a1a] hover:text-[#dffdee]'
            }`}
            onClick={(e) => handleItemClick(e, nb)}
            onContextMenu={(e) => handleContextMenu(e, { ...nb, type: 'notebook' })}
            onDoubleClick={(e) => { e.stopPropagation(); onOpenNotebook(nb.id); }}
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData('application/json', JSON.stringify({ id: nb.id, type: 'notebook' }))
            }}
          >
            <div className="col-span-6 flex items-center gap-3">
              <FileText className="w-5 h-5 text-[#58d68d] shrink-0" />
              {editingItem?.id === nb.id ? (
                <input
                  ref={editInputRef}
                  value={editingItem.name}
                  onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                  onBlur={handleRenameSubmit}
                  onKeyDown={(e) => e.key === 'Enter' && handleRenameSubmit()}
                  onClick={(e) => e.stopPropagation()}
                  className="bg-[#242424] text-white px-2 py-0.5 rounded outline-none w-full"
                />
              ) : (
                <span className="truncate">{nb.title}</span>
              )}
            </div>
            <div className="col-span-3 truncate">{formatDate(nb.createdAt)}</div>
            <div className="col-span-2 truncate">Notebook</div>
            <div className="col-span-1 truncate">{formatSize(nb)}</div>
          </div>
        ))}
      </div>
    </div>
  )

  return (
    <div 
      className="flex h-full flex-col bg-[#0f0f0f] text-[#dffdee]" 
      onClick={handleContainerClick}
      onContextMenu={(e) => handleContextMenu(e, null)}
    >
      {/* Path Bar Toolbar */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-[#242424] bg-[#111]">
        <div className="flex items-center gap-1">
          <div className="relative">
            <button 
              onClick={(e) => { e.stopPropagation(); setNewMenuOpen(!newMenuOpen) }} 
              className="p-1.5 rounded-md text-[#a2a8a5] hover:bg-[#242424] hover:text-white transition-colors mr-1 flex items-center gap-1 text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">New</span>
            </button>
            {newMenuOpen && (
              <div className="absolute left-0 top-full z-30 mt-2 w-48 overflow-hidden rounded-lg border border-[#333] bg-[#1a1a1a] shadow-[0_8px_32px_rgba(0,0,0,0.8)] py-1">
                <button
                  className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-[#58d68d] hover:text-black transition-colors text-sm text-[#c8cdc9]"
                  onClick={async (e) => { e.stopPropagation(); const f = await onCreateFolder(); if (f) setEditingItem({ id: f.id, type: 'folder', name: f.name }); setNewMenuOpen(false) }}
                >
                  <FolderPlus className="w-4 h-4" /> New Folder
                </button>
                <button
                  className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-[#58d68d] hover:text-black transition-colors text-sm text-[#c8cdc9]"
                  onClick={async (e) => { e.stopPropagation(); const nb = await onCreateNotebook(); if (nb) setEditingItem({ id: nb.id, type: 'notebook', name: nb.title }); setNewMenuOpen(false) }}
                >
                  <FilePlus className="w-4 h-4" /> New Notebook
                </button>
              </div>
            )}
          </div>
          
          <div className="w-[1px] h-4 bg-[#333] mx-1"></div>

          <button onClick={() => navigate(-1)} className="p-1.5 rounded-md text-[#a2a8a5] hover:bg-[#242424] hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <button onClick={() => navigate(1)} className="p-1.5 rounded-md text-[#a2a8a5] hover:bg-[#242424] hover:text-white transition-colors">
            <ArrowRight className="w-4 h-4" />
          </button>
          <button onClick={handleUp} disabled={!activeFolderId} className="p-1.5 rounded-md text-[#a2a8a5] hover:bg-[#242424] hover:text-white transition-colors disabled:opacity-30 disabled:hover:bg-transparent">
            <ArrowUp className="w-4 h-4" />
          </button>
          <button onClick={() => onRefresh && onRefresh()} className="p-1.5 rounded-md text-[#a2a8a5] hover:bg-[#242424] hover:text-white transition-colors ml-1">
            <RotateCw className="w-4 h-4" />
          </button>
        </div>
        
        {/* Breadcrumb Path Box */}
        <div className="flex-1 flex items-center bg-[#1a1a1a] border border-[#333] rounded-md px-3 py-1.5 overflow-hidden">
          <button 
            onClick={() => setActiveFolderId(null)}
            className="text-sm text-[#a2a8a5] hover:text-[#58d68d] whitespace-nowrap"
          >
            Your Notebooks
          </button>
          {breadcrumbs.map((crumb) => (
            <div key={crumb.id} className="flex items-center">
              <ChevronRight className="w-4 h-4 mx-1 text-[#657069]" />
              <button
                onClick={() => setActiveFolderId(crumb.id)}
                className={`text-sm whitespace-nowrap ${crumb.id === activeFolderId ? 'text-white' : 'text-[#a2a8a5] hover:text-[#58d68d]'}`}
              >
                {crumb.name}
              </button>
            </div>
          ))}
        </div>

        {/* Utilities */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowManageTags(true)}
            className="flex items-center gap-2 rounded-md border border-[#333] bg-[#1a1a1a] px-3 py-1.5 text-sm text-[#c8cdc9] transition hover:bg-[#242424] hover:text-white"
          >
            <Tags className="size-4" />
            <span className="hidden sm:inline">Tags</span>
          </button>

          {/* Sort Dropdown */}
          <div className="relative" ref={sortMenuRef}>
            <button
              onClick={(e) => { e.stopPropagation(); setSortMenuOpen(!sortMenuOpen) }}
              className="flex items-center gap-2 rounded-md border border-[#333] bg-[#1a1a1a] px-3 py-1.5 text-sm text-[#c8cdc9] transition hover:bg-[#242424] hover:text-white"
            >
              <ArrowDownUp className="size-4" />
              <span>Sort</span>
              <ChevronDown className="size-3 text-[#657069]" />
            </button>
            {sortMenuOpen && (
              <div className="absolute right-0 top-full z-30 mt-2 w-48 overflow-hidden rounded-lg border border-[#333] bg-[#1a1a1a] shadow-[0_8px_32px_rgba(0,0,0,0.8)] py-1">
                {[
                  { id: 'name', label: 'Name' },
                  { id: 'date', label: 'Date modified' },
                  { id: 'type', label: 'Type' },
                  { id: 'size', label: 'Size' }
                ].map(opt => (
                  <button
                    key={opt.id}
                    onClick={() => { setSortField(opt.id); setSortMenuOpen(false) }}
                    className="flex w-full items-center justify-between px-3 py-2 text-sm text-[#c8cdc9] transition hover:bg-[#333] hover:text-white"
                  >
                    <span>{opt.label}</span>
                    {sortField === opt.id && <div className="size-1.5 rounded-full bg-[#58d68d]" />}
                  </button>
                ))}
                <div className="my-1 border-t border-[#333]"></div>
                {[
                  { id: 'asc', label: 'Ascending' },
                  { id: 'desc', label: 'Descending' }
                ].map(opt => (
                  <button
                    key={opt.id}
                    onClick={() => { setSortDirection(opt.id); setSortMenuOpen(false) }}
                    className="flex w-full items-center justify-between px-3 py-2 text-sm text-[#c8cdc9] transition hover:bg-[#333] hover:text-white"
                  >
                    <span>{opt.label}</span>
                    {sortDirection === opt.id && <div className="size-1.5 rounded-full bg-[#58d68d]" />}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="relative" ref={viewMenuRef}>
            <button
              onClick={(e) => { e.stopPropagation(); setViewMenuOpen(!viewMenuOpen) }}
              className="flex items-center gap-2 rounded-md border border-[#333] bg-[#1a1a1a] px-3 py-1.5 text-sm text-[#c8cdc9] transition hover:bg-[#242424] hover:text-white"
            >
              {viewMode === 'details' ? <ListIcon className="size-4" /> : <LayoutGrid className="size-4" />}
              <span>View</span>
              <ChevronDown className="size-3 text-[#657069]" />
            </button>

            {viewMenuOpen && (
              <div className="absolute right-0 top-full z-30 mt-2 w-48 overflow-hidden rounded-lg border border-[#333] bg-[#1a1a1a] shadow-[0_8px_32px_rgba(0,0,0,0.8)] py-1">
                {viewOptions.map((opt) => {
                  const Icon = opt.icon
                  return (
                    <button
                      key={opt.id}
                      onClick={() => {
                        setViewMode(opt.id)
                        setViewMenuOpen(false)
                      }}
                      className="flex w-full items-center gap-3 px-3 py-2 text-sm text-[#c8cdc9] transition hover:bg-[#333] hover:text-white"
                    >
                      <div className="w-5 flex justify-center">
                        <Icon className="size-4" />
                      </div>
                      <span className="flex-1 text-left">{opt.label}</span>
                      {viewMode === opt.id && <div className="size-1.5 rounded-full bg-[#58d68d]" />}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Explorer Content Area */}
      <div className="flex-1 overflow-y-auto">
        {filteredNotebooks.length === 0 && filteredFolders.length === 0 ? (
          <div className="flex h-full items-center justify-center p-8">
            <div className="text-center">
              {searchQuery ? (
                <>
                  <p className="text-sm font-medium text-[#9aa39f]">No results matching "{searchQuery}"</p>
                  <p className="mt-1 text-xs text-[#657069]">Try a different search term.</p>
                </>
              ) : (
                <EmptyState onCreateNotebook={onCreateNotebook} />
              )}
            </div>
          </div>
        ) : (
          viewMode === 'details' ? (
            renderDetailsTable()
          ) : (
            <div className="flex flex-wrap content-start gap-1 p-4">
              {filteredFolders.map((folder) => (
                <FolderCard
                  key={folder.id}
                  folder={folder}
                  onSelect={handleItemClick}
                  isSelected={selectedIds.has(folder.id)}
                  onOpen={() => setActiveFolderId(folder.id)}
                  onRename={onRenameFolder}
                  onDelete={onDeleteFolder}
                  onDropItem={(id, type) => onDropItem(id, type, folder.id)}
                  onContextMenu={(e, folder) => handleContextMenu(e, { ...folder, type: 'folder' })}
                  onDoubleClick={(e, folder) => handleDoubleClick(e, { ...folder, type: 'folder' })}
                  viewMode={viewMode}
                  forceEdit={editingItem?.id === folder.id}
                  onRenameStart={viewMode !== 'details' ? () => setEditingItem(null) : undefined}
                />
              ))}
              {filteredNotebooks.map((nb) => (
                <NotebookCard
                  key={nb.id}
                  notebook={nb}
                  allTags={tags}
                  onSelect={handleItemClick}
                  isSelected={selectedIds.has(nb.id)}
                  onOpen={onOpenNotebook}
                  onRename={onRenameNotebook}
                  onDelete={onDeleteNotebook}
                  onUpdateTags={(tagIds) => onUpdateNotebookTags(nb.id, tagIds)}
                  onManageTags={() => setTagSelectionItem(nb)}
                  viewMode={viewMode}
                  forceEdit={editingItem?.id === nb.id}
                  onRenameStart={viewMode !== 'details' ? () => setEditingItem(null) : undefined}
                  onContextMenu={(e, nb) => handleContextMenu(e, { ...nb, type: 'notebook' })}
                  onDoubleClick={(e, nb) => handleDoubleClick(e, { ...nb, type: 'notebook' })}
                />
              ))}
            </div>
          )
        )}
      </div>

      {showManageTags && (
        <ManageTagsModal
          isOpen={showManageTags}
          onClose={() => setShowManageTags(false)}
          tags={tags}
          onCreateTag={onCreateTag}
          onDeleteTag={onDeleteTag}
        />
      )}

      {contextMenu && (
        <ContextMenu
          position={contextMenu.position}
          item={contextMenu.item}
          onClose={() => setContextMenu(null)}
          onCreateFolder={async () => {
            const newF = await onCreateFolder()
            if (newF) {
              setEditingItem({ id: newF.id, type: 'folder', name: newF.name })
            }
          }}
          onCreateNotebook={async () => {
            const newNb = await onCreateNotebook()
            if (newNb) {
              setEditingItem({ id: newNb.id, type: 'notebook', name: newNb.title })
            }
          }}
          onRename={(item) => {
            if (selectedIds.size > 1 && selectedIds.has(item.id)) {
              setPromptConfig({
                isOpen: true,
                title: 'Rename Multiple Items',
                description: `Enter a base name for ${selectedIds.size} items:`,
                onConfirm: (newName) => {
                  if (onBulkRename) {
                    onBulkRename(selectedIds, newName)
                    setSelectedIds(new Set())
                  }
                  setPromptConfig({ isOpen: false, title: '', description: '', onConfirm: null })
                }
              })
            } else {
              setEditingItem({
                id: item.id,
                type: item.type,
                name: item.type === 'folder' ? item.name : item.title
              })
            }
          }}
          onDelete={(item) => {
            if (selectedIds.size > 1 && selectedIds.has(item.id)) {
              if (onBulkDelete) {
                onBulkDelete(selectedIds)
              }
            } else {
              if (item.type === 'folder') onDeleteFolder(item.id)
              else onDeleteNotebook(item.id)
            }
          }}
          onManageTags={(item) => setTagSelectionItem(item)}
        />
      )}
      
      {tagSelectionItem && (
        <TagSelectionModal
          isOpen={!!tagSelectionItem}
          onClose={() => setTagSelectionItem(null)}
          notebook={tagSelectionItem}
          allTags={tags}
          onUpdateTags={async (tagIds) => {
            await onUpdateNotebookTags(tagSelectionItem.id, tagIds)
            setTagSelectionItem(null)
          }}
        />
      )}

      <PromptDialog
        isOpen={promptConfig.isOpen}
        title={promptConfig.title}
        description={promptConfig.description}
        placeholder="New name..."
        confirmText="Rename"
        onConfirm={promptConfig.onConfirm}
        onCancel={() => setPromptConfig({ ...promptConfig, isOpen: false })}
      />
    </div>
  )
}
