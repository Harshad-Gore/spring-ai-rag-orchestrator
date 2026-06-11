import { BookOpen, Plus } from 'lucide-react'
import { Button } from '../ui/button.jsx'

function EmptyState({ onCreateNotebook }) {
  return (
    <div className="flex min-h-[480px] items-center justify-center p-8">
      <div className="flex max-w-sm flex-col items-center gap-5 text-center">
        {/* Decorative icon */}
        <div className="relative">
          <div className="absolute -inset-3 rounded-full bg-[#dffdee]/[0.04]" />
          <div className="relative flex size-16 items-center justify-center rounded-2xl border border-[#2d2d2d] bg-[#111] shadow-[0_0_40px_rgba(223,253,238,0.04)]">
            <BookOpen aria-hidden="true" className="size-7 text-[#dffdee]/70" />
          </div>
        </div>

        {/* Copy */}
        <div className="grid gap-2">
          <h2 className="text-xl font-semibold text-white">
            No notebooks yet
          </h2>
          <p className="text-sm leading-6 text-[#9aa39f]">
            Create your first notebook to start uploading sources and chatting
            with your documents.
          </p>
        </div>

        {/* CTA */}
        <Button type="button" variant="default" onClick={onCreateNotebook}>
          <Plus aria-hidden="true" className="size-4" />
          Create Notebook
        </Button>
      </div>
    </div>
  )
}

export default EmptyState
