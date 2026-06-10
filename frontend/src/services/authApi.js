const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080'

export class ApiError extends Error {
  constructor(message, fields = {}) {
    super(message)
    this.name = 'ApiError'
    this.fields = fields
  }
}

export function loginUser(payload) {
  return request('/api/auth/login', {
    method: 'POST',
    body: payload,
  })
}

export function signupUser(payload) {
  return request('/api/auth/signup', {
    method: 'POST',
    body: payload,
  })
}

export function getCurrentSession() {
  return request('/api/auth/session')
}

export function logoutUser() {
  return request('/api/auth/logout', {
    method: 'POST',
  })
}

async function request(path, options = {}) {
  const headers = {
    ...(options.body ? { 'Content-Type': 'application/json' } : {}),
    ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
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

async function parseJson(response) {
  const text = await response.text()
  return text ? JSON.parse(text) : null
}
