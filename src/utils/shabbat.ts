// Pure Shabbat pay helpers. No imports on purpose: scripts/ load this file
// directly (see scripts/diff-shabbat-recompute.mjs).
//
// All comparisons use real instants (Date / epoch ms). Wall-clock times are
// always interpreted in Asia/Jerusalem, whatever the device's time zone.

const TZ = 'Asia/Jerusalem'
const HOUR_MS = 60 * 60 * 1000
const DAY_MS = 24 * HOUR_MS

export type TimeWindow = { start: Date; end: Date }
export type ShiftSplit = { regularHours: number; shabbatHours: number }

/** The subset of a Hebcal item we use. `date` has an offset, e.g. "2026-10-30T16:11:00+02:00". */
export type HebcalTimeItem = { category: string; date: string; title?: string; hebrew?: string; yomtov?: boolean }

// ── Time zone ─────────────────────────────────────

const partsFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: TZ,
  hourCycle: 'h23',
  year: 'numeric', month: '2-digit', day: '2-digit',
  hour: '2-digit', minute: '2-digit', second: '2-digit',
  weekday: 'short',
})

type JerusalemParts = { year: number; month: number; day: number; hour: number; minute: number; second: number; weekday: string }

const jerusalemParts = (instant: number): JerusalemParts => {
  const p: Record<string, string> = {}
  for (const { type, value } of partsFormatter.formatToParts(new Date(instant))) p[type] = value
  return {
    year: +p.year, month: +p.month, day: +p.day,
    hour: +p.hour, minute: +p.minute, second: +p.second,
    weekday: p.weekday,
  }
}

/** Israel's UTC offset at an instant, in ms (+2h winter, +3h summer). */
const jerusalemOffset = (instant: number): number => {
  const p = jerusalemParts(instant)
  return Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second) - Math.floor(instant / 1000) * 1000
}

const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/
const TIME_RE = /^(\d{2}):(\d{2})(?::\d{2})?$/

/**
 * The instant at which Israeli clocks show `date` + `time` ("YYYY-MM-DD", "HH:MM").
 * DST-safe: the offset is looked up for that specific moment. A time that
 * doesn't exist (the hour skipped in spring) resolves to just after the jump.
 */
export const jerusalemDateTime = (date: string, time: string): Date => {
  const d = DATE_RE.exec(date)
  const t = TIME_RE.exec(time)
  if (!d || !t) throw new Error(`Invalid date/time: ${date} ${time}`)
  const wall = Date.UTC(+d[1], +d[2] - 1, +d[3], +t[1], +t[2])
  let instant = wall - jerusalemOffset(wall)
  // Near a DST switch the first guess can use the wrong side's offset.
  const corrected = wall - jerusalemOffset(instant)
  if (corrected !== instant) instant = corrected
  return new Date(instant)
}

/** "YYYY-MM-DD" in Israel for an instant. */
export const jerusalemDate = (at: Date): string => {
  const p = jerusalemParts(at.getTime())
  return `${p.year}-${String(p.month).padStart(2, '0')}-${String(p.day).padStart(2, '0')}`
}

export const jerusalemWeekday = (at: Date): string => jerusalemParts(at.getTime()).weekday

/** Adds days to a "YYYY-MM-DD" calendar date. */
export const addDays = (date: string, days: number): string => {
  const d = DATE_RE.exec(date)
  if (!d) throw new Error(`Invalid date: ${date}`)
  return new Date(Date.UTC(+d[1], +d[2] - 1, +d[3]) + days * DAY_MS).toISOString().slice(0, 10)
}

// ── Shifts ────────────────────────────────────────

/** Start and end instants of a shift. An end at or before the start is on the next day. */
export const shiftInterval = (shift: { date: string; startTime: string; endTime: string }): TimeWindow => {
  const start = jerusalemDateTime(shift.date, shift.startTime)
  const sameDayEnd = jerusalemDateTime(shift.date, shift.endTime)
  const end = sameDayEnd.getTime() > start.getTime()
    ? sameDayEnd
    : jerusalemDateTime(addDays(shift.date, 1), shift.endTime)
  return { start, end }
}

const round2 = (n: number) => Math.round(n * 100) / 100

/**
 * Splits a shift into regular and Shabbat hours at every window boundary.
 * Hours are real elapsed time, so a shift across a DST switch counts the
 * hour actually worked. `windows` must not overlap (see buildShabbatWindows).
 */
