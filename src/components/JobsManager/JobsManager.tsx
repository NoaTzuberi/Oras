import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useShifts, type Job, type JobInput } from '../../context/ShiftContext'
import { jobDisplayName, jobToInput as toInput, newJobDefaults } from '../../utils/jobs'
import { ISRAELI_CITIES, cityName } from '../../utils/cities'
import { InlineError } from '../InlineError/InlineError'
import { jobTaxSettings } from '../../tax/calc'
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
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleSave = async () => {
    setError('')
    if (!form.name?.trim()) return setError(t('jobs.errorNameRequired'))
    const parsedRate = rate.trim() === '' ? null : parseFloat(rate)
    if (parsedRate !== null && (isNaN(parsedRate) || parsedRate < 0)) return setError(t('jobs.errorRate'))
    const parsedPct = parseFloat(pensionPct)
    if (pensionActive && (isNaN(parsedPct) || parsedPct < 0 || parsedPct > 20)) return setError(t('jobs.errorPensionPct'))

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

      <div className="switch-row" onClick={() => setForm(f => ({ ...f, paysShabbatPremium: !f.paysShabbatPremium }))}>
        <div className="switch-info">
          <span className="switch-title">{t('jobs.paysPremium')}</span>
          <span className="switch-hint">
            {form.paysShabbatPremium === null ? t('jobs.premiumUnsetHint') : t('jobs.paysPremiumHint')}
          </span>
        </div>
        <div className={`switch ${form.paysShabbatPremium ? 'switch--on' : ''}`}>
          <div className="switch__thumb" />
        </div>
      </div>

      <div className="switch-row" onClick={() => setPensionActive(v => !v)}>
        <div className="switch-info">
          <span className="switch-title">{t('jobs.pension')}</span>
          <span className="switch-hint">{t('jobs.pensionHint')}</span>
        </div>
        <div className={`switch ${pensionActive ? 'switch--on' : ''}`}>
          <div className="switch__thumb" />
        </div>
      </div>

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

      <div className="switch-row" onClick={() => setTipsInPayslip(v => !v)}>
        <div className="switch-info">
          <span className="switch-title">{t('jobs.tipsInPayslip')}</span>
          <span className="switch-hint">{t('jobs.tipsInPayslipHint')}</span>
        </div>
        <div className={`switch ${tipsInPayslip ? 'switch--on' : ''}`}>
          <div className="switch__thumb" />
        </div>
      </div>

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
