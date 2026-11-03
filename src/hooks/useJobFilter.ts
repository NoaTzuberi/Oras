import { useState } from 'react'
import { useShifts } from '../context/ShiftContext'
import { resolveJobFilter, type JobFilter } from '../utils/jobFilter'

// Last selected tab, shared by the Shifts page and the Dashboard.
// Per-device convenience only, so storage errors are ignored.
const KEY = 'oras.jobFilter'

const read = (): string | null => {
  try { return localStorage.getItem(KEY) } catch { return null }
}

const write = (id: JobFilter) => {
  try {
    if (id) localStorage.setItem(KEY, id)
    else localStorage.removeItem(KEY)
  } catch { /* storage unavailable: remembered for this visit only */ }
}

/** Job filter tabs state. Tabs show only with 2+ active jobs; otherwise it's always "All". */
export const useJobFilter = () => {
  const { jobs } = useShifts()
  const [stored, setStored] = useState<string | null>(read)
  const activeJobs = jobs.filter(j => !j.archived)
  const selected = resolveJobFilter(jobs, stored)

  const select = (id: JobFilter) => {
    write(id)
    setStored(id)
  }

  return { activeJobs, showTabs: activeJobs.length > 1, selected, select }
}
