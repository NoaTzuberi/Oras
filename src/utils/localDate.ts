// Calendar dates ("YYYY-MM-DD") for date pickers, read and written in the
// device's local time. toISOString() would convert local midnight to UTC
// first, which in Israel (UTC+2/+3) gives the previous day.

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/

/** The local calendar date of `date` as "YYYY-MM-DD". */
export const toLocalISODate = (date: Date): string => {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/** Local midnight of a "YYYY-MM-DD" date, or an invalid Date for anything else. */
export const parseLocalISODate = (value: string): Date => {
  const match = ISO_DATE.exec(value)
  if (!match) return new Date(NaN)
  const [, y, m, d] = match.map(Number)
  const date = new Date(y, m - 1, d)
  // Reject dates like 2026-02-31 that Date would roll over
  if (date.getMonth() !== m - 1 || date.getDate() !== d) return new Date(NaN)
  return date
}
