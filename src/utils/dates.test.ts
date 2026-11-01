import { describe, it, expect } from 'vitest'
import { jerusalemISODate, historyWindow, toISODate } from './dates'

describe('jerusalemISODate', () => {
  it('returns the Israeli date just after local midnight, when UTC is still the day before (winter, UTC+2)', () => {
    // 2026-01-15 00:30 in Israel = 2026-01-14 22:30 UTC
    expect(jerusalemISODate(new Date('2026-01-14T22:30:00Z'))).toBe('2026-01-15')
  })

  it('handles summer time (UTC+3)', () => {
    // 2026-07-15 02:30 in Israel = 2026-07-14 23:30 UTC
    expect(jerusalemISODate(new Date('2026-07-14T23:30:00Z'))).toBe('2026-07-15')
  })

  it('returns the same day late in the evening', () => {
    expect(jerusalemISODate(new Date('2026-07-15T20:59:00Z'))).toBe('2026-07-15')
  })
})

describe('toISODate', () => {
  it('rolls day 0 back to the last day of the previous month', () => {
    expect(toISODate(2026, 2, 0)).toBe('2026-02-28')
    expect(toISODate(2028, 2, 0)).toBe('2028-02-29')
  })
})

describe('historyWindow', () => {
  it('spans 12 months back to the end of next month, by Israeli date', () => {
    // 2026-11-01 01:00 Israel, still 2026-10-31 in UTC
    const now = new Date('2026-10-31T23:00:00Z')
    expect(historyWindow(12, 1, now)).toEqual({ from: '2025-11-01', to: '2026-12-31' })
  })

  it('crosses the year boundary forwards', () => {
    expect(historyWindow(12, 1, new Date('2026-12-10T10:00:00Z'))).toEqual({ from: '2025-12-01', to: '2027-01-31' })
  })

  it('keeps the last day of the forward month (was dropped by the UTC conversion)', () => {
    expect(historyWindow(0, 1, new Date('2026-01-10T10:00:00Z')).to).toBe('2026-02-28')
  })
})
