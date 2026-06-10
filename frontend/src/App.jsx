import { Navigate, Route, Routes } from 'react-router-dom'
import { GalleryVerticalEnd, Loader2 } from 'lucide-react'
import { useAuth } from './hooks/useAuth.js'
import AuthPage from './pages/AuthPage.jsx'
import DashboardPage from './pages/DashboardPage.jsx'

function AuthLoadingScreen() {
  return (
    <main className="flex min-h-svh items-center justify-center bg-[#070807] px-6 text-white">
      <div className="flex items-center gap-3 text-[#dffdee]">
        <GalleryVerticalEnd aria-hidden="true" className="size-5" />
        <Loader2 aria-hidden="true" className="size-4 animate-spin" />
      </div>
    </main>
  )
}

function ProtectedRoute({ children }) {
  const { authReady, isAuthenticated } = useAuth()

  if (!authReady) {
    return <AuthLoadingScreen />
  }

  return isAuthenticated ? children : <Navigate to="/" replace />
}

function PublicOnlyRoute({ children }) {
  const { authReady, isAuthenticated } = useAuth()

  if (!authReady) {
    return <AuthLoadingScreen />
  }

  return isAuthenticated ? <Navigate to="/dashboard" replace /> : children
}

function App() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <PublicOnlyRoute>
            <AuthPage />
          </PublicOnlyRoute>
        }
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
