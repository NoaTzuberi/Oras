import { describe, it, expect } from 'vitest'
import {
  jerusalemDateTime, shiftInterval, splitShiftHours, calcShiftPay, resolvePremium,
  buildRestWindows, buildShabbatWindows, yomTovOn, type TimeWindow, type HebcalTimeItem,
} from './shabbat'
import regular from './__fixtures__/hebcal_regular_2026-10.json'
import summer from './__fixtures__/hebcal_summer_2026-07.json'
import dstSpring from './__fixtures__/hebcal_dst_spring_2026-03.json'
import dstFall from './__fixtures__/hebcal_dst_fall_2026-10.json'
import shavuot from './__fixtures__/hebcal_shavuot_fri_2026-05.json'
import roshHashana from './__fixtures__/hebcal_rosh_hashana_sun_2026-09.json'

// Real Hebcal responses for Tel Aviv (geonameid 293397), recorded 2026-11-01.
const fixtures = { regular, summer, dstSpring, dstFall, shavuot, roshHashana } as Record<string, HebcalTimeItem[]>

const at = (date: string, time: string) => jerusalemDateTime(date, time)
const win = (startDate: string, startTime: string, endDate: string, endTime: string): TimeWindow => ({
  start: at(startDate, startTime), end: at(endDate, endTime),
})
const split = (date: string, startTime: string, endTime: string, windows: TimeWindow[]) => {
  const { start, end } = shiftInterval({ date, startTime, endTime })
  return splitShiftHours(start, end, windows)
}

// Fri 2026-07-17 / Sat 2026-07-18
const SUMMER_SHABBAT = win('2026-07-17', '18:00', '2026-07-18', '18:30')

describe('jerusalemDateTime', () => {
  it('uses UTC+2 in winter', () => {
    expect(at('2026-01-16', '18:00').toISOString()).toBe('2026-01-16T16:00:00.000Z')
  })

  it('uses UTC+3 in summer', () => {
    expect(at('2026-07-17', '18:00').toISOString()).toBe('2026-07-17T15:00:00.000Z')
  })

  it('switches offset exactly on the DST day (Fri 2026-03-27, 02:00 -> 03:00)', () => {
    expect(at('2026-03-27', '01:30').toISOString()).toBe('2026-03-26T23:30:00.000Z')
    expect(at('2026-03-27', '03:30').toISOString()).toBe('2026-03-27T00:30:00.000Z')
  })

  it('matches the instant Hebcal gives (offset in the string)', () => {
    expect(at('2026-10-30', '16:32').getTime()).toBe(new Date('2026-10-30T16:32:00+02:00').getTime())
  })

  it('rejects malformed input', () => {
    expect(() => at('30/10/2026', '16:32')).toThrow()
    expect(() => at('2026-10-30', '4pm')).toThrow()
  })
})

describe('shiftInterval', () => {
  it('keeps a same-day shift on that day', () => {
    const { start, end } = shiftInterval({ date: '2026-07-17', startTime: '08:00', endTime: '14:00' })
    expect(end.getTime() - start.getTime()).toBe(6 * 3600_000)
  })

  it('moves the end to the next day when end <= start', () => {
    const { end } = shiftInterval({ date: '2026-07-17', startTime: '22:00', endTime: '06:00' })
    expect(end.toISOString()).toBe(at('2026-07-18', '06:00').toISOString())
  })

  it('treats midnight as the end of the day', () => {
    const { end } = shiftInterval({ date: '2026-07-17', startTime: '13:00', endTime: '00:00' })
    expect(end.toISOString()).toBe(at('2026-07-18', '00:00').toISOString())
  })
})

