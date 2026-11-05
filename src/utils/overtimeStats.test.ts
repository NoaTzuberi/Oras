import { describe, it, expect } from 'vitest'
import type { Shift } from '../context/ShiftContext'
import { monthlyOvertime, storedBuckets } from './overtimeStats'

const base: Shift = {
  id: 's', date: '2026-11-06', startTime: '13:00', endTime: '00:00', hours: 11,
  salaryType: 'hourly', baseSalary: 810.75, tips: 0, totalEarnings: 810.75,
  isShabbatOrHoliday: true, used150: true,
  jobId: 'A', hourlyRate: 50, regularHours: 3.57, shabbatHours: 7.43, shabbatPremiumApplied: true, shabbatVerified: true,
  overtimeCalculated: true, dailyThresholdMinutes: 420, isNightShift: true,
  overtimeMinutes125: 0, overtimeMinutes150: 0, shabbatOtMinutes175: 120, shabbatOtMinutes200: 120,
}
const old: Shift = { ...base, overtimeCalculated: null, overtimeMinutes125: null, overtimeMinutes150: null, shabbatOtMinutes175: null, shabbatOtMinutes200: null }

describe('storedBuckets', () => {
  it('rebuilds the minutes per rate from the stored columns', () => {
    expect(storedBuckets(base)).toEqual({ regular: 214, ot125: 0, ot150: 0, shabbat: 206, shabbatOt175: 120, shabbatOt200: 120 })
  })

  it('unverified shift (no Shabbat split): all non-OT minutes are regular', () => {
    expect(storedBuckets({ ...base, regularHours: null, shabbatHours: null, hours: 10, shabbatOtMinutes175: 0, shabbatOtMinutes200: 0, overtimeMinutes125: 84 }))
      .toEqual({ regular: 516, ot125: 84, ot150: 0, shabbat: 0, shabbatOt175: 0, shabbatOt200: 0 })
  })

  it('old shifts: null', () => {
    expect(storedBuckets(old)).toBeNull()
  })
})

describe('monthlyOvertime', () => {
  it('sums minutes by the rate actually paid', () => {
    const weekday = { ...base, regularHours: 10, shabbatHours: 0, overtimeMinutes125: 84, shabbatOtMinutes175: 0, shabbatOtMinutes200: 0 }
    const noPremium = { ...base, shabbatPremiumApplied: false }
    expect(monthlyOvertime([base, weekday, noPremium, old])).toEqual({ 125: 84 + 120, 150: 120, 175: 120, 200: 120 })
  })

  it('daily-total shifts are left out: their overtime is info only, not paid', () => {
    expect(monthlyOvertime([{ ...base, salaryType: 'total' }])).toEqual({ 125: 0, 150: 0, 175: 0, 200: 0 })
  })
})
