const AUTH_REDIRECT_STORAGE_KEY = 'spring-ai-rag-orchestrator.post-auth-redirect'

function getStorage() {
  if (typeof window === 'undefined') {
    return null
  }

  try {
    return window.sessionStorage
  } catch {
    return null
  }
}

export function buildRedirectTarget(locationLike) {
  if (!locationLike) return '/dashboard'

  const pathname = locationLike.pathname || '/dashboard'
  const search = locationLike.search || ''
  const hash = locationLike.hash || ''
  return `${pathname}${search}${hash}`
}

export function rememberPostAuthRedirect(locationLike) {
  const storage = getStorage()
  if (!storage) return

  storage.setItem(AUTH_REDIRECT_STORAGE_KEY, buildRedirectTarget(locationLike))
}

export function consumePostAuthRedirect() {
  const storage = getStorage()
  if (!storage) return null

  const target = storage.getItem(AUTH_REDIRECT_STORAGE_KEY)
  storage.removeItem(AUTH_REDIRECT_STORAGE_KEY)
  return target
}
