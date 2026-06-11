const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080')
  .replace(/\/+$/, '')
const AUTH_TOKEN_STORAGE_KEY = 'spring-ai-rag-orchestrator.auth-token'

export class ApiError extends Error {
  constructor(message, fields = {}) {
    super(message)
    this.name = 'ApiError'
    this.fields = fields
  }
}

export function loginUser(payload) {
  clearStoredAuthToken()
  return request('/api/auth/login', {
    method: 'POST',
    body: payload,
    skipAuth: true,
  }).then(storeAuthResponse)
}

export function signupUser(payload) {
  clearStoredAuthToken()
  return request('/api/auth/signup', {
    method: 'POST',
    body: payload,
    skipAuth: true,
  }).then(storeAuthResponse)
}

export async function getCurrentSession() {
  const session = await request('/api/auth/session')
  if (!session?.authenticated) {
    clearStoredAuthToken()
  }

  return session
}

export async function logoutUser() {
  try {
    return await request('/api/auth/logout', {
      method: 'POST',
    })
  } finally {
    clearStoredAuthToken()
  }
}

async function request(path, options = {}) {
  const token = options.skipAuth ? null : getStoredAuthToken()
  const headers = {
    ...(options.body ? { 'Content-Type': 'application/json' } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: options.method ?? 'GET',
    credentials: 'include',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  })

  const payload = await parseJson(response)

  if (!response.ok) {
    throw new ApiError(
      payload?.message ?? 'Request failed. Please try again.',
      payload?.fields ?? {},
    )
  }

  return payload
}

function storeAuthResponse(response) {
  if (response?.accessToken) {
    setStoredAuthToken(response.accessToken)
  }

  return response
}

export function getStoredAuthToken() {
  if (typeof window === 'undefined') {
    return null
  }

  try {
    return window.localStorage.getItem(AUTH_TOKEN_STORAGE_KEY)
  } catch {
    return null
  }
}

function setStoredAuthToken(token) {
  if (typeof window === 'undefined') {
    return
  }

  try {
    window.localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token)
  } catch {
    // HttpOnly cookies remain the fallback when storage is unavailable.
  }
}

function clearStoredAuthToken() {
  if (typeof window === 'undefined') {
    return
  }

  try {
    window.localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY)
  } catch {
    // Nothing to clear if storage is unavailable.
  }
}

async function parseJson(response) {
  const text = await response.text()
  return text ? JSON.parse(text) : null
}
