import { useId, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useShifts, type Shift } from '../../context/ShiftContext'
import { InlineError } from '../InlineError/InlineError'
import { JobChips } from '../JobChips/JobChips'
import { DateField } from '../DateField/DateField'
import { Switch } from '../Switch/Switch'
import { PayBreakdownSection } from '../PayBreakdownSection/PayBreakdownSection'
import { DayUpdatesNotice } from '../DayUpdatesNotice/DayUpdatesNotice'
import { useShabbatTimes } from '../../hooks/useShabbatTimes'
import { DEFAULT_GEONAMEID } from '../../utils/cities'
import { jobToInput } from '../../utils/jobs'
import { resolvePremium } from '../../utils/shabbat'
import { computeShiftPay, hasPayBreakdown } from '../../utils/shiftPay'
import { resolveOvertimeSettings } from '../../utils/overtime'
import { affectsDay, applyDayUpdates, planDayUpdates, storedPayFields, workDayOthers } from '../../utils/workDay'
import { bucketsText } from '../../utils/payLabels'
import { formatHM, formatMoney } from '../../utils/format'
import { shiftBaseRate } from '../../utils/shiftHelpers'
import { initialPremiumOverride, isPreservedShift, preservedBasePay, recalcTriggered } from '../../utils/editShiftPay'
import './ShiftEditForm.css'

type Props = { shift: Shift; onSaved: () => void; onCancel: () => void }

const round2 = (n: number) => Math.round(n * 100) / 100
const money = (n: number | null | undefined) => (n == null ? '…' : formatMoney(n))

/**
 * Edit form. Same pay rules as the Add form, except that shifts saved before
 * the Shabbat split (or saved unverified) keep their stored pay until the
 * user changes date/times/job/premium, or confirms a recalculation.
 * See utils/editShiftPay.ts.
 */
