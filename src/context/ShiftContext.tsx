import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { supabase } from '../lib/supabase'
import { reportError } from '../lib/sentry'
import { historyWindow } from '../utils/dates'
import { pickLastUsedJobId } from '../utils/jobs'
import { parseLocalISODate } from '../utils/localDate'
import { calcTaxInfo, periodOf, type TaxInfo } from '../tax/calc'
import { childrenToStored, parseStoredChildren, type Child, type ParentColumn } from '../tax/children'

export type Shift = {
  id: string
  date: string
  startTime: string
  endTime: string
  hours: number
  salaryType: 'hourly' | 'total'
  baseSalary: number
  tips: number
  totalEarnings: number
  isShabbatOrHoliday: boolean
  used150: boolean
  // Added with jobs. NULL on shifts saved before that (and before backfill).
  jobId: string | null
  hourlyRate: number | null
  regularHours: number | null
  shabbatHours: number | null
  shabbatPremiumApplied: boolean | null
  shabbatVerified: boolean | null
}

export type Job = {
  id: string
  // NULL for the default job made by the backfill: shown as t('jobs.defaultName')
  name: string | null
  hourlyRate: number | null
  geonameid: number
  // NULL = the user hasn't said yet (backfilled jobs)
  paysShabbatPremium: boolean | null
  color: string | null
  archived: boolean
  // Tax settings. NULL = the default (pension on at 6%, tips on the payslip).
  pensionActive: boolean | null
  pensionEmployeePct: number | null
  tipsInPayslip: boolean | null
}

// color is assigned by the database and not editable yet
export type JobInput = Omit<Job, 'id' | 'color'>

export type ServiceType = 'none' | 'military' | 'national'

export type UserProfile = {
  gender: 'male' | 'female' | null
  children: Child[]
  // Tax column for child points; NULL = 1 for women, 2 for men
  parentColumn: ParentColumn | null
  serviceType: ServiceType
  dischargeDate: string | null
  // No longer counted or editable (see calcCreditPoints); kept as stored
  isMoshavMember: boolean
  isNewImmigrant: boolean
  immigrationYear: number | null
  hasAcademicDegree: boolean
  // No longer counted or editable (see calcCreditPoints); kept as stored
  isPriorityArea: boolean
  defaultHourlyRate: number | null
}

export type { TaxInfo } from '../tax/calc'

type ShiftsContextType = {
  shifts: Shift[]
  addShift: (shift: Omit<Shift, 'id'>) => Promise<void>
  updateShift: (id: string, shift: Omit<Shift, 'id'>) => Promise<void>
  deleteShift: (id: string) => Promise<void>
  jobs: Job[]
  addJob: (job: JobInput) => Promise<Job>
  updateJob: (id: string, job: JobInput) => Promise<void>
  lastUsedJobId: string | null
  userProfile: UserProfile
  setUserProfile: (profile: UserProfile) => Promise<void>
  taxInfo: TaxInfo
  loadingData: boolean
  filteredShifts: Shift[]
selectedMonth: Date
setSelectedMonth: React.Dispatch<React.SetStateAction<Date>>
}

const defaultProfile: UserProfile = {
  gender: null,
  children: [],
  parentColumn: null,
  serviceType: 'none',
  dischargeDate: null,
  isMoshavMember: false,
  isNewImmigrant: false,
  immigrationYear: null,
  hasAcademicDegree: false,
  isPriorityArea: false,
  defaultHourlyRate: null,
}

export type MonthlyBreakdown = {
  year: number
  month: number
  hours: number
  grossEarnings: number
  avgHourlyRate: number
}

export const getMonthlyBreakdown = (shifts: Shift[], monthsCount: number): MonthlyBreakdown[] => {
  const now = new Date()
  const result: MonthlyBreakdown[] = []

  for (let i = monthsCount - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const year = d.getFullYear()
    const month = d.getMonth()

    const monthShifts = shifts.filter(s => {
      const sd = parseLocalISODate(s.date)
      return sd.getFullYear() === year && sd.getMonth() === month
    })

    const hours = parseFloat(monthShifts.reduce((sum, s) => sum + s.hours, 0).toFixed(2))
    const grossEarnings = parseFloat(monthShifts.reduce((sum, s) => sum + s.totalEarnings, 0).toFixed(2))
    const avgHourlyRate = hours > 0 ? parseFloat((grossEarnings / hours).toFixed(2)) : 0

    result.push({ year, month, hours, grossEarnings, avgHourlyRate })
  }

  return result
}

// ── Context ───────────────────────────────────────

// Bounds the shifts fetch to a rolling window instead of a user's entire
// history: 12 months back (covers the stats page's 6-month breakdown with
// room to spare) plus a 1-month buffer for forward-dated shifts.
const HISTORY_MONTHS_BACK = 12
const HISTORY_MONTHS_FORWARD = 1

const getHistoryWindow = () => historyWindow(HISTORY_MONTHS_BACK, HISTORY_MONTHS_FORWARD)

