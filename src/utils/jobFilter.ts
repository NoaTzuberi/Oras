import type { Job, Shift } from '../context/ShiftContext'

/** null = "All" */
export type JobFilter = string | null

export const filterShiftsByJob = (shifts: Shift[], filter: JobFilter): Shift[] =>
  filter === null ? shifts : shifts.filter(s => s.jobId === filter)

/** The stored tab, if it's still an active job and tabs are shown at all (2+ active jobs). */
export const resolveJobFilter = (jobs: Job[], stored: string | null): JobFilter => {
  const active = jobs.filter(j => !j.archived)
  if (active.length < 2 || !stored) return null
  return active.some(j => j.id === stored) ? stored : null
}

const round2 = (n: number) => Math.round(n * 100) / 100

export type JobBreakdownRow = { jobId: string | null; job: Job | null; hours: number; gross: number }

/**
 * Hours and gross per job for the given shifts, in the jobs' order, with
 * "no job" last. Archived jobs are included when they have shifts.
 */
export const jobBreakdown = (shifts: Shift[], jobs: Job[]): JobBreakdownRow[] => {
  const byJob = new Map<string | null, { hours: number; gross: number }>()
  for (const s of shifts) {
    const key = s.jobId && jobs.some(j => j.id === s.jobId) ? s.jobId : null
    const row = byJob.get(key) ?? { hours: 0, gross: 0 }
    row.hours += s.hours
    row.gross += s.totalEarnings
    byJob.set(key, row)
  }
  const rows: JobBreakdownRow[] = []
  for (const job of jobs) {
    const r = byJob.get(job.id)
    if (r) rows.push({ jobId: job.id, job, hours: round2(r.hours), gross: round2(r.gross) })
  }
  const none = byJob.get(null)
  if (none) rows.push({ jobId: null, job: null, hours: round2(none.hours), gross: round2(none.gross) })
  return rows
}
