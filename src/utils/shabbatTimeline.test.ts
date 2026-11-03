import { describe, it, expect } from 'vitest'
import { buildShiftTimeline, jerusalemTime, jerusalemWeekdayIndex, overlappingWindow } from './shabbatTimeline'

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
