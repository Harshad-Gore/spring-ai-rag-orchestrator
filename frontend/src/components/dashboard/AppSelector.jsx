import { MessageSquare, Presentation, FileText } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

function AppSelector({ notebookId }) {
  const navigate = useNavigate()

  const apps = [
    {
      id: 'chat',
      name: 'Chat',
      description: 'Interact with your notebook documents conversationally using AI.',
      icon: MessageSquare,
      color: 'text-[#58d68d]',
      available: true,
      onClick: () => navigate(`/notebook/chat/${notebookId}`)
    },
    {
      id: 'slides',
      name: 'Slides',
      description: 'Generate presentations directly from your notes.',
      icon: Presentation,
      color: 'text-[#eccb45]',
      available: false,
      onClick: () => {}
    },
    {
      id: 'docs',
      name: 'Docs',
      description: 'Draft and edit long-form documents with AI assistance.',
      icon: FileText,
      color: 'text-[#5dade2]',
      available: false,
      onClick: () => {}
    }
  ]

  return (
    <div className="flex flex-col h-full w-full bg-[#0f0f0f] text-[#dffdee] overflow-y-auto">
      <div className="max-w-4xl w-full mx-auto px-8 py-16">
        <div className="mb-10">
          <h1 className="text-2xl font-bold mb-2">Notebook Apps</h1>
          <p className="text-[#a2a8a5] text-sm">
            Select an application to interact with your notebook's knowledge base.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {apps.map((app) => {
            const Icon = app.icon
            return (
              <button
                key={app.id}
                onClick={app.available ? app.onClick : undefined}
                className={`
                  relative flex flex-col p-5 rounded-lg text-left transition-colors
                  border border-[#242424] bg-[#111]
                  ${app.available ? 'cursor-pointer hover:bg-[#1a1a1a] hover:border-[#333]' : 'opacity-50 cursor-not-allowed grayscale hover:opacity-50'}
                `}
              >
                {!app.available && (
                  <span className="absolute top-4 right-4 text-[10px] font-medium text-[#657069] uppercase tracking-wider">
                    Coming Soon
                  </span>
                )}
                
                <div className="flex items-center gap-3 mb-3">
                  <Icon className={`w-5 h-5 ${app.color}`} />
                  <h3 className="text-sm font-semibold text-white">
                    {app.name}
                  </h3>
                </div>

                <p className="text-[#a2a8a5] text-xs leading-relaxed flex-1">
                  {app.description}
                </p>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default AppSelector
