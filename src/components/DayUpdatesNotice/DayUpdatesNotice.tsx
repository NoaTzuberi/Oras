import { useTranslation } from 'react-i18next'
import type { DayUpdate } from '../../utils/workDay'
import { dayUpdateMessage } from '../../utils/payLabels'
import './DayUpdatesNotice.css'

/** Shown before saving: the other shifts of the same work day whose overtime changes. */
export const DayUpdatesNotice = ({ updates }: { updates: DayUpdate[] }) => {
  const { t } = useTranslation()
  if (updates.length === 0) return null
  return (
    <div className="day-updates" role="status">
      {updates.map(u => (
        <p key={u.shift.id} className="day-updates__text">⏱️ {dayUpdateMessage(t, u)}</p>
      ))}
    </div>
  )
}