// ── Row mapping ───────────────────────────────────

/* eslint-disable @typescript-eslint/no-explicit-any -- untyped Supabase rows */
const numOrNull = (v: any): number | null => (v === null || v === undefined ? null : Number(v))

const rowToShift = (s: any): Shift => ({
  id: s.id,
  date: s.date,
  startTime: s.start_time,
  endTime: s.end_time,
  hours: s.hours,
  salaryType: s.salary_type,
  baseSalary: s.base_salary,
  tips: s.tips,
  totalEarnings: s.total_earnings,
  isShabbatOrHoliday: s.is_shabbat_or_holiday,
  used150: s.used_150,
  jobId: s.job_id ?? null,
  hourlyRate: numOrNull(s.hourly_rate),
  regularHours: numOrNull(s.regular_hours),
  shabbatHours: numOrNull(s.shabbat_hours),
  shabbatPremiumApplied: s.shabbat_premium_applied ?? null,
  shabbatVerified: s.shabbat_verified ?? null,
})

const rowToJob = (j: any): Job => ({
  id: j.id,
  name: j.name,
  hourlyRate: numOrNull(j.hourly_rate),
  geonameid: j.geonameid,
  paysShabbatPremium: j.pays_shabbat_premium ?? null,
  color: j.color ?? null,
  archived: j.archived,
  pensionActive: j.pension_active ?? null,
  pensionEmployeePct: numOrNull(j.pension_employee_pct),
  tipsInPayslip: j.tips_in_payslip ?? null,
})
/* eslint-enable @typescript-eslint/no-explicit-any */

// Old columns (used_150, is_shabbat_or_holiday, base_salary, total_earnings)
// keep being written so older app versions still read correct data.
const shiftToRow = (shift: Omit<Shift, 'id'>) => ({
  date: shift.date,
  start_time: shift.startTime,
  end_time: shift.endTime,
  hours: shift.hours,
  salary_type: shift.salaryType,
  base_salary: shift.baseSalary,
  tips: shift.tips,
  total_earnings: shift.totalEarnings,
  is_shabbat_or_holiday: shift.isShabbatOrHoliday,
  used_150: shift.used150,
  job_id: shift.jobId,
  hourly_rate: shift.hourlyRate,
  regular_hours: shift.regularHours,
  shabbat_hours: shift.shabbatHours,
  shabbat_premium_applied: shift.shabbatPremiumApplied,
  shabbat_verified: shift.shabbatVerified,
})

const jobToRow = (job: JobInput) => ({
  name: job.name?.trim() || null,
  hourly_rate: job.hourlyRate,
  geonameid: job.geonameid,
  pays_shabbat_premium: job.paysShabbatPremium,
  archived: job.archived,
  pension_active: job.pensionActive,
  pension_employee_pct: job.pensionEmployeePct,
  tips_in_payslip: job.tipsInPayslip,
})

const LAST_JOB_KEY = 'oras.lastJobId'

const readLastJobId = (): string | null => {
  try { return localStorage.getItem(LAST_JOB_KEY) } catch { return null }
}

const writeLastJobId = (id: string | null) => {
  try {
    if (id) localStorage.setItem(LAST_JOB_KEY, id)
  } catch { /* storage unavailable: fall back to the latest shift's job */ }
}


const ShiftsContext = createContext<ShiftsContextType | null>(null)

