import { useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowUpDown,
  Check,
  ChevronDown,
  ChevronRight,
  FolderPlus,
  Home,
  LayoutGrid,
  List,
  Tags,
} from 'lucide-react'
import NotebookCard from './NotebookCard.jsx'
import FolderCard from './FolderCard.jsx'
import EmptyState from './EmptyState.jsx'
import ManageTagsModal from './ManageTagsModal.jsx'

const viewOptions = [
  { id: 'grid-large', label: 'Extra Large Icons' },
  { id: 'grid', label: 'Medium Icons' },
  { id: 'grid-compact', label: 'Small Icons' },
  { id: 'list', label: 'List' },
  { id: 'list-compact', label: 'Compact List' },
]

const sortOptions = [
  { id: 'name', label: 'Name' },
  { id: 'date', label: 'Date' },
  { id: 'size', label: 'Size' },
  { id: 'tags', label: 'Tags' },
  { id: 'filetype', label: 'File Type' },
]

function formatTypeLabel(value) {
  if (!value) return 'Notebook'
  if (value === 'folder') return 'Folder'
  if (value === 'video/youtube') return 'YouTube'
  if (value === 'text/html') return 'Web'

  const parts = value.split('/')
  if (parts.length === 2) {
    const [, subtype] = parts
    return subtype.replace(/[-+.]/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase())
  }

  return value.replace(/[-_.]/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase())
}

