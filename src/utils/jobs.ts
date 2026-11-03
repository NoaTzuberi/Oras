import type { TFunction } from 'i18next'
import type { Job, JobInput, Shift } from '../context/ShiftContext'
import { DEFAULT_GEONAMEID } from './cities'

export const newJobDefaults: JobInput = {
  name: '',
  hourlyRate: null,
  geonameid: DEFAULT_GEONAMEID,
  paysShabbatPremium: true,
  archived: false,
}

export const jobToInput = (job: Job): JobInput => ({
  name: job.name,
  hourlyRate: job.hourlyRate,
  geonameid: job.geonameid,
  paysShabbatPremium: job.paysShabbatPremium,
  archived: job.archived,
})

/** The job's name, or the translated default name for the backfilled job. */
export const jobDisplayName = (job: Pick<Job, 'name'>, t: TFunction): string =>
  job.name ?? t('jobs.defaultName')

/** Last job the user saved a shift with, if it's still active. */
export const pickLastUsedJobId = (jobs: Job[], shifts: Shift[], stored: string | null): string | null => {
  const active = jobs.filter(j => !j.archived)
  if (stored && active.some(j => j.id === stored)) return stored
  // shifts are ordered newest date first
  const fromShift = shifts.find(s => s.jobId && active.some(j => j.id === s.jobId))?.jobId
  return fromShift ?? active[0]?.id ?? null
}
