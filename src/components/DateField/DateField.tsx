import { useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { FiCalendar } from 'react-icons/fi'
import { parseLocalISODate } from '../../utils/localDate'
import './DateField.css'

type Props = {
  value: string
  onChange: (value: string) => void
  /** The form's input class, for the border / padding / font */
  className: string
  id?: string
  'aria-label'?: string
}

/**
 * Native date picker that shows the date in the app's language.
 * iOS Safari renders a date input in the device's language ("31 Oct 2026"
 * in a Hebrew app), so the formatted date is shown on top and the native
 * input stays underneath, invisible, to open the system picker.
 */
export const DateField = ({ value, onChange, className, id, 'aria-label': ariaLabel }: Props) => {
  const { i18n } = useTranslation()
  const ref = useRef<HTMLInputElement>(null)
  const date = parseLocalISODate(value)
  const text = isNaN(date.getTime())
    ? ''
    : date.toLocaleDateString(i18n.language === 'he' ? 'he-IL' : 'en-US', {
        weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
      })

  return (
    <div className={`date-field ${className}`}>
      <span className="date-field__text" aria-hidden="true">{text}</span>
      <FiCalendar className="date-field__icon" aria-hidden="true" />
      <input
        ref={ref}
        id={id}
        type="date"
        className="date-field__input"
        aria-label={ariaLabel}
        value={value}
        onChange={e => onChange(e.target.value)}
        // Desktop browsers only open the calendar from their own icon, which is hidden here
        onClick={() => { try { ref.current?.showPicker?.() } catch { /* not supported / not allowed */ } }}
      />
    </div>
  )
}
