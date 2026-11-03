import { describe, it, expect } from 'vitest'
import { computeShiftPay, type ShiftPayInput } from './shiftPay'
import { jerusalemDateTime } from './shabbat'

const windows = [{ start: jerusalemDateTime('2026-07-17', '18:00'), end: jerusalemDateTime('2026-07-18', '18:30') }]
const base: ShiftPayInput = {
  date: '2026-07-17', startTime: '13:00', endTime: '00:00',
  salaryType: 'hourly', rate: 50, totalSalary: null,
  premiumApplied: true,
  shabbat: { status: 'ok', windows, isYomTov: false },
}

describe('computeShiftPay', () => {
  it('hourly with premium: 5h x 50 + 6h x 75', () => {
    const r = computeShiftPay(base)!
    expect(r.split).toEqual({ regularHours: 5, shabbatHours: 6 })
    expect(r.baseSalary).toBe(700)
    expect(r.hours).toBe(11)
    expect(r.premiumUsed).toBe(true)
    expect(r.verified).toBe(true)
    expect(r.isShabbatOrHoliday).toBe(true)
  })

  it('premium off (job pays_shabbat_premium = false): split kept, no x1.5', () => {
    const r = computeShiftPay({ ...base, premiumApplied: false })!
    expect(r.split).toEqual({ regularHours: 5, shabbatHours: 6 })
    expect(r.baseSalary).toBe(550)
    expect(r.premiumUsed).toBe(false)
  })

  it('premium on but no Shabbat hours: premiumUsed is false (legacy used_150 stays false)', () => {
    const r = computeShiftPay({ ...base, startTime: '08:00', endTime: '14:00' })!
    expect(r.baseSalary).toBe(300)
    expect(r.premiumUsed).toBe(false)
    expect(r.isShabbatOrHoliday).toBe(false)
  })

  it('daily total: amount unchanged, Shabbat hours shown as info', () => {
    const r = computeShiftPay({ ...base, salaryType: 'total', rate: null, totalSalary: 450 })!
    expect(r.baseSalary).toBe(450)
    expect(r.split).toEqual({ regularHours: 5, shabbatHours: 6 })
    expect(r.premiumUsed).toBe(false)
  })

  it('Shabbat times failed: paid at the rate, marked unverified', () => {
    const r = computeShiftPay({ ...base, shabbat: { status: 'error' } })!
    expect(r.split).toBeNull()
    expect(r.baseSalary).toBe(550)
    expect(r.verified).toBe(false)
  })

  it('yom tov without Shabbat hours still sets the legacy holiday flag', () => {
    const r = computeShiftPay({ ...base, startTime: '08:00', endTime: '14:00', shabbat: { status: 'ok', windows, isYomTov: true } })!
    expect(r.isShabbatOrHoliday).toBe(true)
  })

  it('returns null for missing times or start == end', () => {
    expect(computeShiftPay({ ...base, endTime: '' })).toBeNull()
    expect(computeShiftPay({ ...base, startTime: '09:00', endTime: '09:00' })).toBeNull()
  })

  it('hours are real elapsed time across the DST switch', () => {
    const r = computeShiftPay({ ...base, date: '2026-03-26', startTime: '22:00', endTime: '06:00', shabbat: { status: 'ok', windows: [], isYomTov: false } })!
    expect(r.hours).toBe(7)
  })
})
