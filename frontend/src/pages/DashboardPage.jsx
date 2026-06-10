import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  BookOpen,
  ChevronRight,
  Files,
  MessageSquareText,
  Settings,
} from 'lucide-react'
import DashboardNavbar from '../components/dashboard/DashboardNavbar.jsx'
import { Button } from '../components/ui/button.jsx'
import { useAuth } from '../hooks/useAuth.js'

const views = {
  notebook: {
    icon: BookOpen,
    title: 'Notebook',
    description: 'Your notebook will appear here after sources are connected.',
    action: 'Open sources',
    nextView: 'sources',
  },
  sources: {
    icon: Files,
    title: 'Sources',
    description: 'Source upload and link capture are not connected yet.',
    action: 'Open ask',
    nextView: 'ask',
  },
  ask: {
    icon: MessageSquareText,
    title: 'Ask',
    description: 'Questions will be available after the source workflow is connected.',
    action: 'Open notebook',
    nextView: 'notebook',
  },
  settings: {
    icon: Settings,
    title: 'Settings',
    description: 'Workspace settings are not configured yet.',
    action: 'Open notebook',
    nextView: 'notebook',
  },
}

function DashboardPage() {
  const navigate = useNavigate()
  const { logout } = useAuth()
  const [activeView, setActiveView] = useState('notebook')
  const [mobileOpen, setMobileOpen] = useState(false)
  const [searchValue, setSearchValue] = useState('')

  const currentView = views[activeView]
  const ViewIcon = currentView.icon

  async function handleLogout() {
    await logout()
    navigate('/', { replace: true })
  }

  function handleViewChange(nextView) {
    setActiveView(nextView)
    setMobileOpen(false)
  }

  return (
    <main className="min-h-svh bg-[#090909] text-white">
      <DashboardNavbar
        activeView={activeView}
        mobileOpen={mobileOpen}
        onLogout={handleLogout}
        onSearchChange={setSearchValue}
        onToggleMobile={() => setMobileOpen((open) => !open)}
        onViewChange={handleViewChange}
        searchValue={searchValue}
      />

      <section className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6">
        <div className="overflow-hidden rounded-[10px] border border-[#242424] bg-[#0d0d0d]">
          <div className="flex flex-col gap-3 border-b border-[#242424] p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-[10px] border border-[#2d2d2d] text-white">
                <ViewIcon aria-hidden="true" className="size-4" />
              </div>
              <div className="min-w-0">
                <h1 className="text-xl font-bold text-white">
                  {currentView.title}
                </h1>
                <p className="mt-1 text-sm leading-5 text-[#b9c0ca]">
                  {currentView.description}
                </p>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={() => handleViewChange(currentView.nextView)}
              className="shrink-0"
            >
              {currentView.action}
              <ChevronRight aria-hidden="true" className="size-4" />
            </Button>
          </div>

          {searchValue ? (
            <div className="border-b border-[#242424] px-4 py-3 text-sm text-[#b9c0ca]">
              No results for "{searchValue}".
            </div>
          ) : null}

          <div className="flex min-h-[440px] items-center justify-center p-6 text-center">
            <div className="flex max-w-sm flex-col items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-[10px] border border-[#2d2d2d] text-white">
                <ViewIcon aria-hidden="true" className="size-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">
                  Nothing here yet
                </h2>
                <p className="mt-1 text-sm leading-6 text-[#b9c0ca]">
                  {currentView.description}
                </p>
              </div>
              <Button
                type="button"
                variant="default"
                onClick={() => handleViewChange(currentView.nextView)}
              >
                {currentView.action}
                <ChevronRight aria-hidden="true" className="size-4" />
              </Button>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}

export default DashboardPage
