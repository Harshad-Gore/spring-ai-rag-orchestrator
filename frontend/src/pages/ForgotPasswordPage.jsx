import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Loader2, Mail } from 'lucide-react'
import { useToast } from '../components/ui/toast.jsx'

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080').replace(/\/+$/, '')

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const { toast } = useToast()

  async function handleSubmit(e) {
    e.preventDefault()
    if (!email.trim()) return

    setIsSubmitting(true)
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message ?? 'Something went wrong')
      }

      setSubmitted(true)
      toast({ type: 'success', message: 'If an account exists with this email, a reset link has been sent.' })
    } catch (err) {
      toast({ type: 'error', message: err.message ?? 'Failed to request password reset. Please try again later.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="flex min-h-svh flex-col items-center justify-center bg-[#080908] px-4 py-12 text-[#c8cdc9]">
      <div className="w-full max-w-sm">
        <div className="mb-6">
          <Link to="/auth" className="inline-flex items-center gap-2 text-sm text-[#9aa39f] hover:text-white transition">
            <ArrowLeft className="size-4" />
            Back to login
          </Link>
        </div>

        <div className="rounded-xl border border-[#242424] bg-[#111] p-8 shadow-2xl">
          <h1 className="mb-2 text-2xl font-bold text-white">Reset password</h1>
          <p className="mb-8 text-sm text-[#9aa39f]">
            Enter your email address and we'll send you a link to reset your password.
          </p>

          {submitted ? (
            <div className="rounded-md bg-[#1a2e22] border border-[#2a4a34] p-4 text-sm text-[#e8f5ed]">
              Check your email for a link to reset your password. If it doesn't appear within a few minutes, check your spam folder.
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium leading-6 text-white">
                  Email address
                </label>
                <div className="mt-2">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
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
                    <Mail className="mr-2 size-4" />
                    Send reset link
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </main>
  )
}
