import { shiftInterval, splitShiftHours, type ShiftSplit, type TimeWindow } from './shabbat'
import {
  bucketMinutes, bucketPay, multiplierOf, planWorkDay, segmentShift,
  type Buckets, type OvertimeSettings, type OvertimeTier,
} from './overtime'

export type ShabbatLookup =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'ok'; windows: TimeWindow[]; isYomTov: boolean }

/** Another shift of the same work day (same job, same date). */
export type OtherDayShift = { key: string; date: string; startTime: string; endTime: string }

export type ShiftPayInput = {
  date: string
  startTime: string
  endTime: string
  salaryType: 'hourly' | 'total'
  rate: number | null        // hourly mode
  totalSalary: number | null // daily-total mode
  premiumApplied: boolean
  shabbat: ShabbatLookup
  overtime: {
    settings: OvertimeSettings
    /** The work day's other shifts. Empty for a shift with no job. */
    otherShifts: OtherDayShift[]
    /** This shift's key in the day (its id); new shifts sort last on a tie. */
    key?: string
  }
}

export type ShiftPaySegment = {
  start: Date
  end: Date
  minutes: number
  shabbat: boolean
  tier: OvertimeTier
  /** Pay multiplier for this time (1, 1.25, 1.5, 1.75, 2) */
  multiplier: number
}

export type OvertimeResult = {
  /** false = the job has overtime turned off */
  enabled: boolean
  isNight: boolean
  /** Infinity when overtime is off */
  thresholdMinutes: number
  /** Minutes already worked earlier in the same work day */
  minutesBefore: number
  segments: ShiftPaySegment[]
  minutes: Buckets
  /** Hourly only; null in daily-total mode (minutes are info only) */
  pay: (Buckets & { total: number }) | null
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
  overtime: OvertimeResult
}

const round2 = (n: number) => Math.round(n * 100) / 100

export const NEW_SHIFT_KEY = '\uffff' // sorts after every uuid

/**
 * Pay for a shift being added or recalculated.
 * - The shift is cut into segments (Shabbat or not, overtime tier) and each
 *   is paid at rate x (1 + Shabbat 0.5 if the premium applies + OT 0/0.25/0.5).
 * - Overtime counts the whole work day: the other shifts of the same job
 *   on the same date, in start order.
 * - Daily total: the typed amount; Shabbat and overtime hours are info only.
 * - Shabbat times unavailable: no Shabbat hours (overtime still applies)
 *   and the result is marked unverified (the UI shows a warning; never silent).
 * Returns null while times are missing or start == end.
 */
export const computeShiftPay = (input: ShiftPayInput): ShiftPayResult | null => {
  if (!input.date || !input.startTime || !input.endTime || input.startTime === input.endTime) return null

  const interval = shiftInterval(input)
  const { start, end } = interval
  const hours = round2((end.getTime() - start.getTime()) / 3_600_000)
  const windows = input.shabbat.status === 'ok' ? input.shabbat.windows : []
  const split = input.shabbat.status === 'ok' ? splitShiftHours(start, end, windows) : null
  const hasShabbat = (split?.shabbatHours ?? 0) > 0
  const hourly = input.salaryType === 'hourly'
  const premiumUsed = hourly && input.premiumApplied && hasShabbat

  // Overtime over the work day
  const key = input.overtime.key ?? NEW_SHIFT_KEY
  const day = planWorkDay(input.date, [
    { key, start, end },
    ...input.overtime.otherShifts.filter(o => o.key !== key).map(o => ({ key: o.key, ...shiftInterval(o) })),
  ], input.overtime.settings)
  const minutesBefore = day.minutesBefore.get(key) ?? 0
  const segments = segmentShift(interval, windows, day.thresholdMinutes, minutesBefore).map(seg => ({
    ...seg,
    multiplier: multiplierOf(seg.shabbat, seg.tier, hourly && input.premiumApplied),
  }))
  const minutes = bucketMinutes(segments)
  const pay = hourly && input.rate != null && !isNaN(input.rate)
    ? bucketPay(input.rate, minutes, input.premiumApplied)
    : null

  let baseSalary: number | null = null
  if (hourly && pay) baseSalary = pay.total
  else if (!hourly && input.totalSalary != null && !isNaN(input.totalSalary)) baseSalary = input.totalSalary

  return {
    hours,
    split,
    baseSalary,
    premiumUsed,
    verified: input.shabbat.status === 'ok',
    isShabbatOrHoliday: hasShabbat || (input.shabbat.status === 'ok' && input.shabbat.isYomTov),
    overtime: {
      enabled: input.overtime.settings.enabled,
      isNight: day.isNight,
      thresholdMinutes: day.thresholdMinutes,
      minutesBefore,
      segments,
      minutes,
      pay: hourly ? pay : null,
    },
  }
}

/** True when the Shabbat card replaces the plain base salary row. */
export const hasShabbatHours = (pay: ShiftPayResult | null): boolean =>
  (pay?.split?.shabbatHours ?? 0) > 0

/** True when the shift has overtime minutes (paid, or as info in daily-total mode). */
export const hasOvertime = (pay: ShiftPayResult | null): boolean => {
  const m = pay?.overtime.minutes
  return !!m && m.ot125 + m.ot150 + m.shabbatOt175 + m.shabbatOt200 > 0
}

/** Shows the pay breakdown card instead of the plain base salary row. */
export const hasPayBreakdown = (pay: ShiftPayResult | null): boolean => hasShabbatHours(pay) || hasOvertime(pay)

export type OvertimeColumns = {
  overtimeCalculated: boolean | null
  dailyThresholdMinutes: number | null
  isNightShift: boolean | null
  overtimeMinutes125: number | null
  overtimeMinutes150: number | null
  shabbatOtMinutes175: number | null
  shabbatOtMinutes200: number | null
}

/** Columns saved on a shift computed with overtime (see the overtime migration). */
export const overtimeColumns = (pay: ShiftPayResult): OvertimeColumns => {
  const ot = pay.overtime
  return {
    overtimeCalculated: ot.enabled,
    dailyThresholdMinutes: isFinite(ot.thresholdMinutes) ? ot.thresholdMinutes : null,
    isNightShift: ot.isNight,
    overtimeMinutes125: ot.minutes.ot125,
    overtimeMinutes150: ot.minutes.ot150,
    shabbatOtMinutes175: ot.minutes.shabbatOt175,
    shabbatOtMinutes200: ot.minutes.shabbatOt200,
  }
}

/** A shift saved before overtime existed: all overtime columns NULL. */
export const NO_OVERTIME_COLUMNS: OvertimeColumns = {
  overtimeCalculated: null,
  dailyThresholdMinutes: null,
  isNightShift: null,
  overtimeMinutes125: null,
  overtimeMinutes150: null,
  shabbatOtMinutes175: null,
  shabbatOtMinutes200: null,
}
