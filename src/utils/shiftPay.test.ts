import { describe, it, expect } from 'vitest'
import { computeShiftPay, overtimeColumns, type ShiftPayInput } from './shiftPay'
import { jerusalemDateTime } from './shabbat'
import { DEFAULT_OVERTIME_SETTINGS } from './overtime'

const windows = [{ start: jerusalemDateTime('2026-07-17', '18:00'), end: jerusalemDateTime('2026-07-18', '18:30') }]
const base: ShiftPayInput = {
  date: '2026-07-17', startTime: '13:00', endTime: '00:00',
  salaryType: 'hourly', rate: 50, totalSalary: null,
  premiumApplied: true,
  shabbat: { status: 'ok', windows, isYomTov: false },
  // The Shabbat cases below predate overtime; overtime has its own block
  overtime: { settings: { ...DEFAULT_OVERTIME_SETTINGS, enabled: false }, otherShifts: [] },
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

describe('computeShiftPay with overtime', () => {
  // Fri 2026-11-06, Shabbat from 16:34
  const fridayWindows = [{ start: jerusalemDateTime('2026-11-06', '16:34'), end: jerusalemDateTime('2026-11-07', '17:32') }]
  const ot: ShiftPayInput = {
    ...base,
    date: '2026-11-04', startTime: '08:00', endTime: '18:00',
    shabbat: { status: 'ok', windows: fridayWindows, isYomTov: false },
    overtime: { settings: DEFAULT_OVERTIME_SETTINGS, otherShifts: [] },
  }

  it('10h weekday: base salary includes 1:24 at 125%', () => {
    const r = computeShiftPay(ot)!
    expect(r.baseSalary).toBe(517.5)
    expect(r.overtime.minutes).toMatchObject({ regular: 516, ot125: 84 })
    expect(r.overtime.pay).toMatchObject({ regular: 430, ot125: 87.5, total: 517.5 })
    expect(r.overtime).toMatchObject({ enabled: true, isNight: false, thresholdMinutes: 516 })
    expect(r.split).toEqual({ regularHours: 10, shabbatHours: 0 })
  })

  it('Friday 13:00-00:00: segments and summary (night shift, 7h day)', () => {
    const r = computeShiftPay({ ...ot, date: '2026-11-06', startTime: '13:00', endTime: '00:00' })!
    expect(r.overtime.isNight).toBe(true)
    expect(r.overtime.segments.map(s => [s.minutes, s.shabbat, s.tier, s.multiplier])).toEqual([
      [214, false, 0, 1], [206, true, 0, 1.5], [120, true, 1, 1.75], [120, true, 2, 2],
    ])
    expect(r.overtime.pay).toEqual({ regular: 178.5, ot125: 0, ot150: 0, shabbat: 257.25, shabbatOt175: 175, shabbatOt200: 200, total: 810.75 })
    expect(r.baseSalary).toBe(810.75)
    expect(r.split).toEqual({ regularHours: 3.57, shabbatHours: 7.43 })
  })

  it('two shifts of the same job on the same date: OT on the later one only', () => {
    const later = computeShiftPay({
      ...ot, startTime: '15:00', endTime: '19:00',
      overtime: { settings: DEFAULT_OVERTIME_SETTINGS, otherShifts: [{ key: 'x', date: '2026-11-04', startTime: '08:00', endTime: '14:00' }] },
    })!
    expect(later.overtime.minutesBefore).toBe(360)
    expect(later.overtime.minutes).toMatchObject({ regular: 156, ot125: 84 })
    expect(later.baseSalary).toBe(217.5)
  })

  it('no other shifts passed (different job, or no job): no combining', () => {
    const r = computeShiftPay({ ...ot, startTime: '15:00', endTime: '19:00' })!
    expect(r.overtime.minutes.ot125).toBe(0)
    expect(r.baseSalary).toBe(200)
  })

  it('overtime disabled on the job: plain pay, no OT minutes', () => {
    const r = computeShiftPay({ ...ot, overtime: { settings: { ...DEFAULT_OVERTIME_SETTINGS, enabled: false }, otherShifts: [] } })!
    expect(r.baseSalary).toBe(500)
    expect(r.overtime.enabled).toBe(false)
    expect(r.overtime.minutes).toMatchObject({ regular: 600, ot125: 0 })
  })

  it('daily total: OT minutes as info, pay unchanged', () => {
    const r = computeShiftPay({ ...ot, salaryType: 'total', rate: null, totalSalary: 450 })!
    expect(r.baseSalary).toBe(450)
    expect(r.overtime.minutes.ot125).toBe(84)
    expect(r.overtime.pay).toBeNull()
  })

  it('Shabbat times failed: overtime still applies, Shabbat unknown', () => {
    const r = computeShiftPay({ ...ot, shabbat: { status: 'error' } })!
    expect(r.split).toBeNull()
    expect(r.verified).toBe(false)
    expect(r.baseSalary).toBe(517.5)
  })

  it('stored columns', () => {
    const r = computeShiftPay({ ...ot, date: '2026-11-06', startTime: '13:00', endTime: '00:00' })!
    expect(overtimeColumns(r)).toEqual({
      overtimeCalculated: true, dailyThresholdMinutes: 420, isNightShift: true,
      overtimeMinutes125: 0, overtimeMinutes150: 0, shabbatOtMinutes175: 120, shabbatOtMinutes200: 120,
    })
    const off = computeShiftPay({ ...ot, overtime: { settings: { ...DEFAULT_OVERTIME_SETTINGS, enabled: false }, otherShifts: [] } })!
    expect(overtimeColumns(off)).toMatchObject({ overtimeCalculated: false, dailyThresholdMinutes: null, overtimeMinutes125: 0 })
  })
})
