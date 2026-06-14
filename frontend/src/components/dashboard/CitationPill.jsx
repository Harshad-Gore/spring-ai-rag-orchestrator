import { useState } from 'react'
import { ChevronDown, FileText } from 'lucide-react'

function CitationPill({ index, source, excerpt }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="inline-flex flex-col">
      <button
        type="button"
        onClick={() => setExpanded((prev) => !prev)}
        className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.03] backdrop-blur-sm px-2.5 py-1 text-[11px] font-medium text-[#dffdee] transition hover:border-[#58d68d]/30 hover:bg-[#58d68d]/10 focus:outline-none focus:ring-1 focus:ring-[#58d68d]/50 shadow-sm"
        aria-expanded={expanded}
      >
        <FileText aria-hidden="true" className="size-3 shrink-0 text-[#58d68d]/80" />
        <span className="max-w-[140px] truncate">{source}</span>
        <span className="text-[#58d68d]/70">[{index}]</span>
        <ChevronDown
          aria-hidden="true"
          className={[
            'size-3 shrink-0 transition-transform duration-200 text-[#657069]',
            expanded ? 'rotate-180' : '',
          ].join(' ')}
        />
      </button>

      {expanded && (
        <div className="mt-2 rounded-xl border border-white/[0.05] bg-white/[0.02] backdrop-blur-md px-3.5 py-3 text-xs leading-5 text-[#9aa39f] shadow-lg animate-fade-in relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-[#58d68d] to-transparent opacity-50" />
          <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-[#58d68d]">
            Source: {source}
          </p>
          <p className="text-[#c8cdc9] italic">"{excerpt}"</p>
        </div>
      )}
    </div>
  )
}

export default CitationPill
