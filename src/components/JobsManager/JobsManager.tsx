import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useShifts, type Job, type JobInput } from '../../context/ShiftContext'
import { jobDisplayName, jobToInput as toInput, newJobDefaults } from '../../utils/jobs'
import { ISRAELI_CITIES, cityName } from '../../utils/cities'
import { InlineError } from '../InlineError/InlineError'
import { Switch } from '../Switch/Switch'
import { jobTaxSettings } from '../../tax/calc'
import { resolveOvertimeSettings, type WeekPattern } from '../../utils/overtime'
import './JobsManager.css'


type EditorProps = {
  initial: JobInput
  onSave: (job: JobInput) => Promise<void>
  onCancel: () => void
}

const JobEditor = ({ initial, onSave, onCancel }: EditorProps) => {
  const { t, i18n } = useTranslation()
  // The default job's name is NULL: prefill the translated name so saving
  // stores it in the user's language.
  const [form, setForm] = useState<JobInput>(() => ({ ...initial, name: initial.name ?? t('jobs.defaultName') }))
  const [rate, setRate] = useState(initial.hourlyRate != null ? String(initial.hourlyRate) : '')
  // NULL settings show (and save) as their defaults once the job is edited
  const defaults = jobTaxSettings(initial)
  const [pensionActive, setPensionActive] = useState(defaults.pensionActive)
  const [pensionPct, setPensionPct] = useState(String(defaults.pensionPct))
  const [tipsInPayslip, setTipsInPayslip] = useState(defaults.tipsInPayslip)
  const otDefaults = resolveOvertimeSettings(initial)
  const [overtimeEnabled, setOvertimeEnabled] = useState(otDefaults.enabled)
  const [weekPattern, setWeekPattern] = useState<WeekPattern>(otDefaults.weekPattern)
  const [customThreshold, setCustomThreshold] = useState(initial.customDailyThresholdHours != null ? String(initial.customDailyThresholdHours) : '')
  // NULL = "not sure" (the default): no short day, 8:36 every day
  const [shortDay, setShortDay] = useState<number | null>(initial.shortDayWeekday)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const weekdayNames = t('jobs.weekdayNames', { returnObjects: true }) as string[]

  const handleSave = async () => {
    setError('')
    if (!form.name?.trim()) return setError(t('jobs.errorNameRequired'))
    const parsedRate = rate.trim() === '' ? null : parseFloat(rate)
    if (parsedRate !== null && (isNaN(parsedRate) || parsedRate < 0)) return setError(t('jobs.errorRate'))
    const parsedPct = parseFloat(pensionPct)
    if (pensionActive && (isNaN(parsedPct) || parsedPct < 0 || parsedPct > 20)) return setError(t('jobs.errorPensionPct'))
    const parsedThreshold = customThreshold.trim() === '' ? null : parseFloat(customThreshold)
    const customUsed = overtimeEnabled && weekPattern === 'custom'
    if (customUsed && (parsedThreshold === null || isNaN(parsedThreshold) || parsedThreshold < 1 || parsedThreshold > 24)) {
      return setError(t('jobs.errorThreshold'))
    }

    setSaving(true)
    try {
      await onSave({
        ...form,
        name: form.name!.trim(),
        hourlyRate: parsedRate,
        pensionActive,
        // Keep the stored % when pension is turned off, so turning it back on restores it
        pensionEmployeePct: isNaN(parsedPct) ? initial.pensionEmployeePct : parsedPct,
        tipsInPayslip,
        overtimeEnabled,
        weekPattern,
        // Kept when another pattern is chosen, so switching back restores it
        customDailyThresholdHours: customUsed ? parsedThreshold : initial.customDailyThresholdHours,
        shortDayWeekday: shortDay,
      })
    } catch {
      setError(t('jobs.errorSaveFailed'))
      setSaving(false)
    }
  }

  return (
    <div className="job-editor">
      <input
        className="settings-input"
        placeholder={t('jobs.namePlaceholder') ?? ''}
        value={form.name ?? ''}
        maxLength={80}
        onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
      />

      <div className="input-with-symbol">
        <span className="symbol">₪</span>
        <input
          type="number"
          className="settings-input"
          placeholder={t('jobs.ratePlaceholder') ?? ''}
          value={rate}
          min={0}
          onChange={e => setRate(e.target.value)}
        />
        <span className="per-label">{t('settings.perHourSuffix')}</span>
      </div>

      <label className="job-editor__field">
        <span className="switch-hint">{t('jobs.city')}</span>
        <select
          className="settings-input"
          value={form.geonameid}
          onChange={e => setForm(f => ({ ...f, geonameid: Number(e.target.value) }))}
        >
          {/* Keep an unknown stored id selectable instead of silently changing it */}
          {!ISRAELI_CITIES.some(c => c.geonameid === form.geonameid) && (
            <option value={form.geonameid}>{form.geonameid}</option>
          )}
          {ISRAELI_CITIES.map(c => (
            <option key={c.geonameid} value={c.geonameid}>{cityName(c.geonameid, i18n.language)}</option>
          ))}
        </select>
      </label>

      {/* NULL = the user hasn't answered yet: shown as "not set", not as off */}
      <Switch
        className="ui-switch-row--list"
        checked={form.paysShabbatPremium}
        onChange={v => setForm(f => ({ ...f, paysShabbatPremium: v }))}
        label={t('jobs.paysPremium')}
        hint={form.paysShabbatPremium === null ? t('jobs.premiumUnsetHint') : t('jobs.paysPremiumHint')}
        unsetLabel={t('jobs.notSet')}
      />

      <Switch
        className="ui-switch-row--list"
        checked={pensionActive}
        onChange={setPensionActive}
        label={t('jobs.pension')}
        hint={t('jobs.pensionHint')}
      />

      {pensionActive && (
        <label className="job-editor__field">
          <span className="switch-hint">{t('jobs.pensionPct')}</span>
          <div className="input-with-symbol">
            <input
              type="number"
              className="settings-input"
              value={pensionPct}
              min={0}
              max={20}
              step={0.5}
              onChange={e => setPensionPct(e.target.value)}
            />
            <span className="per-label">%</span>
          </div>
        </label>
      )}

      <Switch
        className="ui-switch-row--list"
        checked={tipsInPayslip}
        onChange={setTipsInPayslip}
        label={t('jobs.tipsInPayslip')}
        hint={t('jobs.tipsInPayslipHint')}
      />

      <Switch
        className="ui-switch-row--list"
        checked={overtimeEnabled}
        onChange={setOvertimeEnabled}
        label={t('jobs.overtimeEnabled')}
        hint={t('jobs.overtimeHint')}
      />

      {overtimeEnabled && (
        <>
          <div className="job-editor__field">
            <span className="switch-hint">{t('jobs.weekPattern')}</span>
            <div className="toggle-row" role="radiogroup" aria-label={t('jobs.weekPattern')}>
              {(['5day', '6day', 'custom'] as const).map(p => (
                <button
                  key={p}
                  type="button"
                  role="radio"
                  aria-checked={weekPattern === p}
                  className={`toggle-btn ${weekPattern === p ? 'toggle-btn--active' : ''}`}
                  onClick={() => setWeekPattern(p)}
                >
                  {t(p === '5day' ? 'jobs.week5' : p === '6day' ? 'jobs.week6' : 'jobs.weekCustom')}
                </button>
              ))}
            </div>
            <span className="switch-hint">
              {t(weekPattern === '5day' ? 'jobs.week5Hint' : weekPattern === '6day' ? 'jobs.week6Hint' : 'jobs.weekCustomHint')}
            </span>
            <span className="switch-hint">{t('jobs.overtimeRates')}</span>
          </div>

          {weekPattern === '5day' && (
            <label className="job-editor__field">
              {/* The law leaves the day to the employer, so we don't guess: "not sure" is the default */}
              <span className="switch-title">{t('jobs.shortDay')}</span>
              <span className="switch-hint">{t('jobs.shortDayAssumption')}</span>
              <select
                className="settings-input"
                value={shortDay ?? ''}
                onChange={e => setShortDay(e.target.value === '' ? null : Number(e.target.value))}
              >
                <option value="">{t('jobs.shortDayUnknown')}</option>
                {weekdayNames.map((name, i) => <option key={i} value={i}>{name}</option>)}
              </select>
              {shortDay === null && <span className="switch-hint">{t('jobs.shortDayUnknownHint')}</span>}
              <span className="switch-hint job-editor__help">{t('jobs.shortDayHowToFind')}</span>
            </label>
          )}

          {weekPattern === 'custom' && (
            <label className="job-editor__field">
              <span className="switch-title">{t('jobs.customThreshold')}</span>
              <input
                type="number"
                className="settings-input"
                value={customThreshold}
                min={1}
                max={24}
                step={0.1}
                placeholder="8.5"
                onChange={e => setCustomThreshold(e.target.value)}
              />
              <span className="switch-hint">{t('jobs.customThresholdHint')}</span>
            </label>
          )}

          <span className="switch-hint">🌙 {t('jobs.nightNote')}</span>
        </>
      )}

      {error && <InlineError>{error}</InlineError>}

      <div className="job-editor__actions">
        <button className="job-btn job-btn--ghost" onClick={onCancel} disabled={saving}>{t('jobs.cancel')}</button>
        <button className="add-child-btn" onClick={handleSave} disabled={saving}>
          {saving ? t('shiftForm.saving') : t('jobs.save')}
        </button>
      </div>
    </div>
  )
}