describe('splitShiftHours: required cases', () => {
  it('Fri 13:00-00:00, Shabbat at 18:00 -> 5h regular, 6h Shabbat', () => {
    expect(split('2026-07-17', '13:00', '00:00', [SUMMER_SHABBAT])).toEqual({ regularHours: 5, shabbatHours: 6 })
  })

  it('Fri 08:00-14:00, before Shabbat -> all regular', () => {
    expect(split('2026-07-17', '08:00', '14:00', [SUMMER_SHABBAT])).toEqual({ regularHours: 6, shabbatHours: 0 })
  })

  it('Fri 22:00 -> Sat 06:00, fully inside -> all Shabbat', () => {
    expect(split('2026-07-17', '22:00', '06:00', [SUMMER_SHABBAT])).toEqual({ regularHours: 0, shabbatHours: 8 })
  })

  it('Sat 10:00-22:00, havdalah 18:30 -> 8.5h Shabbat, 3.5h regular', () => {
    expect(split('2026-07-18', '10:00', '22:00', [SUMMER_SHABBAT])).toEqual({ regularHours: 3.5, shabbatHours: 8.5 })
  })

  it('Sat 20:00-02:00, after havdalah -> all regular', () => {
    expect(split('2026-07-18', '20:00', '02:00', [SUMMER_SHABBAT])).toEqual({ regularHours: 6, shabbatHours: 0 })
  })

  it('Tuesday shift -> all regular', () => {
    expect(split('2026-07-14', '09:00', '17:00', [SUMMER_SHABBAT])).toEqual({ regularHours: 8, shabbatHours: 0 })
  })

  it('a shift covering the whole of Shabbat splits at both boundaries', () => {
    // Fri 12:00 -> Sat 12:00 is 24h; Shabbat part = Fri 18:00 -> Sat 12:00 = 18h
    expect(split('2026-07-17', '12:00', '12:00', [SUMMER_SHABBAT])).toEqual({ regularHours: 6, shabbatHours: 18 })
  })

  it('returns zero for an empty interval', () => {
    const t = at('2026-07-17', '10:00')
    expect(splitShiftHours(t, t, [SUMMER_SHABBAT])).toEqual({ regularHours: 0, shabbatHours: 0 })
  })
})

describe('real Hebcal weeks: winter, summer, DST', () => {
  const windows = (name: string) => buildShabbatWindows(fixtures[name])

  it('winter (UTC+2): Fri 2026-10-30 13:00-00:00, candles 16:32', () => {
    expect(windows('regular')).toEqual([win('2026-10-30', '16:32', '2026-10-31', '17:29')])
    expect(split('2026-10-30', '13:00', '00:00', windows('regular'))).toEqual({ regularHours: 3.53, shabbatHours: 7.47 })
  })

  it('summer (UTC+3): Fri 2026-07-17 13:00-00:00, candles 19:27', () => {
    expect(split('2026-07-17', '13:00', '00:00', windows('summer'))).toEqual({ regularHours: 6.45, shabbatHours: 4.55 })
  })

  it('same wall-clock shift gets different splits in winter and summer', () => {
    const w = split('2026-10-30', '15:00', '21:00', windows('regular')).shabbatHours
    const s = split('2026-07-17', '15:00', '21:00', windows('summer')).shabbatHours
    expect([w, s]).toEqual([4.47, 1.55])
  })

  it('DST start week: overnight Thu 22:00 -> Fri 06:00 is 7 real hours, all regular', () => {
    expect(split('2026-03-26', '22:00', '06:00', windows('dstSpring'))).toEqual({ regularHours: 7, shabbatHours: 0 })
  })

  it('DST start week: Fri 2026-03-27 13:00-00:00, candles 18:37 (first day of summer time)', () => {
    expect(split('2026-03-27', '13:00', '00:00', windows('dstSpring'))).toEqual({ regularHours: 5.62, shabbatHours: 5.38 })
  })

  it('DST end night: Sat 2026-10-24 22:00 -> Sun 06:00 is 9 real hours, all after havdalah', () => {
    expect(split('2026-10-24', '22:00', '06:00', windows('dstFall'))).toEqual({ regularHours: 9, shabbatHours: 0 })
  })

  it('last Shabbat of summer time: Sat 2026-10-24 12:00-20:00, havdalah 18:36', () => {
    expect(split('2026-10-24', '12:00', '20:00', windows('dstFall'))).toEqual({ regularHours: 1.4, shabbatHours: 6.6 })
  })
})