export const ShiftEditForm = ({ shift, onSaved, onCancel }: Props) => {
  const { t, i18n } = useTranslation()
  const timeId = useId()
  const { updateShift, updateJob, jobs, shifts } = useShifts()

  const initialRate = (() => {
    const rate = shiftBaseRate(shift)
    return rate != null ? String(rate) : ''
  })()

  const [date, setDate] = useState(shift.date)
  const [startTime, setStartTime] = useState(shift.startTime)
  const [endTime, setEndTime] = useState(shift.endTime)
  const [salaryType, setSalaryType] = useState<'hourly' | 'total'>(shift.salaryType)
  const [jobId, setJobId] = useState<string | null>(shift.jobId)
  // Base rate, before the x1.5 (rebuilding it from base_salary / hours
  // used to re-apply the premium on every edit of a 150% shift).
  const [hourlyRate, setHourlyRate] = useState(initialRate)
  const [totalSalary, setTotalSalary] = useState(shift.salaryType === 'total' ? String(shift.baseSalary) : '')
  const [tips, setTips] = useState(shift.tips > 0 ? String(shift.tips) : '')
  const [premiumOverride, setPremiumOverride] = useState<boolean | null>(() => initialPremiumOverride(shift))
  const [premiumTouched, setPremiumTouched] = useState(false)
  const [recalcAccepted, setRecalcAccepted] = useState(false)
  const [showRecalcPreview, setShowRecalcPreview] = useState(false)
  const [saving, setSaving] = useState(false)
  const [answeringPremium, setAnsweringPremium] = useState(false)
  const [error, setError] = useState('')

  const job = jobs.find(j => j.id === jobId) ?? null
  const geonameid = job?.geonameid ?? DEFAULT_GEONAMEID
  const { lookup, holidayNames, retry } = useShabbatTimes(date, geonameid)
  const premiumApplied = resolvePremium(premiumOverride, job?.paysShabbatPremium)
  // The day the shift is moved away from (date or job changed): its other shifts' overtime changes too
  const savedJob = jobs.find(j => j.id === shift.jobId) ?? null
  const { lookup: savedDayLookup } = useShabbatTimes(shift.date, savedJob?.geonameid ?? DEFAULT_GEONAMEID)

  const rate = hourlyRate ? parseFloat(hourlyRate) : null
  const total = totalSalary ? parseFloat(totalSalary) : null

  // New calculation (used directly for verified shifts, and as the "after" preview)
  const splitPay = computeShiftPay({
    date, startTime, endTime, salaryType, rate, totalSalary: total, premiumApplied, shabbat: lookup,
    overtime: {
      settings: resolveOvertimeSettings(job),
      otherShifts: workDayOthers(shifts, { id: shift.id, jobId, date }),
      key: shift.id,
    },
  })

  // Old calculation for legacy/unverified shifts
  const preserved = isPreservedShift(shift)
  const triggered = recalcTriggered(shift, { date, startTime, endTime, jobId, premiumTouched })
  const oldBase = preserved
    ? preservedBasePay(shift, { salaryType, rate, rateChanged: hourlyRate !== initialRate, totalSalary: total })
    : null
  const mode: 'preserved' | 'split' = preserved && !triggered && !recalcAccepted ? 'preserved' : 'split'
  // Changes switched an old shift to the new calculation: say so before saving
  const showSwitchNotice = preserved && triggered && !recalcAccepted

  const baseSalary = mode === 'preserved' ? oldBase : splitPay?.baseSalary ?? null
  const hours = mode === 'preserved' ? shift.hours : splitPay?.hours ?? 0
  const totalWithTips = baseSalary != null ? round2(baseSalary + (parseFloat(tips) || 0)) : null

  const common = baseSalary != null && totalWithTips != null ? {
    date, startTime, endTime, salaryType,
    baseSalary,
    tips: parseFloat(tips) || 0,
    totalEarnings: totalWithTips,
    jobId,
    hourlyRate: salaryType === 'hourly' ? rate : null,
  } : null

  const fields: Omit<Shift, 'id'> | null = !common ? null : mode === 'preserved'
    ? {
        // Old calculation kept as stored
        ...common,
        hours: shift.hours,
        isShabbatOrHoliday: shift.isShabbatOrHoliday,
        used150: salaryType === 'hourly' && shift.salaryType === 'hourly' && shift.used150,
        regularHours: shift.regularHours,
        shabbatHours: shift.shabbatHours,
        shabbatPremiumApplied: shift.shabbatPremiumApplied,
        shabbatVerified: shift.shabbatVerified,
        overtimeCalculated: shift.overtimeCalculated,
        dailyThresholdMinutes: shift.dailyThresholdMinutes,
        isNightShift: shift.isNightShift,
        overtimeMinutes125: shift.overtimeMinutes125,
        overtimeMinutes150: shift.overtimeMinutes150,
        shabbatOtMinutes175: shift.shabbatOtMinutes175,
        shabbatOtMinutes200: shift.shabbatOtMinutes200,
      }
    : splitPay ? { ...common, ...storedPayFields(splitPay, salaryType, premiumApplied) } : null

  // Other shifts on the shift's day (before and after the edit) whose overtime moves.
  // Preserved mode never changes date/times/job, so only the new calculation can.
  const dayUpdates = fields && mode === 'split' && affectsDay(shift, fields)
    ? planDayUpdates({
        after: shifts.map(s => (s.id === shift.id ? { ...fields, id: shift.id } : s)),
        days: [{ jobId: shift.jobId, date: shift.date }, { jobId, date }],
        changedId: shift.id,
        jobs,
        lookupFor: d => (d.jobId === jobId && d.date === date ? lookup : savedDayLookup),
      })
    : []

  const handleJobChange = (id: string | null) => {
    setJobId(id)
    setPremiumOverride(null) // follow the new job's setting
    const jobRate = jobs.find(j => j.id === id)?.hourlyRate
    if (jobRate != null) setHourlyRate(String(jobRate))
  }

  const handlePremiumChange = (applied: boolean) => {
    setPremiumOverride(applied)
    setPremiumTouched(true)
  }

  /** Cancel the switch: put back the fields that triggered it. */
  const revertToSaved = () => {
    // A job change also replaced the rate; a rate edit on its own is kept.
    if (jobId !== shift.jobId) setHourlyRate(initialRate)
    setDate(shift.date)
    setStartTime(shift.startTime)
    setEndTime(shift.endTime)
    setJobId(shift.jobId)
    setPremiumOverride(initialPremiumOverride(shift))
    setPremiumTouched(false)
  }

  const answerJobPremium = async (pays: boolean) => {
    if (!job) return
    setAnsweringPremium(true)
    try {
      await updateJob(job.id, { ...jobToInput(job), paysShabbatPremium: pays })
    } catch {
      setError(t('jobs.errorSaveFailed'))
    } finally {
      setAnsweringPremium(false)
    }
  }

  const handleSave = async () => {
    setError('')
    if (!startTime || !endTime) return setError(t('shiftForm.alertEnterTimes'))
    if (startTime === endTime) return setError(t('shiftForm.alertSameTimes'))
    if (salaryType === 'hourly' && !hourlyRate) return setError(t('shiftForm.alertEnterHourlyRate'))
    if (salaryType === 'total' && !totalSalary) return setError(t('shiftForm.alertEnterTotalSalary'))
    if (mode === 'split' && lookup.status === 'loading') return setError(t('shabbat.waitForTimes'))
    if (!fields) return setError(t('shiftForm.alertEnterTimes'))

    setSaving(true)
    try {
      await updateShift(shift.id, fields)
      // This shift is saved; a failure here only leaves another shift's overtime stale
      if (!(await applyDayUpdates(updateShift, dayUpdates))) alert(t('pay.dayUpdateFailed'))
      onSaved()
    } catch (e) {
      console.error('Error saving shift:', e)
      setError(t('shiftCard.errorUpdateFailed'))
      setSaving(false)
    }
  }

  const legacyNote = shift.shabbatVerified === null
    ? (shift.used150 ? t('shiftEdit.legacyNote150') : t('shiftEdit.legacyNote'))
    : shift.shabbatVerified === false ? t('shiftEdit.unverifiedNote') : t('shiftEdit.preOvertimeNote')
  const recalcLabel = shift.shabbatVerified === false ? t('shiftEdit.recheck') : t('shiftEdit.recalculate')
  const afterReady = lookup.status === 'ok' && splitPay != null

  return (
    <>
      <div className="shift-modal__header">
        <button className="shift-modal__close" onClick={onCancel}>←</button>
        <div className="shift-modal__header-left">
          <span className="shift-modal__header-date">{t('shiftCard.editTitle')}</span>
        </div>
      </div>

      <div className="shift-modal__body shift-modal__edit-body">
        {/* Job */}
        <div className="edit-form-section">
          <span className="edit-form-label">{t('shiftForm.job')}</span>
          <JobChips jobs={jobs} value={jobId} onChange={handleJobChange} />
        </div>

        {/* Date */}
        <div className="edit-form-section">
          <label className="edit-form-label" htmlFor={`${timeId}-date`}>{t('shiftForm.date')}</label>
          <DateField id={`${timeId}-date`} className="edit-form-input" value={date} onChange={setDate} />
          {holidayNames.map(h => (
            <div key={h.title} className="edit-special-badge">
              ✡️ {i18n.language === 'he' ? h.hebrew : h.title} — {t('shiftForm.holidaySuffix')}
            </div>
          ))}
        </div>

        {/* Times */}
        <div className="edit-form-section">
          <label className="edit-form-label">{t('shiftForm.shiftHoursLabel')}</label>
          <div className="edit-time-grid">
            <label className="edit-time-label" htmlFor={`${timeId}-start`}>{t('shiftForm.start')}</label>
            <span />
            <label className="edit-time-label" htmlFor={`${timeId}-end`}>{t('shiftForm.end')}</label>
            <input id={`${timeId}-start`} type="time" className="edit-form-input" value={startTime} step="60" onChange={e => setStartTime(e.target.value)} />
            <span className="edit-time-divider" aria-hidden="true">→</span>
            <input id={`${timeId}-end`} type="time" className="edit-form-input" value={endTime} step="60" onChange={e => setEndTime(e.target.value)} />
          </div>
          {hours > 0 && <p className="edit-hours-summary">{t('shiftForm.hoursWorked', { hours: formatHM(hours) })}</p>}
          {startTime && startTime === endTime && <p className="edit-hint">{t('shiftForm.alertSameTimes')}</p>}
        </div>

        {/* Salary */}
        <div className="edit-form-section">
          <label className="edit-form-label">{t('shiftForm.salary')}</label>
          <div className="edit-toggle-row">
            <button className={`edit-toggle-btn ${salaryType === 'hourly' ? 'edit-toggle-btn--active' : ''}`} onClick={() => setSalaryType('hourly')}>
              {t('shiftForm.hourly')}
            </button>
            <button className={`edit-toggle-btn ${salaryType === 'total' ? 'edit-toggle-btn--active' : ''}`} onClick={() => setSalaryType('total')}>
              {t('shiftForm.dailyTotal')}
            </button>
          </div>

          {salaryType === 'hourly' && (
            <div className="edit-input-with-symbol">
              <span className="edit-symbol">₪</span>
              <input type="number" className="edit-form-input" placeholder="e.g. 55" value={hourlyRate} onChange={e => setHourlyRate(e.target.value)} />
              <span className="edit-per-label">{t('shiftForm.perHour')}</span>
            </div>
          )}

          {salaryType === 'total' && (
            <div className="edit-input-with-symbol">
              <span className="edit-symbol">₪</span>
              <input type="number" className="edit-form-input" placeholder="e.g. 450" value={totalSalary} onChange={e => setTotalSalary(e.target.value)} />
            </div>
          )}

          {mode === 'preserved' ? (
            // Old calculation: explain it, offer an explicit recalculation
            <div className="legacy-box">
              <p className="legacy-box__note">{legacyNote}</p>

              {salaryType === 'hourly' && shift.isShabbatOrHoliday && (
                <Switch checked={premiumApplied} onChange={handlePremiumChange} label={t('shabbat.applyPremium')} />
              )}

              {!showRecalcPreview ? (
                <button type="button" className="legacy-box__action" onClick={() => setShowRecalcPreview(true)}>
                  {recalcLabel}
                </button>
              ) : lookup.status === 'error' ? (
                <PayBreakdownSection
                  lookup={lookup} onRetry={retry} pay={splitPay} shift={{ date, startTime, endTime }} salaryType={salaryType} geonameid={geonameid}
                  job={job} premiumApplied={premiumApplied} onPremiumChange={handlePremiumChange}
                  onAnswerJobPremium={answerJobPremium} answering={answeringPremium}
                />
              ) : (
                <div className="recalc-preview">
                  <p className="recalc-preview__title">{t('shiftEdit.previewTitle')}</p>
                  <div className="recalc-preview__row">
                    <span>{t('shiftEdit.before')}</span>
                    <span>{t('shiftEdit.beforeHours', { hours: formatHM(shift.hours) })} · {money(oldBase)}</span>
                  </div>
                  <div className="recalc-preview__row">
                    <span>{t('shiftEdit.after')}</span>
                    <span>
                      {afterReady
                        ? bucketsText(t, splitPay.overtime.minutes, premiumApplied && salaryType === 'hourly')
                        : t('shabbat.loading')}
                      {' · '}{money(splitPay?.baseSalary)}
                    </span>
                  </div>
                  <div className="recalc-preview__actions">
                    <button
                      type="button"
                      className="shabbat-btn shabbat-btn--primary"
                      disabled={lookup.status !== 'ok' || splitPay?.baseSalary == null}
                      onClick={() => { setRecalcAccepted(true); setShowRecalcPreview(false) }}
                    >
                      {t('shiftEdit.confirmRecalc')}
                    </button>
                    <button type="button" className="shabbat-btn" onClick={() => setShowRecalcPreview(false)}>
                      {t('jobs.cancel')}
                    </button>
                  </div>
                  <p className="shabbat-hint">{t('shiftEdit.previewHint')}</p>
                </div>
              )}
            </div>
          ) : (
            <PayBreakdownSection
              lookup={lookup} onRetry={retry} pay={splitPay} shift={{ date, startTime, endTime }} salaryType={salaryType} geonameid={geonameid}
              job={job} premiumApplied={premiumApplied} onPremiumChange={handlePremiumChange}
              onAnswerJobPremium={answerJobPremium} answering={answeringPremium}
            />
          )}

          {/* With Shabbat or overtime hours (new calculation) the total is at the bottom of the pay card */}
          {baseSalary !== null && !(mode === 'split' && hasPayBreakdown(splitPay)) && (
            <div className="edit-calc-result">
              <span className="edit-calc-label">{t('shabbat.baseSalaryHours', { hours: formatHM(hours) })}</span>
              <span className="edit-calc-value">{formatMoney(baseSalary)}</span>
            </div>
          )}
        </div>

        {/* Tips */}
        <div className="edit-form-section">
          <label className="edit-form-label">{t('shiftForm.tip')} <span className="edit-optional">{t('shiftForm.optional')}</span></label>
          <div className="edit-input-with-symbol">
            <span className="edit-symbol">₪</span>
            <input type="number" className="edit-form-input" placeholder={t('shiftForm.tipsPlaceholder') ?? ''} value={tips} onChange={e => setTips(e.target.value)} />
          </div>
        </div>

        {totalWithTips !== null && (
          <div className="edit-total-summary">
            <span className="edit-total-label">{t('shiftForm.totalIncome')}</span>
            <span className="edit-total-value">{formatMoney(totalWithTips)}</span>
          </div>
        )}

        {/* Shown before saving whenever an edit moved an old shift to the new calculation */}
        {showSwitchNotice && (
          <div className="recalc-notice" role="status">
            <p className="recalc-notice__text">
              {t('shiftEdit.switchNotice', { from: money(oldBase), to: money(splitPay?.baseSalary) })}
            </p>
            <button type="button" className="shabbat-btn" onClick={revertToSaved}>{t('shiftEdit.keepOld')}</button>
          </div>
        )}

        <DayUpdatesNotice updates={dayUpdates} />

      </div>

      {/* Always visible: the body above scrolls */}
      <div className="shift-modal__footer">
        {error && <InlineError>{error}</InlineError>}
        <div className="shift-modal__footer-actions">
          <button type="button" className="edit-cancel-btn" onClick={onCancel} disabled={saving}>
            {t('jobs.cancel')}
          </button>
          <button type="button" className="edit-save-btn" onClick={handleSave} disabled={saving}>
            {saving ? t('shiftForm.saving') : t('shiftForm.saveChanges')}
          </button>
        </div>
      </div>
    </>
  )
}
