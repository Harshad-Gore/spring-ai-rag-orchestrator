import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { CheckCircle2, Loader2, XCircle } from 'lucide-react'

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080').replace(/\/+$/, '')

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const [status, setStatus] = useState('verifying') // verifying, success, error
  const [message, setMessage] = useState('Verifying your email...')
  const hasFetched = useRef(false)

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setMessage('Invalid or missing verification token.')
      return
    }

    if (hasFetched.current) return
    hasFetched.current = true

    async function verifyToken() {
      try {
        const response = await fetch(`${API_BASE_URL}/api/auth/verify-email`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token })
        })

        if (!response.ok) {
          const text = await response.text()
          let errorMessage = 'Verification failed'
          try {
            const json = JSON.parse(text)
            if (json.message) errorMessage = json.message
          } catch {
            errorMessage = text || errorMessage
          }
          throw new Error(errorMessage)
        }

        setStatus('success')
        setMessage('Your email has been successfully verified! You can now log in.')
      } catch (err) {
        setStatus('error')
        setMessage(err.message || 'The verification link is invalid or has expired.')
      }
    }

    verifyToken()
  }, [token])

  return (
    <main className="flex min-h-svh items-center justify-center bg-[#080908] px-4 py-12 text-[#c8cdc9]">
      <div className="w-full max-w-sm rounded-xl border border-[#242424] bg-[#111] p-8 text-center shadow-2xl">
        <div className="mb-6 flex justify-center">
          {status === 'verifying' && <Loader2 className="size-12 animate-spin text-[#dffdee]/60" />}
          {status === 'success' && <CheckCircle2 className="size-12 text-[#58d68d]" />}
          {status === 'error' && <XCircle className="size-12 text-red-500" />}
        </div>
        <h1 className="mb-2 text-xl font-bold text-white">Email Verification</h1>
        <p className="mb-8 text-sm text-[#9aa39f]">{message}</p>
        
        {status !== 'verifying' && (
          <Link
            to="/auth"
            className="inline-flex w-full justify-center rounded-md bg-[#dffdee] px-4 py-2 text-sm font-semibold text-[#080908] shadow-sm hover:bg-[#b9f7d3] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#dffdee]"
          >
            Go to Login
          </Link>
        )}
      </div>
    </main>
  )
}
