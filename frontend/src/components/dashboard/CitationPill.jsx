import { useState } from 'react'
import { ChevronDown, FileText } from 'lucide-react'

function CitationPill({ index, source, excerpt }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="inline-flex flex-col">
      <button
        type="button"
        onClick={() => setExpanded((prev) => !prev)}
        className="inline-flex items-center gap-1.5 rounded-full border border-[#1e3a2a] bg-[#122a1e] px-2.5 py-1 text-xs font-medium text-[#dffdee] transition hover:border-[#2a5a3e] hover:bg-[#183324] focus:outline-none focus:ring-2 focus:ring-[#b9f7d3]/25"
        aria-expanded={expanded}
      >
        <FileText aria-hidden="true" className="size-3 shrink-0" />
        <span className="max-w-[140px] truncate">{source}</span>
        <span className="text-[#dffdee]/50">[{index}]</span>
        <ChevronDown
          aria-hidden="true"
          className={[
            'size-3 shrink-0 transition-transform duration-200',
            expanded ? 'rotate-180' : '',
          ].join(' ')}
        />
      </button>

      {expanded && (
        <div className="mt-2 rounded-lg border border-[#1e3a2a]/60 bg-[#0e1f16] px-3 py-2.5 text-xs leading-5 text-[#9aa39f]">
          <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wider text-[#dffdee]/40">
            Source: {source}
          </p>
          <p className="text-[#c8cdc9]">"{excerpt}"</p>
        </div>
      )}
    </div>
  )
}

export default CitationPill
