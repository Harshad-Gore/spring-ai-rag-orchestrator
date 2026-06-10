import { useState } from 'react'
import {
  ArrowRight,
  Eye,
  EyeOff,
  GalleryVerticalEnd,
  Loader2,
  LockKeyhole,
  Mail,
  UserRound,
} from 'lucide-react'
import { Button } from '../ui/button.jsx'
import { Field, FieldError, FieldGroup, FieldLabel } from '../ui/field.jsx'
import { Input } from '../ui/input.jsx'

const initialValues = {
  confirmPassword: '',
  email: '',
  fullName: '',
  password: '',
}

const copy = {
  login: {
    title: 'Login',
    action: 'Login',
    loading: 'Authenticating',
  },
  signup: {
    title: 'Create account',
    action: 'Create account',
    loading: 'Creating account',
  },
}

function getPasswordStrength(password) {
  if (!password) {
    return { level: 0, label: 'Strength' }
  }

  const checks = [
    password.length >= 8,
    /[a-z]/.test(password) && /[A-Z]/.test(password),
    /\d/.test(password),
    /[^A-Za-z0-9]/.test(password),
    password.length >= 12,
  ]
  const score = checks.filter(Boolean).length

  if (score >= 4) {
    return { level: 3, label: 'Strong' }
  }

  if (score >= 3) {
    return { level: 2, label: 'Good' }
  }

  return { level: 1, label: 'Weak' }
}

function validate(values, mode) {
  const nextErrors = {}

  if (mode === 'signup' && values.fullName.trim().length < 2) {
    nextErrors.fullName = 'Enter your full name.'
  }

  if (!/^\S+@\S+\.\S+$/.test(values.email)) {
    nextErrors.email = 'Use a valid email address.'
  }

  if (values.password.length < 8) {
    nextErrors.password = 'Password must be at least 8 characters.'
  }

  if (mode === 'signup') {
    if (!values.confirmPassword) {
      nextErrors.confirmPassword = 'Re-enter your password.'
    } else if (values.confirmPassword !== values.password) {
      nextErrors.confirmPassword = 'Passwords do not match.'
    }
  }

  return nextErrors
}

