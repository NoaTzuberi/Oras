import type { Job, ServiceType, Shift, UserProfile } from '../context/ShiftContext'
import { parseLocalISODate } from '../utils/localDate'
import { shiftBaseRate } from '../utils/shiftHelpers'
import { taxConfigFor } from '.'
import type { Bracket, TaxYearConfig } from './types'
import { childAgeIn, pointsForChild, resolveParentColumn } from './children'

/** A calendar month, month 0–11 (like Date#getMonth). */
export type TaxPeriod = { year: number; month: number }

export const periodOf = (date: Date): TaxPeriod => ({ year: date.getFullYear(), month: date.getMonth() })

const round2 = (n: number) => Math.round(n * 100) / 100

// ── Credit points ─────────────────────────────────

// Discharged soldiers / national-civil service volunteers get points for a
// fixed window starting the month after discharge.
const MILITARY_SERVICE_CREDIT_POINTS = 2
const NATIONAL_SERVICE_CREDIT_POINTS = 2
const SERVICE_CREDIT_ELIGIBILITY_MONTHS = 36

/** Whether `month` falls in the 36 months starting the month after discharge. */
export const isServiceCreditEligible = (dischargeDate: string | null, month: TaxPeriod): boolean => {
  if (!dischargeDate) return false
  // Local date: new Date('YYYY-MM-DD') is UTC midnight, the previous day west of UTC
  const discharge = parseLocalISODate(dischargeDate)
  if (isNaN(discharge.getTime())) return false

  // Months between the eligibility start (month after discharge) and `month`
  const monthsSinceStart = (month.year - discharge.getFullYear()) * 12 + (month.month - discharge.getMonth()) - 1
  return monthsSinceStart >= 0 && monthsSinceStart < SERVICE_CREDIT_ELIGIBILITY_MONTHS
}

export const calcServiceCreditPoints = (serviceType: ServiceType, dischargeDate: string | null, month: TaxPeriod): number => {
  if (serviceType === 'none') return 0
  if (!isServiceCreditEligible(dischargeDate, month)) return 0
  return serviceType === 'military' ? MILITARY_SERVICE_CREDIT_POINTS : NATIONAL_SERVICE_CREDIT_POINTS
}

/**
 * Credit points for `month` (not today): child ages, the service window and
 * years since aliyah are all counted for the month being viewed.
 */
export const calcCreditPoints = (
  profile: UserProfile,
  month: TaxPeriod,
  config: TaxYearConfig = taxConfigFor(month.year).config,
): number => {
  let points = 0

  // No gender = no basis for the base points; Settings asks for it.
  if (profile.gender === 'female') points += 2.75
  else if (profile.gender === 'male') points += 2.25
  else return 0

  const column = resolveParentColumn(profile)
  for (const child of profile.children) {
    points += pointsForChild(childAgeIn(child, month.year), column, config.childPoints.value)
  }

  points += calcServiceCreditPoints(profile.serviceType, profile.dischargeDate, month)

  // isMoshavMember and isPriorityArea are kept in the profile but no longer
  // counted: there's no credit point for moshav/kibbutz membership, and the
  // priority-area benefit is a percentage of income set per locality
  // (section 11), not +0.5 points. Both overstated the net.

  if (profile.isNewImmigrant && profile.immigrationYear) {
    const yearsInIsrael = month.year - profile.immigrationYear
    if (yearsInIsrael <= 3) points += 3
    else if (yearsInIsrael <= 6) points += 2
    else if (yearsInIsrael <= 10) points += 1
  }

  if (profile.hasAcademicDegree) points += 0.5

  return round2(points)
}

// ── Income tax, Bituach Leumi ─────────────────────

/** Tax on monthly income by the brackets, before credits. */
export const bracketTax = (monthlyIncome: number, brackets: Bracket[]): number => {
  let tax = 0
  let prev = 0
  for (const { upTo, rate } of brackets) {
    if (monthlyIncome <= prev) break
    tax += (Math.min(monthlyIncome, upTo) - prev) * rate
    prev = upTo
  }
  return tax
}

/** Employee Bituach Leumi + health on monthly income. */
export const calcBituachLeumi = (monthlyIncome: number, config: TaxYearConfig) => {
  const bl = config.bituachLeumi
  const insured = Math.min(Math.max(monthlyIncome, 0), bl.ceiling.value)
  const reduced = Math.min(insured, bl.reducedThreshold.value)
  const full = insured - reduced
  return {
    nationalInsurance: round2(reduced * bl.nationalReducedRate.value + full * bl.nationalFullRate.value),
    healthInsurance: round2(reduced * bl.healthReducedRate.value + full * bl.healthFullRate.value),
  }
}

