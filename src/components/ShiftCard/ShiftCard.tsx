import { useState } from 'react'
import './ShiftCard.css'
import type { Shift } from '../../context/ShiftContext';
import { useShifts } from "../../context/ShiftContext"
import { useTranslation } from "react-i18next"

export const ShiftCard = ({ shift, style }: { shift: Shift; style?: React.CSSProperties }) => {
  console.log("SHIFT:", shift);

const { t, i18n } = useTranslation()

  const [open, setOpen] = useState(false)

const locale = i18n.language === 'he' ? 'he-IL' : 'en-US'

  const formattedDate = new Date(shift.date).toLocaleDateString(locale, {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
})

  const day = new Date(shift.date).getDate()
  const month = new Date(shift.date).toLocaleDateString(locale, { month: 'short' })
  const weekday = new Date(shift.date).toLocaleDateString(locale, { weekday: 'short' })

  const { deleteShift } = useShifts();

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
        <div className="shift-modal-backdrop" onClick={() => setOpen(false)}>
          <div className="shift-modal" onClick={e => e.stopPropagation()}>

            <div className="shift-modal__header">
              <button className="shift-modal__close" onClick={() => setOpen(false)}>✕</button>
              <div className="shift-modal__header-left">
                <span className="shift-modal__header-date">{formattedDate}</span>
                {shift.isShabbatOrHoliday && (
                  <span className="shift-modal__holiday-badge">
                    ✡️ {shift.used150 ? 'שכר 150% הוחל' : 'שבת / חג'}
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
                  <span> {t("shiftCard.baseSalary")} </span>
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
                <span className="shift-modal__total-label"> {t("shiftCard.total")} </span>
              </div>
              <div className="shift-modal__actions">
                <button
                  className="shift-delete-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm(t("shiftCard.confirmDelete"))) {
                      deleteShift(shift.id);
                      setOpen(false);
                    }
                  }}
                >
                {t("shiftCard.delete")}                </button>
              </div>

            </div>
          </div>
        </div>
      )}
    </>
  )
}

