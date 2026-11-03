import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import './BottomNavBar.css'
import { FiHome, FiList, FiBarChart2, FiSettings, FiPlus } from 'react-icons/fi'
import { useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from "react-i18next"

const isTextField = (el: EventTarget | null) =>
  el instanceof HTMLElement && (el.matches('input:not([type=checkbox]):not([type=radio]):not([type=button]), textarea, select') || el.isContentEditable)

/**
 * True while a text field has focus on a touch device. iOS keeps a fixed
 * bottom bar floating just above the keyboard, where it covers the form
 * being edited (e.g. the job editor's Save / Cancel), so the nav steps aside.
 */
const useTyping = () => {
  const [typing, setTyping] = useState(false)
  useEffect(() => {
    if (!window.matchMedia('(pointer: coarse)').matches) return
    const onIn = (e: FocusEvent) => { if (isTextField(e.target)) setTyping(true) }
    const onOut = (e: FocusEvent) => { if (!isTextField(e.relatedTarget)) setTyping(false) }
    document.addEventListener('focusin', onIn)
    document.addEventListener('focusout', onOut)
    return () => {
      document.removeEventListener('focusin', onIn)
      document.removeEventListener('focusout', onOut)
    }
  }, [])
  return typing
}

export const BottomNavBar = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const path = location.pathname
  const { t } = useTranslation()
  const typing = useTyping()


  // Rendered into <body>: an ancestor with transform / filter / backdrop-filter
  // (page animations, glass cards) would make position: fixed relative to it.
  return createPortal(
    <nav className={`bottom-nav${typing ? ' bottom-nav--typing' : ''}`}>
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
    </nav>,
    document.body,
  )
}