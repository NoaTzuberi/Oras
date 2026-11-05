// Daily overtime (Israeli Hours of Work and Rest Law, private sector).
// Pure helpers: no React, no Supabase. Weekly overtime (over 42h) is not
// handled yet. The stored per-shift minutes and threshold allow adding it
// later without new data.
//
// Sources (kolzchut.org.il, checked 2026-11-05):
// - "גמול עבור שעות נוספות": 125% for the first 2 overtime hours of a day,
//   150% from the 3rd. Daily threshold in the private sector: 8:36 on a
//   5-day week (7:36 on the short day), 8h on a 6-day week (7h on Friday).
//   On the weekly rest day the Shabbat 50% adds on top: "ערך 2 השעות
//   הנוספות הראשונות בשבת הנו 175% = 50% + 125%", and 200% = 50% + 150%.
// - "עבודה במשמרת לילה": "משמרת לילה היא משמרת שלפחות שעתיים מתוכה הן בין
//   השעות 22:00 ל-06:00", and "7 שעות עבודה במשמרת לילה נחשבות ליום עבודה
//   מלא". Exactly 2:00 counts (the page's 04:00-12:00 example).
// - "יום עבודה ושבוע עבודה": the short day is a fixed day the employer
//   chooses ("היום המקוצר יהיה ביום מוגדר וקבוע"), so it's a job setting.
//   Default Thursday (last day of a Sun-Thu week).
//
// All times are real instants; wall-clock times are in Asia/Jerusalem.

import { addDays, jerusalemDateTime, type TimeWindow } from './shabbat'

export type WeekPattern = '5day' | '6day' | 'custom'

export type OvertimeSettings = {
  weekPattern: WeekPattern
  /** Only for 'custom'. NULL there means the 5-day rules. */
  customThresholdHours: number | null
  enabled: boolean
  /** 0 = Sunday ... 6 = Saturday. Only for the 5-day week. */
  shortDayWeekday: number
}

export const DEFAULT_SHORT_DAY_WEEKDAY = 4 // Thursday

export const DEFAULT_OVERTIME_SETTINGS: OvertimeSettings = {
  weekPattern: '5day',
  customThresholdHours: null,
  enabled: true,
  shortDayWeekday: DEFAULT_SHORT_DAY_WEEKDAY,
}

type StoredJobSettings = {
  weekPattern?: WeekPattern | null
  customDailyThresholdHours?: number | null
  overtimeEnabled?: boolean | null
  shortDayWeekday?: number | null
}

/** A job's overtime settings; NULL columns (or no job) mean the defaults. */
export const resolveOvertimeSettings = (job: StoredJobSettings | null | undefined): OvertimeSettings => ({
  weekPattern: job?.weekPattern ?? DEFAULT_OVERTIME_SETTINGS.weekPattern,
  customThresholdHours: job?.customDailyThresholdHours ?? null,
  enabled: job?.overtimeEnabled ?? DEFAULT_OVERTIME_SETTINGS.enabled,
  shortDayWeekday: job?.shortDayWeekday ?? DEFAULT_SHORT_DAY_WEEKDAY,
})

// ── Thresholds (minutes) ──────────────────────────

export const FIVE_DAY_NORMAL_MIN = 516 // 8:36
export const FIVE_DAY_SHORT_MIN = 456  // 7:36
export const SIX_DAY_NORMAL_MIN = 480  // 8:00
export const SIX_DAY_FRIDAY_MIN = 420  // 7:00
export const NIGHT_DAY_MIN = 420       // 7:00
export const NIGHT_SHIFT_MIN_MINUTES = 120
/** Overtime minutes paid at the first tier (+25%) before the second (+50%). */
export const FIRST_TIER_MIN = 120

const FRIDAY = 5

/** Weekday of a calendar date (0 = Sunday). Doesn't depend on the time zone. */
const weekdayOf = (date: string): number => {
  const [y, m, d] = date.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay()
}

/**
 * Minutes after which a work day's hours are overtime. When several rules
 * apply (night shift on a short day, custom threshold at night) the lower
 * one wins. Overtime disabled -> Infinity.
 */
export const dailyThresholdMinutes = (settings: OvertimeSettings, date: string, isNight: boolean): number => {
  if (!settings.enabled) return Infinity
  const weekday = weekdayOf(date)
  let threshold: number
  if (settings.weekPattern === 'custom' && settings.customThresholdHours != null) {
    threshold = Math.round(settings.customThresholdHours * 60)
  } else if (settings.weekPattern === '6day') {
    threshold = weekday === FRIDAY ? SIX_DAY_FRIDAY_MIN : SIX_DAY_NORMAL_MIN
  } else {
    threshold = weekday === settings.shortDayWeekday ? FIVE_DAY_SHORT_MIN : FIVE_DAY_NORMAL_MIN
  }
  return isNight ? Math.min(threshold, NIGHT_DAY_MIN) : threshold
}

