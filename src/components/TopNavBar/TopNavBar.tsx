import { LanguageToggle } from '../LanguageToggle/LanguageToggle'
import './TopNavBar.css'
import { useTranslation } from "react-i18next"
import { useAuth } from '../../context/AuthContext'
import { LogoutButton } from '../Logout/Logout'


export const TopNavBar = () => {
  const { t, i18n } = useTranslation()
  const { user } = useAuth()

  const now = new Date()
  const hour = now.getHours()

  const greeting =
    hour < 12
      ? t('greeting.morning')
      : hour < 17
      ? t('greeting.afternoon')
      : t('greeting.evening')

  // 🧠 בניית שם מה-metadata
  const firstName = user?.user_metadata?.first_name
  const lastName = user?.user_metadata?.last_name

  const name =
    firstName
      ? `${firstName}${lastName ? ' ' + lastName : ''}`
      : user?.email?.split('@')[0] || ''

  const date = now.toLocaleDateString(
    i18n.language === 'he' ? 'he-IL' : 'en-GB',
    { month: 'long', year: 'numeric' }
  )

  return (
    <div className="top-navbar">
      <div className="top-navbar__left">
        <span className="top-navbar__greeting">
          {greeting}{name && `, ${name}`} 👋
        </span>

        <span className="top-navbar__date">
          {date}
        </span>
      </div>

      <div className="top-navbar__right">
        <div className="top-navbar__actions">
          <LogoutButton/>
          <LanguageToggle />
        </div>
        <div className="top-navbar__logo-wrap">
          <img src="/logo.png" alt="logo" className="top-navbar__logo" />
        </div>
      </div>
    </div>
  )
}