export const ShiftsProvider = ({ children }: { children: ReactNode }) => {
  const [shifts, setShifts] = useState<Shift[]>([])
  const [jobs, setJobs] = useState<Job[]>([])
  const [storedLastJobId, setStoredLastJobId] = useState<string | null>(() => readLastJobId())
  const [userProfile, setUserProfileState] = useState<UserProfile>(defaultProfile)
  const [loadingData, setLoadingData] = useState(true)
  const [selectedMonth, setSelectedMonth] = useState(new Date())

  // Load data when component mounts
  useEffect(() => {
    loadUserData()
  }, [])

  const loadUserData = async () => {
    setLoadingData(true)
    try {
      // Get current logged in user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setLoadingData(false)
        return
      }

      // Load shifts (bounded to a rolling window, not the user's entire history)
      const { from, to } = getHistoryWindow()
      const { data: shiftsData, error: shiftsError } = await supabase
        .from('shifts')
        .select('*')
        .eq('user_id', user.id)
        .gte('date', from)
        .lte('date', to)
        .order('date', { ascending: false })

      if (shiftsError) {
        console.error('Shifts error:', shiftsError)
        reportError(shiftsError)
      }

      if (shiftsData) {
        setShifts(shiftsData.map(rowToShift))
      }

      const { data: jobsData, error: jobsError } = await supabase
        .from('jobs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })

      if (jobsError) {
        console.error('Jobs error:', jobsError)
        reportError(jobsError)
      }

      if (jobsData) {
        setJobs(jobsData.map(rowToJob))
      }

      // Load profile
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profileError) {
        console.error('Profile error:', profileError)
        reportError(profileError)
      }

      if (profileData) {
        setUserProfileState({
          gender: profileData.gender ?? null,
          children: parseStoredChildren(profileData.children, new Date().getFullYear()),
          parentColumn: profileData.parent_column === 1 || profileData.parent_column === 2 ? profileData.parent_column : null,
          serviceType: profileData.service_type ?? 'none',
          dischargeDate: profileData.discharge_date ?? null,
          isMoshavMember: profileData.is_moshav_member ?? false,
          isNewImmigrant: profileData.is_new_immigrant ?? false,
          immigrationYear: profileData.immigration_year ?? null,
          hasAcademicDegree: profileData.has_academic_degree ?? false,
          isPriorityArea: profileData.is_priority_area ?? false,
          defaultHourlyRate: profileData.default_hourly_rate ?? null,
        })
      }
    } catch (e) {
      console.error('Error loading data:', e)
      reportError(e)
    } finally {
      setLoadingData(false)
    }
  }

  const addShift = async (shift: Omit<Shift, 'id'>) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not signed in')

    const { data, error } = await supabase
      .from('shifts')
      .insert({ user_id: user.id, ...shiftToRow(shift) })
      .select()
      .single()

    if (error) {
      console.error('Error adding shift:', error)
      reportError(error)
      throw error
    }

    setShifts(prev => [rowToShift(data), ...prev])
    rememberJob(shift.jobId)
  }

  const updateShift = async (id: string, shift: Omit<Shift, 'id'>) => {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not signed in')

  const { data, error } = await supabase
    .from('shifts')
    .update(shiftToRow(shift))
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) {
    console.error('Error updating shift:', error)
    reportError(error)
    throw error
  }

  setShifts(prev => prev.map(s => s.id === id ? rowToShift(data) : s))
  rememberJob(shift.jobId)
}

  const rememberJob = (jobId: string | null) => {
    if (!jobId) return
    writeLastJobId(jobId)
    setStoredLastJobId(jobId)
  }

  const addJob = async (job: JobInput): Promise<Job> => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not signed in')

    const { data, error } = await supabase
      .from('jobs')
      .insert({ user_id: user.id, ...jobToRow(job) })
      .select()
      .single()

    if (error) {
      console.error('Error adding job:', error)
      reportError(error)
      throw error
    }

    const created = rowToJob(data)
    setJobs(prev => [...prev, created])
    return created
  }

  const updateJob = async (id: string, job: JobInput) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not signed in')

    const { data, error } = await supabase
      .from('jobs')
      .update(jobToRow(job))
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating job:', error)
      reportError(error)
      throw error
    }

    setJobs(prev => prev.map(j => j.id === id ? rowToJob(data) : j))
  }

  const lastUsedJobId = pickLastUsedJobId(jobs, shifts, storedLastJobId)

  const deleteShift = async (id: string) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not signed in')

    const { error } = await supabase
      .from('shifts')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      console.error('Error deleting shift:', error)
      reportError(error)
      throw error
    }

    setShifts(prev => prev.filter(s => s.id !== id))
  }

  const setUserProfile = async (profile: UserProfile) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not signed in')

    const { error } = await supabase
      .from('user_profiles')
      .upsert({
        id: user.id,
        gender: profile.gender,
        children: childrenToStored(profile.children, new Date().getFullYear()),
        parent_column: profile.parentColumn,
        service_type: profile.serviceType,
        discharge_date: profile.dischargeDate,
        is_moshav_member: profile.isMoshavMember,
        is_new_immigrant: profile.isNewImmigrant,
        immigration_year: profile.immigrationYear,
        has_academic_degree: profile.hasAcademicDegree,
        is_priority_area: profile.isPriorityArea,
        default_hourly_rate: profile.defaultHourlyRate,
      })

    if (error) {
      console.error('Error saving profile:', error)
      reportError(error)
      throw error
    }

    setUserProfileState(profile)
  }

const filteredShifts = shifts.filter(shift => {
  const shiftDate = parseLocalISODate(shift.date)

  return (
    shiftDate.getMonth() === selectedMonth.getMonth() &&
    shiftDate.getFullYear() === selectedMonth.getFullYear()
  )
})

  const taxInfo = calcTaxInfo(userProfile, filteredShifts, jobs, periodOf(selectedMonth))
  return (
  <ShiftsContext.Provider
    value={{
      shifts,
      filteredShifts,

      selectedMonth,
      setSelectedMonth,

      addShift,
      deleteShift,
      updateShift,

      jobs,
      addJob,
      updateJob,
      lastUsedJobId,

      userProfile,
      setUserProfile,

      taxInfo,
      loadingData,
    }}
  >
    {children}
  </ShiftsContext.Provider>
)
}

export const useShifts = () => {
  const ctx = useContext(ShiftsContext)
  if (!ctx) throw new Error('useShifts must be used inside ShiftsProvider')
  return ctx
}