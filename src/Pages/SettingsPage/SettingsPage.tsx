import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { BottomNavBar } from '../../components/BottomNavBar/BottomNavBar'
import { TopNavBar } from '../../components/TopNavBar/TopNavBar'
import './SettingsPage.css'
import { calcCreditPoints, useShifts, type UserProfile } from '../../context/ShiftContext'
import { InlineError } from '../../components/InlineError/InlineError'

export const SettingsPage = () => {
  const { t } = useTranslation()
  const { userProfile, setUserProfile } = useShifts()

  const [form, setForm] = useState<UserProfile>(userProfile)
  const [childAgeInput, setChildAgeInput] = useState('')
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')

  const previewPoints = calcCreditPoints(form)
  const previewCredit = parseFloat((previewPoints * 242).toFixed(2))

  const handleSave = async () => {
    setSaveError('')
    setSaving(true)

    try {
      await setUserProfile(form)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (e) {
      console.error('Error saving settings:', e)
      setSaveError(t('settings.errorSaveFailed'))
    } finally {
      setSaving(false)
    }
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
        {/* Live preview */}
        {previewPoints > 0 && (
          <div className="credit-preview">
            <div className="credit-preview__row">
              <span className="credit-preview__label">{t('settings.creditPoints')}</span>
              <span className="credit-preview__value">{previewPoints}</span>
            </div>
            <div className="credit-preview__row">
              <span className="credit-preview__label">{t('settings.monthlyTaxDiscount')}</span>
              <span className="credit-preview__value">₪{previewCredit}</span>
            </div>
          </div>
        )}

        {/* Gender */}
        <div className="settings-section">
          <label className="settings-label">{t('settings.gender')}</label>
          <div className="toggle-row">
            <button
              className={`toggle-btn ${form.gender === 'male' ? 'toggle-btn--active' : ''}`}
              onClick={() => setForm(f => ({ ...f, gender: 'male' }))}
            >
              {t('settings.male')}
            </button>
            <button
              className={`toggle-btn ${form.gender === 'female' ? 'toggle-btn--active' : ''}`}
              onClick={() => setForm(f => ({ ...f, gender: 'female' }))}
            >
              {t('settings.female')}
            </button>
          </div>
          <p className="settings-hint">
            {form.gender === 'male' ? t('settings.basePointsMale') : form.gender === 'female' ? t('settings.basePointsFemale') : ''}
          </p>
        </div>

        {/* Children */}
        <div className="settings-section">
          <label className="settings-label">{t('settings.children')}</label>
          <div className="children-input-row">
            <input
              type="number"
              className="settings-input"
              placeholder={t('settings.childAgePlaceholder') ?? ''}
              value={childAgeInput}
              onChange={e => setChildAgeInput(e.target.value)}
              min={0}
              max={18}
            />
            <button className="add-child-btn" onClick={addChild}>{t('settings.addChild')}</button>
          </div>
          {form.children.length > 0 && (
            <div className="children-list">
              {form.children.map((child, i) => (
                <div key={i} className="child-tag">
                  <span>{t('settings.age', { age: child.age })}</span>
                  <button onClick={() => removeChild(i)}>✕</button>
                </div>
              ))}
            </div>
          )}
          <p className="settings-hint">{t('settings.childrenHint')}</p>
        </div>

        {/* Military / National Service */}
        <div className="settings-section">
          <label className="settings-label">{t('settings.serviceType')}</label>
          <div className="toggle-row">
            {([
              ['none', t('settings.serviceNone')],
              ['military', t('settings.serviceMilitary')],
              ['national', t('settings.serviceNational')],
            ] as const).map(([type, label]) => (
              <button
                key={type}
                className={`toggle-btn ${form.serviceType === type ? 'toggle-btn--active' : ''}`}
                onClick={() => setForm(f => ({
                  ...f,
                  serviceType: type,
                  dischargeDate: type === 'none' ? null : f.dischargeDate,
                }))}
              >
                {label}
              </button>
            ))}
          </div>

          {form.serviceType !== 'none' && (
            <div className="discharge-service-year">
              <label className="settings-label">{t('settings.dischargeDate')}</label>
              <DatePicker
                selected={form.dischargeDate ? new Date(form.dischargeDate) : null}
                onChange={(date: Date | null) => setForm(f => ({
                  ...f,
                  dischargeDate: date ? date.toISOString().split('T')[0] : null,
                }))}
                maxDate={new Date()}
                dateFormat="dd/MM/yyyy"
                placeholderText="DD/MM/YYYY"
                className="settings-input"
                wrapperClassName="settings-datepicker"
              />
              <p className="settings-hint">{t('settings.dischargeDateHint')}</p>
            </div>
          )}
        </div>

        {/* Switches */}
        <div className="settings-section">
          <label className="settings-label">{t('settings.additionalDetails')}</label>

          <div className="switch-row" onClick={() => setForm(f => ({ ...f, isMoshavMember: !f.isMoshavMember }))}>
            <div className="switch-info">
              <span className="switch-title">{t('settings.moshavMember')}</span>
              <span className="switch-hint">{t('settings.moshavHint')}</span>
            </div>
            <div className={`switch ${form.isMoshavMember ? 'switch--on' : ''}`}>
              <div className="switch__thumb" />
            </div>
          </div>

          <div className="switch-row" onClick={() => setForm(f => ({ ...f, hasAcademicDegree: !f.hasAcademicDegree }))}>
            <div className="switch-info">
              <span className="switch-title">{t('settings.academicDegree')}</span>
              <span className="switch-hint">{t('settings.academicHint')}</span>
            </div>
            <div className={`switch ${form.hasAcademicDegree ? 'switch--on' : ''}`}>
              <div className="switch__thumb" />
            </div>
          </div>

          <div className="switch-row" onClick={() => setForm(f => ({ ...f, isPriorityArea: !f.isPriorityArea }))}>
            <div className="switch-info">
              <span className="switch-title">{t('settings.priorityArea')}</span>
              <span className="switch-hint">{t('settings.priorityHint')}</span>
            </div>
            <div className={`switch ${form.isPriorityArea ? 'switch--on' : ''}`}>
              <div className="switch__thumb" />
            </div>
          </div>

          <div className="switch-row" onClick={() => setForm(f => ({ ...f, isNewImmigrant: !f.isNewImmigrant }))}>
            <div className="switch-info">
              <span className="switch-title">{t('settings.newImmigrant')}</span>
              <span className="switch-hint">{t('settings.newImmigrantHint')}</span>
            </div>
            <div className={`switch ${form.isNewImmigrant ? 'switch--on' : ''}`}>
              <div className="switch__thumb" />
            </div>
          </div>

          {form.isNewImmigrant && (
            <div className="immigration-year">
              <label className="settings-label">{t('settings.immigrationYear')}</label>
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
          <label className="settings-label">{t('settings.defaultHourlyRate')}</label>
          <div className="input-with-symbol">
            <span className="symbol">₪</span>
            <span className="per-label">{t('settings.perHourSuffix')}</span>
            <input
              type="number"
              className="settings-input"
              placeholder="e.g. 55"
              value={form.defaultHourlyRate ?? ''}
              onChange={e => setForm(f => ({
                ...f,
                defaultHourlyRate: e.target.value ? parseFloat(e.target.value) : null
              }))}
            />
          </div>
          <p className="settings-hint">{t('settings.defaultHourlyRateHint')}</p>
        </div>

        {saveError && <InlineError>{saveError}</InlineError>}

        {/* Save button */}
        <button
          className={`save-btn ${saved ? 'save-btn--saved' : ''}`}
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? t('shiftForm.saving') : saved ? t('settings.saved') : t('settings.save')}
        </button>

      </div>
      <BottomNavBar />
    </div>
  )
}