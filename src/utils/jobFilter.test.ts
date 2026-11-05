import { describe, it, expect } from 'vitest'
import type { Job, Shift } from '../context/ShiftContext'
import { filterShiftsByJob, jobBreakdown, resolveJobFilter } from './jobFilter'

const job = (id: string, archived = false): Job => ({
  id, name: id, hourlyRate: 50, geonameid: 293397, paysShabbatPremium: true, color: '#6366F1',
  archived, pensionActive: null, pensionEmployeePct: null, tipsInPayslip: null,
  weekPattern: null, customDailyThresholdHours: null, overtimeEnabled: null, shortDayWeekday: null,
})

const shift = (id: string, jobId: string | null, hours: number, total: number): Shift => ({
  id, date: '2026-11-01', startTime: '08:00', endTime: '16:00', hours, salaryType: 'hourly',
  baseSalary: total, tips: 0, totalEarnings: total, isShabbatOrHoliday: false, used150: false,
  jobId, hourlyRate: 50, regularHours: null, shabbatHours: null, shabbatPremiumApplied: null, shabbatVerified: true,
  overtimeCalculated: null, dailyThresholdMinutes: null, isNightShift: null,
  overtimeMinutes125: null, overtimeMinutes150: null, shabbatOtMinutes175: null, shabbatOtMinutes200: null,
})

describe('resolveJobFilter', () => {
  it('is "All" with 0-1 active jobs', () => {
    expect(resolveJobFilter([], 'a')).toBeNull()
    expect(resolveJobFilter([job('a'), job('b', true)], 'a')).toBeNull()
  })

  it('keeps a stored active job, drops an archived or unknown one', () => {
    const jobs = [job('a'), job('b'), job('c', true)]
    expect(resolveJobFilter(jobs, 'b')).toBe('b')
    expect(resolveJobFilter(jobs, 'c')).toBeNull()
    expect(resolveJobFilter(jobs, 'zzz')).toBeNull()
    expect(resolveJobFilter(jobs, null)).toBeNull()
  })
})

describe('filterShiftsByJob', () => {
  it('filters by job, or returns everything for "All"', () => {
    const shifts = [shift('1', 'a', 8, 400), shift('2', 'b', 4, 200), shift('3', null, 2, 100)]
    expect(filterShiftsByJob(shifts, null)).toHaveLength(3)
    expect(filterShiftsByJob(shifts, 'b').map(s => s.id)).toEqual(['2'])
  })
})

describe('jobBreakdown', () => {
  it('sums per job in job order, archived included, no job last', () => {
    const jobs = [job('a'), job('b', true)]
    const rows = jobBreakdown([
      shift('1', null, 2, 100), shift('2', 'b', 4, 200.1), shift('3', 'a', 8, 400), shift('4', 'a', 1.5, 75.2),
    ], jobs)
    expect(rows.map(r => [r.jobId, r.hours, r.gross])).toEqual([
      ['a', 9.5, 475.2], ['b', 4, 200.1], [null, 2, 100],
    ])
  })
})
