import type { Shift } from '../context/ShiftContext'

// Rules for editing a shift that must keep its stored pay until the user
// changes something that affects Shabbat hours, or confirms a recalculation:
// - legacy shifts (shabbat_verified NULL): saved before the Shabbat split,
//   pay = rate x hours x (1.5 if used_150), the whole shift.
// - unverified shifts (shabbat_verified false): Shabbat times failed to
//   load when saved, paid at the regular rate.
// Verified shifts (true) are always recalculated with the split.

const round2 = (n: number) => Math.round(n * 100) / 100

export const isPreservedShift = (shift: Pick<Shift, 'shabbatVerified'>): boolean => shift.shabbatVerified !== true

/**
 * Starting value of the per-shift premium checkbox (null = follow the job).
 * - Split shifts: what was stored, so a later change to the job's setting
 *   never changes a past shift.
 * - Legacy shifts on a Shabbat/holiday date: the user's old 150% choice.
 */
export const initialPremiumOverride = (
  shift: Pick<Shift, 'shabbatVerified' | 'shabbatPremiumApplied' | 'isShabbatOrHoliday' | 'used150'>,
): boolean | null => {
  if (shift.shabbatVerified === null) return shift.isShabbatOrHoliday ? shift.used150 : null
  return shift.shabbatPremiumApplied
}

type EditedFields = {
  date: string
  startTime: string
  endTime: string
  jobId: string | null
  /** The user ticked/unticked the premium checkbox */
  premiumTouched: boolean
}

/** Changes that switch a preserved shift to the new Shabbat calculation. */
export const recalcTriggered = (shift: Shift, edited: EditedFields): boolean =>
  edited.date !== shift.date
  || edited.startTime !== shift.startTime
  || edited.endTime !== shift.endTime
  || edited.jobId !== shift.jobId
  || edited.premiumTouched

/**
 * Base pay for a preserved shift with the old formula.
 * Nothing pay-related changed -> the stored amount exactly (re-deriving
 * the rate rounds it, e.g. 500 / 7h / 1.5 = 47.62 -> 500.01).
 */
export const preservedBasePay = (
  shift: Shift,
  edited: { salaryType: 'hourly' | 'total'; rate: number | null; rateChanged: boolean; totalSalary: number | null },
): number | null => {
  if (edited.salaryType === 'total') return edited.totalSalary
  if (edited.rate == null || isNaN(edited.rate)) return null
  if (edited.salaryType === shift.salaryType && !edited.rateChanged) return shift.baseSalary
  const premium = edited.salaryType === shift.salaryType && shift.used150 ? 1.5 : 1
  return round2(edited.rate * shift.hours * premium)
}
