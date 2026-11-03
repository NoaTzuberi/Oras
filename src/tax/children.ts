import type { ChildPointsRow } from './types'

/**
 * A child, by birth year. `estimated` = converted from an age typed before
 * birth years were stored (birth year = year loaded − age), not yet
 * confirmed. Stored as "birthYearEstimated" so a normal Save keeps it; only
 * the confirm button in Settings clears it.
 */
export type Child = { birthYear: number; estimated: boolean }

export type ParentColumn = 1 | 2

const isYear = (n: unknown): n is number => typeof n === 'number' && Number.isInteger(n) && n >= 1900 && n <= 2200

/**
 * Children from the user_profiles.children jsonb. Older rows hold only
 * { age }: those get a birth year estimated from `currentYear`.
 */
export const parseStoredChildren = (raw: unknown, currentYear: number): Child[] => {
  if (!Array.isArray(raw)) return []
  return raw.flatMap((c): Child[] => {
    if (c && isYear(c.birthYear)) return [{ birthYear: c.birthYear, estimated: c.birthYearEstimated === true }]
    if (c && typeof c.age === 'number' && c.age >= 0) return [{ birthYear: currentYear - Math.floor(c.age), estimated: true }]
    return []
  })
}

/**
 * The jsonb to store. `age` keeps being written so older app versions,
 * which read only `age`, still see a sensible value.
 */
export const childrenToStored = (children: Child[], currentYear: number) =>
  children.map(c => ({
    birthYear: c.birthYear,
    age: Math.max(0, currentYear - c.birthYear),
    ...(c.estimated ? { birthYearEstimated: true } : {}),
  }))

/** Stored column, or the usual default: 1 for women, 2 for men. */
export const resolveParentColumn = (p: { parentColumn: ParentColumn | null; gender: 'male' | 'female' | null }): ParentColumn =>
  p.parentColumn ?? (p.gender === 'female' ? 1 : 2)

/** Age during the tax year: tax year − birth year (0 = birth year). */
export const childAgeIn = (child: Pick<Child, 'birthYear'>, taxYear: number): number => taxYear - child.birthYear

export const pointsForChild = (age: number, column: ParentColumn, table: ChildPointsRow[]): number => {
  const row = table.find(r => age >= r.minAge && age <= r.maxAge)
  if (!row) return 0
  return column === 1 ? row.column1 : row.column2
}