// ── Per-job settings ──────────────────────────────

export const DEFAULT_PENSION_EMPLOYEE_PCT = 6

/** A job's tax settings; NULL (or no job) means the defaults. */
export const jobTaxSettings = (job: Pick<Job, 'pensionActive' | 'pensionEmployeePct' | 'tipsInPayslip'> | undefined) => ({
  pensionActive: job?.pensionActive ?? true,
  pensionPct: job?.pensionEmployeePct ?? DEFAULT_PENSION_EMPLOYEE_PCT,
  tipsInPayslip: job?.tipsInPayslip ?? true,
})

/**
 * The wage pension is taken on: base rate × all hours, Shabbat hours
 * included at the base rate, without the extra 50% premium (and without
 * tips). What counts as pensionable pay varies by employer and collective
 * agreement; this is a common default. Daily-total shifts have no rate, so
 * the whole amount counts.
 */
export const pensionableWage = (shift: Shift): number => {
  const rate = shiftBaseRate(shift)
  return rate != null ? round2(rate * shift.hours) : shift.baseSalary
}

/** 35% of the contribution, counting at most 7% of the qualifying-income ceiling. */
export const pensionTaxCredit = (contribution: number, config: TaxYearConfig): number => {
  const p = config.pension
  const creditable = Math.min(contribution, p.maxCreditedShare.value * p.qualifyingIncomeCeiling.value)
  return round2(creditable * p.creditRate.value)
}

// ── Month total ───────────────────────────────────

export type TaxInfo = {
  taxYear: number
  /** false = no figures for this year yet; the closest year's were used. */
  taxYearExact: boolean
  creditPoints: number
  monthlyTaxCredit: number
  /** Everything earned, tips included (shown as gross). */
  grossSalary: number
  /** What the payslip taxes: pay + tips the employer puts on the payslip. */
  taxableGross: number
  /** Cash tips outside the payslip: untaxed, added to net. */
  tipsOutsidePayslip: number
  incomeTax: number
  nationalInsurance: number
  healthInsurance: number
  pensionContribution: number
  pensionTaxCredit: number
  netSalary: number
}

/**
 * Monthly withholding on the month's total, the way a payslip computes it.
 * All jobs are added together (as if the user coordinates tax between them).
 */
export const calcTaxInfo = (profile: UserProfile, shifts: Shift[], jobs: Job[], month: TaxPeriod): TaxInfo => {
  const { config, exact } = taxConfigFor(month.year)
  const jobsById = new Map(jobs.map(j => [j.id, j]))

  let grossSalary = 0
  let taxableGross = 0
  let pensionContribution = 0
  for (const shift of shifts) {
    const settings = jobTaxSettings(shift.jobId ? jobsById.get(shift.jobId) : undefined)
    // From the stored totals, so with tips on the payslip taxable = gross exactly
    const tips = shift.totalEarnings - shift.baseSalary
    grossSalary += shift.totalEarnings
    taxableGross += shift.baseSalary + (settings.tipsInPayslip ? tips : 0)
    if (settings.pensionActive) pensionContribution += round2(pensionableWage(shift) * settings.pensionPct / 100)
  }
  grossSalary = round2(grossSalary)
  taxableGross = round2(taxableGross)
  pensionContribution = round2(pensionContribution)
  const tipsOutsidePayslip = round2(grossSalary - taxableGross)

  const creditPoints = calcCreditPoints(profile, month, config)
  const monthlyTaxCredit = round2(creditPoints * config.creditPointMonthly.value)
  const pensionCredit = pensionTaxCredit(pensionContribution, config)
  const incomeTax = round2(Math.max(0, bracketTax(taxableGross, config.brackets.value) - monthlyTaxCredit - pensionCredit))
  const { nationalInsurance, healthInsurance } = calcBituachLeumi(taxableGross, config)

  const netSalary = round2(taxableGross - incomeTax - nationalInsurance - healthInsurance - pensionContribution + tipsOutsidePayslip)

  return {
    taxYear: config.year,
    taxYearExact: exact,
    creditPoints,
    monthlyTaxCredit,
    grossSalary,
    taxableGross,
    tipsOutsidePayslip,
    incomeTax,
    nationalInsurance,
    healthInsurance,
    pensionContribution,
    pensionTaxCredit: pensionCredit,
    netSalary,
  }
}