describe('yom tov next to Shabbat', () => {
  it('Shavuot on Friday: two candle lightings, one havdalah -> one merged rest period', () => {
    const rest = buildRestWindows(fixtures.shavuot)
    expect(rest).toEqual([{
      start: at('2026-05-21', '19:15').getTime(),
      end: at('2026-05-23', '20:18').getTime(),
    }])
  })

  it('Shavuot on Friday: only Shabbat itself counts (holiday premium not supported yet)', () => {
    const windows = buildShabbatWindows(fixtures.shavuot)
    expect(windows).toEqual([win('2026-05-22', '19:16', '2026-05-23', '20:18')])
    // Shavuot day, before Shabbat starts: regular for now
    expect(split('2026-05-22', '10:00', '16:00', windows)).toEqual({ regularHours: 6, shabbatHours: 0 })
    // Splits at Shabbat candle lighting, not at the chag's
    expect(split('2026-05-22', '16:00', '22:00', windows)).toEqual({ regularHours: 3.27, shabbatHours: 2.73 })
  })

  it('Rosh Hashana starting Saturday night: Shabbat ends at the Saturday candle lighting, not Sunday havdalah', () => {
    const windows = buildShabbatWindows(fixtures.roshHashana)
    expect(windows).toEqual([win('2026-09-11', '18:32', '2026-09-12', '19:28')])
    expect(split('2026-09-12', '17:00', '23:00', windows)).toEqual({ regularHours: 3.53, shabbatHours: 2.47 })
  })

  it('reports yom tov names on the Israeli calendar', () => {
    expect(yomTovOn(fixtures.roshHashana, '2026-09-13').map(h => h.title)).toEqual(['Rosh Hashana II'])
    expect(yomTovOn(fixtures.roshHashana, '2026-09-11')).toEqual([]) // erev, not yom tov
  })

  it('a weekday yom tov alone produces no Shabbat window', () => {
    const items: HebcalTimeItem[] = [
      { category: 'candles', date: '2026-04-01T18:50:00+03:00' }, // Wed
      { category: 'havdalah', date: '2026-04-02T19:50:00+03:00' }, // Thu
    ]
    expect(buildShabbatWindows(items)).toEqual([])
  })

  it('throws when a Shabbat start has no end in the data (caller marks shift unverified)', () => {
    expect(() => buildShabbatWindows([{ category: 'candles', date: '2026-10-30T16:32:00+02:00' }])).toThrow(/Incomplete/)
  })
})

describe('premium', () => {
  const s = { regularHours: 5, shabbatHours: 6 }

  it('pays regular hours at the rate and Shabbat hours at x1.5', () => {
    expect(calcShiftPay(50, s, true)).toBe(5 * 50 + 6 * 75)
  })

  it('job with pays_shabbat_premium = false: split still computed, no x1.5', () => {
    const premium = resolvePremium(null, false)
    expect(premium).toBe(false)
    expect(calcShiftPay(50, s, premium)).toBe(550)
  })

  it('job not answered yet (NULL) or no job: no x1.5 until answered', () => {
    expect(resolvePremium(null, null)).toBe(false)
    expect(resolvePremium(null, undefined)).toBe(false)
  })

  it('per-shift override beats the job default, both ways', () => {
    expect(resolvePremium(true, false)).toBe(true)
    expect(resolvePremium(false, true)).toBe(false)
    expect(calcShiftPay(50, s, resolvePremium(true, false))).toBe(700)
  })

  it('rounds to agorot', () => {
    expect(calcShiftPay(33.33, { regularHours: 3.53, shabbatHours: 7.47 }, true)).toBe(491.12)
  })
})