// ── Night shift ───────────────────────────────────

const MIN_MS = 60_000

const overlapMs = (a: TimeWindow, b: { start: number; end: number }) =>
  Math.max(0, Math.min(a.end.getTime(), b.end) - Math.max(a.start.getTime(), b.start))

/** Minutes of the intervals that fall between 22:00 and 06:00 (Israel time). */
export const nightMinutes = (intervals: TimeWindow[]): number => {
  if (intervals.length === 0) return 0
  const first = Math.min(...intervals.map(i => i.start.getTime()))
  const last = Math.max(...intervals.map(i => i.end.getTime()))
  // Night windows from the evening before the first start to the last end
  let date = addDays(new Date(first).toISOString().slice(0, 10), -1)
  let ms = 0
  for (;;) {
    const start = jerusalemDateTime(date, '22:00').getTime()
    if (start >= last) break
    const night = { start, end: jerusalemDateTime(addDays(date, 1), '06:00').getTime() }
    for (const i of intervals) ms += overlapMs(i, night)
    date = addDays(date, 1)
  }
  return Math.round(ms / MIN_MS)
}

// ── Work day ──────────────────────────────────────

export type DayShift = { key: string; start: Date; end: Date }

export type WorkDay = {
  isNight: boolean
  thresholdMinutes: number
  /** Minutes worked in the day's earlier shifts, per shift key. */
  minutesBefore: Map<string, number>
}

/**
 * A work day: every shift of one job on one date (a shift crossing midnight
 * stays on its start date). Night status and the threshold are decided on
 * the whole day. Shifts are ordered by start, then key, so the order is
 * the same whichever shift is being computed.
 */
export const planWorkDay = (date: string, shifts: DayShift[], settings: OvertimeSettings): WorkDay => {
  const isNight = nightMinutes(shifts) >= NIGHT_SHIFT_MIN_MINUTES
  const ordered = [...shifts].sort((a, b) =>
    a.start.getTime() - b.start.getTime() || (a.key < b.key ? -1 : a.key > b.key ? 1 : 0))
  const minutesBefore = new Map<string, number>()
  let worked = 0
  for (const s of ordered) {
    minutesBefore.set(s.key, worked)
    worked += Math.round((s.end.getTime() - s.start.getTime()) / MIN_MS)
  }
  return { isNight, thresholdMinutes: dailyThresholdMinutes(settings, date, isNight), minutesBefore }
}

// ── Segments ──────────────────────────────────────

/** 0 = regular hours, 1 = first 2 overtime hours (+25%), 2 = after that (+50%). */
export type OvertimeTier = 0 | 1 | 2

export type PaySegment = { start: Date; end: Date; minutes: number; shabbat: boolean; tier: OvertimeTier }

/**
 * One shift cut at every Shabbat boundary and overtime tier boundary, in
 * time order. `minutesBefore` = minutes already worked that work day.
 */
export const segmentShift = (
  interval: TimeWindow, windows: TimeWindow[], thresholdMinutes: number, minutesBefore: number,
): PaySegment[] => {
  const s = interval.start.getTime()
  const e = interval.end.getTime()
  if (!(e > s)) return []

  const cuts = new Set<number>([s, e])
  for (const w of windows) {
    for (const t of [w.start.getTime(), w.end.getTime()]) if (t > s && t < e) cuts.add(t)
  }
  for (const atMin of [thresholdMinutes, thresholdMinutes + FIRST_TIER_MIN]) {
    if (!isFinite(atMin)) continue
    const t = s + (atMin - minutesBefore) * MIN_MS
    if (t > s && t < e) cuts.add(t)
  }
  const points = [...cuts].sort((a, b) => a - b)

  const inShabbat = (t: number) => windows.some(w => t >= w.start.getTime() && t < w.end.getTime())
  const tierAt = (t: number): OvertimeTier => {
    const worked = minutesBefore + (t - s) / MIN_MS
    return worked < thresholdMinutes ? 0 : worked < thresholdMinutes + FIRST_TIER_MIN ? 1 : 2
  }

  const segments: PaySegment[] = []
  for (let i = 0; i < points.length - 1; i++) {
    const mid = (points[i] + points[i + 1]) / 2
    const shabbat = inShabbat(mid)
    const tier = tierAt(mid)
    const last = segments[segments.length - 1]
    if (last && last.shabbat === shabbat && last.tier === tier) {
      last.end = new Date(points[i + 1])
    } else {
      segments.push({ start: new Date(points[i]), end: new Date(points[i + 1]), minutes: 0, shabbat, tier })
    }
  }
  for (const seg of segments) seg.minutes = Math.round((seg.end.getTime() - seg.start.getTime()) / MIN_MS)
  return segments
}

