import { describe, it, expect } from 'vitest'
import { getMonthlyBreakdown, type Shift } from './ShiftContext'
import { toLocalISODate } from '../utils/localDate'

// Shape of a shift saved before jobs existed: all new fields NULL.
const legacyShiftFields = {
  jobId: null,
  hourlyRate: null,
  regularHours: null,
  shabbatHours: null,
  shabbatPremiumApplied: null,
  shabbatVerified: null,
  overtimeCalculated: null, dailyThresholdMinutes: null, isNightShift: null,
  overtimeMinutes125: null, overtimeMinutes150: null, shabbatOtMinutes175: null, shabbatOtMinutes200: null,
}

describe('getMonthlyBreakdown', () => {
  it('groups hours and earnings by calendar month', () => {
    const now = new Date()
    const thisMonth = toLocalISODate(new Date(now.getFullYear(), now.getMonth(), 15))

    const shifts: Shift[] = [
      {
        id: '1', date: thisMonth, startTime: '09:00', endTime: '17:00',
        hours: 8, salaryType: 'total', baseSalary: 400, tips: 0,
        totalEarnings: 400, isShabbatOrHoliday: false, used150: false, ...legacyShiftFields,
      },
      {
        id: '2', date: thisMonth, startTime: '09:00', endTime: '13:00',
        hours: 4, salaryType: 'total', baseSalary: 200, tips: 0,
        totalEarnings: 200, isShabbatOrHoliday: false, used150: false, ...legacyShiftFields,
      },
    ]

    const breakdown = getMonthlyBreakdown(shifts, 1)
    expect(breakdown).toHaveLength(1)
    expect(breakdown[0].hours).toBe(12)
    expect(breakdown[0].grossEarnings).toBe(600)
    expect(breakdown[0].avgHourlyRate).toBe(50)
  })

  it('returns one entry per requested month, even with no shifts', () => {
    const breakdown = getMonthlyBreakdown([], 6)
    expect(breakdown).toHaveLength(6)
    breakdown.forEach(month => {
      expect(month.hours).toBe(0)
      expect(month.avgHourlyRate).toBe(0)
    })
  })

  it('puts a shift on the 1st in its own month in any timezone (local date, not UTC)', () => {
    const now = new Date()
    const first = toLocalISODate(new Date(now.getFullYear(), now.getMonth(), 1))
    const shift: Shift = {
      id: '1', date: first, startTime: '09:00', endTime: '17:00',
      hours: 8, salaryType: 'total', baseSalary: 400, tips: 0,
      totalEarnings: 400, isShabbatOrHoliday: false, used150: false, ...legacyShiftFields,
    }
    expect(getMonthlyBreakdown([shift], 1)[0].grossEarnings).toBe(400)
  })
})
