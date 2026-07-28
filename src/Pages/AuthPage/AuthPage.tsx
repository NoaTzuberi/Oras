import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../context/AuthContext'
import './AuthPage.css'

export const AuthPage = () => {
  const { signIn, signUp } = useAuth()
  const navigate = useNavigate()
  const { t } = useTranslation()

  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  // ✨ NEW FIELDS
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')

  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')

  const handleSubmit = async () => {
    setError('')
    setSuccessMsg('')

    if (!email || !password) {
      setError(t('auth.errorFillFields'))
      return
    }

    if (password.length < 6) {
      setError(t('auth.errorPasswordShort'))
      return
    }

    setLoading(true)

    if (mode === 'login') {
      const { error } = await signIn(email, password)

      if (error) {
        setError(t('auth.errorInvalidCredentials'))
      } else {
        navigate('/')
      }
    } else {
      // ✨ validate name fields only in signup
      if (!firstName || !lastName) {
        setError(t('auth.errorFillNames'))
        setLoading(false)
        return
      }

      const { error } = await signUp(email, password, firstName, lastName)

      if (error) {
        setError(t('auth.errorSignup'))
      } else {
        setSuccessMsg(t('auth.successVerification'))
      }
    }

    setLoading(false)
  }

  return (
    <div className="auth-page">
      <div className="auth-card">

        <div className="auth-logo">
          <img src="/logo.png" alt="Oras" className="auth-logo__img" />
          <span className="auth-logo__name"></span>
        </div>

        <h1 className="auth-title">
          {mode === 'login' ? t('auth.welcomeBack') : t('auth.createAccount')}
        </h1>

        <p className="auth-subtitle">
          {mode === 'login'
            ? t('auth.loginSubtitle')
            : t('auth.signupSubtitle')}
        </p>

        <div className="auth-fields">

          <div className="auth-field">
            <label className="auth-label">{t('auth.email')}</label>
            <input
              type="email"
              className="auth-input"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            />
          </div>

          <div className="auth-field">
            <label className="auth-label">{t('auth.password')}</label>
            <input
              type="password"
              className="auth-input"
              placeholder={t('auth.passwordPlaceholder') ?? ''}
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            />
          </div>

          {/* ✨ NEW FIELDS ONLY IN SIGNUP */}
          {mode === 'signup' && (
            <>
              <div className="auth-field">
                <label className="auth-label">{t('auth.firstName')}</label>
                <input
                  type="text"
                  className="auth-input"
                  placeholder={t('auth.firstName') ?? ''}
                  value={firstName}
                  onChange={e => setFirstName(e.target.value)}
                />
              </div>

              <div className="auth-field">
                <label className="auth-label">{t('auth.lastName')}</label>
                <input
                  type="text"
                  className="auth-input"
                  placeholder={t('auth.lastName') ?? ''}
                  value={lastName}
                  onChange={e => setLastName(e.target.value)}
                />
              </div>
            </>
          )}

        </div>

        {error && <p className="auth-error">{error}</p>}
        {successMsg && <p className="auth-success">{successMsg}</p>}

        <button
          className="auth-btn"
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading
            ? t('auth.loading')
            : mode === 'login'
              ? t('auth.login')
              : t('auth.signup')}
        </button>

        <button
          className="auth-switch"
          onClick={() => {
            setMode(m => (m === 'login' ? 'signup' : 'login'))
            setError('')
            setSuccessMsg('')
          }}
        >
          {mode === 'login'
            ? t('auth.noAccount')
            : t('auth.haveAccount')}
        </button>

      </div>
    </div>
  )
}