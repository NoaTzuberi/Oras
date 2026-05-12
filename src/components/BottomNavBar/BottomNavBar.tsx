import './BottomNavBar.css'
import { FiHome, FiList, FiBarChart2, FiSettings, FiPlus } from 'react-icons/fi'
import { useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from "react-i18next"

export const BottomNavBar = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const path = location.pathname
  const { t } = useTranslation()


  return (
    <div className="bottom-nav">
      <button className={`nav-item ${path === '/' ? 'nav-item--active' : ''}`} onClick={() => navigate('/')}>
        <FiHome /><span>{t("nav.home")}</span>
      </button>
      <button className={`nav-item ${path === '/shifts' ? 'nav-item--active' : ''}`} onClick={() => navigate('/shifts')}>
        <FiList /><span>{t("nav.shifts")}</span>
      </button>
      <button className="add-button" onClick={() => navigate('/add')}>
        <FiPlus />
      </button>
      <button className={`nav-item ${path === '/dashboard' ? 'nav-item--active' : ''}`} onClick={() => navigate('/dashboard')}>
        <FiBarChart2 /><span>{t("nav.stats")}</span>
      </button>
      <button className={`nav-item ${path === '/settings' ? 'nav-item--active' : ''}`} onClick={() => navigate('/settings')}>
        <FiSettings /><span>{t("nav.settings")}</span>
      </button>
    </div>
  )
}