import { useState } from 'react'
import { createPortal } from 'react-dom'
import './ShiftCard.css'
import type { Shift } from '../../context/ShiftContext';
import { useShifts } from "../../context/ShiftContext"
import { useTranslation } from "react-i18next"
import { InlineError } from '../InlineError/InlineError'
import { ShiftEditForm } from '../ShiftEditForm/ShiftEditForm'
import { jobDisplayName } from '../../utils/jobs'
import { parseLocalISODate } from '../../utils/localDate'
import { jobColor, shade, withAlpha } from '../../utils/jobColors'
import { DEFAULT_GEONAMEID } from '../../utils/cities'
import { fetchShabbatLookup } from '../../utils/shabbatApi'
import { applyDayUpdates, canRecalcWithDay, planDayUpdates, workDayOthers } from '../../utils/workDay'
import { bucketsText, dayUpdateMessage } from '../../utils/payLabels'
import { overtimeMinutes } from '../../utils/overtime'
import { storedBuckets } from '../../utils/overtimeStats'

// ── Component ─────────────────────────────────────

export const ShiftCard = ({ shift, style }: { shift: Shift; style?: React.CSSProperties }) => {
  const { t, i18n } = useTranslation()
  const { deleteShift, updateShift, jobs, shifts } = useShifts()
  const shiftJob = jobs.find(j => j.id === shift.jobId) ?? null

  // Minutes per pay rate, for shifts saved with overtime
  const buckets = storedBuckets(shift)
  const showOvertime = buckets != null && overtimeMinutes(buckets) > 0

  const [open, setOpen] = useState(false)
  const [editMode, setEditMode] = useState(false)

  const [actionError, setActionError] = useState('')

  const locale = i18n.language === 'he' ? 'he-IL' : 'en-US'

  // Archived jobs are still in `jobs`, so old shifts keep their color
  const jobStyle = shiftJob
    ? ({ '--job-color': jobColor(shiftJob), '--job-tint': withAlpha(jobColor(shiftJob), 0.12), '--job-text': shade(jobColor(shiftJob), 0.6) } as React.CSSProperties)
    : undefined
  const jobChip = shiftJob && (
    <span className="job-tag" style={jobStyle}>
      <span className="job-tag__dot" aria-hidden="true" />
      <span className="job-tag__name">{jobDisplayName(shiftJob, t)}</span>
    </span>
  )

  // Local midnight: new Date('YYYY-MM-DD') is UTC, the previous day west of UTC
  const shiftDate = parseLocalISODate(shift.date)
  const formattedDate = shiftDate.toLocaleDateString(locale, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })

  const day = shiftDate.getDate()
  const month = shiftDate.toLocaleDateString(locale, { month: 'short' })
  const weekday = shiftDate.toLocaleDateString(locale, { weekday: 'short' })

  return (
    <>
      <div
        className={`shift-card${shiftJob ? ' shift-card--job' : ''}`}
        style={{ ...style, ...jobStyle }}
        onClick={() => setOpen(true)}
      >
        {shift.isShabbatOrHoliday && (
          <div className="shift-card__holiday-dot">✡️</div>
        )}
        {shift.shabbatVerified === false && (
          <div className="shift-card__unverified-dot" title={t('shabbat.unverified')}>⚠️</div>
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
          {jobChip}
        </div>
      </div>

      {/* In <body>, above the page's stacking context and the bottom nav */}
      {open && createPortal(
        <div className="shift-modal-backdrop" onClick={() => { setOpen(false); setEditMode(false) }}>
          <div className={`shift-modal${editMode ? ' shift-modal--edit' : ''}`} onClick={e => e.stopPropagation()}>

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
                  {shiftJob && (
                    <div className="shift-modal__row">
                      <span>{t('shiftForm.job')}</span>
                      {jobChip}
                    </div>
                  )}
                  <div className="shift-modal__section">
                    <p className="shift-modal__section-title">{t("shiftCard.shiftHours")}</p>
                    <div className="shift-modal__time-row">
                      <div className="shift-modal__time-block">
                        <span className="shift-modal__time-label">{t("shiftCard.start")}</span>
                        <span className="shift-modal__time-value">{shift.startTime}</span>
                      </div>
                      <div className="shift-modal__time-arrow">←</div>
                      <div className="shift-modal__time-block">
                        <span className="shift-modal__time-label">{t("shiftCard.end")}</span>
                        <span className="shift-modal__time-value">{shift.endTime}</span>
                      </div>
                    </div>
                    <p className="shift-modal__hours-caption">{shift.hours} {t("shiftCard.hours")}</p>
                    {/* Only shifts saved with the split have these; older shifts show as before */}
                    {shift.regularHours != null && shift.shabbatHours != null && shift.shabbatHours > 0 && (
                      <p className="shift-modal__hours-caption">
                        {t('shabbat.savedBreakdown', { regular: shift.regularHours, shabbat: shift.shabbatHours })}
                        {shift.shabbatPremiumApplied ? ' ×1.5' : ''}
                      </p>
                    )}
                    {showOvertime && (
                      <p className="shift-modal__hours-caption">
                        {bucketsText(t, buckets, shift.salaryType === 'hourly' && shift.shabbatPremiumApplied === true)}
                      </p>
                    )}
                    {showOvertime && shift.isNightShift && (
                      <p className="shift-modal__hours-caption">🌙 {t('pay.nightShiftRule')}</p>
                    )}
                    {shift.shabbatVerified === false && (
                      <p className="shift-modal__hours-caption shift-modal__unverified">⚠️ {t('shabbat.unverified')}</p>
                    )}
                  </div>

                  <div className="shift-modal__section">
                    <p className="shift-modal__section-title">{t("shiftCard.income")}</p>
                    <div className="shift-modal__row">
                      <span>{t("shiftCard.baseSalary")}</span>
                      <span>₪{shift.baseSalary}</span>
                    </div>
                    {shift.tips > 0 && (
                      <div className="shift-modal__row">
                        <span>{t("shiftCard.tips")}</span>
                        <span>₪{shift.tips}</span>
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

                  {actionError && <InlineError>{actionError}</InlineError>}

                  <div className="shift-modal__actions">
                    <button
                      className="shift-edit-btn"
                      onClick={(e) => { e.stopPropagation(); setActionError(''); setEditMode(true) }}
                    >
                       {t("shiftCard.edit")}
                    </button>
                    <button
                      className="shift-delete-btn"
                      onClick={async (e) => {
                        e.stopPropagation()
                        setActionError('')

                        // Other shifts of the same work day whose overtime changes once this one is gone
                        const sameDayIds = new Set(workDayOthers(shifts, shift).map(o => o.key))
                        const needsCheck = shifts.some(s => sameDayIds.has(s.id) && canRecalcWithDay(s))
                        // Cached per week, so usually instant. If it fails, the other shifts are left as they are.
                        const lookup = needsCheck ? await fetchShabbatLookup(shift.date, shiftJob?.geonameid ?? DEFAULT_GEONAMEID) : null
                        const updates = lookup ? planDayUpdates({
                          after: shifts.filter(s => s.id !== shift.id),
                          days: [{ jobId: shift.jobId, date: shift.date }],
                          changedId: shift.id,
                          jobs,
                          lookupFor: () => lookup,
                        }) : []
                        const message = [t("shiftCard.confirmDelete"), ...updates.map(u => dayUpdateMessage(t, u))].join('\n\n')
                        if (!confirm(message)) return

                        try {
                          await deleteShift(shift.id)
                          if (!(await applyDayUpdates(updateShift, updates))) alert(t('pay.deleteDayUpdateFailed'))
                          setOpen(false)
                        } catch (err) {
                          console.error('Error deleting shift:', err)
                          setActionError(t('shiftCard.errorDeleteFailed'))
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
              <ShiftEditForm
                shift={shift}
                onCancel={() => setEditMode(false)}
                onSaved={() => { setEditMode(false); setOpen(false) }}
              />
            )}
          </div>
        </div>,
        document.body,
      )}
    </>
  )
}