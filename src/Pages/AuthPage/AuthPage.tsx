import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import './AuthPage.css'

export const AuthPage = () => {
  const { signIn, signUp } = useAuth()
  const navigate = useNavigate()

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
      setError('נא למלא אימייל וסיסמה')
      return
    }

    if (password.length < 6) {
      setError('הסיסמה חייבת להיות לפחות 6 תווים')
      return
    }

    setLoading(true)

    if (mode === 'login') {
      const { error } = await signIn(email, password)

      if (error) {
        setError('אימייל או סיסמה שגויים')
      } else {
        navigate('/')
      }
    } else {
      // ✨ validate name fields only in signup
      if (!firstName || !lastName) {
        setError('נא למלא שם פרטי ושם משפחה')
        setLoading(false)
        return
      }

      const { error } = await signUp(email, password, firstName, lastName)

      if (error) {
        setError('שגיאה בהרשמה, נסה שוב')
      } else {
        setSuccessMsg('נשלח אימייל אימות! בדוק תיבת דואר')
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
          {mode === 'login' ? 'ברוך הבא ל Oras 👋' : 'צור חשבון חדש'}
        </h1>

        <p className="auth-subtitle">
          {mode === 'login'
            ? 'התחבר לחשבון שלך'
            : 'הצטרף ועקוב אחרי המשמרות שלך'}
        </p>

        <div className="auth-fields">

          <div className="auth-field">
            <label className="auth-label">אימייל</label>
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
            <label className="auth-label">סיסמה</label>
            <input
              type="password"
              className="auth-input"
              placeholder="לפחות 6 תווים"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            />
          </div>

          {/* ✨ NEW FIELDS ONLY IN SIGNUP */}
          {mode === 'signup' && (
            <>
              <div className="auth-field">
                <label className="auth-label">שם פרטי</label>
                <input
                  type="text"
                  className="auth-input"
                  placeholder="שם פרטי"
                  value={firstName}
                  onChange={e => setFirstName(e.target.value)}
                />
              </div>

              <div className="auth-field">
                <label className="auth-label">שם משפחה</label>
                <input
                  type="text"
                  className="auth-input"
                  placeholder="שם משפחה"
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
            ? '...'
            : mode === 'login'
              ? 'התחבר'
              : 'הירשם'}
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
            ? 'אין לך חשבון? הירשם'
            : 'כבר יש לך חשבון? התחבר'}
        </button>

      </div>
    </div>
  )
}