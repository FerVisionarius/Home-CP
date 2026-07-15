import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AuthProvider, useAuth } from './AuthContext'
import LoginPage from './LoginPage'
import ForgotPassword from './ForgotPassword'
import ResetPassword from './ResetPassword'
import Launcher from './Launcher'

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return (
    <div className="min-h-screen bg-bg-100 flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-accent-100 border-t-transparent rounded-full animate-spin" />
    </div>
  )
  if (!user) return <Navigate to="/login" replace />
  return children
}

function AppRoutes() {
  const { user, loading } = useAuth()
  const location = useLocation()
  const isPublicRoute = ['/login', '/forgot-password', '/reset-password', '/set-password'].includes(location.pathname)

  useEffect(() => {
    const hash = window.location.hash
    if (hash.includes('type=invite') || hash.includes('type=signup')) {
      window.location.replace('/set-password' + hash)
    } else if (hash.includes('type=recovery') && location.pathname !== '/reset-password') {
      window.location.replace('/reset-password' + hash)
    }
    const code = new URLSearchParams(window.location.search).get('code')
    if (code && location.pathname !== '/reset-password' && location.pathname !== '/set-password') {
      window.location.replace('/reset-password' + window.location.search)
    }
  }, [location.pathname])

  if (loading && !isPublicRoute) {
    return (
      <div className="min-h-screen bg-bg-100 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-accent-100 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <LoginPage />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/set-password" element={<ResetPassword isInvite />} />

      <Route path="/" element={
        <ProtectedRoute><Launcher /></ProtectedRoute>
      } />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}