// ── Summary ───────────────────────────────────────

export type Buckets = {
  regular: number
  ot125: number
  ot150: number
  /** Shabbat hours without overtime (150% with the premium, else 100%) */
  shabbat: number
  /** First 2 overtime hours inside Shabbat (175% with the premium, else 125%) */
  shabbatOt175: number
  /** Overtime from the 3rd hour inside Shabbat (200% with the premium, else 150%) */
  shabbatOt200: number
}

export type BucketKey = keyof Buckets
export const BUCKET_KEYS: BucketKey[] = ['regular', 'ot125', 'ot150', 'shabbat', 'shabbatOt175', 'shabbatOt200']

export const emptyBuckets = (): Buckets => ({ regular: 0, ot125: 0, ot150: 0, shabbat: 0, shabbatOt175: 0, shabbatOt200: 0 })

export const bucketOf = (shabbat: boolean, tier: OvertimeTier): BucketKey =>
  shabbat
    ? (['shabbat', 'shabbatOt175', 'shabbatOt200'] as const)[tier]
    : (['regular', 'ot125', 'ot150'] as const)[tier]

export const bucketMinutes = (segments: PaySegment[]): Buckets => {
  const b = emptyBuckets()
  for (const seg of segments) b[bucketOf(seg.shabbat, seg.tier)] += seg.minutes
  return b
}

const OT_ADD = [0, 0.25, 0.5]
const SHABBAT_ADD = 0.5

/** Pay multiplier: base + Shabbat add (only with the premium) + overtime add. */
export const multiplierOf = (shabbat: boolean, tier: OvertimeTier, premiumApplied: boolean): number =>
  1 + (shabbat && premiumApplied ? SHABBAT_ADD : 0) + OT_ADD[tier]

const BUCKET_PARTS: Record<BucketKey, { shabbat: boolean; tier: OvertimeTier }> = {
  regular: { shabbat: false, tier: 0 },
  ot125: { shabbat: false, tier: 1 },
  ot150: { shabbat: false, tier: 2 },
  shabbat: { shabbat: true, tier: 0 },
  shabbatOt175: { shabbat: true, tier: 1 },
  shabbatOt200: { shabbat: true, tier: 2 },
}

export const bucketMultiplier = (key: BucketKey, premiumApplied: boolean): number =>
  multiplierOf(BUCKET_PARTS[key].shabbat, BUCKET_PARTS[key].tier, premiumApplied)

const round2 = (n: number) => Math.round(n * 100) / 100

/** Hours of a bucket as stored/paid: rounded to 2 decimals, as regular_hours/shabbat_hours always were. */
export const bucketHours = (minutes: number): number => round2(minutes / 60)

/**
 * Pay per bucket and in total. Each part is rate x hours (2 decimals) x
 * multiplier, so a shift without overtime pays exactly what the old
 * Shabbat formula paid. The last non-zero part absorbs rounding so the
 * parts always add up to the total.
 */
export const bucketPay = (rate: number, minutes: Buckets, premiumApplied: boolean): Buckets & { total: number } => {
  const exact = emptyBuckets()
  for (const k of BUCKET_KEYS) exact[k] = rate * bucketHours(minutes[k]) * bucketMultiplier(k, premiumApplied)
  const total = round2(BUCKET_KEYS.reduce((sum, k) => sum + exact[k], 0))

  const pay = emptyBuckets()
  for (const k of BUCKET_KEYS) pay[k] = round2(exact[k])
  const lastKey = [...BUCKET_KEYS].reverse().find(k => minutes[k] > 0)
  if (lastKey) {
    const others = BUCKET_KEYS.filter(k => k !== lastKey).reduce((sum, k) => sum + pay[k], 0)
    pay[lastKey] = round2(total - others)
  }
  return { ...pay, total }
}

export const overtimeMinutes = (b: Buckets): number => b.ot125 + b.ot150 + b.shabbatOt175 + b.shabbatOt200
