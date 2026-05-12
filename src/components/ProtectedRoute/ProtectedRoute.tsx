import { Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth()

  if (loading) return (
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

  if (!user) return <Navigate to="/auth" replace />
  return <>{children}</>
}