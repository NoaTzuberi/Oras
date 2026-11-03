import { describe, it, expect } from 'vitest'
import type { Job, Shift, UserProfile } from '../context/ShiftContext'
import {
  bracketTax,
  calcBituachLeumi,
  calcCreditPoints,
  calcServiceCreditPoints,
  calcTaxInfo,
  isServiceCreditEligible,
  pensionTaxCredit,
  pensionableWage,
} from './calc'
import { TAX_2025 } from './2025'
import { TAX_2026 } from './2026'
import { taxConfigFor } from '.'
import { childrenToStored, parseStoredChildren } from './children'

const baseProfile: UserProfile = {
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
const male: UserProfile = { ...baseProfile, gender: 'male' }
const female: UserProfile = { ...baseProfile, gender: 'female' }

const NOV_2026 = { year: 2026, month: 10 }
const born = (birthYear: number) => ({ birthYear, estimated: false })

const job = (over: Partial<Job> = {}): Job => ({
  id: 'j1', name: 'Cafe', hourlyRate: 50, geonameid: 293397, paysShabbatPremium: true,
  color: null, archived: false, pensionActive: true, pensionEmployeePct: 6, tipsInPayslip: true,
  ...over,
})
const noPension = job({ pensionActive: false })

const shift = (baseSalary: number, tips = 0, jobId: string | null = 'j1'): Shift => ({
  id: 's', date: '2026-11-10', startTime: '09:00', endTime: '17:00', hours: 8,
  salaryType: 'total', baseSalary, tips, totalEarnings: baseSalary + tips,
  isShabbatOrHoliday: false, used150: false,
  jobId, hourlyRate: null, regularHours: null, shabbatHours: null,
  shabbatPremiumApplied: null, shabbatVerified: null,
})

describe('tax year figures', () => {
  it.each([TAX_2025, TAX_2026])('every $year value has its year and a source URL', config => {
    const values = [
      config.creditPointMonthly, config.brackets, config.childPoints,
      ...Object.values(config.bituachLeumi), ...Object.values(config.pension),
    ]
    for (const v of values) {
      expect(v.year).toBe(config.year)
      expect(v.source).toMatch(/^https:\/\//)
    }
  })

  it('each year picks its own figures', () => {
    expect(taxConfigFor(2025)).toEqual({ config: TAX_2025, exact: true })
    expect(taxConfigFor(2026)).toEqual({ config: TAX_2026, exact: true })
  })

  it('a year without its own figures uses the closest one and says so', () => {
    expect(taxConfigFor(2024)).toEqual({ config: TAX_2025, exact: false })
    expect(taxConfigFor(2027)).toEqual({ config: TAX_2026, exact: false })
  })
})

describe('2025 figures (before the widening)', () => {
  it('20% ends at 16,150 and 31% at 22,440', () => {
    // 701 + 427 + 6,090 x 20% + 1,850 x 31%
    expect(bracketTax(18_000, TAX_2025.brackets.value)).toBeCloseTo(2_919.5, 2)
    expect(bracketTax(18_000, TAX_2026.brackets.value)).toBeCloseTo(2_716, 2)
  })

  it('Bituach Leumi: same rates, threshold 7,522, ceiling 50,695', () => {
    // 7,522 x 1.04% + 478 x 7% ; 7,522 x 3.23% + 478 x 5.17%
    expect(calcBituachLeumi(8_000, TAX_2025)).toEqual({ nationalInsurance: 111.69, healthInsurance: 267.67 })
    expect(calcBituachLeumi(60_000, TAX_2025)).toEqual(calcBituachLeumi(50_695, TAX_2025))
  })

  it('a December 2025 month uses 2025 figures, not an estimate', () => {
    const r = calcTaxInfo(male, [shift(18_000)], [noPension], { year: 2025, month: 11 })
    expect(r.taxYear).toBe(2025)
    expect(r.taxYearExact).toBe(true)
    expect(r.incomeTax).toBe(2_375)          // 2,919.50 - 544.50
  })
})

describe('bracketTax (2026, after the widening)', () => {
  const b = TAX_2026.brackets.value

  it('20% runs to 19,000 and 31% to 25,100 (not 16,150 / 22,440)', () => {
    // 701 + 427 + 1,788
    expect(bracketTax(19_000, b)).toBeCloseTo(2_916, 2)
    // + 6,100 x 31%
    expect(bracketTax(25_100, b)).toBeCloseTo(4_807, 2)
  })

  it('47% to 60,130, then 50% (47% + 3% surtax)', () => {
    expect(bracketTax(60_130, b)).toBeCloseTo(18_680.3, 2)
    expect(bracketTax(70_130, b)).toBeCloseTo(23_680.3, 2)
  })

  it('is 0 for no income', () => {
    expect(bracketTax(0, b)).toBe(0)
  })
})

describe('calcBituachLeumi (2026)', () => {
  it('reduced rates up to 7,703: 1.04% + 3.23%', () => {
    expect(calcBituachLeumi(5_000, TAX_2026)).toEqual({ nationalInsurance: 52, healthInsurance: 161.5 })
  })

  it('full rates above 7,703: 7% + 5.17%', () => {
    // 7,703 x 1.04% + 297 x 7% ; 7,703 x 3.23% + 297 x 5.17%
    expect(calcBituachLeumi(8_000, TAX_2026)).toEqual({ nationalInsurance: 100.9, healthInsurance: 264.16 })
  })

  it('nothing above the 51,910 ceiling', () => {
    expect(calcBituachLeumi(70_000, TAX_2026)).toEqual(calcBituachLeumi(51_910, TAX_2026))
  })
})

describe('pensionTaxCredit', () => {
  it('35% of the contribution', () => {
    expect(pensionTaxCredit(480, TAX_2026)).toBe(168)
  })

  it('counts at most 7% of 9,700 (679)', () => {
    expect(pensionTaxCredit(1_200, TAX_2026)).toBe(237.65)
  })
})

describe('calcCreditPoints', () => {
  it('returns 0 when gender is not set', () => {
    expect(calcCreditPoints(baseProfile, NOV_2026)).toBe(0)
  })

  it('base points: 2.25, +0.5 for women', () => {
    expect(calcCreditPoints(male, NOV_2026)).toBe(2.25)
    expect(calcCreditPoints(female, NOV_2026)).toBe(2.75)
  })

  it.each([
    [2026, 2.5], // birth year
    [2025, 4.5], // age 1
    [2024, 4.5], // age 2
    [2023, 3.5], // age 3
    [2021, 2.5], // age 5
    [2016, 2],   // age 10, column 1
    [2008, 0.5], // age 18, column 1
    [2007, 0],   // age 19
    [2027, 0],   // not born yet in 2026
  ])('child born %i: +%d points (column 1)', (year, extra) => {
    expect(calcCreditPoints({ ...female, children: [born(year)] }, NOV_2026)).toBe(2.75 + extra)
  })

  it('column 2: 1 point for ages 6–17, none at 18', () => {
    expect(calcCreditPoints({ ...male, children: [born(2016)] }, NOV_2026)).toBe(3.25)
    expect(calcCreditPoints({ ...male, children: [born(2008)] }, NOV_2026)).toBe(2.25)
    // ages 0–5 are the same in both columns
    expect(calcCreditPoints({ ...male, children: [born(2025)] }, NOV_2026)).toBe(6.75)
  })

  it('defaults to column 1 for women, 2 for men; the setting overrides', () => {
    expect(calcCreditPoints({ ...female, parentColumn: 2, children: [born(2016)] }, NOV_2026)).toBe(3.75)
    expect(calcCreditPoints({ ...male, parentColumn: 1, children: [born(2016)] }, NOV_2026)).toBe(4.25)
  })

  it('child age comes from the month viewed, not today', () => {
    const p = { ...female, children: [born(2025)] }
    expect(calcCreditPoints(p, { year: 2025, month: 11 })).toBe(5.25) // birth year: 2.5
    expect(calcCreditPoints(p, { year: 2026, month: 0 })).toBe(7.25)  // age 1: 4.5
  })

  it('service points follow the month viewed', () => {
    const p: UserProfile = { ...male, serviceType: 'military', dischargeDate: '2023-06-15' }
    expect(calcCreditPoints(p, { year: 2026, month: 5 })).toBe(4.25) // June 2026: month 36 of 36
    expect(calcCreditPoints(p, { year: 2026, month: 6 })).toBe(2.25) // July 2026: window over
  })

  it('no longer counts moshav or priority area', () => {
    expect(calcCreditPoints({ ...male, isMoshavMember: true, isPriorityArea: true }, NOV_2026)).toBe(2.25)
  })

  it('academic degree still adds 0.5', () => {
    expect(calcCreditPoints({ ...male, hasAcademicDegree: true }, NOV_2026)).toBe(2.75)
  })

  it('new-immigrant points by years since aliyah, counted from the viewed year', () => {
    const p = (year: number): UserProfile => ({ ...male, isNewImmigrant: true, immigrationYear: year })
    expect(calcCreditPoints(p(2026), NOV_2026)).toBe(5.25)
    expect(calcCreditPoints(p(2021), NOV_2026)).toBe(4.25)
    expect(calcCreditPoints(p(2011), NOV_2026)).toBe(2.25)
  })
})

describe('isServiceCreditEligible', () => {
  const july2026 = { year: 2026, month: 6 }

  it('is not eligible without a valid discharge date', () => {
    expect(isServiceCreditEligible(null, july2026)).toBe(false)
    expect(isServiceCreditEligible('not-a-date', july2026)).toBe(false)
    expect(isServiceCreditEligible('2026-02-31', july2026)).toBe(false)
  })

  it('starts the month after discharge', () => {
    expect(isServiceCreditEligible('2026-07-01', july2026)).toBe(false)
    expect(isServiceCreditEligible('2026-06-30', july2026)).toBe(true)
  })

  it('lasts 36 months', () => {
    expect(isServiceCreditEligible('2023-07-15', july2026)).toBe(true)
    expect(isServiceCreditEligible('2023-06-15', july2026)).toBe(false)
  })
})

describe('calcServiceCreditPoints', () => {
  const july2026 = { year: 2026, month: 6 }

  it('2 points for military or national service in the window, else 0', () => {
    expect(calcServiceCreditPoints('military', '2026-06-15', july2026)).toBe(2)
    expect(calcServiceCreditPoints('national', '2026-06-15', july2026)).toBe(2)
    expect(calcServiceCreditPoints('none', '2026-06-15', july2026)).toBe(0)
    expect(calcServiceCreditPoints('military', null, july2026)).toBe(0)
    expect(calcServiceCreditPoints('military', '2023-06-15', july2026)).toBe(0)
  })
})

describe('calcTaxInfo', () => {
  it('8,000 gross, no pension, 2.25 points', () => {
    const r = calcTaxInfo(male, [shift(8_000)], [noPension], NOV_2026)
    expect(r.grossSalary).toBe(8_000)
    expect(r.incomeTax).toBe(295.1)          // 839.60 - 544.50
    expect(r.nationalInsurance).toBe(100.9)
    expect(r.healthInsurance).toBe(264.16)
    expect(r.pensionContribution).toBe(0)
    expect(r.netSalary).toBe(7_339.84)
  })

  it('8,000 gross with 6% pension: deducted, 35% back as tax credit', () => {
    const r = calcTaxInfo(male, [shift(8_000)], [job()], NOV_2026)
    expect(r.pensionContribution).toBe(480)
    expect(r.pensionTaxCredit).toBe(168)
    expect(r.incomeTax).toBe(127.1)          // 839.60 - 544.50 - 168
    expect(r.netSalary).toBe(7_027.84)
  })

  it('pension credit stays inside the tax >= 0 floor', () => {
    const r = calcTaxInfo(male, [shift(3_000)], [job()], NOV_2026)
    expect(r.incomeTax).toBe(0)
    expect(r.netSalary).toBe(2_691.9)        // 3,000 - 128.10 BL - 180 pension
  })

  it('shifts with no job (pre-backfill) and jobs with NULL settings use the defaults', () => {
    const nulls = job({ pensionActive: null, pensionEmployeePct: null, tipsInPayslip: null })
    const a = calcTaxInfo(male, [shift(8_000, 0, null)], [], NOV_2026)
    const b = calcTaxInfo(male, [shift(8_000)], [nulls], NOV_2026)
    expect(a.pensionContribution).toBe(480)
    expect(b).toEqual(a)
  })

  it('tips on the payslip are taxed (as before)', () => {
    const r = calcTaxInfo(male, [shift(7_000, 1_000)], [noPension], NOV_2026)
    expect(r.taxableGross).toBe(8_000)
    expect(r.tipsOutsidePayslip).toBe(0)
    expect(r.netSalary).toBe(7_339.84)
  })

  it('cash tips off the payslip are not taxed and are added to net', () => {
    const cash = job({ pensionActive: false, tipsInPayslip: false })
    const r = calcTaxInfo(male, [shift(7_000, 1_000)], [cash], NOV_2026)
    expect(r.grossSalary).toBe(8_000)
    expect(r.taxableGross).toBe(7_000)
    expect(r.tipsOutsidePayslip).toBe(1_000)
    expect(r.incomeTax).toBe(155.5)          // 700 - 544.50
    expect(r.netSalary).toBe(7_545.6)        // 7,000 - 155.50 - 72.80 - 226.10 + 1,000
  })

  it('pension is on the wage, not on tips', () => {
    const r = calcTaxInfo(male, [shift(7_000, 1_000)], [job()], NOV_2026)
    expect(r.pensionContribution).toBe(420)
  })

  it('pension on a Shabbat shift: base rate x all hours, without the 50% premium', () => {
    // 5 regular + 3 Shabbat hours at 50/h: pay 250 + 225 = 475, pensionable 400
    const sat: Shift = {
      ...shift(475), salaryType: 'hourly', hours: 8, hourlyRate: 50,
      regularHours: 5, shabbatHours: 3, shabbatPremiumApplied: true, shabbatVerified: true,
    }
    const r = calcTaxInfo(male, [sat], [job()], NOV_2026)
    expect(r.pensionContribution).toBe(24)
  })

  it('adds up several jobs as one payslip', () => {
    const second = job({ id: 'j2', pensionEmployeePct: 7 })
    const r = calcTaxInfo(male, [shift(4_000), shift(4_000, 0, 'j2')], [job(), second], NOV_2026)
    expect(r.taxableGross).toBe(8_000)
    expect(r.pensionContribution).toBe(520)  // 240 + 280
  })

  it('returns zero everything for no shifts', () => {
    const r = calcTaxInfo(male, [], [], NOV_2026)
    expect(r.grossSalary).toBe(0)
    expect(r.incomeTax).toBe(0)
    expect(r.netSalary).toBe(0)
  })

  it('flags months in a year without its own figures', () => {
    expect(calcTaxInfo(male, [], [], { year: 2024, month: 11 }).taxYearExact).toBe(false)
  })
})

describe('pensionableWage', () => {
  it('old 150% shift (no stored rate): undoes the x1.5', () => {
    const old: Shift = { ...shift(600), salaryType: 'hourly', hours: 8, used150: true, isShabbatOrHoliday: true }
    expect(pensionableWage(old)).toBe(400)
  })

  it('daily-total shift: the whole amount', () => {
    expect(pensionableWage(shift(450))).toBe(450)
  })
})

describe('children storage', () => {
  it('converts old { age } entries to an estimated birth year', () => {
    expect(parseStoredChildren([{ age: 3 }, { age: 0 }], 2026)).toEqual([
      { birthYear: 2023, estimated: true },
      { birthYear: 2026, estimated: true },
    ])
  })

  it('keeps stored birth years as confirmed', () => {
    expect(parseStoredChildren([{ birthYear: 2020, age: 6 }], 2026)).toEqual([{ birthYear: 2020, estimated: false }])
  })

  it('drops malformed entries', () => {
    expect(parseStoredChildren([null, {}, { age: -1 }, { birthYear: 'x' }], 2026)).toEqual([])
    expect(parseStoredChildren(null, 2026)).toEqual([])
  })

  it('still writes age for older app versions', () => {
    expect(childrenToStored([born(2020)], 2026)).toEqual([{ birthYear: 2020, age: 6 }])
  })

  it('a normal save keeps estimated birth years estimated', () => {
    const stored = childrenToStored([{ birthYear: 2023, estimated: true }], 2026)
    expect(stored).toEqual([{ birthYear: 2023, age: 3, birthYearEstimated: true }])
    // ...and they stay estimated a year later (not re-derived from age)
    expect(parseStoredChildren(stored, 2027)).toEqual([{ birthYear: 2023, estimated: true }])
  })

  it('confirmed birth years are stored without the flag', () => {
    const stored = childrenToStored([born(2023)], 2026)
    expect(parseStoredChildren(stored, 2026)).toEqual([born(2023)])
  })
})
