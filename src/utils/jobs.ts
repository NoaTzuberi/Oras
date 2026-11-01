import type { Job, JobInput, Shift } from '../context/ShiftContext'
import { DEFAULT_GEONAMEID } from './cities'

export const newJobDefaults: JobInput = {
  name: '',
  hourlyRate: null,
  geonameid: DEFAULT_GEONAMEID,
  paysShabbatPremium: true,
  archived: false,
}

/** Last job the user saved a shift with, if it's still active. */
export const pickLastUsedJobId = (jobs: Job[], shifts: Shift[], stored: string | null): string | null => {
  const active = jobs.filter(j => !j.archived)
  if (stored && active.some(j => j.id === stored)) return stored
  // shifts are ordered newest date first
  const fromShift = shifts.find(s => s.jobId && active.some(j => j.id === s.jobId))?.jobId
  return fromShift ?? active[0]?.id ?? null
}
