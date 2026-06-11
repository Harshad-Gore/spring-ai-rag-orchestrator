import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, Loader2, Dices, Save, User } from 'lucide-react'
import { useAuth } from '../hooks/useAuth.js'
import { getStoredAuthToken } from '../services/authApi.js'
import DashboardNavbar from '../components/dashboard/DashboardNavbar.jsx'
import { Button } from '../components/ui/button.jsx'
import { useToast } from '../components/ui/toast.jsx'

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080').replace(/\/+$/, '')

function authHeaders() {
  const token = getStoredAuthToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

async function apiFetch(path, options = {}) {
  return fetch(`${API_BASE_URL}${path}`, {
    credentials: 'include',
    ...options,
    headers: {
      ...authHeaders(),
      ...(options.headers || {}),
    },
  })
}

export default function SettingsPage() {
  const { user, mutateAuth, logout } = useAuth()
  const navigate = useNavigate()
  const { toast } = useToast()

  const [fullName, setFullName] = useState(user?.fullName || '')
  const [avatarSeed, setAvatarSeed] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  // Initialize avatar seed from user's current avatarUrl
  useEffect(() => {
    if (user) {
      setFullName(user.fullName || '')
      if (user.avatarUrl && user.avatarUrl.includes('dicebear.com')) {
        const match = user.avatarUrl.match(/seed=([^&]+)/)
        if (match) setAvatarSeed(match[1])
        else setAvatarSeed(user.fullName?.replace(/\s+/g, '') || 'User')
      } else {
        setAvatarSeed(user.fullName?.replace(/\s+/g, '') || 'User')
      }
    }
  }, [user])

  const currentAvatarUrl = `https://api.dicebear.com/9.x/bottts-neutral/svg?seed=${avatarSeed}&backgroundColor=transparent`

  function handleRandomizeAvatar() {
    setAvatarSeed(Math.random().toString(36).substring(7))
  }

  async function handleSave(e) {
    e.preventDefault()
    if (!fullName.trim()) return

    setIsSaving(true)
    try {
      const response = await apiFetch('/api/auth/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: fullName.trim(),
          avatarUrl: currentAvatarUrl
        })
      })

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}))
        throw new Error(errData.message || 'Failed to update profile')
      }

      await mutateAuth() // Refresh auth state via context
      toast({ type: 'success', message: 'Profile updated successfully' })
    } catch (err) {
      toast({ type: 'error', message: err.message })
    } finally {
      setIsSaving(false)
    }
  }

  async function handleLogout() {
    await logout()
    navigate('/', { replace: true })
  }

  return (
    <main className="min-h-svh bg-[#090909] text-white">
      {/* Header */}
      <DashboardNavbar
        isSettingsPage={true}
        onGoHome={() => navigate('/dashboard')}
        onLogout={handleLogout}
      />

      {/* Content */}
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row gap-8">
          
          {/* Sidebar */}
          <aside className="w-full md:w-64 shrink-0">
            <nav className="flex flex-col gap-1">
              <button className="flex items-center gap-3 rounded-lg bg-[#1a1a1a] border border-[#242424] px-4 py-2.5 text-sm font-medium text-[#dffdee] shadow-sm">
                <User className="size-4" />
                Profile
              </button>
              {/* Future settings tabs */}
            </nav>
          </aside>

          {/* Settings Panel */}
          <div className="flex-1">
            <div className="rounded-[10px] border border-[#242424] bg-[#0d0d0d] shadow-sm">
              <div className="border-b border-[#242424] px-6 py-5">
                <h2 className="text-lg font-semibold text-white">Public Profile</h2>
                <p className="mt-1 text-sm text-[#657069]">This information will be displayed on your profile.</p>
              </div>

              <form onSubmit={handleSave} className="px-6 py-6 space-y-7">
                
                {/* Avatar Section */}
                <div>
                  <label className="block text-sm font-medium text-[#c8cdc9]">Avatar</label>
                  <div className="mt-4 flex items-center gap-5">
                    <div className="flex size-24 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-[#242424] bg-[#1a1a1a]">
                      <img src={currentAvatarUrl} alt="Avatar" className="size-full object-cover" />
                    </div>
                    <div>
                      <Button type="button" variant="outline" onClick={handleRandomizeAvatar} className="gap-2">
                        <Dices className="size-4" />
                        Randomize Avatar
                      </Button>
                      <p className="mt-2 text-xs text-[#657069]">Generated dynamically via DiceBear.</p>
                    </div>
                  </div>
                </div>

                {/* Full Name */}
                <div>
                  <label htmlFor="fullName" className="block text-sm font-medium text-[#c8cdc9]">Full Name</label>
                  <input
                    id="fullName"
                    type="text"
                    required
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    className="mt-2 block w-full rounded-lg border border-[#2d2d2d] bg-[#0a0a0a] px-4 py-2.5 text-sm text-[#c8cdc9] outline-none transition placeholder:text-[#4a5a4e] focus:border-[#2a4a34] focus:ring-1 focus:ring-[#58d68d]/20"
                  />
                </div>

                {/* Email (Read Only) */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-[#c8cdc9]">Email Address</label>
                  <input
                    id="email"
                    type="email"
                    disabled
                    value={user?.email || ''}
                    className="mt-2 block w-full rounded-lg border border-[#1a1a1a] bg-[#111] px-4 py-2.5 text-sm text-[#657069] cursor-not-allowed"
                  />
                  <p className="mt-2 text-xs text-[#657069]">Your email address is managed by your authentication provider.</p>
                </div>

                {/* Submit */}
                <div className="pt-5 border-t border-[#1a1a1a] flex justify-end">
                  <Button type="submit" variant="default" disabled={isSaving || !fullName.trim()} className="gap-2">
                    {isSaving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                    Save Changes
                  </Button>
                </div>
              </form>
            </div>
          </div>

        </div>
      </div>
    </main>
  )
}
