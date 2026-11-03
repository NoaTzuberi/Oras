import { useRef, type CSSProperties, type KeyboardEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { FiCheck } from 'react-icons/fi'
import type { Job } from '../../context/ShiftContext'
import { jobDisplayName } from '../../utils/jobs'
import { NO_JOB_COLOR, jobColor, shade, withAlpha } from '../../utils/jobColors'
import './JobChips.css'

type Props = {
  jobs: Job[]
  value: string | null
  onChange: (jobId: string | null) => void
}

type Option = { id: string | null; label: string; color: string }

/** Above this many chips the row scrolls sideways instead of wrapping. */
const WRAP_LIMIT = 5

/**
 * Job picker as a row of chips (radio group). Active jobs, plus the current
 * job if it was archived (so old shifts keep showing it), then "No job".
 * Arrow keys move the selection, following the reading direction.
 */
export const JobChips = ({ jobs, value, onChange }: Props) => {
  const { t, i18n } = useTranslation()
  const refs = useRef<(HTMLButtonElement | null)[]>([])

  const options: Option[] = [
    ...jobs
      .filter(j => !j.archived || j.id === value)
      .map(j => ({
        id: j.id,
        label: jobDisplayName(j, t) + (j.archived ? ` (${t('jobs.archivedTag')})` : ''),
        color: jobColor(j),
      })),
    { id: null, label: t('shiftForm.noJob'), color: NO_JOB_COLOR },
  ]
  const selectedIndex = Math.max(0, options.findIndex(o => o.id === value))

  const select = (index: number) => {
    const i = (index + options.length) % options.length
    onChange(options[i].id)
    refs.current[i]?.focus()
  }

  const onKeyDown = (e: KeyboardEvent) => {
    const rtl = i18n.dir() === 'rtl'
    const next = rtl ? 'ArrowLeft' : 'ArrowRight'
    const prev = rtl ? 'ArrowRight' : 'ArrowLeft'
    if (e.key === next || e.key === 'ArrowDown') select(selectedIndex + 1)
    else if (e.key === prev || e.key === 'ArrowUp') select(selectedIndex - 1)
    else if (e.key === 'Home') select(0)
    else if (e.key === 'End') select(options.length - 1)
    else return
    e.preventDefault()
  }

  return (
    <div
      role="radiogroup"
      aria-label={t('shiftForm.job')}
      className={`job-chips${options.length > WRAP_LIMIT ? ' job-chips--scroll' : ''}`}
      onKeyDown={onKeyDown}
    >
      {options.map((o, i) => {
        const selected = i === selectedIndex
        const style = {
          '--chip-color': o.color,
          '--chip-tint': withAlpha(o.color, 0.1),
          '--chip-border': withAlpha(o.color, 0.45),
          '--chip-fill': shade(o.color),
        } as CSSProperties
        return (
          <button
            key={o.id ?? 'none'}
            ref={el => { refs.current[i] = el }}
            type="button"
            role="radio"
            aria-checked={selected}
            tabIndex={selected ? 0 : -1}
            className={`job-chip${o.id === null ? ' job-chip--none' : ''}`}
            style={style}
            onClick={() => onChange(o.id)}
          >
            {selected
              ? <FiCheck className="job-chip__check" aria-hidden="true" />
              : <span className="job-chip__dot" aria-hidden="true" />}
            <span className="job-chip__label">{o.label}</span>
          </button>
        )
      })}
    </div>
  )
}