export const JobsManager = () => {
  const { t, i18n } = useTranslation()
  const { jobs, addJob, updateJob } = useShifts()
  // null = nothing open, 'new' = add form, otherwise the job id being edited
  const [editing, setEditing] = useState<string | null>(null)
  const [showArchived, setShowArchived] = useState(false)
  const [rowError, setRowError] = useState('')

  const active = jobs.filter(j => !j.archived)
  const archived = jobs.filter(j => j.archived)

  const setArchived = async (job: Job, value: boolean) => {
    setRowError('')
    try {
      await updateJob(job.id, { ...toInput(job), archived: value })
    } catch {
      setRowError(t('jobs.errorSaveFailed'))
    }
  }

  const renderRow = (job: Job) =>
    editing === job.id ? (
      <JobEditor
        key={job.id}
        initial={toInput(job)}
        onSave={async input => { await updateJob(job.id, input); setEditing(null) }}
        onCancel={() => setEditing(null)}
      />
    ) : (
      <div key={job.id} className={`job-row ${job.archived ? 'job-row--archived' : ''}`}>
        <div className="job-row__info">
          <span className="switch-title">{jobDisplayName(job, t)}</span>
          <span className="switch-hint">
            {job.hourlyRate != null ? `₪${job.hourlyRate}${t('settings.perHourSuffix')} · ` : ''}
            {cityName(job.geonameid, i18n.language)}
            {' · '}
            {job.paysShabbatPremium === null ? t('jobs.premiumUnset') : job.paysShabbatPremium ? t('jobs.premiumOn') : t('jobs.premiumOff')}
            {' · '}
            {(() => {
              const tax = jobTaxSettings(job)
              return tax.pensionActive ? t('jobs.pensionOn', { pct: tax.pensionPct }) : t('jobs.pensionOff')
            })()}
            {job.overtimeEnabled === false ? ` · ${t('jobs.overtimeOff')}` : ''}
          </span>
        </div>
        <div className="job-row__actions">
          {job.archived ? (
            <button className="job-btn" onClick={() => setArchived(job, false)}>{t('jobs.restore')}</button>
          ) : (
            <>
              <button className="job-btn" onClick={() => setEditing(job.id)}>{t('jobs.edit')}</button>
              <button className="job-btn job-btn--ghost" onClick={() => setArchived(job, true)}>{t('jobs.archive')}</button>
            </>
          )}
        </div>
      </div>
    )

  return (
    <div className="settings-section">
      <label className="settings-label">{t('jobs.title')}</label>

      {active.length === 0 && editing !== 'new' && (
        <p className="settings-hint">{t('jobs.empty')}</p>
      )}

      {active.map(renderRow)}

      {editing === 'new' ? (
        <JobEditor
          initial={newJobDefaults}
          onSave={async input => { await addJob(input); setEditing(null) }}
          onCancel={() => setEditing(null)}
        />
      ) : (
        <button className="add-child-btn job-add-btn" onClick={() => setEditing('new')}>{t('jobs.add')}</button>
      )}

      {rowError && <InlineError>{rowError}</InlineError>}

      {archived.length > 0 && (
        <>
          <button className="job-btn job-btn--ghost job-archived-toggle" onClick={() => setShowArchived(v => !v)}>
            {showArchived ? t('jobs.hideArchived') : t('jobs.showArchived', { count: archived.length })}
          </button>
          {showArchived && archived.map(renderRow)}
        </>
      )}

      <p className="settings-hint">{t('jobs.hint')}</p>
    </div>
  )
}
