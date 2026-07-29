import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ShiftsProvider } from './context/ShiftContext'
import { ProtectedRoute } from './components/ProtectedRoute/ProtectedRoute'
import { useAuth } from './context/AuthContext'

const LiquidBackground = lazy(() => import('./components/LiquidBackground/LiquidBackground').then(m => ({ default: m.LiquidBackground })))
const HomePage = lazy(() => import('./Pages/HomePage/HomePage').then(m => ({ default: m.HomePage })))
const AddShiftPage = lazy(() => import('./Pages/AddShiftPage/AddShiftPage').then(m => ({ default: m.AddShiftPage })))
const ShiftsPage = lazy(() => import('./Pages/ShiftsPage/ShiftsPage').then(m => ({ default: m.ShiftsPage })))
const SettingsPage = lazy(() => import('./Pages/SettingsPage/SettingsPage').then(m => ({ default: m.SettingsPage })))
const StatsPage = lazy(() => import('./Pages/StatsPage/StatsPage').then(m => ({ default: m.StatsPage })))
const AuthPage = lazy(() => import('./Pages/AuthPage/AuthPage').then(m => ({ default: m.AuthPage })))
const ResetPasswordPage = lazy(() => import('./Pages/ResetPasswordPage/ResetPasswordPage').then(m => ({ default: m.ResetPasswordPage })))

const RouteFallback = () => (
  <div style={{
    minHeight: '100vh', display: 'flex',
    alignItems: 'center', justifyContent: 'center'
  }}>
    <div style={{
      fontFamily: 'Syne, sans-serif', fontSize: '18px',
      background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
      WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
    }}>
      Oras...
    </div>
  </div>
)

const AppRoutes = () => {
  const { user } = useAuth()

  return (
    <>
      <Suspense fallback={null}>
        <LiquidBackground />
      </Suspense>
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route path="/auth" element={user ? <Navigate to="/" replace /> : <AuthPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <ShiftsProvider>
                  <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/add" element={<AddShiftPage />} />
                    <Route path="/shifts" element={<ShiftsPage />} />
                    <Route path="/dashboard" element={<StatsPage />} />
                    <Route path="/settings" element={<SettingsPage />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </ShiftsProvider>
              </ProtectedRoute>
            }
          />
        </Routes>
      </Suspense>
    </>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
