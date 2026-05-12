import { useTranslation } from "react-i18next"
import './LanguageToggle.css'

export const LanguageToggle = () => {
  const { i18n } = useTranslation()

  const toggleLanguage = () => {
    const newLang = i18n.language === 'he' ? 'en' : 'he'
    i18n.changeLanguage(newLang)
    localStorage.setItem('lang', newLang)
  }

  return (
    <button
      className={`lang-toggle ${i18n.language}`}
      onClick={toggleLanguage}
    >
      <span className="lang-toggle__inner">
        {i18n.language === 'he' ? '🇮🇱 HE' : 'EN 🇺🇸'}
      </span>
    </button>
  )
}