import { useState, useEffect } from 'react'
import './ShiftCard.css'
import type { Shift } from '../../context/ShiftContext';
import { useShifts } from "../../context/ShiftContext"
import { useTranslation } from "react-i18next"

// ── Helpers (same as AddShiftPage) ───────────────

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

// ── Component ─────────────────────────────────────

export const ShiftCard = ({ shift, style }: { shift: Shift; style?: React.CSSProperties }) => {
  const { t, i18n } = useTranslation()
  const { deleteShift, updateShift } = useShifts()

  const [open, setOpen] = useState(false)
  const [editMode, setEditMode] = useState(false)

  // Edit form state — pre-filled with current shift values
  const [editDate, setEditDate] = useState(shift.date)
  const [editStartTime, setEditStartTime] = useState(shift.startTime)
  const [editEndTime, setEditEndTime] = useState(shift.endTime)
  const [editSalaryType, setEditSalaryType] = useState<'hourly' | 'total'>(shift.salaryType)
  const [editHourlyRate, setEditHourlyRate] = useState(
    shift.salaryType === 'hourly' && shift.hours > 0
      ? String((shift.baseSalary / shift.hours).toFixed(2))
      : ''
  )
  const [editTotalSalary, setEditTotalSalary] = useState(
    shift.salaryType === 'total' ? String(shift.baseSalary) : ''
  )
  const [editTips, setEditTips] = useState(shift.tips > 0 ? String(shift.tips) : '')
  const [editUse150, setEditUse150] = useState(shift.used150)
  const [editSpecialDay, setEditSpecialDay] = useState<{ isSpecial: boolean; reason: string | null }>({
    isSpecial: shift.isShabbatOrHoliday,
    reason: null,
  })
  const [editLoading, setEditLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  const locale = i18n.language === 'he' ? 'he-IL' : 'en-US'

  const formattedDate = new Date(shift.date).toLocaleDateString(locale, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })

  const day = new Date(shift.date).getDate()
  const month = new Date(shift.date).toLocaleDateString(locale, { month: 'short' })
  const weekday = new Date(shift.date).toLocaleDateString(locale, { weekday: 'short' })

  // Recalculate when edit date changes
  useEffect(() => {
    if (!editMode || !editDate) return
    setEditLoading(true)
    checkIfSpecialDay(new Date(editDate)).then(result => {
      setEditSpecialDay(result)
      setEditLoading(false)
    })
  }, [editDate, editMode])

  const editHours = calcHours(editStartTime, editEndTime)

  const editCalculatedSalary = (() => {
    if (editSalaryType === 'hourly' && editHourlyRate && editHours > 0) {
      const base = parseFloat(editHourlyRate) * editHours
      return editUse150 ? parseFloat((base * 1.5).toFixed(2)) : parseFloat(base.toFixed(2))
    }
    if (editSalaryType === 'total' && editTotalSalary) return parseFloat(editTotalSalary)
    return null
  })()

  const editTotalWithTips = editCalculatedSalary !== null
    ? parseFloat((editCalculatedSalary + (parseFloat(editTips) || 0)).toFixed(2))
    : null

  const handleSave = async () => {
    if (!editStartTime || !editEndTime) return alert(t('shiftForm.alertEnterTimes'))
    if (editSalaryType === 'hourly' && !editHourlyRate) return alert(t('shiftForm.alertEnterHourlyRate'))
    if (editSalaryType === 'total' && !editTotalSalary) return alert(t('shiftForm.alertEnterTotalSalary'))

    setSaving(true)
    await updateShift(shift.id, {
      date: editDate,
      startTime: editStartTime,
      endTime: editEndTime,
      hours: editHours,
      salaryType: editSalaryType,
      baseSalary: editCalculatedSalary ?? 0,
      tips: parseFloat(editTips) || 0,
      totalEarnings: editTotalWithTips ?? 0,
      isShabbatOrHoliday: editSpecialDay.isSpecial,
      used150: editUse150,
    })
    setSaving(false)
    setEditMode(false)
    setOpen(false)
  }

  return (
    <>
      <div className="shift-card" style={style} onClick={() => setOpen(true)}>
        {shift.isShabbatOrHoliday && (
          <div className="shift-card__holiday-dot">✡️</div>
        )}
        <div className="shift-card__top">
          <span className="shift-card__weekday">{weekday}</span>
          <div className='shift-card-day-month'>
            <span className="shift-card__day">{day}</span>
            <span className="shift-card__month">{month}</span>
          </div>
        </div>
        <div className="shift-card__bottom">
          <span className="shift-card__total">₪{shift.totalEarnings}</span>
          <span className="shift-card__hours">{shift.hours} ש'</span>
        </div>
      </div>

      {open && (
        <div className="shift-modal-backdrop" onClick={() => { setOpen(false); setEditMode(false) }}>
          <div className="shift-modal" onClick={e => e.stopPropagation()}>

            {!editMode ? (
              // ── View mode ──────────────────────────────
              <>
                <div className="shift-modal__header">
                  <button className="shift-modal__close" onClick={() => setOpen(false)}>✕</button>
                  <div className="shift-modal__header-left">
                    <span className="shift-modal__header-date">{formattedDate}</span>
                    {shift.isShabbatOrHoliday && (
                      <span className="shift-modal__holiday-badge">
                        ✡️ {shift.used150 ? t('shiftCard.applied150') : t('shiftForm.holidaySuffix')}
                      </span>
                    )}
                  </div>
                </div>

                <div className="shift-modal__body">
                  <div className="shift-modal__section">
                    <p className="shift-modal__section-title">{t("shiftCard.shiftHours")}</p>
                    <div className="shift-modal__time-row">
                      <div className="shift-modal__time-block shift-modal__time-block--right">
                        <span className="shift-modal__time-label">{t("shiftCard.shiftHours")}</span>
                        <span className="shift-modal__time-value">{shift.hours} {t("shiftCard.hours")}</span>
                      </div>
                      <div className="shift-modal__time-arrow">←</div>
                      <div className="shift-modal__time-block">
                        <span className="shift-modal__time-label">{t("shiftCard.end")}</span>
                        <span className="shift-modal__time-value">{shift.endTime}</span>
                      </div>
                      <div className="shift-modal__time-arrow">←</div>
                      <div className="shift-modal__time-block">
                        <span className="shift-modal__time-label">{t("shiftCard.start")}</span>
                        <span className="shift-modal__time-value">{shift.startTime}</span>
                      </div>
                    </div>
                  </div>

                  <div className="shift-modal__section">
                    <p className="shift-modal__section-title">{t("shiftCard.income")}</p>
                    <div className="shift-modal__row">
                      <span>₪{shift.baseSalary}</span>
                      <span>{t("shiftCard.baseSalary")}</span>
                    </div>
                    {shift.tips > 0 && (
                      <div className="shift-modal__row">
                        <span>₪{shift.tips}</span>
                        <span>{t("shiftCard.tips")}</span>
                      </div>
                    )}
                    {shift.used150 && (
                      <div className="shift-modal__row shift-modal__row--highlight">
                        <span>{t("shiftCard.applied150")}</span>
                      </div>
                    )}
                  </div>

                  <div className="shift-modal__total-block">
                    <span className="shift-modal__total-value">₪{shift.totalEarnings}</span>
                    <span className="shift-modal__total-label">{t("shiftCard.total")}</span>
                  </div>

                  <div className="shift-modal__actions">
                    <button
                      className="shift-edit-btn"
                      onClick={(e) => { e.stopPropagation(); setEditMode(true) }}
                    >
                       {t("shiftCard.edit")}
                    </button>
                    <button
                      className="shift-delete-btn"
                      onClick={(e) => {
                        e.stopPropagation()
                        if (confirm(t("shiftCard.confirmDelete"))) {
                          deleteShift(shift.id)
                          setOpen(false)
                        }
                      }}
                    >
                      {t("shiftCard.delete")}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              // ── Edit mode ──────────────────────────────
              <>
                <div className="shift-modal__header">
                  <button className="shift-modal__close" onClick={() => setEditMode(false)}>←</button>
                  <div className="shift-modal__header-left">
                    <span className="shift-modal__header-date">{t('shiftCard.editTitle')}</span>
                  </div>
                </div>

                <div className="shift-modal__body shift-modal__edit-body">

                  {/* Date */}
                  <div className="edit-form-section">
                    <label className="edit-form-label">{t('shiftForm.date')}</label>
                    <input
                      type="date"
                      className="edit-form-input"
                      value={editDate}
                      onChange={(e) => setEditDate(e.target.value)}
                    />
                    {editLoading && <p className="edit-hint">{t('shiftForm.checkingDate')}</p>}
                    {!editLoading && editSpecialDay.isSpecial && (
                      <div className="edit-special-badge">✡️ {editSpecialDay.reason ?? ''} — {t('shiftForm.holidaySuffix')}</div>
                    )}
                  </div>

                  {/* Times */}
                  <div className="edit-form-section">
                    <label className="edit-form-label">{t('shiftForm.shiftHoursLabel')}</label>
                    <div className="edit-time-row">
                      <div className="edit-time-block">
                        <span className="edit-time-label">{t('shiftForm.start')}</span>
                        <input
                          type="time"
                          className="edit-form-input"
                          value={editStartTime}
                          step="60"
                          onChange={e => setEditStartTime(e.target.value)}
                        />
                      </div>
                      <div className="edit-time-divider">→</div>
                      <div className="edit-time-block">
                        <span className="edit-time-label">{t('shiftForm.end')}</span>
                        <input
                          type="time"
                          className="edit-form-input"
                          value={editEndTime}
                          step="60"
                          onChange={e => setEditEndTime(e.target.value)}
                        />
                      </div>
                    </div>
                    {editHours > 0 && <p className="edit-hours-summary">{t('shiftForm.hoursWorked', { hours: editHours })}</p>}
                  </div>

                  {/* Salary */}
                  <div className="edit-form-section">
                    <label className="edit-form-label">{t('shiftForm.salary')}</label>
                    <div className="edit-toggle-row">
                      <button
                        className={`edit-toggle-btn ${editSalaryType === 'hourly' ? 'edit-toggle-btn--active' : ''}`}
                        onClick={() => setEditSalaryType('hourly')}
                      >
                        {t('shiftForm.hourly')}
                      </button>
                      <button
                        className={`edit-toggle-btn ${editSalaryType === 'total' ? 'edit-toggle-btn--active' : ''}`}
                        onClick={() => setEditSalaryType('total')}
                      >
                        {t('shiftForm.dailyTotal')}
                      </button>
                    </div>

                    {editSalaryType === 'hourly' && (
                      <div className="edit-input-with-symbol">
                        <span className="edit-symbol">₪</span>
                        <input
                          type="number"
                          className="edit-form-input"
                          placeholder="e.g. 55"
                          value={editHourlyRate}
                          onChange={e => setEditHourlyRate(e.target.value)}
                        />
                        <span className="edit-per-label">{t('shiftForm.perHour')}</span>
                      </div>
                    )}

                    {editSalaryType === 'total' && (
                      <div className="edit-input-with-symbol">
                        <span className="edit-symbol">₪</span>
                        <input
                          type="number"
                          className="edit-form-input"
                          placeholder="e.g. 450"
                          value={editTotalSalary}
                          onChange={e => setEditTotalSalary(e.target.value)}
                        />
                      </div>
                    )}

                    {editSpecialDay.isSpecial && editSalaryType === 'hourly' && editHours > 0 && editHourlyRate && (
                      <div className="edit-suggestion-box">
                        <div className="edit-suggestion-top">
                          <span>💡 {editSpecialDay.reason}</span>
                          <span className="edit-suggestion-rate">{(parseFloat(editHourlyRate) * 1.5).toFixed(2)}/hr</span>
                        </div>
                        <button
                          className={`edit-apply-150-btn ${editUse150 ? 'edit-apply-150-btn--active' : ''}`}
                          onClick={() => setEditUse150(p => !p)}
                        >
                          {editUse150 ? t('shiftForm.apply150Active') : t('shiftForm.apply150')}
                        </button>
                      </div>
                    )}

                    {editCalculatedSalary !== null && (
                      <div className="edit-calc-result">
                        <span className="edit-calc-label">{t('shiftForm.baseSalary')}</span>
                        <span className="edit-calc-value">₪{editCalculatedSalary}</span>
                      </div>
                    )}
                  </div>

                  {/* Tips */}
                  <div className="edit-form-section">
                    <label className="edit-form-label">{t('shiftForm.tip')} <span className="edit-optional">{t('shiftForm.optional')}</span></label>
                    <div className="edit-input-with-symbol">
                      <span className="edit-symbol">₪</span>
                      <input
                        type="number"
                        className="edit-form-input"
                        placeholder={t('shiftForm.tipsPlaceholder') ?? ''}
                        value={editTips}
                        onChange={e => setEditTips(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Total */}
                  {editTotalWithTips !== null && (
                    <div className="edit-total-summary">
                      <span className="edit-total-label">{t('shiftForm.totalIncome')}</span>
                      <span className="edit-total-value">₪{editTotalWithTips}</span>
                    </div>
                  )}

                  {/* Save button */}
                  <button
                    className="edit-save-btn"
                    onClick={handleSave}
                    disabled={saving}
                  >
                    {saving ? t('shiftForm.saving') : t('shiftForm.saveChanges')}
                  </button>

                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}