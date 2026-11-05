import { jerusalemWeekday, type TimeWindow } from './shabbat'
import { bucketOf, type BucketKey, type PaySegment } from './overtime'

export type TimelineSegment = { kind: 'regular' | 'shabbat'; from: number; to: number } // percent of the shift
export type TimelineTick = { at: Date; pct: number; kind: 'in' | 'out' }
export type ShiftTimeline = { segments: TimelineSegment[]; ticks: TimelineTick[] }

/**
 * The shift as a bar: regular / Shabbat segments (in percent of the shift)
 * and a tick for every Shabbat start or end that falls strictly inside it.
 */
export const buildShiftTimeline = (start: Date, end: Date, windows: TimeWindow[]): ShiftTimeline => {
  const s = start.getTime()
  const e = end.getTime()
  if (!(e > s)) return { segments: [], ticks: [] }
  const pct = (t: number) => ((t - s) / (e - s)) * 100

  const ticks: TimelineTick[] = []
  for (const w of windows) {
    const ws = w.start.getTime()
    const we = w.end.getTime()
    if (ws > s && ws < e) ticks.push({ at: w.start, pct: pct(ws), kind: 'in' })
    if (we > s && we < e) ticks.push({ at: w.end, pct: pct(we), kind: 'out' })
  }
  ticks.sort((a, b) => a.pct - b.pct)

  const cuts = [s, ...ticks.map(t => t.at.getTime()), e]
  const inShabbat = (t: number) => windows.some(w => t >= w.start.getTime() && t < w.end.getTime())
  const segments: TimelineSegment[] = []
  for (let i = 0; i < cuts.length - 1; i++) {
    const kind = inShabbat((cuts[i] + cuts[i + 1]) / 2) ? 'shabbat' : 'regular'
    const last = segments[segments.length - 1]
    if (last && last.kind === kind) last.to = pct(cuts[i + 1])
    else segments.push({ kind, from: pct(cuts[i]), to: pct(cuts[i + 1]) })
  }
  return { segments, ticks }
}

/** The Shabbat window the shift overlaps (the first one, if somehow several). */
export const overlappingWindow = (start: Date, end: Date, windows: TimeWindow[]): TimeWindow | null =>
  windows.find(w => w.start.getTime() < end.getTime() && w.end.getTime() > start.getTime()) ?? null

const timeFormatter = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Asia/Jerusalem', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
})

/** "16:34", Israel time. */
export const jerusalemTime = (at: Date): string => timeFormatter.format(at)

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

/** 0 = Sunday ... 6 = Saturday, Israel time. */
export const jerusalemWeekdayIndex = (at: Date): number => WEEKDAYS.indexOf(jerusalemWeekday(at))

export type PayTimelineSegment = { kind: BucketKey; from: number; to: number } // percent of the shift
export type PayTimelineTick = { at: Date; pct: number; kind: 'in' | 'out' | 'ot' }
export type PayTimeline = { segments: PayTimelineSegment[]; ticks: PayTimelineTick[] }

/**
 * The shift as a bar of pay parts (regular, overtime tiers, Shabbat and
 * Shabbat overtime), with a tick at every Shabbat start/end and every
 * point where an overtime tier begins.
 */
export const buildPayTimeline = (start: Date, end: Date, segments: PaySegment[], windows: TimeWindow[]): PayTimeline => {
  const s = start.getTime()
  const e = end.getTime()
  if (!(e > s)) return { segments: [], ticks: [] }
  const pct = (t: number) => ((t - s) / (e - s)) * 100

  const ticks: PayTimelineTick[] = buildShiftTimeline(start, end, windows).ticks
  for (let i = 1; i < segments.length; i++) {
    if (segments[i].tier > segments[i - 1].tier) {
      const t = segments[i].start.getTime()
      ticks.push({ at: segments[i].start, pct: pct(t), kind: 'ot' })
    }
  }
  ticks.sort((a, b) => a.pct - b.pct)

  return {
    segments: segments.map(seg => ({
      kind: bucketOf(seg.shabbat, seg.tier),
      from: pct(seg.start.getTime()),
      to: pct(seg.end.getTime()),
    })),
    ticks,
  }
}
