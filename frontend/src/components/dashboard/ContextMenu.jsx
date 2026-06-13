import { useEffect } from 'react'
import { FolderPlus, FilePlus, Edit2, Trash2, FolderOutput, Tags } from 'lucide-react'

export default function ContextMenu({
  position,
  item,
  onClose,
  onCreateFolder,
  onCreateNotebook,
  onRename,
  onDelete,
  onManageTags,
}) {
  useEffect(() => {
    const handleClickOutside = () => onClose()
    document.addEventListener('click', handleClickOutside)
    document.addEventListener('contextmenu', handleClickOutside)
    return () => {
      document.removeEventListener('click', handleClickOutside)
      document.removeEventListener('contextmenu', handleClickOutside)
    }
  }, [onClose])

  if (!position) return null

  const isBackground = !item

  return (
    <div
      className="fixed z-50 min-w-[160px] bg-[#1a1a1a] border border-[#333] rounded-md shadow-lg py-1 text-sm text-[#dffdee]"
      style={{ top: position.y, left: position.x }}
      onClick={(e) => e.stopPropagation()}
      onContextMenu={(e) => e.preventDefault()}
    >
      {isBackground ? (
        <>
          <button
            className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-[#58d68d] hover:text-black transition-colors"
            onClick={(e) => { e.stopPropagation(); onCreateFolder(); onClose() }}
          >
            <FolderPlus className="w-4 h-4" /> New Folder
          </button>
          <button
            className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-[#58d68d] hover:text-black transition-colors"
            onClick={(e) => { e.stopPropagation(); onCreateNotebook(); onClose() }}
          >
            <FilePlus className="w-4 h-4" /> New Notebook
          </button>
        </>
      ) : (
        <>
          <button
            className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-[#58d68d] hover:text-black transition-colors"
            onClick={(e) => { e.stopPropagation(); onRename(item); onClose() }}
          >
            <Edit2 className="w-4 h-4" /> Rename
          </button>
          {item.type === 'notebook' && (
            <button
              className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-[#58d68d] hover:text-black transition-colors"
              onClick={(e) => { e.stopPropagation(); onManageTags(item); onClose() }}
            >
              <Tags className="w-4 h-4" /> Tags
            </button>
          )}
          {/* <button
            className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-[#58d68d] hover:text-black transition-colors"
            onClick={(e) => { e.stopPropagation(); onMove(item); onClose() }}
          >
            <FolderOutput className="w-4 h-4" /> Move
          </button> */}
          <div className="my-1 border-t border-[#333]"></div>
          <button
            className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-red-500 hover:text-white transition-colors text-red-400"
            onClick={(e) => { e.stopPropagation(); onDelete(item); onClose() }}
          >
            <Trash2 className="w-4 h-4" /> Delete
          </button>
        </>
      )}
    </div>
  )
}
