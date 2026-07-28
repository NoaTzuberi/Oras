import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../context/AuthContext'
import '../AuthPage/AuthPage.css'

export const ResetPasswordPage = () => {
  const { updatePassword } = useAuth()
  const navigate = useNavigate()
  const { t } = useTranslation()

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')

  const handleSubmit = async () => {
    setError('')
    setSuccessMsg('')

    if (!password || !confirmPassword) {
      setError(t('auth.errorFillFields'))
      return
    }

    if (password.length < 6) {
      setError(t('auth.errorPasswordShort'))
      return
    }

    if (password !== confirmPassword) {
      setError(t('auth.errorPasswordsMismatch'))
      return
    }

    setLoading(true)

    const { error } = await updatePassword(password)

    if (error) {
      setError(t('auth.errorResetFailed'))
      setLoading(false)
    } else {
      setSuccessMsg(t('auth.successPasswordUpdated'))
      setLoading(false)
      setTimeout(() => navigate('/'), 1500)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">

        <div className="auth-logo">
          <img src="/logo.png" alt="Oras" className="auth-logo__img" />
        </div>

        <h1 className="auth-title">{t('auth.resetTitle')}</h1>
        <p className="auth-subtitle">{t('auth.resetSubtitle')}</p>

        <div className="auth-fields">
          <div className="auth-field">
            <label className="auth-label">{t('auth.newPassword')}</label>
            <input
              type="password"
              className="auth-input"
              placeholder={t('auth.passwordPlaceholder') ?? ''}
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            />
          </div>

          <div className="auth-field">
            <label className="auth-label">{t('auth.confirmPassword')}</label>
            <input
              type="password"
              className="auth-input"
              placeholder={t('auth.passwordPlaceholder') ?? ''}
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            />
          </div>
        </div>

        {error && <p className="auth-error">{error}</p>}
        {successMsg && <p className="auth-success">{successMsg}</p>}

        <button
          className="auth-btn"
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? t('auth.loading') : t('auth.updatePassword')}
        </button>

      </div>
    </div>
  )
}
