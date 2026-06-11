import { useState } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { CheckCircle2, Loader2, Lock } from 'lucide-react'
import { useToast } from '../components/ui/toast.jsx'

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080').replace(/\/+$/, '')

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const navigate = useNavigate()
  const { toast } = useToast()

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  if (!token) {
    return (
      <main className="flex min-h-svh items-center justify-center bg-[#080908] px-4 py-12 text-[#c8cdc9]">
        <div className="w-full max-w-sm rounded-xl border border-[#242424] bg-[#111] p-8 text-center shadow-2xl">
          <h1 className="mb-2 text-xl font-bold text-white">Invalid Request</h1>
          <p className="mb-8 text-sm text-[#9aa39f]">Missing password reset token.</p>
          <Link to="/auth" className="inline-flex w-full justify-center rounded-md bg-[#dffdee] px-4 py-2 text-sm font-semibold text-[#080908] shadow-sm hover:bg-[#b9f7d3]">
            Go to Login
          </Link>
        </div>
      </main>
    )
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (password !== confirmPassword) {
      toast({ title: 'Error', description: 'Passwords do not match.', variant: 'error' })
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password })
      })

      if (!response.ok) {
        const text = await response.text()
        let errorMessage = 'Failed to reset password.'
        try {
          const json = JSON.parse(text)
          if (json.message) errorMessage = json.message
        } catch {
          errorMessage = text || errorMessage
        }
        throw new Error(errorMessage)
      }

      setIsSuccess(true)
      toast({ title: 'Success', description: 'Your password has been reset successfully.', variant: 'success' })
      setTimeout(() => navigate('/auth'), 3000)
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'error' })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="flex min-h-svh items-center justify-center bg-[#080908] px-4 py-12 text-[#c8cdc9]">
      <div className="w-full max-w-sm rounded-xl border border-[#242424] bg-[#111] p-8 shadow-2xl">
        {isSuccess ? (
          <div className="text-center">
            <div className="mb-6 flex justify-center">
              <CheckCircle2 className="size-12 text-[#58d68d]" />
            </div>
            <h1 className="mb-2 text-xl font-bold text-white">Password Reset</h1>
            <p className="mb-8 text-sm text-[#9aa39f]">Your password has been successfully updated. Redirecting to login...</p>
            <Link to="/auth" className="inline-flex w-full justify-center rounded-md bg-[#dffdee] px-4 py-2 text-sm font-semibold text-[#080908] shadow-sm hover:bg-[#b9f7d3]">
              Log in now
            </Link>
          </div>
        ) : (
          <>
            <h1 className="mb-2 text-2xl font-bold text-white text-center">Set new password</h1>
            <p className="mb-8 text-sm text-[#9aa39f] text-center">Please enter your new password below.</p>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium leading-6 text-white">New Password</label>
                <div className="mt-2">
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full rounded-md border border-[#242424] bg-[#0a0a0a] px-3 py-1.5 text-white shadow-sm ring-1 ring-inset ring-transparent focus:ring-2 focus:ring-inset focus:ring-[#58d68d] sm:text-sm sm:leading-6 outline-none transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium leading-6 text-white">Confirm Password</label>
                <div className="mt-2">
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="block w-full rounded-md border border-[#242424] bg-[#0a0a0a] px-3 py-1.5 text-white shadow-sm ring-1 ring-inset ring-transparent focus:ring-2 focus:ring-inset focus:ring-[#58d68d] sm:text-sm sm:leading-6 outline-none transition"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="flex w-full justify-center rounded-md bg-[#dffdee] px-3 py-2 text-sm font-semibold text-[#080908] shadow-sm hover:bg-[#b9f7d3] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#dffdee] disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {isSubmitting ? (
                  <Loader2 className="size-5 animate-spin" />
                ) : (
                  <>
                    <Lock className="mr-2 size-4" />
                    Reset Password
                  </>
                )}
              </button>
            </form>
          </>
        )}
      </div>
    </main>
  )
}
