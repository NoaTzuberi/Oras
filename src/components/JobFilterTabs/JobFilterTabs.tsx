import type { CSSProperties } from 'react'
import { useTranslation } from 'react-i18next'
import type { Job } from '../../context/ShiftContext'
import type { JobFilter } from '../../utils/jobFilter'
import { jobDisplayName } from '../../utils/jobs'
import { jobColor, shade } from '../../utils/jobColors'
import './JobFilterTabs.css'

type Props = { jobs: Job[]; selected: JobFilter; onSelect: (id: JobFilter) => void }

/** "All | job | job ..." filter row. Scrolls sideways when it doesn't fit. */
export const JobFilterTabs = ({ jobs, selected, onSelect }: Props) => {
  const { t } = useTranslation()
  return (
    <div className="job-tabs" role="group" aria-label={t('jobFilter.label')}>
      <button
        type="button"
        className="job-tab"
        aria-pressed={selected === null}
        onClick={() => onSelect(null)}
      >
        {t('jobFilter.all')}
      </button>
      {jobs.map(job => {
        const color = jobColor(job)
        return (
          <button
            key={job.id}
            type="button"
            className="job-tab"
            aria-pressed={selected === job.id}
            style={{ '--tab-color': color, '--tab-fill': shade(color) } as CSSProperties}
            onClick={() => onSelect(job.id)}
          >
            <span className="job-tab__dot" aria-hidden="true" />
            <span className="job-tab__label">{jobDisplayName(job, t)}</span>
          </button>
        )
      })}
    </div>
  )
}