function compareText(a, b) {
  return a.localeCompare(b, undefined, { sensitivity: 'base', numeric: true })
}

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
  onDropFolder,
  onUpdateNotebookTags,
  onCreateTag,
  onDeleteTag,
}) {
  const [showManageTags, setShowManageTags] = useState(false)
  const [viewMode, setViewMode] = useState(() => localStorage.getItem('notebookViewMode') || 'grid')
  const [sortField, setSortField] = useState(() => localStorage.getItem('notebookSortField') || 'date')
  const [sortDirection, setSortDirection] = useState(() => localStorage.getItem('notebookSortDirection') || 'desc')
  const [viewMenuOpen, setViewMenuOpen] = useState(false)
  const [sortMenuOpen, setSortMenuOpen] = useState(false)
  const viewMenuRef = useRef(null)
  const sortMenuRef = useRef(null)

  useEffect(() => {
    localStorage.setItem('notebookViewMode', viewMode)
  }, [viewMode])

  useEffect(() => {
    localStorage.setItem('notebookSortField', sortField)
  }, [sortField])

  useEffect(() => {
    localStorage.setItem('notebookSortDirection', sortDirection)
  }, [sortDirection])

  useEffect(() => {
    if (!viewMenuOpen && !sortMenuOpen) return

    function handleClick(event) {
      if (viewMenuRef.current && !viewMenuRef.current.contains(event.target)) {
        setViewMenuOpen(false)
      }
      if (sortMenuRef.current && !sortMenuRef.current.contains(event.target)) {
        setSortMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [sortMenuOpen, viewMenuOpen])

  const normalizedQuery = searchQuery.trim().toLowerCase()

  const tagNameById = useMemo(
    () => new Map(tags.map((tag) => [tag.id, tag.name.toLowerCase()])),
    [tags],
  )

  const folderStatsById = useMemo(() => {
    const stats = new Map()

    function buildFolderStats(folderId) {
      if (stats.has(folderId)) return stats.get(folderId)

      const directFolders = folders.filter((folder) => folder.parentId === folderId)
      const directNotebooks = notebooks.filter((notebook) => notebook.folderId === folderId)

      let totalSizeBytes = directNotebooks.reduce(
        (sum, notebook) => sum + Number(notebook.totalSizeBytes ?? 0),
        0,
      )
      let notebookCount = directNotebooks.length
      let nestedTagCount = directNotebooks.reduce(
        (sum, notebook) => sum + (notebook.tagIds?.length ?? 0),
        0,
      )

      directFolders.forEach((folder) => {
        const childStats = buildFolderStats(folder.id)
        totalSizeBytes += childStats.totalSizeBytes
        notebookCount += childStats.notebookCount
        nestedTagCount += childStats.nestedTagCount
      })

      const result = {
        directItemCount: directFolders.length + directNotebooks.length,
        notebookCount,
        totalSizeBytes,
        nestedTagCount,
      }

      stats.set(folderId, result)
      return result
    }

    folders.forEach((folder) => {
      buildFolderStats(folder.id)
    })

    return stats
  }, [folders, notebooks])

  const breadcrumbs = useMemo(() => {
    const trail = []
    let current = activeFolderId ? folders.find((folder) => folder.id === activeFolderId) : null

    while (current) {
      trail.unshift(current)
      current = current.parentId ? folders.find((folder) => folder.id === current.parentId) : null
    }

    return trail
  }, [activeFolderId, folders])

  const filteredNotebooks = useMemo(() => {
    if (!normalizedQuery) {
      return notebooks.filter((notebook) => notebook.folderId === activeFolderId)
    }

    return notebooks.filter((notebook) => {
      const matchesTitle = notebook.title.toLowerCase().includes(normalizedQuery)
      const matchesTag = (notebook.tagIds || []).some((tagId) => tagNameById.get(tagId)?.includes(normalizedQuery))
      const matchesType = formatTypeLabel(notebook.primaryContentType).toLowerCase().includes(normalizedQuery)
      return matchesTitle || matchesTag || matchesType
    })
  }, [activeFolderId, normalizedQuery, notebooks, tagNameById])

  const filteredFolders = useMemo(() => {
    if (!normalizedQuery) {
      return folders.filter((folder) => (activeFolderId ? folder.parentId === activeFolderId : !folder.parentId))
    }

    return folders.filter((folder) => folder.name.toLowerCase().includes(normalizedQuery))
  }, [activeFolderId, folders, normalizedQuery])

  const libraryItems = useMemo(() => {
    const folderItems = filteredFolders.map((folder) => {
      const stats = folderStatsById.get(folder.id) || {
        directItemCount: 0,
        notebookCount: 0,
        totalSizeBytes: 0,
        nestedTagCount: 0,
      }

      return {
        id: folder.id,
        kind: 'folder',
        name: folder.name,
        createdAt: folder.createdAt,
        sizeValue: stats.totalSizeBytes,
        tagValue: stats.nestedTagCount,
        tagLabel: '',
        fileTypeValue: 'folder',
        data: folder,
        stats,
      }
    })

    const notebookItems = filteredNotebooks.map((notebook) => {
      const notebookTags = (notebook.tagIds || [])
        .map((tagId) => tagNameById.get(tagId))
        .filter(Boolean)
        .sort(compareText)

      return {
        id: notebook.id,
        kind: 'notebook',
        name: notebook.title,
        createdAt: notebook.createdAt,
        sizeValue: Number(notebook.totalSizeBytes ?? 0),
        tagValue: notebookTags.length,
        tagLabel: notebookTags.join(', '),
        fileTypeValue: formatTypeLabel(notebook.primaryContentType),
        data: notebook,
      }
    })

    const sorted = [...folderItems, ...notebookItems].sort((a, b) => {
      let result = 0

      if (sortField === 'name') {
        result = compareText(a.name, b.name)
      } else if (sortField === 'date') {
        result = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      } else if (sortField === 'size') {
        result = a.sizeValue - b.sizeValue
      } else if (sortField === 'tags') {
        result = a.tagValue - b.tagValue || compareText(a.tagLabel, b.tagLabel)
      } else if (sortField === 'filetype') {
        result = compareText(a.fileTypeValue, b.fileTypeValue)
      }

      if (result === 0) {
        result = compareText(a.name, b.name)
      }

      return sortDirection === 'asc' ? result : -result
    })

    return sorted
  }, [filteredFolders, filteredNotebooks, folderStatsById, sortDirection, sortField, tagNameById])

  const sortLabel = sortOptions.find((option) => option.id === sortField)?.label ?? 'Date'

  const gridClassName =
    viewMode === 'grid-large'
      ? 'grid grid-cols-1 gap-6 md:grid-cols-2'
      : viewMode === 'grid-compact'
        ? 'grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4'
        : viewMode.startsWith('list')
          ? 'flex flex-col gap-3'
          : 'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-5 rounded-[10px] border border-[#1b211d] bg-[#0b0f0d] p-4 shadow-[0_16px_40px_rgba(0,0,0,0.22)]">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-[#657069]">
                Workspace
              </p>
              <h2 className="mt-1 text-xl font-semibold text-white">Your Notebooks</h2>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="relative" ref={sortMenuRef}>
                <button
                  onClick={() => setSortMenuOpen((open) => !open)}
                  className="flex items-center gap-2 rounded-lg border border-[#242424] bg-[#0d0d0d] px-3 py-1.5 text-sm text-[#c8cdc9] transition hover:bg-[#171717] hover:text-white"
                >
                  <ArrowUpDown className="size-4" />
                  <span>{sortLabel}</span>
                  <ChevronDown className="size-3 text-[#657069]" />
                </button>

                {sortMenuOpen && (
                  <div className="absolute left-0 top-full z-30 mt-2 w-56 overflow-hidden rounded-lg border border-[#242424] bg-[#111] py-1 shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
                    {sortOptions.map((option) => (
                      <button
                        key={option.id}
                        onClick={() => {
                          setSortField(option.id)
                          setSortMenuOpen(false)
                        }}
                        className="flex w-full items-center justify-between px-3 py-2 text-sm text-[#c8cdc9] transition hover:bg-white/[0.06] hover:text-white"
                      >
                        <span>{option.label}</span>
                        {sortField === option.id && <Check className="size-4 text-[#58d68d]" />}
                      </button>
                    ))}

                    <div className="mx-3 my-1 border-t border-white/[0.06]" />

                    {[
                      { id: 'asc', label: 'Ascending' },
                      { id: 'desc', label: 'Descending' },
                    ].map((direction) => (
                      <button
                        key={direction.id}
                        onClick={() => {
                          setSortDirection(direction.id)
                          setSortMenuOpen(false)
                        }}
                        className="flex w-full items-center justify-between px-3 py-2 text-sm text-[#c8cdc9] transition hover:bg-white/[0.06] hover:text-white"
                      >
                        <span>{direction.label}</span>
                        {sortDirection === direction.id && <Check className="size-4 text-[#58d68d]" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="relative" ref={viewMenuRef}>
                <button
                  onClick={() => setViewMenuOpen((open) => !open)}
                  className="flex items-center gap-2 rounded-lg border border-[#242424] bg-[#0d0d0d] px-3 py-1.5 text-sm text-[#c8cdc9] transition hover:bg-[#171717] hover:text-white"
                >
                  {viewMode.startsWith('list') ? <List className="size-4" /> : <LayoutGrid className="size-4" />}
                  <span>View</span>
                  <ChevronDown className="size-3 text-[#657069]" />
                </button>

                {viewMenuOpen && (
                  <div className="absolute left-0 top-full z-30 mt-2 w-48 overflow-hidden rounded-lg border border-[#242424] bg-[#111] py-1 shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
                    {viewOptions.map((option) => (
                      <button
                        key={option.id}
                        onClick={() => {
                          setViewMode(option.id)
                          setViewMenuOpen(false)
                        }}
                        className="flex w-full items-center justify-between px-3 py-2 text-sm text-[#c8cdc9] transition hover:bg-white/[0.06] hover:text-white"
                      >
                        <span>{option.label}</span>
                        {viewMode === option.id && <Check className="size-4 text-[#58d68d]" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button
                onClick={() => setShowManageTags(true)}
                className="flex items-center gap-2 rounded-lg border border-[#242424] bg-[#0d0d0d] px-3 py-1.5 text-sm text-[#c8cdc9] transition hover:bg-[#171717] hover:text-white"
              >
                <Tags className="size-4" />
                <span className="hidden sm:inline">Tags</span>
              </button>

              <button
                onClick={onCreateFolder}
                className="flex items-center gap-2 rounded-lg border border-[#242424] bg-[#0d0d0d] px-3 py-1.5 text-sm text-[#c8cdc9] transition hover:bg-[#171717] hover:text-white"
              >
                <FolderPlus className="size-4" />
                <span className="hidden sm:inline">Folder</span>
              </button>

              <div className="ml-auto rounded-full border border-[#202723] bg-[#101513] px-3 py-1 text-xs font-medium text-[#9aa39f]">
                {libraryItems.length} items
              </div>
            </div>
          </div>

          <div className="rounded-[10px] border border-[#1c221f] bg-[#090c0a] px-2 py-2">
            <div className="flex items-center gap-1 overflow-x-auto whitespace-nowrap px-1 pb-1">
              <button
                onClick={() => setActiveFolderId(null)}
                className={`inline-flex max-w-[12rem] items-center gap-2 rounded-lg px-3 py-2 text-sm transition ${
                  activeFolderId
                    ? 'text-[#a2a8a5] hover:bg-white/[0.05] hover:text-white'
                    : 'bg-[#111714] text-[#dffdee]'
                }`}
                title="Your Notebooks"
              >
                <Home className="size-4 shrink-0" />
                <span className="truncate">Your Notebooks</span>
              </button>

              {breadcrumbs.map((crumb, index) => {
                const isLast = index === breadcrumbs.length - 1

                return (
                  <div key={crumb.id} className="flex items-center gap-1">
                    <ChevronRight className="size-4 shrink-0 text-[#4f5853]" />
                    <button
                      onClick={() => setActiveFolderId(crumb.id)}
                      className={`inline-flex max-w-[11rem] items-center rounded-lg px-3 py-2 text-sm transition md:max-w-[15rem] ${
                        isLast
                          ? 'bg-[#111714] text-[#dffdee]'
                          : 'text-[#a2a8a5] hover:bg-white/[0.05] hover:text-white'
                      }`}
                      title={crumb.name}
                    >
                      <span className="truncate">{crumb.name}</span>
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {libraryItems.length === 0 ? (
        <div className="flex min-h-[320px] items-center justify-center">
          <div className="text-center">
            {searchQuery ? (
              <>
                <p className="text-sm font-medium text-[#9aa39f]">
                  No results matching "{searchQuery}"
                </p>
                <p className="mt-1 text-xs text-[#657069]">Try a different search term.</p>
              </>
            ) : (
              <EmptyState onCreateNotebook={onCreateNotebook} />
            )}
          </div>
        </div>
      ) : (
        <div className={gridClassName}>
          {libraryItems.map((item) =>
            item.kind === 'folder' ? (
              <FolderCard
                key={item.id}
                folder={item.data}
                folderStats={item.stats}
                viewMode={viewMode}
                onClick={() => setActiveFolderId(item.data.id)}
                onRename={onRenameFolder}
                onDelete={onDeleteFolder}
                onDropNotebook={onDropNotebook}
                onDropFolder={onDropFolder}
              />
            ) : (
              <NotebookCard
                key={item.id}
                notebook={item.data}
                allTags={tags}
                onOpen={onOpenNotebook}
                onRename={onRenameNotebook}
                onDelete={onDeleteNotebook}
                onUpdateTags={(tagIds) => onUpdateNotebookTags(item.data.id, tagIds)}
                viewMode={viewMode}
              />
            ),
          )}
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
