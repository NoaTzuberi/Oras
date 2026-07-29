import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { supabase } from '../lib/supabase'
import { reportError } from '../lib/sentry'

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
}

export type UserProfile = {
  gender: 'male' | 'female' | null
  children: { age: number }[]
  militaryYears: number
  isMoshavMember: boolean
  isNewImmigrant: boolean
  immigrationYear: number | null
  hasAcademicDegree: boolean
  isPriorityArea: boolean
  defaultHourlyRate: number | null
}

export type TaxInfo = {
  creditPoints: number
  monthlyTaxCredit: number
  grossSalary: number
  netSalary: number
  incomeTax: number
  nationalInsurance: number
  healthInsurance: number
}

type ShiftsContextType = {
  shifts: Shift[]
  addShift: (shift: Omit<Shift, 'id'>) => Promise<void>
  updateShift: (id: string, shift: Omit<Shift, 'id'>) => Promise<void>
  deleteShift: (id: string) => Promise<void>
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
  militaryYears: 0,
  isMoshavMember: false,
  isNewImmigrant: false,
  immigrationYear: null,
  hasAcademicDegree: false,
  isPriorityArea: false,
  defaultHourlyRate: null,
}

// ── Tax calculation ───────────────────────────────

const CREDIT_POINT_MONTHLY = 242

export const calcCreditPoints = (profile: UserProfile): number => {
  let points = 0

  if (profile.gender === 'female') points += 2.75
  else if (profile.gender === 'male') points += 2.25
  else return 0

  profile.children.forEach(child => {
    const age = child.age
    if (age === 0) points += 1.5
    else if (age >= 1 && age <= 6) points += 2.5
    else if (age >= 7 && age <= 18) points += 1
  })

  if (profile.militaryYears >= 2) points += 1
  if (profile.militaryYears >= 3) points += 0.5

  if (profile.isMoshavMember) points += 1

  if (profile.isNewImmigrant && profile.immigrationYear) {
    const yearsInIsrael = new Date().getFullYear() - profile.immigrationYear
    if (yearsInIsrael <= 3) points += 3
    else if (yearsInIsrael <= 6) points += 2
    else if (yearsInIsrael <= 10) points += 1
  }

  if (profile.hasAcademicDegree) points += 0.5
  if (profile.isPriorityArea) points += 0.5

  return parseFloat(points.toFixed(2))
}

const calcIncomeTax = (monthlyGross: number, creditPoints: number): number => {
  const brackets = [
    { limit: 7010, rate: 0.10 },
    { limit: 10060, rate: 0.14 },
    { limit: 16150, rate: 0.20 },
    { limit: 21440, rate: 0.31 },
    { limit: 44520, rate: 0.35 },
    { limit: 55270, rate: 0.47 },
    { limit: Infinity, rate: 0.50 },
  ]

  let tax = 0
  let remaining = monthlyGross
  let prev = 0

  for (const bracket of brackets) {
    if (remaining <= 0) break
    const taxable = Math.min(remaining, bracket.limit - prev)
    tax += taxable * bracket.rate
    remaining -= taxable
    prev = bracket.limit
  }

  return Math.max(0, parseFloat((tax - creditPoints * CREDIT_POINT_MONTHLY).toFixed(2)))
}

const calcNationalInsurance = (monthlyGross: number): number => {
  if (monthlyGross <= 7522) return parseFloat((monthlyGross * 0.04).toFixed(2))
  return parseFloat((7522 * 0.04 + (monthlyGross - 7522) * 0.07).toFixed(2))
}

const calcHealthInsurance = (monthlyGross: number): number => {
  if (monthlyGross <= 7522) return parseFloat((monthlyGross * 0.031).toFixed(2))
  return parseFloat((7522 * 0.031 + (monthlyGross - 7522) * 0.05).toFixed(2))
}

export const calcTaxInfo = (profile: UserProfile, shifts: Shift[]): TaxInfo => {
  const creditPoints = calcCreditPoints(profile)
  const monthlyTaxCredit = parseFloat((creditPoints * CREDIT_POINT_MONTHLY).toFixed(2))

  const grossSalary = parseFloat(shifts.reduce((sum, s) => sum + s.totalEarnings, 0).toFixed(2))
  const incomeTax = calcIncomeTax(grossSalary, creditPoints)
  const nationalInsurance = calcNationalInsurance(grossSalary)
  const healthInsurance = calcHealthInsurance(grossSalary)
  const netSalary = parseFloat((grossSalary - incomeTax - nationalInsurance - healthInsurance).toFixed(2))

  return { creditPoints, monthlyTaxCredit, grossSalary, netSalary, incomeTax, nationalInsurance, healthInsurance }
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
      const sd = new Date(s.date)
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

const getHistoryWindow = () => {
  const now = new Date()
  const from = new Date(now.getFullYear(), now.getMonth() - HISTORY_MONTHS_BACK, 1)
  const to = new Date(now.getFullYear(), now.getMonth() + HISTORY_MONTHS_FORWARD + 1, 0)
  const toISODate = (d: Date) => d.toISOString().split('T')[0]
  return { from: toISODate(from), to: toISODate(to) }
}

const ShiftsContext = createContext<ShiftsContextType | null>(null)

export const ShiftsProvider = ({ children }: { children: ReactNode }) => {
  const [shifts, setShifts] = useState<Shift[]>([])
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
        setShifts(shiftsData.map(s => ({
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
        })))
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
          children: profileData.children ?? [],
          militaryYears: profileData.military_years ?? 0,
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
      .insert({
        user_id: user.id,
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
      })
      .select()
      .single()

    if (error) {
      console.error('Error adding shift:', error)
      reportError(error)
      throw error
    }

    setShifts(prev => [{
      id: data.id,
      date: data.date,
      startTime: data.start_time,
      endTime: data.end_time,
      hours: data.hours,
      salaryType: data.salary_type,
      baseSalary: data.base_salary,
      tips: data.tips,
      totalEarnings: data.total_earnings,
      isShabbatOrHoliday: data.is_shabbat_or_holiday,
      used150: data.used_150,
    }, ...prev])
  }

  const updateShift = async (id: string, shift: Omit<Shift, 'id'>) => {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not signed in')

  const { data, error } = await supabase
    .from('shifts')
    .update({
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
    })
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) {
    console.error('Error updating shift:', error)
    reportError(error)
    throw error
  }

  setShifts(prev => prev.map(s => s.id === id ? {
    id: data.id,
    date: data.date,
    startTime: data.start_time,
    endTime: data.end_time,
    hours: data.hours,
    salaryType: data.salary_type,
    baseSalary: data.base_salary,
    tips: data.tips,
    totalEarnings: data.total_earnings,
    isShabbatOrHoliday: data.is_shabbat_or_holiday,
    used150: data.used_150,
  } : s))
}

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
        children: profile.children,
        military_years: profile.militaryYears,
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
  const shiftDate = new Date(shift.date)

  return (
    shiftDate.getMonth() === selectedMonth.getMonth() &&
    shiftDate.getFullYear() === selectedMonth.getFullYear()
  )
})

  const taxInfo = calcTaxInfo(userProfile, filteredShifts)
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