function AuthForm({ onSubmit }) {
  const [mode, setMode] = useState('login')
  const [values, setValues] = useState(initialValues)
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const isSignup = mode === 'signup'
  const currentCopy = copy[mode]
  const passwordStrength = getPasswordStrength(values.password)

  function switchMode(nextMode) {
    if (nextMode === mode) {
      return
    }

    setMode(nextMode)
    setErrors({})
    setFormError('')
    setShowPassword(false)
  }

  function updateValue(field) {
    return (event) => {
      setValues((current) => ({ ...current, [field]: event.target.value }))
      setErrors((current) => {
        const nextErrors = { ...current, [field]: undefined }

        if (field === 'password') {
          nextErrors.confirmPassword = undefined
        }

        return nextErrors
      })
      setFormError('')
    }
  }

  async function handleSubmit(event) {
    event.preventDefault()

    const nextErrors = validate(values, mode)
    setErrors(nextErrors)

    if (Object.keys(nextErrors).length > 0) {
      return
    }

    setLoading(true)
    setFormError('')

    try {
      await onSubmit(mode, {
        email: values.email,
        fullName: values.fullName,
        password: values.password,
      })
    } catch (error) {
      setErrors(error.fields ?? {})
      setFormError(error.message ?? 'Authentication failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full">
      <div className="mb-6 grid gap-4">
        <div className="flex items-center gap-3">
          <span className="flex size-8 items-center justify-center rounded-lg border border-white/10 bg-white/[0.03] text-[#dffdee]">
            <GalleryVerticalEnd aria-hidden="true" className="size-4" />
          </span>
          <span className="text-sm font-semibold text-white">
            Notebook
          </span>
        </div>

        <h1
          key={mode}
          className="auth-mode-title text-[28px] font-semibold leading-tight text-white"
        >
          {currentCopy.title}
        </h1>

        <div
          className="inline-flex w-full rounded-full border border-white/10 bg-[#101211] p-0.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
          role="group"
          aria-label="Authentication mode"
        >
          {['login', 'signup'].map((option) => {
            const active = mode === option

            return (
              <button
                key={option}
                type="button"
                aria-pressed={active}
                disabled={loading}
                onClick={() => switchMode(option)}
                className={[
                  'h-7 flex-1 rounded-full px-3 text-[13px] font-medium transition duration-200 focus:outline-none focus:ring-2 focus:ring-[#b9f7d3]/25 disabled:cursor-not-allowed disabled:opacity-60',
                  active
                    ? 'bg-[#dffdee] text-[#07110c] shadow-[0_5px_16px_rgba(88,214,141,0.14)]'
                    : 'text-[#9aa39f] hover:text-white',
                ].join(' ')}
              >
                {option === 'login' ? 'Login' : 'Sign up'}
              </button>
            )
          })}
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        noValidate
        aria-busy={loading}
        className="grid gap-4"
      >
        <FieldGroup key={mode} className="auth-mode-panel gap-4">
          {isSignup ? (
            <Field className="gap-2">
              <FieldLabel htmlFor="fullName">Full name</FieldLabel>
              <Input
                id="fullName"
                value={values.fullName}
                onChange={updateValue('fullName')}
                placeholder="Enter your name"
                disabled={loading}
                error={errors.fullName}
                icon={UserRound}
                autoComplete="name"
                aria-invalid={Boolean(errors.fullName)}
                aria-describedby={errors.fullName ? 'fullName-error' : undefined}
              />
              <FieldError id="fullName-error">{errors.fullName}</FieldError>
            </Field>
          ) : null}

          <Field className="gap-2">
            <FieldLabel htmlFor="email">Email</FieldLabel>
            <Input
              id="email"
              type="email"
            value={values.email}
            onChange={updateValue('email')}
            placeholder="Enter your email"
            disabled={loading}
            error={errors.email}
            icon={Mail}
              autoComplete="email"
              aria-invalid={Boolean(errors.email)}
              aria-describedby={errors.email ? 'email-error' : undefined}
            />
            <FieldError id="email-error">{errors.email}</FieldError>
          </Field>

          <Field className="gap-2">
            <FieldLabel htmlFor="password">Password</FieldLabel>
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
            value={values.password}
            onChange={updateValue('password')}
            placeholder="Enter your password"
            disabled={loading}
            error={errors.password}
            icon={LockKeyhole}
              autoComplete={isSignup ? 'new-password' : 'current-password'}
              aria-invalid={Boolean(errors.password)}
              aria-describedby={errors.password ? 'password-error' : undefined}
              trailing={
                <button
                  type="button"
                  onClick={() => setShowPassword((visible) => !visible)}
                  disabled={loading}
                  className="absolute right-1.5 top-1/2 inline-flex size-7 -translate-y-1/2 items-center justify-center rounded-lg text-[#87918c] transition hover:bg-white/[0.06] hover:text-white focus:outline-none focus:ring-2 focus:ring-[#b9f7d3]/25 disabled:cursor-not-allowed disabled:opacity-50"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff aria-hidden="true" className="size-4" />
                  ) : (
                    <Eye aria-hidden="true" className="size-4" />
                  )}
                </button>
              }
            />
            {isSignup ? (
              <div className="flex items-center gap-2 pt-0.5">
                {[1, 2, 3].map((level) => (
                  <span
                    key={level}
                    className={[
                      'h-1 flex-1 rounded-full transition-colors duration-200',
                      passwordStrength.level >= level
                        ? level === 1
                          ? 'bg-[#f0c987]'
                          : 'bg-[#dffdee]'
                        : 'bg-white/10',
                    ].join(' ')}
                  />
                ))}
                <span className="w-14 text-right text-xs text-[#8e9994]">
                  {passwordStrength.label}
                </span>
              </div>
            ) : null}
            <FieldError id="password-error">{errors.password}</FieldError>
          </Field>

          {isSignup ? (
            <Field className="gap-2">
              <FieldLabel htmlFor="confirmPassword">
                Re-enter password
              </FieldLabel>
              <Input
                id="confirmPassword"
                type={showPassword ? 'text' : 'password'}
                value={values.confirmPassword}
                onChange={updateValue('confirmPassword')}
                placeholder="Re-enter your password"
                disabled={loading}
                error={errors.confirmPassword}
                icon={LockKeyhole}
                autoComplete="new-password"
                aria-invalid={Boolean(errors.confirmPassword)}
                aria-describedby={
                  errors.confirmPassword ? 'confirmPassword-error' : undefined
                }
              />
              <FieldError id="confirmPassword-error">
                {errors.confirmPassword}
              </FieldError>
            </Field>
          ) : null}

          {formError ? (
            <p
              role="alert"
              className="rounded-lg border border-red-500/25 bg-red-500/10 px-3 py-2 text-sm leading-5 text-red-200"
            >
              {formError}
            </p>
          ) : null}

          <Button
            type="submit"
            disabled={loading}
            className="mt-1 h-10 w-full rounded-full text-sm font-semibold"
          >
            {loading ? (
              <Loader2 aria-hidden="true" className="size-4 animate-spin" />
            ) : (
              <ArrowRight aria-hidden="true" className="size-4" />
            )}
            {loading ? currentCopy.loading : currentCopy.action}
          </Button>
        </FieldGroup>
      </form>
    </div>
  )
}

export default AuthForm
