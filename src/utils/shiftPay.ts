import { calcShiftPay, shiftInterval, splitShiftHours, type ShiftSplit, type TimeWindow } from './shabbat'

export type ShabbatLookup =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'ok'; windows: TimeWindow[]; isYomTov: boolean }

export type ShiftPayInput = {
  date: string
  startTime: string
  endTime: string
  salaryType: 'hourly' | 'total'
  rate: number | null        // hourly mode
  totalSalary: number | null // daily-total mode
  premiumApplied: boolean
  shabbat: ShabbatLookup
}

export type ShiftPayResult = {
  hours: number
  /** null when Shabbat times couldn't be loaded */
  split: ShiftSplit | null
  /** Pay before tips. null when the inputs aren't complete. */
  baseSalary: number | null
  /** The x1.5 actually used: only with hourly pay and Shabbat hours. */
  premiumUsed: boolean
  verified: boolean
  isShabbatOrHoliday: boolean
}

const round2 = (n: number) => Math.round(n * 100) / 100

/**
 * Pay for a shift being added or recalculated.
 * - Hourly: regular hours at the rate, Shabbat hours at rate x1.5 when the
 *   premium applies.
 * - Daily total: the typed amount; Shabbat hours are info only.
 * - Shabbat times unavailable: hours are all paid at the rate and the
 *   result is marked unverified (the UI shows a warning; never silent).
 * Returns null while times are missing or start == end.
 */
export const computeShiftPay = (input: ShiftPayInput): ShiftPayResult | null => {
  if (!input.date || !input.startTime || !input.endTime || input.startTime === input.endTime) return null

  const { start, end } = shiftInterval(input)
  const hours = round2((end.getTime() - start.getTime()) / 3_600_000)
  const split = input.shabbat.status === 'ok' ? splitShiftHours(start, end, input.shabbat.windows) : null
  const hasShabbatHours = (split?.shabbatHours ?? 0) > 0
  const premiumUsed = input.salaryType === 'hourly' && input.premiumApplied && hasShabbatHours

  let baseSalary: number | null = null
  if (input.salaryType === 'hourly' && input.rate != null && !isNaN(input.rate)) {
    baseSalary = split ? calcShiftPay(input.rate, split, input.premiumApplied) : round2(input.rate * hours)
  } else if (input.salaryType === 'total' && input.totalSalary != null && !isNaN(input.totalSalary)) {
    baseSalary = input.totalSalary
  }

  return {
    hours,
    split,
    baseSalary,
    premiumUsed,
    verified: input.shabbat.status === 'ok',
    isShabbatOrHoliday: hasShabbatHours || (input.shabbat.status === 'ok' && input.shabbat.isYomTov),
  }
}
