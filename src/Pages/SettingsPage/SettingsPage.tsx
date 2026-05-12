import { useState } from 'react'
import { BottomNavBar } from '../../components/BottomNavBar/BottomNavBar'
import { TopNavBar } from '../../components/TopNavBar/TopNavBar'
import './SettingsPage.css'
import { calcCreditPoints, useShifts, type UserProfile } from '../../context/ShiftContext'

export const SettingsPage = () => {
  const { userProfile, setUserProfile } = useShifts()

  const [form, setForm] = useState<UserProfile>(userProfile)
  const [childAgeInput, setChildAgeInput] = useState('')
  const [saved, setSaved] = useState(false)

  const previewPoints = calcCreditPoints(form)
  const previewCredit = parseFloat((previewPoints * 242).toFixed(2))

  const handleSave = async () => {
  await setUserProfile(form)
  setSaved(true)
  setTimeout(() => setSaved(false), 2000)
}

  const addChild = () => {
    const age = parseInt(childAgeInput)
    if (isNaN(age) || age < 0 || age > 18) return
    setForm(f => ({ ...f, children: [...f.children, { age }] }))
    setChildAgeInput('')
  }

  const removeChild = (index: number) => {
    setForm(f => ({ ...f, children: f.children.filter((_, i) => i !== index) }))
  }

  return (
    <div className="settings-page">
      <TopNavBar />
      <div className="settings-content">
        <h2 className="settings-title">הגדרות</h2>
        <p className="settings-subtitle">מלא את הפרטים כדי לחשב את נקודות הזיכוי שלך</p>

        {/* Live preview */}
        {previewPoints > 0 && (
          <div className="credit-preview">
            <div className="credit-preview__row">
              <span className="credit-preview__label">נקודות זיכוי</span>
              <span className="credit-preview__value">{previewPoints}</span>
            </div>
            <div className="credit-preview__row">
              <span className="credit-preview__label">הנחת מס חודשית</span>
              <span className="credit-preview__value">₪{previewCredit}</span>
            </div>
          </div>
        )}

        {/* Gender */}
        <div className="settings-section">
          <label className="settings-label">מגדר</label>
          <div className="toggle-row">
            <button
              className={`toggle-btn ${form.gender === 'male' ? 'toggle-btn--active' : ''}`}
              onClick={() => setForm(f => ({ ...f, gender: 'male' }))}
            >
              גבר
            </button>
            <button
              className={`toggle-btn ${form.gender === 'female' ? 'toggle-btn--active' : ''}`}
              onClick={() => setForm(f => ({ ...f, gender: 'female' }))}
            >
              אישה
            </button>
          </div>
          <p className="settings-hint">
            {form.gender === 'male' ? '2.25 נקודות בסיס' : form.gender === 'female' ? '2.75 נקודות בסיס' : ''}
          </p>
        </div>

        {/* Children */}
        <div className="settings-section">
          <label className="settings-label">ילדים</label>
          <div className="children-input-row">
            <input
              type="number"
              className="settings-input"
              placeholder="גיל הילד"
              value={childAgeInput}
              onChange={e => setChildAgeInput(e.target.value)}
              min={0}
              max={18}
            />
            <button className="add-child-btn" onClick={addChild}>+ הוסף</button>
          </div>
          {form.children.length > 0 && (
            <div className="children-list">
              {form.children.map((child, i) => (
                <div key={i} className="child-tag">
                  <span>גיל {child.age}</span>
                  <button onClick={() => removeChild(i)}>✕</button>
                </div>
              ))}
            </div>
          )}
          <p className="settings-hint">נקודות זיכוי לפי גיל הילד לפי חוק</p>
        </div>

        {/* Military */}
        <div className="settings-section">
          <label className="settings-label">חיילים משוחררים/ שירות לאומי</label>
          <div className="toggle-row">
            {[0, 1, 2, 3].map(y => (
              <button
                key={y}
                className={`toggle-btn ${form.militaryYears === y ? 'toggle-btn--active' : ''}`}
                onClick={() => setForm(f => ({ ...f, militaryYears: y }))}
              >
                {y === 0 ? 'ללא' : `${y}+`}
              </button>
            ))}
          </div>
          <p className="settings-hint">
            {form.militaryYears >= 2 ? `+${form.militaryYears >= 3 ? '1.5' : '1'} נקודות` : ''}
          </p>
        </div>

        {/* Switches */}
        <div className="settings-section">
          <label className="settings-label">פרטים נוספים</label>

          <div className="switch-row" onClick={() => setForm(f => ({ ...f, isMoshavMember: !f.isMoshavMember }))}>
            <div className="switch-info">
              <span className="switch-title">חבר מושב שיתופי / קיבוץ</span>
              <span className="switch-hint">+1 נקודת זיכוי</span>
            </div>
            <div className={`switch ${form.isMoshavMember ? 'switch--on' : ''}`}>
              <div className="switch__thumb" />
            </div>
          </div>

          <div className="switch-row" onClick={() => setForm(f => ({ ...f, hasAcademicDegree: !f.hasAcademicDegree }))}>
            <div className="switch-info">
              <span className="switch-title">תואר אקדמי</span>
              <span className="switch-hint">+0.5 נקודת זיכוי</span>
            </div>
            <div className={`switch ${form.hasAcademicDegree ? 'switch--on' : ''}`}>
              <div className="switch__thumb" />
            </div>
          </div>

          <div className="switch-row" onClick={() => setForm(f => ({ ...f, isPriorityArea: !f.isPriorityArea }))}>
            <div className="switch-info">
              <span className="switch-title">אזור עדיפות לאומית</span>
              <span className="switch-hint">+0.5 נקודת זיכוי</span>
            </div>
            <div className={`switch ${form.isPriorityArea ? 'switch--on' : ''}`}>
              <div className="switch__thumb" />
            </div>
          </div>

          <div className="switch-row" onClick={() => setForm(f => ({ ...f, isNewImmigrant: !f.isNewImmigrant }))}>
            <div className="switch-info">
              <span className="switch-title">עולה חדש</span>
              <span className="switch-hint">עד +3 נקודות לפי שנת עלייה</span>
            </div>
            <div className={`switch ${form.isNewImmigrant ? 'switch--on' : ''}`}>
              <div className="switch__thumb" />
            </div>
          </div>

          {form.isNewImmigrant && (
            <div className="immigration-year">
              <label className="settings-label">שנת עלייה</label>
              <input
                type="number"
                className="settings-input"
                placeholder="e.g. 2020"
                value={form.immigrationYear ?? ''}
                onChange={e => setForm(f => ({ ...f, immigrationYear: parseInt(e.target.value) }))}
                min={1948}
                max={new Date().getFullYear()}
              />
            </div>
          )}
        </div>

        {/* Default hourly rate */}
        <div className="settings-section">
          <label className="settings-label">שכר ברירת מחדל לשעה</label>
          <div className="input-with-symbol">
            <span className="symbol">₪</span>
            <input
              type="number"
              className="settings-input"
              placeholder="לדוגמא 55"
              value={form.defaultHourlyRate ?? ''}
              onChange={e => setForm(f => ({
                ...f,
                defaultHourlyRate: e.target.value ? parseFloat(e.target.value) : null
              }))}
            />
            <span className="per-label">לשעה</span>
          </div>
          <p className="settings-hint">יוכנס אוטומטית בכל משמרת חדשה</p>
        </div>

        {/* Save button */}
        <button className={`save-btn ${saved ? 'save-btn--saved' : ''}`} onClick={handleSave}>
          {saved ? '✓ נשמר!' : 'שמור הגדרות'}
        </button>

      </div>
      <BottomNavBar />
    </div>
  )
}