import { useState, useRef, useEffect } from 'react'
import {
  GalleryVerticalEnd,
  Home,
  LogOut,
  Menu,
  Plus,
  Search,
  Settings,
  User,
  X,
} from 'lucide-react'
import { Button } from '../ui/button.jsx'
import { Input } from '../ui/input.jsx'

function DashboardNavbar({
  onCreateNotebook,
  onGoHome,
  onLogout,
  onSearchChange,
  searchValue,
}) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const profileRef = useRef(null)

  // Close profile dropdown on outside click
  useEffect(() => {
    if (!profileOpen) return

    function handleClick(e) {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [profileOpen])

  return (
    <header className="sticky top-0 z-30 border-b border-[#242424] bg-[#090909]/95 backdrop-blur-md">
      <div className="flex h-14 w-full items-center gap-4 px-4 sm:px-5">
        {/* Mobile hamburger */}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => setMobileOpen((prev) => !prev)}
          aria-expanded={mobileOpen}
          aria-label="Toggle navigation"
          className="md:hidden shrink-0 size-8"
        >
          {mobileOpen ? (
            <X aria-hidden="true" className="size-4" />
          ) : (
            <Menu aria-hidden="true" className="size-4" />
          )}
        </Button>

        {/* Logo + brand */}
        <button
          type="button"
          onClick={onGoHome}
          className="flex shrink-0 cursor-pointer items-center gap-2 rounded-lg px-1 py-1 text-left transition hover:bg-white/[0.04] focus:outline-none focus:ring-2 focus:ring-[#b9f7d3]/25"
        >
          <span className="flex size-7 items-center justify-center rounded-lg bg-gradient-to-br from-[#dffdee]/20 to-[#dffdee]/5 shadow-[inset_0_1px_0_rgba(223,253,238,0.15)]">
            <GalleryVerticalEnd
              aria-hidden="true"
              className="size-4 text-[#dffdee]"
            />
          </span>
          <span className="hidden text-sm font-semibold text-white sm:inline">
            Notebook
          </span>
        </button>

        {/* Dashboard link */}
        <button
          type="button"
          onClick={onGoHome}
          className="hidden cursor-pointer items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-medium text-[#9aa39f] transition hover:bg-white/[0.06] hover:text-white focus:outline-none focus:ring-2 focus:ring-[#b9f7d3]/25 md:inline-flex"
        >
          <Home aria-hidden="true" className="size-3.5" />
          Dashboard
        </button>

        {/* Center: search — fills available space */}
        <div className="ml-auto hidden flex-1 md:block lg:mx-4">
          <div className="mx-auto max-w-sm">
            <Input
              type="search"
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search notebooks…"
              icon={Search}
              aria-label="Search notebooks"
              className="h-9 text-xs"
            />
          </div>
        </div>

        {/* Right: create + profile */}
        <div className="ml-auto flex shrink-0 items-center gap-2 md:ml-0">
          {/* Create Notebook — desktop */}
          <Button
            type="button"
            variant="default"
            size="sm"
            onClick={onCreateNotebook}
            className="hidden md:inline-flex"
          >
            <Plus aria-hidden="true" className="size-3.5" />
            New Notebook
          </Button>

          {/* Create Notebook — mobile icon */}
          <Button
            type="button"
            variant="default"
            size="icon"
            onClick={onCreateNotebook}
            aria-label="Create new notebook"
            className="md:hidden size-8"
          >
            <Plus aria-hidden="true" className="size-4" />
          </Button>

          {/* Profile dropdown */}
          <div ref={profileRef} className="relative">
            <button
              type="button"
              onClick={() => setProfileOpen((prev) => !prev)}
              className="flex size-8 cursor-pointer items-center justify-center rounded-full border border-white/10 bg-[#101211] text-[#9aa39f] transition hover:border-white/15 hover:bg-[#151917] hover:text-white focus:outline-none focus:ring-2 focus:ring-[#b9f7d3]/25"
              aria-label="User menu"
              aria-expanded={profileOpen}
            >
              <User aria-hidden="true" className="size-3.5" />
            </button>

            {profileOpen && (
              <div className="absolute right-0 top-full z-40 mt-2 w-44 overflow-hidden rounded-xl border border-[#242424] bg-[#0d0d0d] shadow-[0_12px_40px_rgba(0,0,0,0.5)]">
                <button
                  type="button"
                  onClick={() => {
                    setProfileOpen(false)
                  }}
                  className="flex w-full cursor-pointer items-center gap-2.5 px-3.5 py-2.5 text-sm text-[#c8cdc9] transition hover:bg-white/[0.06] hover:text-white"
                >
                  <Settings aria-hidden="true" className="size-4" />
                  Settings
                </button>
                <div className="border-t border-[#1a1a1a]" />
                <button
                  type="button"
                  onClick={() => {
                    setProfileOpen(false)
                    onLogout()
                  }}
                  className="flex w-full cursor-pointer items-center gap-2.5 px-3.5 py-2.5 text-sm text-red-400 transition hover:bg-red-500/10 hover:text-red-300"
                >
                  <LogOut aria-hidden="true" className="size-4" />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="border-t border-[#242424] bg-[#090909] px-4 py-3 md:hidden">
          <div className="grid w-full gap-3">
            <Input
              type="search"
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search notebooks…"
              icon={Search}
              aria-label="Search notebooks"
            />
            <button
              type="button"
              onClick={() => {
                onGoHome()
                setMobileOpen(false)
              }}
              className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-[#9aa39f] transition hover:bg-white/[0.06] hover:text-white"
            >
              <Home aria-hidden="true" className="size-4" />
              Dashboard
            </button>
          </div>
        </div>
      )}
    </header>
  )
}

export default DashboardNavbar
