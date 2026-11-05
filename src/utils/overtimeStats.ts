import type { Shift } from '../context/ShiftContext'
import type { Buckets } from './overtime'

/**
 * A saved shift's minutes per rate, from the stored columns. The overtime
 * minutes are parts of regular_hours / shabbat_hours (see the overtime
 * migration). null for shifts saved before overtime.
 */
export const storedBuckets = (shift: Shift): Buckets | null => {
  if (shift.overtimeCalculated === null) return null
  const ot125 = shift.overtimeMinutes125 ?? 0
  const ot150 = shift.overtimeMinutes150 ?? 0
  const shabbatOt175 = shift.shabbatOtMinutes175 ?? 0
  const shabbatOt200 = shift.shabbatOtMinutes200 ?? 0
  const totalMin = Math.round(shift.hours * 60)
  const shabbatMin = shift.shabbatHours != null ? Math.round(shift.shabbatHours * 60) : 0
  return {
    regular: Math.max(0, totalMin - shabbatMin - ot125 - ot150),
    ot125,
    ot150,
    shabbat: Math.max(0, shabbatMin - shabbatOt175 - shabbatOt200),
    shabbatOt175,
    shabbatOt200,
  }
}

export type OvertimeByRate = { 125: number; 150: number; 175: number; 200: number }

/**
 * Overtime minutes over some shifts, by the rate paid. Shabbat overtime
 * without the premium is paid 125 / 150. Daily-total shifts are left out:
 * their overtime is info only.
 */
export const monthlyOvertime = (shifts: Shift[]): OvertimeByRate => {
  const out: OvertimeByRate = { 125: 0, 150: 0, 175: 0, 200: 0 }
  for (const s of shifts) {
    if (!s.overtimeCalculated || s.salaryType !== 'hourly') continue
    out[125] += s.overtimeMinutes125 ?? 0
    out[150] += s.overtimeMinutes150 ?? 0
    const premium = s.shabbatPremiumApplied === true
    out[premium ? 175 : 125] += s.shabbatOtMinutes175 ?? 0
    out[premium ? 200 : 150] += s.shabbatOtMinutes200 ?? 0
  }
  return out
}
