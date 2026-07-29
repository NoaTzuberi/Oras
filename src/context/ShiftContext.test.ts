import { describe, it, expect } from 'vitest'
import {
  calcCreditPoints,
  calcTaxInfo,
  calcServiceCreditPoints,
  isServiceCreditEligible,
  getMonthlyBreakdown,
  type UserProfile,
  type Shift,
} from './ShiftContext'

const baseProfile: UserProfile = {
  gender: null,
  children: [],
  serviceType: 'none',
  dischargeDate: null,
  isMoshavMember: false,
  isNewImmigrant: false,
  immigrationYear: null,
  hasAcademicDegree: false,
  isPriorityArea: false,
  defaultHourlyRate: null,
}

describe('calcCreditPoints', () => {
  it('returns 0 when gender is not set', () => {
    expect(calcCreditPoints(baseProfile)).toBe(0)
  })

  it('gives base points by gender', () => {
    expect(calcCreditPoints({ ...baseProfile, gender: 'male' })).toBe(2.25)
    expect(calcCreditPoints({ ...baseProfile, gender: 'female' })).toBe(2.75)
  })

  it('adds points per child based on age bracket', () => {
    expect(calcCreditPoints({ ...baseProfile, gender: 'female', children: [{ age: 0 }] })).toBe(4.25) // 2.75 + 1.5
    expect(calcCreditPoints({ ...baseProfile, gender: 'female', children: [{ age: 3 }] })).toBe(5.25) // 2.75 + 2.5
    expect(calcCreditPoints({ ...baseProfile, gender: 'female', children: [{ age: 10 }] })).toBe(3.75) // 2.75 + 1
  })

  it('adds service credit points for an eligible military or national service member', () => {
    const now = new Date()
    const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0]

    expect(calcCreditPoints({
      ...baseProfile, gender: 'male', serviceType: 'military', dischargeDate: oneMonthAgo,
    })).toBe(4.25) // 2.25 + 2

    expect(calcCreditPoints({
      ...baseProfile, gender: 'male', serviceType: 'national', dischargeDate: oneMonthAgo,
    })).toBe(4.25) // 2.25 + 2
  })

  it('gives no service credit when serviceType is none, regardless of discharge date', () => {
    const now = new Date()
    const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0]

    expect(calcCreditPoints({
      ...baseProfile, gender: 'male', serviceType: 'none', dischargeDate: oneMonthAgo,
    })).toBe(2.25)
  })

  it('gives no service credit once the 36-month eligibility window has passed', () => {
    const now = new Date()
    const fourYearsAgo = new Date(now.getFullYear() - 4, now.getMonth(), 1).toISOString().split('T')[0]

    expect(calcCreditPoints({
      ...baseProfile, gender: 'male', serviceType: 'military', dischargeDate: fourYearsAgo,
    })).toBe(2.25)
  })

  it('adds moshav, academic degree, and priority area bonuses', () => {
    expect(calcCreditPoints({ ...baseProfile, gender: 'male', isMoshavMember: true })).toBe(3.25)
    expect(calcCreditPoints({ ...baseProfile, gender: 'male', hasAcademicDegree: true })).toBe(2.75)
    expect(calcCreditPoints({ ...baseProfile, gender: 'male', isPriorityArea: true })).toBe(2.75)
  })

  it('adds new-immigrant points based on years since immigration', () => {
    const thisYear = new Date().getFullYear()
    expect(calcCreditPoints({
      ...baseProfile, gender: 'male', isNewImmigrant: true, immigrationYear: thisYear,
    })).toBe(5.25) // 2.25 + 3
    expect(calcCreditPoints({
      ...baseProfile, gender: 'male', isNewImmigrant: true, immigrationYear: thisYear - 5,
    })).toBe(4.25) // 2.25 + 2
    expect(calcCreditPoints({
      ...baseProfile, gender: 'male', isNewImmigrant: true, immigrationYear: thisYear - 15,
    })).toBe(2.25) // outside the 10-year window, no bonus
  })
})

