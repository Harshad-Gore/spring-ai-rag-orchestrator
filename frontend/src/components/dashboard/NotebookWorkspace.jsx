import { useState } from 'react'
import { FileText, MessageSquareText } from 'lucide-react'
import DocumentSidebar from './DocumentSidebar.jsx'
import ChatArena from './ChatArena.jsx'

const mobileTabs = [
  { id: 'documents', label: 'Documents', icon: FileText },
  { id: 'chat', label: 'Chat', icon: MessageSquareText },
]

function NotebookWorkspace({
  notebook,
  onBack,
  onOpenUpload,
  onRemoveDocument,
  onSendMessage,
}) {
  const [mobileTab, setMobileTab] = useState('chat')

  return (
    <div className="flex h-[calc(100svh-57px)] flex-col">
      {/* Mobile tab bar — hidden on md+ */}
      <div className="flex shrink-0 border-b border-[#242424] bg-[#090909] px-4 py-2 md:hidden">
        <div className="inline-flex w-full rounded-full border border-white/10 bg-[#101211] p-0.5">
          {mobileTabs.map((tab) => {
            const active = mobileTab === tab.id
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setMobileTab(tab.id)}
                aria-pressed={active}
                className={[
                  'flex h-8 flex-1 items-center justify-center gap-1.5 rounded-full px-3 text-xs font-medium transition duration-200 focus:outline-none focus:ring-2 focus:ring-[#b9f7d3]/25',
                  active
                    ? 'bg-[#dffdee] text-[#07110c] shadow-[0_5px_16px_rgba(88,214,141,0.14)]'
                    : 'text-[#9aa39f] hover:text-white',
                ].join(' ')}
              >
                <Icon aria-hidden="true" className="size-3.5" />
                {tab.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Desktop split-screen | Mobile single-panel */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar — always visible on md+, conditional on mobile */}
        <div
          className={[
            'w-full shrink-0 md:block md:w-80',
            mobileTab === 'documents' ? 'block' : 'hidden',
          ].join(' ')}
        >
          <DocumentSidebar
            notebook={notebook}
            onBack={onBack}
            onOpenUpload={onOpenUpload}
            onRemoveDocument={onRemoveDocument}
          />
        </div>

        {/* Main chat arena — always visible on md+, conditional on mobile */}
        <div
          className={[
            'min-w-0 flex-1',
            mobileTab === 'chat' ? 'block' : 'hidden md:block',
          ].join(' ')}
        >
          <ChatArena
            chatHistory={notebook?.chatHistory ?? []}
            onSendMessage={onSendMessage}
          />
        </div>
      </div>
    </div>
  )
}

export default NotebookWorkspace
