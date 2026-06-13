import { useNavigate, useLocation } from 'react-router-dom'
import AuthForm from '../components/auth/AuthForm.jsx'
import { useAuth } from '../hooks/useAuth.js'

function AuthPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login, signup } = useAuth()

  async function handleAuthSubmit(mode, values) {
    if (mode === 'signup') {
      await signup(values)
    } else {
      await login({
        email: values.email,
        password: values.password,
      })
    }

    const from = location.state?.from?.pathname || '/dashboard'
    navigate(from, { replace: true })
  }

  return (
    <main className="relative min-h-svh overflow-hidden bg-[#070807] px-5 text-white">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(145deg,rgba(223,253,238,0.08)_0%,rgba(7,8,7,0)_34%),linear-gradient(180deg,rgba(255,255,255,0.035)_0%,rgba(255,255,255,0)_28%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#dffdee]/40 to-transparent" />

      <section className="relative flex min-h-svh w-full max-w-[340px] flex-col justify-center py-10 sm:mx-auto">
        <AuthForm onSubmit={handleAuthSubmit} />
      </section>
    </main>
  )
}

export default AuthPage
