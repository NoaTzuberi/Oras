import { describe, it, expect } from 'vitest'
import type { Shift } from '../context/ShiftContext'
import { initialPremiumOverride, isPreservedShift, preservedBasePay, recalcTriggered } from './editShiftPay'
import { shiftBaseRate } from './shiftHelpers'

// Saturday 18:00 -> 00:30 at 150%, saved before the split (prod pattern)
const legacy: Shift = {
  id: '1', date: '2026-07-18', startTime: '18:00', endTime: '00:30', hours: 6.5,
  salaryType: 'hourly', baseSalary: 487.5, tips: 10, totalEarnings: 497.5,
  isShabbatOrHoliday: true, used150: true,
  jobId: null, hourlyRate: null, regularHours: null, shabbatHours: null,
  shabbatPremiumApplied: null, shabbatVerified: null,
  overtimeCalculated: null, dailyThresholdMinutes: null, isNightShift: null,
  overtimeMinutes125: null, overtimeMinutes150: null, shabbatOtMinutes175: null, shabbatOtMinutes200: null,
}

const unchanged = { date: legacy.date, startTime: legacy.startTime, endTime: legacy.endTime, jobId: legacy.jobId, premiumTouched: false }

describe('isPreservedShift', () => {
  it('legacy (NULL) and unverified (false) shifts keep their pay; verified ones are recalculated', () => {
    expect(isPreservedShift({ shabbatVerified: null, overtimeCalculated: null })).toBe(true)
    expect(isPreservedShift({ shabbatVerified: false, overtimeCalculated: null })).toBe(true)
    expect(isPreservedShift({ shabbatVerified: true, overtimeCalculated: true })).toBe(false)
  })

  it('verified Shabbat split saved before overtime (overtime NULL) also keeps its pay', () => {
    expect(isPreservedShift({ shabbatVerified: true, overtimeCalculated: null })).toBe(true)
    expect(isPreservedShift({ shabbatVerified: true, overtimeCalculated: false })).toBe(false) // computed, OT off for the job
    expect(isPreservedShift({ shabbatVerified: false, overtimeCalculated: true })).toBe(true)  // unverified
  })
})

describe('recalcTriggered', () => {
  it('opening and saving without changes keeps the old calculation', () => {
    expect(recalcTriggered(legacy, unchanged)).toBe(false)
  })

  it.each([
    ['date', { date: '2026-07-25' }],
    ['start', { startTime: '17:00' }],
    ['end', { endTime: '01:00' }],
    ['job', { jobId: 'job-2' }],
    ['premium checkbox', { premiumTouched: true }],
  ])('changing the %s switches to the new split', (_, change) => {
    expect(recalcTriggered(legacy, { ...unchanged, ...change })).toBe(true)
  })
})

describe('preservedBasePay', () => {
  const rate = shiftBaseRate(legacy)!

  it('unchanged: exactly the stored base_salary', () => {
    expect(preservedBasePay(legacy, { salaryType: 'hourly', rate, rateChanged: false, totalSalary: null })).toBe(487.5)
  })

  it('unchanged keeps the exact cents even when the derived rate is rounded', () => {
    const odd = { ...legacy, hours: 7, baseSalary: 500, totalEarnings: 510 }
    const r = shiftBaseRate(odd)! // 47.62
    expect(r * 7 * 1.5).not.toBe(500)
    expect(preservedBasePay(odd, { salaryType: 'hourly', rate: r, rateChanged: false, totalSalary: null })).toBe(500)
  })

  it('rate change: old formula, whole shift x1.5 kept', () => {
    expect(preservedBasePay(legacy, { salaryType: 'hourly', rate: 60, rateChanged: true, totalSalary: null })).toBe(585)
  })

  it('rate change on a non-150% shift: rate x hours', () => {
    expect(preservedBasePay({ ...legacy, used150: false, baseSalary: 325 }, { salaryType: 'hourly', rate: 60, rateChanged: true, totalSalary: null })).toBe(390)
  })

  it('rate change on a split shift (stored rate): the stored pay scaled to the new rate', () => {
    // 5h regular + 6h Shabbat x1.5 at 50 = 700 -> at 60 = 840; with overtime it's linear in the rate too
    const split = { ...legacy, hours: 11, hourlyRate: 50, baseSalary: 700, used150: true, shabbatVerified: true, regularHours: 5, shabbatHours: 6 }
    expect(preservedBasePay(split, { salaryType: 'hourly', rate: 60, rateChanged: true, totalSalary: null })).toBe(840)
    const unverifiedOt = { ...legacy, hours: 10, hourlyRate: 50, baseSalary: 517.5, used150: false, shabbatVerified: false }
    expect(preservedBasePay(unverifiedOt, { salaryType: 'hourly', rate: 55, rateChanged: true, totalSalary: null })).toBe(569.25)
  })

  it('switching to daily total uses the typed amount', () => {
    expect(preservedBasePay(legacy, { salaryType: 'total', rate: null, rateChanged: false, totalSalary: 450 })).toBe(450)
  })

  it('daily total -> hourly: rate x stored hours, no premium', () => {
    const total = { ...legacy, salaryType: 'total' as const, used150: false, baseSalary: 450 }
    expect(preservedBasePay(total, { salaryType: 'hourly', rate: 50, rateChanged: true, totalSalary: null })).toBe(325)
  })
})

describe('initialPremiumOverride', () => {
  it('legacy Shabbat shift: keeps the old 150% choice', () => {
    expect(initialPremiumOverride(legacy)).toBe(true)
    expect(initialPremiumOverride({ ...legacy, used150: false })).toBe(false)
  })

  it('legacy weekday shift: no choice was made, follow the job', () => {
    expect(initialPremiumOverride({ ...legacy, isShabbatOrHoliday: false, used150: false })).toBeNull()
  })

  it('split shift: the stored choice, not the job default', () => {
    expect(initialPremiumOverride({ ...legacy, shabbatVerified: true, shabbatPremiumApplied: false })).toBe(false)
    expect(initialPremiumOverride({ ...legacy, shabbatVerified: false, shabbatPremiumApplied: true })).toBe(true)
  })
})
