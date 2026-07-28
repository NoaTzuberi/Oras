import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ShiftsProvider } from './context/ShiftContext'
import { LiquidBackground } from './components/LiquidBackground/LiquidBackground'
import { ProtectedRoute } from './components/ProtectedRoute/ProtectedRoute'
import { HomePage } from './Pages/HomePage/HomePage'
import { AddShiftPage } from './Pages/AddShiftPage/AddShiftPage'
import { ShiftsPage } from './Pages/ShiftsPage/ShiftsPage'
import { SettingsPage } from './Pages/SettingsPage/SettingsPage'
import { DashboardPage } from './Pages/DashboardPage/DashboardPage'
import { AuthPage } from './Pages/AuthPage/AuthPage'
import { useAuth } from './context/AuthContext'

const AppRoutes = () => {
  const { user } = useAuth()

  return (
    <>
      <LiquidBackground />
      <Routes>
        <Route path="/auth" element={user ? <Navigate to="/" replace /> : <AuthPage />} />
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <ShiftsProvider>
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/add" element={<AddShiftPage />} />
                  <Route path="/shifts" element={<ShiftsPage />} />
                  <Route path="/dashboard" element={<DashboardPage />} />
                  <Route path="/settings" element={<SettingsPage />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </ShiftsProvider>
            </ProtectedRoute>
          }
        />
      </Routes>
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