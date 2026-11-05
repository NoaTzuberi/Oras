import { describe, it, expect } from 'vitest'
import { buildPayTimeline, buildShiftTimeline, jerusalemTime, jerusalemWeekdayIndex, overlappingWindow } from './shabbatTimeline'

// Winter: Israel is UTC+2
const at = (iso: string) => new Date(`${iso}+02:00`)
const shabbat = { start: at('2026-11-06T16:34'), end: at('2026-11-07T17:33') }

describe('buildShiftTimeline', () => {
  it('Friday shift into Shabbat: regular then Shabbat, one "in" tick', () => {
    const { segments, ticks } = buildShiftTimeline(at('2026-11-06T13:08'), at('2026-11-07T00:08'), [shabbat])
    expect(segments.map(s => s.kind)).toEqual(['regular', 'shabbat'])
    expect(segments[0].from).toBe(0)
    expect(segments[1].to).toBe(100)
    expect(ticks).toHaveLength(1)
    expect(ticks[0].kind).toBe('in')
    expect(ticks[0].pct).toBeCloseTo((206 / 660) * 100) // 3:26 of 11:00
  })

  it('Saturday-night shift: Shabbat then regular, one "out" tick', () => {
    const { segments, ticks } = buildShiftTimeline(at('2026-11-07T15:00'), at('2026-11-07T23:00'), [shabbat])
    expect(segments.map(s => s.kind)).toEqual(['shabbat', 'regular'])
    expect(ticks.map(t => t.kind)).toEqual(['out'])
  })

  it('shift covering all of Shabbat: both ticks', () => {
    const { segments, ticks } = buildShiftTimeline(at('2026-11-06T12:00'), at('2026-11-07T20:00'), [shabbat])
    expect(segments.map(s => s.kind)).toEqual(['regular', 'shabbat', 'regular'])
    expect(ticks.map(t => t.kind)).toEqual(['in', 'out'])
  })

  it('shift inside Shabbat: one Shabbat segment, no ticks', () => {
    const { segments, ticks } = buildShiftTimeline(at('2026-11-07T08:00'), at('2026-11-07T12:00'), [shabbat])
    expect(segments).toEqual([{ kind: 'shabbat', from: 0, to: 100 }])
    expect(ticks).toEqual([])
  })

  it('boundary exactly at the shift edge is not a tick', () => {
    const { ticks, segments } = buildShiftTimeline(at('2026-11-06T16:34'), at('2026-11-06T20:00'), [shabbat])
    expect(ticks).toEqual([])
    expect(segments.map(s => s.kind)).toEqual(['shabbat'])
  })
})

describe('header helpers', () => {
  it('finds the overlapping window', () => {
    expect(overlappingWindow(at('2026-11-06T13:00'), at('2026-11-06T17:00'), [shabbat])).toBe(shabbat)
    expect(overlappingWindow(at('2026-11-06T08:00'), at('2026-11-06T12:00'), [shabbat])).toBeNull()
  })

  it('formats Israel time and weekday', () => {
    expect(jerusalemTime(shabbat.start)).toBe('16:34')
    expect(jerusalemWeekdayIndex(shabbat.start)).toBe(5)
    expect(jerusalemWeekdayIndex(shabbat.end)).toBe(6)
  })
})

describe('buildPayTimeline', () => {
  const seg = (from: string, to: string, shabbat: boolean, tier: 0 | 1 | 2) => {
    const start = at(from), end = at(to)
    return { start, end, minutes: (end.getTime() - start.getTime()) / 60000, shabbat, tier }
  }

  it('Friday 13:00-00:00: one bar part per pay tier, Shabbat and overtime ticks', () => {
    const segments = [
      seg('2026-11-06T13:00', '2026-11-06T16:34', false, 0),
      seg('2026-11-06T16:34', '2026-11-06T20:00', true, 0),
      seg('2026-11-06T20:00', '2026-11-06T22:00', true, 1),
      seg('2026-11-06T22:00', '2026-11-07T00:00', true, 2),
    ]
    const t = buildPayTimeline(at('2026-11-06T13:00'), at('2026-11-07T00:00'), segments, [shabbat])
    expect(t.segments.map(s => s.kind)).toEqual(['regular', 'shabbat', 'shabbatOt175', 'shabbatOt200'])
    expect(t.segments[3].to).toBe(100)
    expect(t.ticks.map(k => k.kind)).toEqual(['in', 'ot', 'ot'])
    expect(t.ticks[1].pct).toBeCloseTo((420 / 660) * 100)
  })

  it('overtime crossing into Shabbat: one Shabbat tick, no extra overtime tick', () => {
    const segments = [
      seg('2026-11-06T06:00', '2026-11-06T14:36', false, 0),
      seg('2026-11-06T14:36', '2026-11-06T16:34', false, 1),
      seg('2026-11-06T16:34', '2026-11-06T16:36', true, 1),
      seg('2026-11-06T16:36', '2026-11-06T18:00', true, 2),
    ]
    const t = buildPayTimeline(at('2026-11-06T06:00'), at('2026-11-06T18:00'), segments, [shabbat])
    expect(t.segments.map(s => s.kind)).toEqual(['regular', 'ot125', 'shabbatOt175', 'shabbatOt200'])
    expect(t.ticks.map(k => k.kind)).toEqual(['ot', 'in', 'ot'])
  })
})
