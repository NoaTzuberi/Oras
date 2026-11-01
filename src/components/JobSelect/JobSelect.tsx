import { useTranslation } from 'react-i18next'
import type { Job } from '../../context/ShiftContext'

type Props = {
  jobs: Job[]
  value: string | null
  onChange: (jobId: string | null) => void
  className?: string
}

/** Active jobs, plus the current job if it was archived (so old shifts keep showing it). */
export const JobSelect = ({ jobs, value, onChange, className }: Props) => {
  const { t } = useTranslation()
  const options = jobs.filter(j => !j.archived || j.id === value)

  return (
    <select
      className={className}
      value={value ?? ''}
      onChange={e => onChange(e.target.value || null)}
    >
      <option value="">{t('shiftForm.noJob')}</option>
      {options.map(job => (
        <option key={job.id} value={job.id}>
          {job.name}{job.archived ? ` (${t('jobs.archivedTag')})` : ''}
        </option>
      ))}
    </select>
  )
}