describe('calcTaxInfo', () => {
  const shiftWithEarnings = (totalEarnings: number): Shift => ({
    id: '1',
    date: '2026-01-01',
    startTime: '09:00',
    endTime: '17:00',
    hours: 8,
    salaryType: 'total',
    baseSalary: totalEarnings,
    tips: 0,
    totalEarnings,
    isShabbatOrHoliday: false,
    used150: false,
  })

  it('computes gross, tax, insurance, and net for a mid-range salary', () => {
    // gross 8000, credit points 2.25 (male, no extras)
    const profile: UserProfile = { ...baseProfile, gender: 'male' }
    const result = calcTaxInfo(profile, [shiftWithEarnings(8000)])

    expect(result.grossSalary).toBe(8000)
    expect(result.incomeTax).toBeCloseTo(295.1, 2)
    expect(result.nationalInsurance).toBeCloseTo(334.34, 2)
    expect(result.healthInsurance).toBeCloseTo(257.08, 2)
    expect(result.netSalary).toBeCloseTo(7113.48, 2)
  })

  it('never returns negative income tax when credit points fully offset the bracket tax', () => {
    const profile: UserProfile = { ...baseProfile, gender: 'male' } // 2.25 credit points
    const result = calcTaxInfo(profile, [shiftWithEarnings(3000)])

    expect(result.incomeTax).toBe(0)
    expect(result.nationalInsurance).toBeCloseTo(120, 2)
    expect(result.healthInsurance).toBeCloseTo(93, 2)
    expect(result.netSalary).toBeCloseTo(2787, 2)
  })

  it('sums earnings across multiple shifts for gross salary', () => {
    const profile: UserProfile = { ...baseProfile, gender: 'female' }
    const result = calcTaxInfo(profile, [shiftWithEarnings(1000), shiftWithEarnings(2000)])

    expect(result.grossSalary).toBe(3000)
  })

  it('returns zero everything for no shifts', () => {
    const profile: UserProfile = { ...baseProfile, gender: 'male' }
    const result = calcTaxInfo(profile, [])

    expect(result.grossSalary).toBe(0)
    expect(result.incomeTax).toBe(0)
    expect(result.netSalary).toBe(0)
  })
})

describe('getMonthlyBreakdown', () => {
  it('groups hours and earnings by calendar month', () => {
    const now = new Date()
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 15).toISOString().split('T')[0]

    const shifts: Shift[] = [
      {
        id: '1', date: thisMonth, startTime: '09:00', endTime: '17:00',
        hours: 8, salaryType: 'total', baseSalary: 400, tips: 0,
        totalEarnings: 400, isShabbatOrHoliday: false, used150: false,
      },
      {
        id: '2', date: thisMonth, startTime: '09:00', endTime: '13:00',
        hours: 4, salaryType: 'total', baseSalary: 200, tips: 0,
        totalEarnings: 200, isShabbatOrHoliday: false, used150: false,
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
})

describe('isServiceCreditEligible', () => {
  // Fixed reference date so these boundary tests are fully deterministic,
  // independent of when the test suite actually runs.
  const referenceNow = new Date(2026, 6, 15) // July 15, 2026

  it('is not eligible when there is no discharge date', () => {
    expect(isServiceCreditEligible(null, referenceNow)).toBe(false)
  })

  it('is not eligible for an unparseable date', () => {
    expect(isServiceCreditEligible('not-a-date', referenceNow)).toBe(false)
  })

  it('is not eligible before the window opens (discharged this same month)', () => {
    // Eligibility starts the month AFTER discharge, so this month's discharge
    // hasn't opened its window yet.
    expect(isServiceCreditEligible('2026-07-01', referenceNow)).toBe(false)
  })

  it('is eligible in the first month of the window (discharged last month)', () => {
    expect(isServiceCreditEligible('2026-06-15', referenceNow)).toBe(true)
  })

  it('is still eligible in the 35th (final) month of the window', () => {
    expect(isServiceCreditEligible('2023-07-15', referenceNow)).toBe(true)
  })

  it('is no longer eligible exactly at the 36-month boundary', () => {
    expect(isServiceCreditEligible('2023-06-15', referenceNow)).toBe(false)
  })
})

describe('calcServiceCreditPoints', () => {
  const referenceNow = new Date(2026, 6, 15)
  const eligibleDischargeDate = '2026-06-15'

  it('returns 0 for serviceType "none" even with an eligible discharge date', () => {
    expect(calcServiceCreditPoints('none', eligibleDischargeDate, referenceNow)).toBe(0)
  })

  it('returns 0 when there is no discharge date', () => {
    expect(calcServiceCreditPoints('military', null, referenceNow)).toBe(0)
  })

  it('returns 0 once the eligibility window has passed', () => {
    expect(calcServiceCreditPoints('military', '2023-06-15', referenceNow)).toBe(0)
  })

  it('awards military service credit points when eligible', () => {
    expect(calcServiceCreditPoints('military', eligibleDischargeDate, referenceNow)).toBe(2)
  })

  it('awards national/civil service credit points when eligible', () => {
    expect(calcServiceCreditPoints('national', eligibleDischargeDate, referenceNow)).toBe(2)
  })
})
