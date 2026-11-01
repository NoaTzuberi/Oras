export const ISRAEL_TZ = 'Asia/Jerusalem'

const isoDateFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: ISRAEL_TZ,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

/** Calendar date ("YYYY-MM-DD") in Israel at the given moment, whatever the device's time zone. */
export const jerusalemISODate = (at: Date = new Date()): string => isoDateFormatter.format(at)

/** Formats a year / 0-based month / day as "YYYY-MM-DD". Overflowing values roll over like Date does. */
export const toISODate = (year: number, monthIndex: number, day: number): string =>
  new Date(Date.UTC(year, monthIndex, day)).toISOString().slice(0, 10)

/**
 * Date range for loading shifts: the 1st of the month `monthsBack` months ago
 * up to the last day of the month `monthsForward` months ahead, using
 * Israel's current month.
 */
export const historyWindow = (monthsBack: number, monthsForward: number, now: Date = new Date()) => {
  const [year, month] = jerusalemISODate(now).split('-').map(Number)
  return {
    from: toISODate(year, month - 1 - monthsBack, 1),
    to: toISODate(year, month + monthsForward, 0),
  }
}