export const splitShiftHours = (start: Date, end: Date, windows: TimeWindow[]): ShiftSplit => {
  const s = start.getTime()
  const e = end.getTime()
  if (!(e > s)) return { regularHours: 0, shabbatHours: 0 }

  let shabbatMs = 0
  for (const w of windows) {
    const overlap = Math.min(e, w.end.getTime()) - Math.max(s, w.start.getTime())
    if (overlap > 0) shabbatMs += overlap
  }
  // Round the parts from whole minutes so they always add up to the total.
  const totalMin = Math.round((e - s) / 60000)
  const shabbatMin = Math.min(totalMin, Math.round(shabbatMs / 60000))
  return {
    regularHours: round2((totalMin - shabbatMin) / 60),
    shabbatHours: round2(shabbatMin / 60),
  }
}

export const SHABBAT_MULTIPLIER = 1.5

/** Base pay for a split shift. The premium applies only to Shabbat hours. */
export const calcShiftPay = (rate: number, split: ShiftSplit, premiumApplied: boolean): number =>
  round2(split.regularHours * rate + split.shabbatHours * rate * (premiumApplied ? SHABBAT_MULTIPLIER : 1))

/**
 * Whether the x1.5 applies: a per-shift override wins, then the job's
 * setting. NULL (job not answered yet, or no job) means don't apply.
 */
export const resolvePremium = (override: boolean | null, jobPays: boolean | null | undefined): boolean =>
  override ?? jobPays ?? false

// ── Building windows from Hebcal ──────────────────

/**
 * Rest periods: each candle lighting paired with the NEXT havdalah, then
 * overlapping/touching periods merged. Handles yom tov next to Shabbat
 * (several candle lightings before one havdalah). A candle lighting with
 * no havdalah in the data gets an open end (Infinity), trimmed later.
 */
export const buildRestWindows = (items: HebcalTimeItem[]): { start: number; end: number }[] => {
  const events = items
    .filter(i => i.category === 'candles' || i.category === 'havdalah')
    .map(i => ({ kind: i.category, at: new Date(i.date).getTime() }))
    .filter(e => !isNaN(e.at))
    .sort((a, b) => a.at - b.at)

  const raw: { start: number; end: number }[] = []
  for (const [i, ev] of events.entries()) {
    if (ev.kind !== 'candles') continue
    const havdalah = events.slice(i + 1).find(e => e.kind === 'havdalah')
    raw.push({ start: ev.at, end: havdalah?.at ?? Infinity })
  }

  const merged: { start: number; end: number }[] = []
  for (const w of raw.sort((a, b) => a.start - b.start)) {
    const last = merged[merged.length - 1]
    if (last && w.start <= last.end) last.end = Math.max(last.end, w.end)
    else merged.push({ ...w })
  }
  return merged
}

/**
 * Shabbat windows (Friday candle lighting -> Saturday nightfall), taken
 * from the rest periods. Yom tov hours around Shabbat are trimmed off, and
 * rest periods with no Shabbat in them (weekday yom tov) are dropped:
 * holiday premium is not supported yet.
 *
 * Saturday nightfall = the first havdalah or candle lighting on Saturday
 * evening (when yom tov starts right after Shabbat, Hebcal lists a candle
 * lighting at nightfall instead of a havdalah).
 *
 * Throws if a Shabbat starts but its end isn't in the data, so the caller
 * can flag the shift as unverified instead of guessing.
 */
export const buildShabbatWindows = (items: HebcalTimeItem[]): TimeWindow[] => {
  const events = items
    .filter(i => i.category === 'candles' || i.category === 'havdalah')
    .map(i => new Date(i.date))
    .filter(d => !isNaN(d.getTime()))
    .sort((a, b) => a.getTime() - b.getTime())

  const windows: TimeWindow[] = []
  for (const rest of buildRestWindows(items)) {
    const fridayCandles = events.find(d =>
      d.getTime() >= rest.start && d.getTime() <= rest.end && jerusalemWeekday(d) === 'Fri'
      && items.some(i => i.category === 'candles' && new Date(i.date).getTime() === d.getTime()))
    if (!fridayCandles) continue

    const saturday = addDays(jerusalemDate(fridayCandles), 1)
    const nightfall = events.find(d =>
      d.getTime() > fridayCandles.getTime() && jerusalemDate(d) === saturday)
    if (!nightfall) throw new Error(`Incomplete Shabbat times: no end found for Shabbat starting ${fridayCandles.toISOString()}`)

    windows.push({ start: fridayCandles, end: nightfall })
  }
  return windows
}

/** Yom tov days falling on `date` (Israeli calendar items). */
export const yomTovOn = (items: HebcalTimeItem[], date: string): { title: string; hebrew: string }[] =>
  items
    .filter(i => i.category === 'holiday' && i.yomtov === true && i.date.slice(0, 10) === date)
    .map(i => ({ title: i.title ?? '', hebrew: i.hebrew ?? i.title ?? '' }))
