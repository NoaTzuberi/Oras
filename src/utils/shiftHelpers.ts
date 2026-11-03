type RateSource = {
  salaryType: 'hourly' | 'total'
  hours: number
  baseSalary: number
  used150: boolean
  hourlyRate: number | null
}

/**
 * The shift's base hourly rate (before any Shabbat premium).
 * Uses the stored rate; for older shifts saved before it existed, derives
 * it from base_salary, which already has the x1.5 baked in when used150.
 */
export const shiftBaseRate = (shift: RateSource): number | null => {
  if (shift.hourlyRate != null) return shift.hourlyRate
  if (shift.salaryType !== 'hourly' || !(shift.hours > 0)) return null
  return parseFloat((shift.baseSalary / shift.hours / (shift.used150 ? 1.5 : 1)).toFixed(2))
}
