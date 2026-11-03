import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useShifts, type Shift } from '../../context/ShiftContext'
import { InlineError } from '../InlineError/InlineError'
import { JobSelect } from '../JobSelect/JobSelect'
import { ShabbatPaySection } from '../ShabbatPaySection/ShabbatPaySection'
import { useShabbatTimes } from '../../hooks/useShabbatTimes'
import { DEFAULT_GEONAMEID } from '../../utils/cities'
import { jobToInput } from '../../utils/jobs'
import { resolvePremium } from '../../utils/shabbat'
import { computeShiftPay } from '../../utils/shiftPay'
import { shiftBaseRate } from '../../utils/shiftHelpers'
import { initialPremiumOverride, isPreservedShift, preservedBasePay, recalcTriggered } from '../../utils/editShiftPay'
import './ShiftEditForm.css'

type Props = { shift: Shift; onSaved: () => void; onCancel: () => void }

const round2 = (n: number) => Math.round(n * 100) / 100
const money = (n: number | null | undefined) => (n == null ? '…' : `₪${n}`)

/**
 * Edit form. Same pay rules as the Add form, except that shifts saved before
 * the Shabbat split (or saved unverified) keep their stored pay until the
 * user changes date/times/job/premium, or confirms a recalculation.
 * See utils/editShiftPay.ts.
 */
export const ShiftEditForm = ({ shift, onSaved, onCancel }: Props) => {
  const { t, i18n } = useTranslation()
  const { updateShift, updateJob, jobs } = useShifts()

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

  const rate = hourlyRate ? parseFloat(hourlyRate) : null
  const total = totalSalary ? parseFloat(totalSalary) : null

  // New calculation (used directly for verified shifts, and as the "after" preview)
  const splitPay = computeShiftPay({ date, startTime, endTime, salaryType, rate, totalSalary: total, premiumApplied, shabbat: lookup })

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
    if (baseSalary == null || totalWithTips == null) return setError(t('shiftForm.alertEnterTimes'))

    const common = {
      date, startTime, endTime, salaryType,
      baseSalary,
      tips: parseFloat(tips) || 0,
      totalEarnings: totalWithTips,
      jobId,
      hourlyRate: salaryType === 'hourly' ? rate : null,
    }

    const fields = mode === 'preserved'
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
        }
      : {
          ...common,
          hours,
          isShabbatOrHoliday: splitPay!.isShabbatOrHoliday,
          used150: splitPay!.premiumUsed,
          regularHours: splitPay!.split?.regularHours ?? null,
          shabbatHours: splitPay!.split?.shabbatHours ?? null,
          shabbatPremiumApplied: salaryType === 'hourly' ? premiumApplied : null,
          shabbatVerified: splitPay!.verified,
        }

    setSaving(true)
    try {
      await updateShift(shift.id, fields)
      onSaved()
    } catch (e) {
      console.error('Error saving shift:', e)
      setError(t('shiftCard.errorUpdateFailed'))
      setSaving(false)
    }
  }

  const legacyNote = shift.shabbatVerified === null
    ? (shift.used150 ? t('shiftEdit.legacyNote150') : t('shiftEdit.legacyNote'))
    : t('shiftEdit.unverifiedNote')
  const recalcLabel = shift.shabbatVerified === null ? t('shiftEdit.recalculate') : t('shiftEdit.recheck')
  const afterSplit = splitPay?.split

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
          <label className="edit-form-label">{t('shiftForm.job')}</label>
          <JobSelect jobs={jobs} value={jobId} onChange={handleJobChange} className="edit-form-input" />
        </div>

        {/* Date */}
        <div className="edit-form-section">
          <label className="edit-form-label">{t('shiftForm.date')}</label>
          <input type="date" className="edit-form-input" value={date} onChange={e => setDate(e.target.value)} />
          {holidayNames.map(h => (
            <div key={h.title} className="edit-special-badge">
              ✡️ {i18n.language === 'he' ? h.hebrew : h.title} — {t('shiftForm.holidaySuffix')}
            </div>
          ))}
        </div>

        {/* Times */}
        <div className="edit-form-section">
          <label className="edit-form-label">{t('shiftForm.shiftHoursLabel')}</label>
          <div className="edit-time-row">
            <div className="edit-time-block">
              <span className="edit-time-label">{t('shiftForm.start')}</span>
              <input type="time" className="edit-form-input" value={startTime} step="60" onChange={e => setStartTime(e.target.value)} />
            </div>
            <div className="edit-time-divider">←</div>
            <div className="edit-time-block">
              <span className="edit-time-label">{t('shiftForm.end')}</span>
              <input type="time" className="edit-form-input" value={endTime} step="60" onChange={e => setEndTime(e.target.value)} />
            </div>
          </div>
          {hours > 0 && <p className="edit-hours-summary">{t('shiftForm.hoursWorked', { hours })}</p>}
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
                <label className="shabbat-override">
                  <input type="checkbox" checked={premiumApplied} onChange={e => handlePremiumChange(e.target.checked)} />
                  <span>{t('shabbat.applyPremium')}</span>
                </label>
              )}

              {!showRecalcPreview ? (
                <button type="button" className="legacy-box__action" onClick={() => setShowRecalcPreview(true)}>
                  {recalcLabel}
                </button>
              ) : lookup.status === 'error' ? (
                <ShabbatPaySection
                  lookup={lookup} onRetry={retry} pay={splitPay} salaryType={salaryType} geonameid={geonameid}
                  job={job} premiumApplied={premiumApplied} onPremiumChange={handlePremiumChange}
                  onAnswerJobPremium={answerJobPremium} answering={answeringPremium}
                />
              ) : (
                <div className="recalc-preview">
                  <p className="recalc-preview__title">{t('shiftEdit.previewTitle')}</p>
                  <div className="recalc-preview__row">
                    <span>{t('shiftEdit.before')}</span>
                    <span>{t('shiftEdit.beforeHours', { hours: shift.hours })} · {money(oldBase)}</span>
                  </div>
                  <div className="recalc-preview__row">
                    <span>{t('shiftEdit.after')}</span>
                    <span>
                      {afterSplit
                        ? t(premiumApplied && salaryType === 'hourly' ? 'shabbat.breakdownPremium' : 'shabbat.breakdownNoPremium',
                            { regular: afterSplit.regularHours, shabbat: afterSplit.shabbatHours })
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
            <ShabbatPaySection
              lookup={lookup} onRetry={retry} pay={splitPay} salaryType={salaryType} geonameid={geonameid}
              job={job} premiumApplied={premiumApplied} onPremiumChange={handlePremiumChange}
              onAnswerJobPremium={answerJobPremium} answering={answeringPremium}
            />
          )}

          {baseSalary !== null && (
            <div className="edit-calc-result">
              <span className="edit-calc-label">{t('shiftForm.baseSalary')}</span>
              <span className="edit-calc-value">₪{baseSalary}</span>
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
            <span className="edit-total-value">₪{totalWithTips}</span>
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

        {error && <InlineError>{error}</InlineError>}

        <button className="edit-save-btn" onClick={handleSave} disabled={saving}>
          {saving ? t('shiftForm.saving') : t('shiftForm.saveChanges')}
        </button>
      </div>
    </>
  )
}
