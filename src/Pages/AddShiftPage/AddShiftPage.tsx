import { useId, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { BottomNavBar } from '../../components/BottomNavBar/BottomNavBar'
import './AddShiftPage.css'
import { useShifts } from '../../context/ShiftContext'
import { InlineError } from '../../components/InlineError/InlineError'
import { JobChips } from '../../components/JobChips/JobChips'
import { DateField } from '../../components/DateField/DateField'
import { ShabbatPaySection } from '../../components/ShabbatPaySection/ShabbatPaySection'
import { jerusalemISODate } from '../../utils/dates'
import { DEFAULT_GEONAMEID } from '../../utils/cities'
import { jobToInput } from '../../utils/jobs'
import { resolvePremium } from '../../utils/shabbat'
import { computeShiftPay, hasShabbatHours } from '../../utils/shiftPay'
import { formatHM, formatMoney } from '../../utils/format'
import { useShabbatTimes } from '../../hooks/useShabbatTimes'

export const AddShiftPage = () => {
  const navigate = useNavigate()
  const { t, i18n } = useTranslation()
  const timeId = useId()
  const { addShift, updateJob, userProfile, jobs, lastUsedJobId } = useShifts()

  const [date, setDate] = useState(() => jerusalemISODate())
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [salaryType, setSalaryType] = useState<'hourly' | 'total'>('hourly')
  // undefined = user hasn't picked yet, so follow the last used job
  // (jobs load asynchronously, so this can't be a one-time initial value).
  const [jobChoice, setJobChoice] = useState<string | null | undefined>(undefined)
  const jobId = jobChoice === undefined ? lastUsedJobId : jobChoice
  const selectedJob = jobs.find(j => j.id === jobId) ?? null

  // undefined = not edited, so prefill from the job (or the profile default)
  const [rateInput, setRateInput] = useState<string | undefined>(undefined)
  const prefillRate = selectedJob?.hourlyRate ?? userProfile?.defaultHourlyRate ?? null
  const hourlyRate = rateInput ?? (prefillRate != null ? String(prefillRate) : '')
  const setHourlyRate = (value: string) => setRateInput(value)

  // null = follow the job's setting; true/false = this shift's override
  const [premiumOverride, setPremiumOverride] = useState<boolean | null>(null)

  const handleJobChange = (id: string | null) => {
    setJobChoice(id)
    setRateInput(undefined)
    setPremiumOverride(null)
  }

  const [totalSalary, setTotalSalary] = useState('')
  const [tips, setTips] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [answeringPremium, setAnsweringPremium] = useState(false)
  const [submitError, setSubmitError] = useState('')

  // Shabbat times for the job's city (Tel Aviv when no job)
  const geonameid = selectedJob?.geonameid ?? DEFAULT_GEONAMEID
  const { lookup, holidayNames, retry } = useShabbatTimes(date, geonameid)
  const premiumApplied = resolvePremium(premiumOverride, selectedJob?.paysShabbatPremium)

  const pay = computeShiftPay({
    date, startTime, endTime, salaryType,
    rate: hourlyRate ? parseFloat(hourlyRate) : null,
    totalSalary: totalSalary ? parseFloat(totalSalary) : null,
    premiumApplied,
    shabbat: lookup,
  })
  const hours = pay?.hours ?? 0
  const calculatedSalary = pay?.baseSalary ?? null

  const answerJobPremium = async (pays: boolean) => {
    if (!selectedJob) return
    setAnsweringPremium(true)
    try {
      await updateJob(selectedJob.id, { ...jobToInput(selectedJob), paysShabbatPremium: pays })
    } catch {
      setSubmitError(t('jobs.errorSaveFailed'))
    } finally {
      setAnsweringPremium(false)
    }
  }

  const totalWithTips = calculatedSalary !== null
    ? parseFloat((calculatedSalary + (parseFloat(tips) || 0)).toFixed(2))
    : null

  const handleSubmit = async () => {
  setSubmitError('')

  if (!startTime || !endTime) return setSubmitError(t('shiftForm.alertEnterTimes'))
  if (startTime === endTime) return setSubmitError(t('shiftForm.alertSameTimes'))
  if (!pay) return setSubmitError(t('shiftForm.alertEnterTimes'))
  // Saving with unknown Shabbat times is allowed only after the request failed
  // (then it's marked unverified), not while it's still loading.
  if (lookup.status === 'loading') return setSubmitError(t('shabbat.waitForTimes'))
  if (salaryType === 'hourly' && !hourlyRate) return setSubmitError(t('shiftForm.alertEnterHourlyRate'))
  if (salaryType === 'total' && !totalSalary) return setSubmitError(t('shiftForm.alertEnterTotalSalary'))

  setSubmitting(true)

  try {
    await addShift({
      date,
      startTime,
      endTime,
      hours,
      salaryType,
      baseSalary: calculatedSalary ?? 0,
      tips: parseFloat(tips) || 0,
      totalEarnings: totalWithTips ?? 0,
      isShabbatOrHoliday: pay.isShabbatOrHoliday,
      // Old column, still written for older app versions: true only when
      // the x1.5 was actually used on some hours.
      used150: pay.premiumUsed,
      jobId,
      hourlyRate: salaryType === 'hourly' ? parseFloat(hourlyRate) : null,
      regularHours: pay.split?.regularHours ?? null,
      shabbatHours: pay.split?.shabbatHours ?? null,
      // The intended premium (also kept when unverified, for re-checking later)
      shabbatPremiumApplied: salaryType === 'hourly' ? premiumApplied : null,
      shabbatVerified: pay.verified,
    })

    navigate('/shifts')
  } catch (e) {
    console.error('Error saving shift:', e)
    setSubmitError(t('shiftForm.errorSaveFailed'))
    setSubmitting(false)
  }
}


  
  return (
    <div className="add-shift-backdrop">
      <div className="add-shift-card">
        <div className="card-header">
          <button className="back-btn" onClick={() => navigate(-1)}>←</button>
          <h1>{t('shift.addShift')}</h1>
          <div />
        </div>

        <div className="card-body">
          <div className="form-section">
            <span className="form-label">{t('shiftForm.job')}</span>
            <JobChips jobs={jobs} value={jobId} onChange={handleJobChange} />
            {jobs.filter(j => !j.archived).length === 0 && (
              <p className="hint">{t('shiftForm.addJobHint')}</p>
            )}
          </div>

          <div className="form-section">
            <label className="form-label" htmlFor={`${timeId}-date`}>{t('shiftForm.date')}</label>
            <DateField id={`${timeId}-date`} className="form-input" value={date} onChange={setDate} />
            {holidayNames.map(h => (
              <div key={h.title} className="special-day-badge">
                ✡️ {i18n.language === 'he' ? h.hebrew : h.title} — {t('shiftForm.holidaySuffix')}
              </div>
            ))}
          </div>

          <div className="form-section">
            <label className="form-label">{t('shiftForm.shiftHoursLabel')}</label>
            {/* Labels on the first row, inputs on the second, so the arrow centers on the inputs */}
            <div className="time-grid">
              <label className="time-label" htmlFor={`${timeId}-start`}>{t('shiftForm.start')}</label>
              <span />
              <label className="time-label" htmlFor={`${timeId}-end`}>{t('shiftForm.end')}</label>
              <input id={`${timeId}-start`} type="time" className="form-input" value={startTime} step="60" inputMode="numeric"
                onChange={e => setStartTime(e.target.value)} />
              <span className="time-divider" aria-hidden="true">→</span>
              <input id={`${timeId}-end`} type="time" className="form-input" value={endTime} step="60" inputMode="numeric"
                onChange={e => setEndTime(e.target.value)} />
            </div>
            {hours > 0 && <p className="hours-summary">{t('shiftForm.hoursWorked', { hours: formatHM(hours) })}</p>}
            {startTime && startTime === endTime && <p className="hint">{t('shiftForm.alertSameTimes')}</p>}
          </div>

          <div className="form-section">
            <label className="form-label">{t('shiftForm.salary')}</label>
            <div className="toggle-row">
              <button className={`toggle-btn ${salaryType === 'hourly' ? 'toggle-btn--active' : ''}`} onClick={() => setSalaryType('hourly')}>{t('shiftForm.hourly')}</button>
              <button className={`toggle-btn ${salaryType === 'total' ? 'toggle-btn--active' : ''}`} onClick={() => setSalaryType('total')}>{t('shiftForm.dailyTotal')}</button>
            </div>

            {salaryType === 'hourly' && (
              <div className="input-with-symbol">
                <span className="symbol">₪</span>
                <input type="number" className="form-input" placeholder="e.g. 55" value={hourlyRate} onChange={e => setHourlyRate(e.target.value)} />
                <span className="per-label">{t('shiftForm.perHour')}</span>
              </div>
            )}

            {salaryType === 'total' && (
              <div className="input-with-symbol">
                <span className="symbol">₪</span>
                <input type="number" className="form-input" placeholder="e.g. 450" value={totalSalary} onChange={e => setTotalSalary(e.target.value)} />
              </div>
            )}

            <ShabbatPaySection
              lookup={lookup}
              onRetry={retry}
              pay={pay}
              shift={{ date, startTime, endTime }}
              rate={hourlyRate ? parseFloat(hourlyRate) : null}
              salaryType={salaryType}
              geonameid={geonameid}
              job={selectedJob}
              premiumApplied={premiumApplied}
              onPremiumChange={setPremiumOverride}
              onAnswerJobPremium={answerJobPremium}
              answering={answeringPremium}
            />

            {/* With Shabbat hours the total is at the bottom of the Shabbat card */}
            {calculatedSalary !== null && !hasShabbatHours(pay) && (
              <div className="calc-result">
                <span className="calc-label">{t('shabbat.baseSalaryHours', { hours: formatHM(hours) })}</span>
                <span className="calc-value">{formatMoney(calculatedSalary)}</span>
              </div>
            )}
          </div>

          <div className="form-section">
            <label className="form-label">{t('shiftForm.tip')} <span className="optional">{t('shiftForm.optional')}</span></label>
            <div className="input-with-symbol">
              <span className="symbol">₪</span>
              <input type="number" className="form-input" placeholder={t('shiftForm.tipsPlaceholder') ?? ''} value={tips} onChange={e => setTips(e.target.value)} />
            </div>
          </div>

          {totalWithTips !== null && (
            <div className="total-summary">
              <span className="total-label">{t('shiftForm.totalIncome')}</span>
              <span className="total-value">{formatMoney(totalWithTips)}</span>
              {parseFloat(tips) > 0 && (
                <span className="total-breakdown">{t('shiftForm.breakdown', { salary: calculatedSalary, tips })}</span>
              )}
            </div>
          )}

          {submitError && <InlineError>{submitError}</InlineError>}

          <button className="submit-btn" onClick={handleSubmit} disabled={submitting}>
            {submitting ? t('shiftForm.saving') : t('shiftForm.saveShift')}
          </button>
        </div>
      </div>
      <BottomNavBar />
    </div>
  )
}