import { useState, useMemo } from 'react'
import { ChevronRight, ChevronDown, Folder } from 'lucide-react'

function TreeNode({ node, activeFolderId, onSelect, expandedFolders, toggleExpand, onDrop }) {
  const isActive = node.id === activeFolderId
  const isExpanded = expandedFolders.has(node.id)
  const hasChildren = node.children && node.children.length > 0
  const [isDragOver, setIsDragOver] = useState(false)

  const handleDragOver = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
    
    try {
      const data = JSON.parse(e.dataTransfer.getData('application/json'))
      if (data && data.id && data.id !== node.id) {
        onDrop(data.id, data.type, node.id)
      }
    } catch (err) {
      console.error('Invalid drop data', err)
    }
  }

  const handleDragStart = (e) => {
    e.stopPropagation()
    e.dataTransfer.setData('application/json', JSON.stringify({ id: node.id, type: 'folder' }))
    e.dataTransfer.effectAllowed = 'move'
  }

  return (
    <div className="select-none">
      <div
        className={`flex items-center gap-1 cursor-pointer py-1 px-2 rounded-md group transition-colors ${isActive ? 'bg-[#333] text-white' : 'text-[#a2a8a5] hover:bg-[#1a1a1a] hover:text-[#dffdee]'} ${isDragOver ? 'ring-2 ring-[#58d68d] bg-[#1a1a1a]' : ''}`}
        onClick={() => onSelect(node.id)}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        draggable
        onDragStart={handleDragStart}
      >
        <div 
          className="w-5 h-5 flex items-center justify-center text-[#657069] hover:text-white"
          onClick={(e) => {
            if (hasChildren) {
              e.stopPropagation()
              toggleExpand(node.id)
            }
          }}
        >
          {hasChildren ? (isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />) : <div className="w-4 h-4" />}
        </div>
        <Folder className="w-4 h-4 text-[#eccb45] shrink-0" fill="currentColor" fillOpacity={0.2} />
        <span className="text-sm whitespace-nowrap">{node.name}</span>
      </div>
      
      {isExpanded && hasChildren && (
        <div className="ml-4 pl-1 border-l border-[#333]">
          {node.children.map(child => (
            <TreeNode 
              key={child.id} 
              node={child} 
              activeFolderId={activeFolderId}
              onSelect={onSelect}
              expandedFolders={expandedFolders}
              toggleExpand={toggleExpand}
              onDrop={onDrop}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default function FolderTreeSidebar({ folders, activeFolderId, onSelect, onDrop }) {
  const [expandedFolders, setExpandedFolders] = useState(() => new Set())

  const tree = useMemo(() => {
    const buildTree = (parentId = null) => {
      return folders
        .filter(f => f.parentId === parentId)
        .sort((a, b) => a.name.localeCompare(b.name))
        .map(f => ({ ...f, children: buildTree(f.id) }))
    }
    return buildTree(null)
  }, [folders])

  const toggleExpand = (folderId) => {
    setExpandedFolders(prev => {
      const next = new Set(prev)
      if (next.has(folderId)) {
        next.delete(folderId)
      } else {
        next.add(folderId)
      }
      return next
    })
  }

  // Auto-expand parents of active folder
  useMemo(() => {
    if (!activeFolderId) return
    const parentsToExpand = []
    let currId = activeFolderId
    while (currId) {
      const folder = folders.find(f => f.id === currId)
      if (folder && folder.parentId) {
        parentsToExpand.push(folder.parentId)
        currId = folder.parentId
      } else {
        currId = null
      }
    }
    
    if (parentsToExpand.length > 0) {
      setExpandedFolders(prev => {
        let changed = false
        const next = new Set(prev)
        parentsToExpand.forEach(pid => {
          if (!next.has(pid)) {
            next.add(pid)
            changed = true
          }
        })
        return changed ? next : prev
      })
    }
  }, [activeFolderId, folders])

  return (
    <div className="w-full h-full bg-[#0d0d0d] overflow-auto p-2">
      <div className="min-w-max pr-4">
      <div className="text-xs font-semibold text-[#657069] uppercase tracking-wider mb-2 px-2">Folders</div>
      {tree.length === 0 ? (
        <div className="text-xs text-[#657069] px-2 italic">No folders</div>
      ) : (
        tree.map(node => (
          <TreeNode 
            key={node.id} 
            node={node} 
            activeFolderId={activeFolderId}
            onSelect={onSelect}
            expandedFolders={expandedFolders}
            toggleExpand={toggleExpand}
            onDrop={onDrop}
          />
        ))
      )}
      </div>
    </div>
  )
}
