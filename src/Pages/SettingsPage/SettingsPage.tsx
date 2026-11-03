import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { BottomNavBar } from '../../components/BottomNavBar/BottomNavBar'
import { TopNavBar } from '../../components/TopNavBar/TopNavBar'
import './SettingsPage.css'
import { useShifts, type UserProfile } from '../../context/ShiftContext'
import { calcCreditPoints, periodOf } from '../../tax/calc'
import { resolveParentColumn, type Child } from '../../tax/children'
import { taxConfigFor } from '../../tax'
import { InlineError } from '../../components/InlineError/InlineError'
import { JobsManager } from '../../components/JobsManager/JobsManager'
import { WhatsNewModal } from '../../components/WhatsNewModal/WhatsNewModal'
import { Switch } from '../../components/Switch/Switch'
import { parseLocalISODate, toLocalISODate } from '../../utils/localDate'

export const SettingsPage = () => {
  const { t } = useTranslation()
  const { userProfile, setUserProfile } = useShifts()

  const [form, setForm] = useState<UserProfile>(userProfile)
  const [childYearInput, setChildYearInput] = useState('')
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [confirmError, setConfirmError] = useState('')
  const [confirming, setConfirming] = useState(false)
  // Reopened from here; doesn't touch the "seen" flag
  const [showWhatsNew, setShowWhatsNew] = useState(false)

  const today = periodOf(new Date())
  const currentYear = today.year
  const { config } = taxConfigFor(currentYear)
  const previewPoints = calcCreditPoints(form, today, config)
  const previewCredit = parseFloat((previewPoints * config.creditPointMonthly.value).toFixed(2))

  // Children whose birth year was estimated from an age typed before
  const estimatedChildren = form.children.map((c, i) => ({ c, i })).filter(({ c }) => c.estimated)
  const isValidBirthYear = (y: number) => Number.isInteger(y) && y >= currentYear - 30 && y <= currentYear

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
    const birthYear = parseInt(childYearInput)
    if (!isValidBirthYear(birthYear)) return
    setForm(f => ({ ...f, children: [...f.children, { birthYear, estimated: false }] }))
    setChildYearInput('')
  }

  const setChildYear = (index: number, value: string) => {
    const birthYear = parseInt(value)
    setForm(f => ({
      ...f,
      children: f.children.map((c, i) => (i === index ? { ...c, birthYear: isNaN(birthYear) ? c.birthYear : birthYear } : c)),
    }))
  }

  // One-time check of birth years converted from ages. Saves only the
  // children, so other unsaved edits on the page stay as drafts.
  const confirmChildren = async () => {
    setConfirmError('')
    if (!form.children.every(c => isValidBirthYear(c.birthYear))) return setConfirmError(t('settings.childYearInvalid'))
    const children: Child[] = form.children.map(c => ({ ...c, estimated: false }))
    setConfirming(true)
    try {
      await setUserProfile({ ...userProfile, children })
      setForm(f => ({ ...f, children }))
    } catch (e) {
      console.error('Error saving children:', e)
      setConfirmError(t('settings.errorSaveFailed'))
    } finally {
      setConfirming(false)
    }
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

        {/* Birth years converted from ages: ask once */}
        {estimatedChildren.length > 0 && (
          <div className="settings-notice">
            <p className="settings-notice__title">{t('settings.confirmChildrenTitle')}</p>
            <p className="settings-notice__text">{t('settings.confirmChildrenBody')}</p>
            {estimatedChildren.map(({ c, i }) => (
              <label key={i} className="settings-notice__row">
                <span>{t('settings.childN', { n: i + 1 })}</span>
                <input
                  type="number"
                  className="settings-input settings-input--year"
                  value={c.birthYear}
                  min={currentYear - 30}
                  max={currentYear}
                  onChange={e => setChildYear(i, e.target.value)}
                />
              </label>
            ))}
            {confirmError && <InlineError>{confirmError}</InlineError>}
            <button className="add-child-btn" onClick={confirmChildren} disabled={confirming}>
              {confirming ? t('shiftForm.saving') : t('settings.confirmChildrenButton')}
            </button>
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
          {form.gender === null ? (
            <p className="settings-notice settings-notice__text">{t('settings.genderRequired')}</p>
          ) : (
            <p className="settings-hint">
              {form.gender === 'male' ? t('settings.basePointsMale') : t('settings.basePointsFemale')}
            </p>
          )}
        </div>

        {/* Children */}
        <div className="settings-section">
          <label className="settings-label">{t('settings.children')}</label>
          <div className="children-input-row">
            <input
              type="number"
              className="settings-input"
              placeholder={t('settings.childBirthYearPlaceholder') ?? ''}
              value={childYearInput}
              onChange={e => setChildYearInput(e.target.value)}
              min={currentYear - 30}
              max={currentYear}
            />
            <button className="add-child-btn" onClick={addChild}>{t('settings.addChild')}</button>
          </div>
          {form.children.length > 0 && (
            <div className="children-list">
              {form.children.map((child, i) => (
                <div key={i} className="child-tag">
                  <span>
                    {t('settings.childBirthYear', { year: child.birthYear, age: Math.max(0, currentYear - child.birthYear) })}
                    {child.estimated && ` · ${t('settings.childEstimated')}`}
                  </span>
                  <button onClick={() => removeChild(i)}>✕</button>
                </div>
              ))}
            </div>
          )}
          <p className="settings-hint">{t('settings.childrenHint')}</p>

          {form.children.length > 0 && (
            <>
              <label className="settings-label">{t('settings.parentColumn')}</label>
              <div className="toggle-row">
                {([1, 2] as const).map(col => (
                  <button
                    key={col}
                    className={`toggle-btn ${resolveParentColumn(form) === col ? 'toggle-btn--active' : ''}`}
                    onClick={() => setForm(f => ({ ...f, parentColumn: col }))}
                  >
                    {col === 1 ? t('settings.parentColumn1') : t('settings.parentColumn2')}
                  </button>
                ))}
              </div>
              <p className="settings-hint">{t('settings.parentColumnHint')}</p>
            </>
          )}
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
                selected={form.dischargeDate ? parseLocalISODate(form.dischargeDate) : null}
                onChange={(date: Date | null) => setForm(f => ({
                  ...f,
                  dischargeDate: date ? toLocalISODate(date) : null,
                }))}
                maxDate={new Date()}
                dateFormat="dd/MM/yyyy"
                placeholderText="DD/MM/YYYY"
                className="settings-input"
                wrapperClassName="settings-datepicker"
                portalId="datepicker-portal"
                showYearDropdown
                showMonthDropdown
                dropdownMode="select"
                yearDropdownItemNumber={60}
                scrollableYearDropdown
              />
              <p className="settings-hint">{t('settings.dischargeDateHint')}</p>
            </div>
          )}
        </div>

        {/* Switches */}
        <div className="settings-section">
          <label className="settings-label">{t('settings.additionalDetails')}</label>

          {/* Moshav and priority area are no longer offered: they aren't
              credit points (see calcCreditPoints). Stored values are kept. */}
          <Switch
            className="ui-switch-row--list"
            checked={form.hasAcademicDegree}
            onChange={v => setForm(f => ({ ...f, hasAcademicDegree: v }))}
            label={t('settings.academicDegree')}
            hint={t('settings.academicHint')}
          />

          <Switch
            className="ui-switch-row--list"
            checked={form.isNewImmigrant}
            onChange={v => setForm(f => ({ ...f, isNewImmigrant: v }))}
            label={t('settings.newImmigrant')}
            hint={t('settings.newImmigrantHint')}
          />

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

        {/* Jobs: saved immediately, separate from the profile Save button */}
        <JobsManager />

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

        <button type="button" className="whats-new-link" onClick={() => setShowWhatsNew(true)}>
          ✨ {t('whatsNew.reopen')}
        </button>
        {showWhatsNew && <WhatsNewModal onClose={() => setShowWhatsNew(false)} />}

      </div>
      <BottomNavBar />
    </div>
  )
}