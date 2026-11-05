import type { Job, Shift } from '../context/ShiftContext'
import { resolveOvertimeSettings } from './overtime'
import { shiftBaseRate } from './shiftHelpers'
import { computeShiftPay, overtimeColumns, type OtherDayShift, type ShabbatLookup, type ShiftPayInput, type ShiftPayResult } from './shiftPay'

// A work day = every shift of one job on one date (a shift crossing
// midnight stays on its start date). Overtime counts the whole day.
// Different jobs never combine (different employers), and shifts with no
// job are each a day of their own.

const round2 = (n: number) => Math.round(n * 100) / 100

type DayRef = { jobId: string | null; date: string }

const sameDay = (a: DayRef, b: DayRef) => a.jobId != null && a.jobId === b.jobId && a.date === b.date

/** The day's other shifts, for computeShiftPay. Includes old shifts: their hours count, their pay never changes. */
export const workDayOthers = (shifts: Shift[], target: DayRef & { id?: string }): OtherDayShift[] =>
  shifts
    .filter(s => s.id !== target.id && sameDay(s, target))
    .map(s => ({ key: s.id, date: s.date, startTime: s.startTime, endTime: s.endTime }))

/** Stored fields of the new calculation (everything but date/times/salary/tips/job). */
export const storedPayFields = (pay: ShiftPayResult, salaryType: 'hourly' | 'total', premiumApplied: boolean) => ({
  hours: pay.hours,
  isShabbatOrHoliday: pay.isShabbatOrHoliday,
  // Old column, still written for older app versions: true only when the
  // x1.5 was actually used on some hours.
  used150: pay.premiumUsed,
  regularHours: pay.split?.regularHours ?? null,
  shabbatHours: pay.split?.shabbatHours ?? null,
  // The intended premium (also kept when unverified, for re-checking later)
  shabbatPremiumApplied: salaryType === 'hourly' ? premiumApplied : null,
  shabbatVerified: pay.verified,
  ...overtimeColumns(pay),
})

/**
 * Other shifts recalculated when a day's shifts change: saved with the
 * overtime calculation and verified Shabbat times. Old shifts (overtime
 * NULL) and unverified ones keep their stored pay.
 */
export const canRecalcWithDay = (s: Shift): boolean => s.overtimeCalculated !== null && s.shabbatVerified === true

export type DayUpdate = {
  shift: Shift
  fields: Omit<Shift, 'id'>
  /** New base salary minus the stored one */
  deltaPay: number
}

const overtimeChanged = (a: Shift, b: Omit<Shift, 'id'>) =>
  a.overtimeMinutes125 !== b.overtimeMinutes125 || a.overtimeMinutes150 !== b.overtimeMinutes150
  || a.shabbatOtMinutes175 !== b.shabbatOtMinutes175 || a.shabbatOtMinutes200 !== b.shabbatOtMinutes200
  || a.dailyThresholdMinutes !== b.dailyThresholdMinutes || a.isNightShift !== b.isNightShift
  || a.overtimeCalculated !== b.overtimeCalculated

/**
 * Recalculates one stored shift against the day as it will be.
 * Returns null when nothing would change.
 */
export const recalcDayShift = (shift: Shift, dayShifts: Shift[], job: Job | null, lookup: ShabbatLookup): DayUpdate | null => {
  if (lookup.status !== 'ok') return null
  const premiumApplied = shift.shabbatPremiumApplied ?? false
  const input: ShiftPayInput = {
    date: shift.date,
    startTime: shift.startTime,
    endTime: shift.endTime,
    salaryType: shift.salaryType,
    rate: shiftBaseRate(shift),
    totalSalary: shift.salaryType === 'total' ? shift.baseSalary : null,
    premiumApplied,
    shabbat: lookup,
    overtime: { settings: resolveOvertimeSettings(job), otherShifts: workDayOthers(dayShifts, shift), key: shift.id },
  }
  const pay = computeShiftPay(input)
  if (!pay || pay.baseSalary == null) return null

  const fields: Omit<Shift, 'id'> = {
    ...shift,
    ...storedPayFields(pay, shift.salaryType, premiumApplied),
    baseSalary: pay.baseSalary,
    totalEarnings: round2(pay.baseSalary + shift.tips),
  }
  delete (fields as Partial<Shift>).id
  const deltaPay = round2(pay.baseSalary - shift.baseSalary)
  if (deltaPay === 0 && !overtimeChanged(shift, fields)) return null
  return { shift, fields, deltaPay }
}

type PlanInput = {
  /** All shifts as they will be after the change (edited one replaced, new one added, deleted one removed) */
  after: Shift[]
  /** Days touched by the change: the shift's day before and after an edit */
  days: DayRef[]
  /** The shift being saved or deleted: never in the result */
  changedId: string | null
  jobs: Job[]
  /** Shabbat times for a day, per job city. Days whose times aren't loaded are skipped. */
  lookupFor: (day: DayRef) => ShabbatLookup
}

/** Other shifts whose pay changes because a day's shifts changed. */
export const planDayUpdates = ({ after, days, changedId, jobs, lookupFor }: PlanInput): DayUpdate[] => {
  const seen = new Set<string>()
  const updates: DayUpdate[] = []
  for (const day of days) {
    if (day.jobId == null) continue
    const key = `${day.jobId}|${day.date}`
    if (seen.has(key)) continue
    seen.add(key)

    const dayShifts = after.filter(s => sameDay(s, day))
    const job = jobs.find(j => j.id === day.jobId) ?? null
    const lookup = lookupFor(day)
    for (const s of dayShifts) {
      if (s.id === changedId || !canRecalcWithDay(s)) continue
      const u = recalcDayShift(s, dayShifts, job, lookup)
      if (u) updates.push(u)
    }
  }
  return updates
}

/** True when a change moves the shift's time or day, so its day's other shifts may change. */
export const affectsDay = (before: Pick<Shift, 'date' | 'startTime' | 'endTime' | 'jobId'>, after: Pick<Shift, 'date' | 'startTime' | 'endTime' | 'jobId'>) =>
  before.date !== after.date || before.startTime !== after.startTime
  || before.endTime !== after.endTime || before.jobId !== after.jobId

/** Saves the other shifts' updates one by one. Returns false if any failed (the rest are still tried). */
export const applyDayUpdates = async (
  save: (id: string, fields: Omit<Shift, 'id'>) => Promise<void>, updates: DayUpdate[],
): Promise<boolean> => {
  let ok = true
  for (const u of updates) {
    try { await save(u.shift.id, u.fields) } catch { ok = false }
  }
  return ok
}
