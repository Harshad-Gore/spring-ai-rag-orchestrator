import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { useAuth } from './hooks/useAuth.js'
import AuthPage from './pages/AuthPage.jsx'
import DashboardPage from './pages/DashboardPage.jsx'
import VerifyEmailPage from './pages/VerifyEmailPage.jsx'
import ForgotPasswordPage from './pages/ForgotPasswordPage.jsx'
import ResetPasswordPage from './pages/ResetPasswordPage.jsx'
import SettingsPage from './pages/SettingsPage.jsx'
import SharedNotebookPage from './pages/SharedNotebookPage.jsx'
import CustomCursor from './components/ui/CustomCursor.jsx'

function AuthLoadingScreen() {
  return (
    <main className="flex min-h-svh items-center justify-center bg-[#070807]">
      <Loader2 aria-hidden="true" className="size-6 animate-spin text-[#dffdee]/60" />
    </main>
  )
}

function ProtectedRoute({ children }) {
  const { authReady, isAuthenticated } = useAuth()
  const location = useLocation()

  if (!authReady) {
    return <AuthLoadingScreen />
  }

  return isAuthenticated ? children : <Navigate to="/" state={{ from: location }} replace />
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
    <>
      <CustomCursor />
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
          path="/verify-email"
          element={
          <PublicOnlyRoute>
            <VerifyEmailPage />
          </PublicOnlyRoute>
        }
      />
      <Route
        path="/forgot-password"
        element={
          <PublicOnlyRoute>
            <ForgotPasswordPage />
          </PublicOnlyRoute>
        }
      />
      <Route
        path="/reset-password"
        element={
          <PublicOnlyRoute>
            <ResetPasswordPage />
          </PublicOnlyRoute>
        }
      />
      <Route
        path="/dashboard/:notebookId?"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/shared/:shareToken"
        element={
          <ProtectedRoute>
            <SharedNotebookPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <SettingsPage />
          </ProtectedRoute>
        }
      />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}

export default App
