import { useEffect, useMemo, useState } from 'react'
import { AuthContext } from './authContext.js'
import {
  getCurrentSession,
  loginUser,
  logoutUser,
  signupUser,
} from '../services/authApi.js'

export function AuthProvider({ children }) {
  const [authReady, setAuthReady] = useState(false)
  const [user, setUser] = useState(null)

  useEffect(() => {
    let active = true

    getCurrentSession()
      .then((session) => {
        if (active) {
          setUser(session.authenticated ? session.user : null)
        }
      })
      .catch(() => {
        if (active) {
          setUser(null)
        }
      })
      .finally(() => {
        if (active) {
          setAuthReady(true)
        }
      })

    return () => {
      active = false
    }
  }, [])

  async function login(credentials) {
    const response = await loginUser(credentials)
    setUser(response.user)
    return response
  }

  async function signup(credentials) {
    const response = await signupUser(credentials)
    setUser(response.user)
    return response
  }

  async function logout() {
    try {
      await logoutUser()
    } finally {
      setUser(null)
    }
  }

  async function mutateAuth() {
    try {
      const session = await getCurrentSession()
      setUser(session.authenticated ? session.user : null)
    } catch {
      setUser(null)
    }
  }

  const value = useMemo(
    () => ({
      authReady,
      isAuthenticated: Boolean(user),
      login,
      logout,
      signup,
      mutateAuth,
      user,
    }),
    [authReady, user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
