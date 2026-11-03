import { describe, it, expect } from 'vitest'
import { parseLocalISODate, toLocalISODate } from './localDate'

describe('toLocalISODate', () => {
  it('keeps the picked day (toISOString gave the day before in Israel)', () => {
    // What the date picker returns: local midnight
    expect(toLocalISODate(new Date(2025, 7, 1))).toBe('2025-08-01')
  })

  it('pads month and day', () => {
    expect(toLocalISODate(new Date(2026, 0, 5))).toBe('2026-01-05')
  })
})

describe('parseLocalISODate', () => {
  it('round-trips with toLocalISODate', () => {
    expect(toLocalISODate(parseLocalISODate('2025-08-01'))).toBe('2025-08-01')
  })

  it('returns local midnight, so the month is right in any time zone', () => {
    const d = parseLocalISODate('2025-08-01')
    expect([d.getFullYear(), d.getMonth(), d.getDate(), d.getHours()]).toEqual([2025, 7, 1, 0])
  })

  it('rejects invalid input', () => {
    expect(isNaN(parseLocalISODate('not-a-date').getTime())).toBe(true)
    expect(isNaN(parseLocalISODate('2026-02-31').getTime())).toBe(true)
  })
})
