import {
  BookOpen,
  Files,
  GalleryVerticalEnd,
  LogOut,
  Menu,
  MessageSquareText,
  Search,
  Settings,
  X,
} from 'lucide-react'
import { Button } from '../ui/button.jsx'
import { Input } from '../ui/input.jsx'

const navItems = [
  { id: 'notebook', label: 'Notebook', icon: BookOpen },
  { id: 'sources', label: 'Sources', icon: Files },
  { id: 'ask', label: 'Ask', icon: MessageSquareText },
  { id: 'settings', label: 'Settings', icon: Settings },
]

function NavButton({ active, icon: Icon, label, onClick }) {
  return (
    <Button
      type="button"
      variant={active ? 'default' : 'ghost'}
      size="sm"
      onClick={onClick}
      aria-current={active ? 'page' : undefined}
    >
      <Icon aria-hidden="true" className="size-4" />
      {label}
    </Button>
  )
}

function DashboardNavbar({
  activeView,
  mobileOpen,
  onLogout,
  onSearchChange,
  onToggleMobile,
  onViewChange,
  searchValue,
}) {
  return (
    <header className="sticky top-0 z-20 border-b border-[#242424] bg-[#090909]">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center gap-2 px-4 sm:px-6">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onToggleMobile}
          aria-expanded={mobileOpen}
          aria-label="Toggle navigation"
          className="md:hidden"
        >
          {mobileOpen ? (
            <X aria-hidden="true" className="size-4" />
          ) : (
            <Menu aria-hidden="true" className="size-4" />
          )}
        </Button>

        <button
          type="button"
          onClick={() => onViewChange('notebook')}
          className="flex items-center gap-2 rounded-md px-1 py-1 text-left font-medium text-white transition hover:bg-[#171717] focus:outline-none focus:ring-2 focus:ring-white/15"
        >
          <span className="flex size-8 items-center justify-center rounded-md">
            <GalleryVerticalEnd aria-hidden="true" className="size-6" />
          </span>
          <span className="hidden text-sm sm:inline">Notebook</span>
        </button>

        <nav className="ml-2 hidden items-center gap-1 md:flex">
          {navItems.map((item) => (
            <NavButton
              key={item.id}
              active={activeView === item.id}
              icon={item.icon}
              label={item.label}
              onClick={() => onViewChange(item.id)}
            />
          ))}
        </nav>

        <div className="ml-auto hidden w-full max-w-xs md:block">
          <Input
            type="search"
            value={searchValue}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search"
            icon={Search}
            aria-label="Search workspace"
          />
        </div>

        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={onLogout}
          aria-label="Sign out"
          title="Sign out"
        >
          <LogOut aria-hidden="true" className="size-4" />
        </Button>
      </div>

      {mobileOpen ? (
        <div className="border-t border-[#242424] bg-[#090909] px-4 py-3 md:hidden">
          <div className="mx-auto grid w-full max-w-6xl gap-3">
            <div className="grid grid-cols-2 gap-2">
              {navItems.map((item) => (
                <NavButton
                  key={item.id}
                  active={activeView === item.id}
                  icon={item.icon}
                  label={item.label}
                  onClick={() => onViewChange(item.id)}
                />
              ))}
            </div>
            <Input
              type="search"
              value={searchValue}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Search"
              icon={Search}
              aria-label="Search workspace"
            />
          </div>
        </div>
      ) : null}
    </header>
  )
}

export default DashboardNavbar
