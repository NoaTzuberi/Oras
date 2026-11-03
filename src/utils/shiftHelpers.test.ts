import { describe, it, expect } from 'vitest'
import { shiftBaseRate } from './shiftHelpers'

const legacy = { hourlyRate: null }

describe('shiftBaseRate', () => {
  it('uses the stored hourly rate when present', () => {
    expect(shiftBaseRate({ salaryType: 'hourly', hours: 8, baseSalary: 999, used150: true, hourlyRate: 50 })).toBe(50)
  })

  it('derives the rate for an old regular shift', () => {
    expect(shiftBaseRate({ salaryType: 'hourly', hours: 8, baseSalary: 400, used150: false, ...legacy })).toBe(50)
  })

  it('undoes the x1.5 for an old 150% shift instead of inflating it', () => {
    // 8h x 50 x 1.5 = 600 stored in base_salary
    expect(shiftBaseRate({ salaryType: 'hourly', hours: 8, baseSalary: 600, used150: true, ...legacy })).toBe(50)
  })

  it('returns null for daily-total shifts', () => {
    expect(shiftBaseRate({ salaryType: 'total', hours: 8, baseSalary: 450, used150: false, ...legacy })).toBeNull()
  })

  it('returns null when hours are 0', () => {
    expect(shiftBaseRate({ salaryType: 'hourly', hours: 0, baseSalary: 0, used150: false, ...legacy })).toBeNull()
  })

  it('re-saving a 150% shift keeps the same pay (no compounding)', () => {
    const rate = shiftBaseRate({ salaryType: 'hourly', hours: 8, baseSalary: 600, used150: true, ...legacy })!
    expect(rate * 8 * 1.5).toBe(600)
  })
})
