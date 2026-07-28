import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { BottomNavBar } from '../../components/BottomNavBar/BottomNavBar'
import './AddShiftPage.css'
import { useShifts } from '../../context/ShiftContext'




const checkIfSpecialDay = async (date: Date) => {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()

  if (date.getDay() === 6) return { isSpecial: true, reason: 'שבת' }

  try {
    const res = await fetch(
      `https://www.hebcal.com/hebcal?v=1&cfg=json&year=${year}&month=${month}&maj=on&min=off&mod=off&nx=off&mf=off&ss=off&s=on&geo=none`
    )
    const data = await res.json()
    const match = data.items?.find((item: any) => {
      const itemDate = new Date(item.date)
      return (
        itemDate.getFullYear() === year &&
        itemDate.getMonth() + 1 === month &&
        itemDate.getDate() === day &&
        item.category === 'holiday' &&
        item.yomtov === true
      )
    })
    if (match) return { isSpecial: true, reason: match.title }
  } catch (e) {
    console.error('Hebcal error:', e)
  }

  return { isSpecial: false, reason: null }
}


const calcHours = (start: string, end: string) => {
  if (!start || !end) return 0
  const [sh, sm] = start.split(':').map(Number)
  const [eh, em] = end.split(':').map(Number)
  let mins = (eh * 60 + em) - (sh * 60 + sm)
  if (mins < 0) mins += 24 * 60
  return parseFloat((mins / 60).toFixed(2))
}

export const AddShiftPage = () => {
  const navigate = useNavigate()
  const { t } = useTranslation()
const { addShift } = useShifts()

  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0])
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [salaryType, setSalaryType] = useState<'hourly' | 'total'>('hourly')
  const { userProfile } = useShifts()
  const [hourlyRate, setHourlyRate] = useState('')


  const [totalSalary, setTotalSalary] = useState('')
  const [tips, setTips] = useState('')
  const [specialDay, setSpecialDay] = useState<{ isSpecial: boolean; reason: string | null }>({ isSpecial: false, reason: null })
  const [use150, setUse150] = useState(false)
  const [loading, setLoading] = useState(false)

  const hours = calcHours(startTime, endTime)

  useEffect(() => {
  if (userProfile?.defaultHourlyRate) {
    setHourlyRate(String(userProfile.defaultHourlyRate))
  }
}, [userProfile])

  const calculatedSalary = (() => {
    if (salaryType === 'hourly' && hourlyRate && hours > 0) {
      const base = parseFloat(hourlyRate) * hours
      return use150 ? parseFloat((base * 1.5).toFixed(2)) : parseFloat(base.toFixed(2))
    }
    if (salaryType === 'total' && totalSalary) return parseFloat(totalSalary)
    return null
  })()

  const totalWithTips = calculatedSalary !== null
    ? parseFloat((calculatedSalary + (parseFloat(tips) || 0)).toFixed(2))
    : null

  useEffect(() => {
    if (!date) return
    setLoading(true)
    checkIfSpecialDay(new Date(date)).then(result => {
      setSpecialDay(result)
      setLoading(false)
    })
  }, [date])

  const handleSubmit = async () => {
  if (!startTime || !endTime) return alert(t('shiftForm.alertEnterTimes'))
  if (salaryType === 'hourly' && !hourlyRate) return alert(t('shiftForm.alertEnterHourlyRate'))
  if (salaryType === 'total' && !totalSalary) return alert(t('shiftForm.alertEnterTotalSalary'))

  await addShift({
    date,
    startTime,
    endTime,
    hours,
    salaryType,
    baseSalary: calculatedSalary ?? 0,
    tips: parseFloat(tips) || 0,
    totalEarnings: totalWithTips ?? 0,
    isShabbatOrHoliday: specialDay.isSpecial,
    used150: use150,
  })

  navigate('/shifts')
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
            <label className="form-label">{t('shiftForm.date')}</label>
            <input
              type="date"
              className="form-input"
              value={date}
              onChange={(e) => {
                setDate(e.target.value)
                e.target.blur()
              }}
            />
            {loading && <p className="hint">{t('shiftForm.checkingDate')}</p>}
            {!loading && specialDay.isSpecial && (
              <div className="special-day-badge">✡️ {specialDay.reason ?? ''} — {t('shiftForm.holidaySuffix')}</div>
            )}
          </div>

          <div className="form-section">
            <label className="form-label">{t('shiftForm.shiftHoursLabel')}</label>
            <div className="time-row">
              <div className="time-block">
                <span className="time-label">{t('shiftForm.start')}</span>
                <input type="time" className="form-input"
                value={startTime}
                step="60"
                inputMode='numeric'
                onChange={e => setStartTime(e.target.value)} />
              </div>
              <div className="time-divider">→</div>
              <div className="time-block">
                <span className="time-label">{t('shiftForm.end')}</span>
                <input type="time" className="form-input" value={endTime}
                step="60"
                inputMode='numeric'
                onChange={e => setEndTime(e.target.value)} />
              </div>
            </div>
            {hours > 0 && <p className="hours-summary">{t('shiftForm.hoursWorked', { hours })}</p>}
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

            {specialDay.isSpecial && salaryType === 'hourly' && hours > 0 && hourlyRate && (
              <div className="suggestion-box">
                <div className="suggestion-top">
                  <span>💡 {specialDay.reason}</span>
                  <span className="suggestion-rate">{(parseFloat(hourlyRate) * 1.5).toFixed(2)}/hr</span>
                </div>
                <p className="suggestion-sub">{t('shiftForm.applyOnlyIfEmployerPays')}</p>
                <button
                  className={`apply-150-btn ${use150 ? 'apply-150-btn--active' : ''}`}
                  onClick={() => setUse150(p => !p)}
                >
                  {use150 ? t('shiftForm.apply150Active') : t('shiftForm.apply150')}
                </button>
              </div>
            )}

            {calculatedSalary !== null && (
              <div className="calc-result">
                <span className="calc-label">{t('shiftForm.baseSalary')}</span>
                <span className="calc-value">₪{calculatedSalary}</span>
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
              <span className="total-value">₪{totalWithTips}</span>
              {parseFloat(tips) > 0 && (
                <span className="total-breakdown">{t('shiftForm.breakdown', { salary: calculatedSalary, tips })}</span>
              )}
            </div>
          )}

          <button className="submit-btn" onClick={handleSubmit}>{t('shiftForm.saveShift')}</button>
        </div>
      </div>
      <BottomNavBar />
    </div>
  )
}