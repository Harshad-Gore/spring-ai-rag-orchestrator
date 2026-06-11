import NotebookCard from './NotebookCard.jsx'
import EmptyState from './EmptyState.jsx'

function NotebookLibrary({
  notebooks,
  searchQuery,
  onOpenNotebook,
  onCreateNotebook,
  onRenameNotebook,
  onDeleteNotebook,
}) {
  const filtered = searchQuery
    ? notebooks.filter((nb) =>
        nb.title.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : notebooks

  if (notebooks.length === 0) {
    return <EmptyState onCreateNotebook={onCreateNotebook} />
  }

  return (
    <div className="p-4 sm:p-6">
      {/* Section header */}
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">Your Notebooks</h2>
        <span className="text-xs text-[#657069]">
          {filtered.length} of {notebooks.length}
        </span>
      </div>

      {filtered.length === 0 ? (
        <div className="flex min-h-[320px] items-center justify-center">
          <div className="text-center">
            <p className="text-sm font-medium text-[#9aa39f]">
              No notebooks matching "{searchQuery}"
            </p>
            <p className="mt-1 text-xs text-[#657069]">
              Try a different search term.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((nb) => (
            <NotebookCard
              key={nb.id}
              notebook={nb}
              onOpen={onOpenNotebook}
              onRename={onRenameNotebook}
              onDelete={onDeleteNotebook}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default NotebookLibrary
