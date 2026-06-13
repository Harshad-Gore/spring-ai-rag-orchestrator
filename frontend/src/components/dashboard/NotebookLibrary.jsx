import { useState, useEffect, useRef } from 'react'
import NotebookCard from './NotebookCard.jsx'
import EmptyState from './EmptyState.jsx'
import { LayoutGrid, List, ChevronDown, Check, ChevronRight, FolderPlus, Tags } from 'lucide-react'
import FolderCard from './FolderCard.jsx'
import ManageTagsModal from './ManageTagsModal.jsx'

function NotebookLibrary({
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
  onDropNotebook,
  onUpdateNotebookTags,
  onCreateTag,
  onDeleteTag,
}) {
  const [showManageTags, setShowManageTags] = useState(false)

  const filteredNotebooks = searchQuery
    ? notebooks.filter((nb) => nb.title.toLowerCase().includes(searchQuery.toLowerCase()))
    : notebooks.filter((nb) => nb.folderId === activeFolderId)

  const filteredFolders = searchQuery
    ? folders.filter((f) => f.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : folders.filter((f) => (activeFolderId ? f.parentId === activeFolderId : !f.parentId))

  const breadcrumbs = []
  let curr = activeFolderId ? folders.find(f => f.id === activeFolderId) : null
  while (curr) {
    breadcrumbs.unshift(curr)
    curr = curr.parentId ? folders.find(f => f.id === curr.parentId) : null
  }

  const [viewMode, setViewMode] = useState(() => {
    return localStorage.getItem('notebookViewMode') || 'grid'
  })
  const [viewMenuOpen, setViewMenuOpen] = useState(false)
  const viewMenuRef = useRef(null)

  useEffect(() => {
    localStorage.setItem('notebookViewMode', viewMode)
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

  const viewOptions = [
    { id: 'grid-large', label: 'Extra Large Icons' },
    { id: 'grid', label: 'Medium Icons' },
    { id: 'grid-compact', label: 'Small Icons' },
    { id: 'list', label: 'List' },
    { id: 'list-compact', label: 'Compact List' },
  ]

  if (notebooks.length === 0) {
    return <EmptyState onCreateNotebook={onCreateNotebook} />
  }

  return (
    <div className="p-4 sm:p-6">
      {/* Section header & Breadcrumbs */}
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-2 text-lg font-semibold text-white">
          <button 
            onClick={() => setActiveFolderId(null)}
            className="hover:text-[#58d68d] transition-colors"
          >
            Your Notebooks
          </button>
          {breadcrumbs.map((crumb) => (
            <div key={crumb.id} className="flex items-center gap-2">
              <ChevronRight className="size-5 text-[#657069]" />
              <button
                onClick={() => setActiveFolderId(crumb.id)}
                className={`transition-colors ${crumb.id === activeFolderId ? 'text-[#dffdee]' : 'text-[#a2a8a5] hover:text-[#58d68d]'}`}
              >
                {crumb.name}
              </button>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowManageTags(true)}
            className="flex items-center gap-2 rounded-lg border border-[#242424] bg-[#0d0d0d] px-3 py-1.5 text-sm text-[#c8cdc9] transition hover:bg-[#1a1a1a] hover:text-white"
          >
            <Tags className="size-4" />
            <span className="hidden sm:inline">Tags</span>
          </button>
          <button
            onClick={onCreateFolder}
            className="flex items-center gap-2 rounded-lg border border-[#242424] bg-[#0d0d0d] px-3 py-1.5 text-sm text-[#c8cdc9] transition hover:bg-[#1a1a1a] hover:text-white"
          >
            <FolderPlus className="size-4" />
            <span className="hidden sm:inline">Folder</span>
          </button>
          <span className="text-xs text-[#657069]">
            {filteredNotebooks.length + filteredFolders.length} items
          </span>
          <div className="relative" ref={viewMenuRef}>
            <button
              onClick={() => setViewMenuOpen(!viewMenuOpen)}
              className="flex items-center gap-2 rounded-lg border border-[#242424] bg-[#0d0d0d] px-3 py-1.5 text-sm text-[#c8cdc9] transition hover:bg-[#1a1a1a] hover:text-white"
            >
              {viewMode.startsWith('list') ? <List className="size-4" /> : <LayoutGrid className="size-4" />}
              <span>View</span>
              <ChevronDown className="size-3 text-[#657069]" />
            </button>

            {viewMenuOpen && (
              <div className="absolute right-0 top-full z-30 mt-2 w-48 overflow-hidden rounded-lg border border-[#242424] bg-[#111] shadow-[0_8px_32px_rgba(0,0,0,0.5)] py-1">
                {viewOptions.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => {
                      setViewMode(opt.id)
                      setViewMenuOpen(false)
                    }}
                    className="flex w-full items-center justify-between px-3 py-2 text-sm text-[#c8cdc9] transition hover:bg-white/[0.06] hover:text-white"
                  >
                    <span>{opt.label}</span>
                    {viewMode === opt.id && <Check className="size-4 text-[#58d68d]" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {filteredNotebooks.length === 0 && filteredFolders.length === 0 ? (
        <div className="flex min-h-[320px] items-center justify-center">
          <div className="text-center">
            {searchQuery ? (
              <>
                <p className="text-sm font-medium text-[#9aa39f]">
                  No results matching "{searchQuery}"
                </p>
                <p className="mt-1 text-xs text-[#657069]">
                  Try a different search term.
                </p>
              </>
            ) : (
              <EmptyState onCreateNotebook={onCreateNotebook} />
            )}
          </div>
        </div>
      ) : (
        <div className={
          viewMode === 'grid-large' ? "grid grid-cols-1 md:grid-cols-2 gap-6" :
          viewMode === 'grid-compact' ? "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3" :
          viewMode.startsWith('list') ? "flex flex-col gap-3" :
          "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
        }>
          {filteredFolders.map((folder) => (
            <FolderCard
              key={folder.id}
              folder={folder}
              onClick={() => setActiveFolderId(folder.id)}
              onRename={onRenameFolder}
              onDelete={onDeleteFolder}
              onDropNotebook={onDropNotebook}
            />
          ))}
          {filteredNotebooks.map((nb) => (
            <NotebookCard
              key={nb.id}
              notebook={nb}
              allTags={tags}
              onOpen={onOpenNotebook}
              onRename={onRenameNotebook}
              onDelete={onDeleteNotebook}
              onUpdateTags={(tagIds) => onUpdateNotebookTags(nb.id, tagIds)}
              viewMode={viewMode}
            />
          ))}
        </div>
      )}

      {showManageTags && (
        <ManageTagsModal
          isOpen={showManageTags}
          onClose={() => setShowManageTags(false)}
          tags={tags}
          onCreateTag={onCreateTag}
          onDeleteTag={onDeleteTag}
        />
      )}
    </div>
  )
}

export default NotebookLibrary
