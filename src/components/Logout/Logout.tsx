import { useAuth } from '../../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import './Logout.css'
import { t } from 'i18next'

export const LogoutButton = () => {
  const { signOut } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await signOut()
    navigate('/auth')
  }

  return (
    <button className="logout-btn" onClick={handleLogout}>
     {t("nav.LogoutButton")} 
    </button>
  )
}