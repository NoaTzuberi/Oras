import { describe, it, expect } from 'vitest'
import {
  bucketMinutes, bucketPay, dailyThresholdMinutes, nightMinutes, planWorkDay, resolveOvertimeSettings,
  segmentShift, DEFAULT_OVERTIME_SETTINGS, type OvertimeSettings,
} from './overtime'
import { jerusalemDateTime, shiftInterval, type TimeWindow } from './shabbat'

// Week of Sun 2026-11-01 .. Sat 2026-11-07
const WED = '2026-11-04'
const THU = '2026-11-05'
const FRI = '2026-11-06'
const SAT = '2026-11-07'
// Synthetic Shabbat window (real-looking times for Tel Aviv)
const SHABBAT: TimeWindow = { start: jerusalemDateTime(FRI, '16:34'), end: jerusalemDateTime(SAT, '17:32') }
const windows = [SHABBAT]

const fiveDay = DEFAULT_OVERTIME_SETTINGS
const fiveDayThuShort: OvertimeSettings = { ...fiveDay, shortDayWeekday: 4 }
const sixDay: OvertimeSettings = { ...fiveDay, weekPattern: '6day' }

const iv = (date: string, startTime: string, endTime: string) => shiftInterval({ date, startTime, endTime })

/** One shift on its own: segments, buckets and pay at ₪50 with the premium on. */
const single = (date: string, startTime: string, endTime: string, settings = fiveDay, premium = true) => {
  const interval = iv(date, startTime, endTime)
  const day = planWorkDay(date, [{ key: 'a', ...interval }], settings)
  const segments = segmentShift(interval, windows, day.thresholdMinutes, day.minutesBefore.get('a')!)
  const minutes = bucketMinutes(segments)
  return { day, segments, minutes, pay: bucketPay(50, minutes, premium) }
}

describe('resolveOvertimeSettings', () => {
  it('NULL job settings (or no job) mean 5-day week, OT on, short day not known', () => {
    expect(resolveOvertimeSettings(null)).toEqual({ weekPattern: '5day', customThresholdHours: null, enabled: true, shortDayWeekday: null })
    expect(resolveOvertimeSettings({ weekPattern: null, customDailyThresholdHours: null, overtimeEnabled: null, shortDayWeekday: null }))
      .toEqual(DEFAULT_OVERTIME_SETTINGS)
  })

  it('custom pattern without a value falls back to the 5-day rules', () => {
    const s = resolveOvertimeSettings({ weekPattern: 'custom', customDailyThresholdHours: null, overtimeEnabled: true, shortDayWeekday: null })
    expect(dailyThresholdMinutes(s, WED, false)).toBe(516)
  })
})

describe('dailyThresholdMinutes', () => {
  it('5-day week: 8:36, and 7:36 on the chosen short day', () => {
    expect(dailyThresholdMinutes(fiveDayThuShort, WED, false)).toBe(516)
    expect(dailyThresholdMinutes(fiveDayThuShort, THU, false)).toBe(456)
    expect(dailyThresholdMinutes(fiveDayThuShort, FRI, false)).toBe(516)
    expect(dailyThresholdMinutes({ ...fiveDay, shortDayWeekday: 0 }, '2026-11-01', false)).toBe(456)
  })

  it('5-day week, short day not known (the default): 8:36 every day', () => {
    for (const date of ['2026-11-01', '2026-11-02', '2026-11-03', WED, THU, FRI, SAT]) {
      expect(dailyThresholdMinutes(fiveDay, date, false)).toBe(516)
    }
  })

  it('6-day week: 8h, Friday 7h', () => {
    expect(dailyThresholdMinutes(sixDay, WED, false)).toBe(480)
    expect(dailyThresholdMinutes(sixDay, FRI, false)).toBe(420)
  })

  it('night shift: 7h, the lower threshold wins', () => {
    expect(dailyThresholdMinutes(fiveDay, WED, true)).toBe(420)
    expect(dailyThresholdMinutes(fiveDayThuShort, THU, true)).toBe(420) // short day 7:36 vs night 7:00
  })

  it('custom threshold, and the lower of custom / 7h on a night shift', () => {
    const custom = (h: number): OvertimeSettings => ({ ...fiveDay, weekPattern: 'custom', customThresholdHours: h })
    expect(dailyThresholdMinutes(custom(9), WED, false)).toBe(540)
    expect(dailyThresholdMinutes(custom(9), WED, true)).toBe(420)
    expect(dailyThresholdMinutes(custom(6), WED, true)).toBe(360)
    expect(dailyThresholdMinutes({ ...custom(7.5), shortDayWeekday: 4 }, THU, false)).toBe(450) // custom ignores the short day
  })
})

describe('night shift (2+ hours between 22:00 and 06:00)', () => {
  it('counts minutes in the night windows on both sides of midnight', () => {
    expect(nightMinutes([iv(WED, '22:00', '07:00')])).toBe(480)
    expect(nightMinutes([iv(WED, '04:00', '12:00')])).toBe(120) // kolzchut's own example
    expect(nightMinutes([iv(WED, '08:00', '18:00')])).toBe(0)
  })

  it('exactly 2:00 is a night shift, 1:59 is not', () => {
    expect(planWorkDay(FRI, [{ key: 'a', ...iv(FRI, '13:00', '00:00') }], fiveDay).isNight).toBe(true)
    expect(planWorkDay(FRI, [{ key: 'a', ...iv(FRI, '13:00', '23:59') }], fiveDay).isNight).toBe(false)
  })

  it('is decided on the whole work day (two shifts of the same job)', () => {
    const day = planWorkDay(WED, [
      { key: 'a', ...iv(WED, '21:00', '23:00') }, // 1h at night
      { key: 'b', ...iv(WED, '23:30', '00:30') }, // 1h at night
    ], fiveDay)
    expect(day.isNight).toBe(true)
    expect(day.thresholdMinutes).toBe(420)
  })
})

describe('daily overtime (₪50/h)', () => {
  it('10h weekday, 5-day job: 8:36 @100%, 1:24 @125% = ₪517.50', () => {
    const r = single(WED, '08:00', '18:00')
    expect(r.minutes).toEqual({ regular: 516, ot125: 84, ot150: 0, shabbat: 0, shabbatOt175: 0, shabbatOt200: 0 })
    expect(r.pay.total).toBe(517.5)
  })

  it('12h weekday: 8:36 @100%, 2:00 @125%, 1:24 @150%', () => {
    const r = single(WED, '07:00', '19:00')
    expect(r.minutes).toMatchObject({ regular: 516, ot125: 120, ot150: 84 })
    expect(r.pay.total).toBe(660) // 430 + 125 + 105
  })

  it('6-day job, Friday 9h: 7h @100%, 2h @125%', () => {
    const r = single(FRI, '06:00', '15:00', sixDay)
    expect(r.minutes).toMatchObject({ regular: 420, ot125: 120, ot150: 0 })
    expect(r.pay.total).toBe(475)
  })

  it('5-day job, Thursday chosen as the short day, 9h: 7:36 @100%, 1:24 @125%', () => {
    const r = single(THU, '08:00', '17:00', fiveDayThuShort)
    expect(r.minutes).toMatchObject({ regular: 456, ot125: 84 })
  })

  it('5-day job, short day not known, Thursday 9h: 8:36 @100%, 0:24 @125%', () => {
    const r = single(THU, '08:00', '17:00')
    expect(r.minutes).toMatchObject({ regular: 516, ot125: 24 })
  })

  it('night shift 22:00-07:00 (9h): 7h @100%, 2h @125%', () => {
    const r = single(WED, '22:00', '07:00')
    expect(r.day.isNight).toBe(true)
    expect(r.minutes).toMatchObject({ regular: 420, ot125: 120, ot150: 0 })
    expect(r.pay.total).toBe(475)
  })

  it('no overtime under the threshold', () => {
    const r = single(WED, '09:00', '17:00')
    expect(r.minutes).toMatchObject({ regular: 480, ot125: 0, ot150: 0 })
    expect(r.pay.total).toBe(400)
  })
})

describe('Shabbat + overtime', () => {
  it('Friday 13:00-00:00, Shabbat from 16:34: night shift, so 7h day; 100 / 150 / 175 / 200%', () => {
    const r = single(FRI, '13:00', '00:00')
    expect(r.day).toMatchObject({ isNight: true, thresholdMinutes: 420 })
    expect(r.segments.map(s => [s.minutes, s.shabbat, s.tier])).toEqual([
      [214, false, 0], // 13:00-16:34 100%
      [206, true, 0],  // 16:34-20:00 150%
      [120, true, 1],  // 20:00-22:00 175%
      [120, true, 2],  // 22:00-00:00 200%
    ])
    expect(r.segments[1].start).toEqual(SHABBAT.start)
    expect(r.segments[2].start).toEqual(jerusalemDateTime(FRI, '20:00'))
    expect(r.segments[3].start).toEqual(jerusalemDateTime(FRI, '22:00'))
    expect(r.minutes).toEqual({ regular: 214, ot125: 0, ot150: 0, shabbat: 206, shabbatOt175: 120, shabbatOt200: 120 })
    // Hours rounded to 2 decimals per part, as today: 3.57x50 + 3.43x75 + 2x87.5 + 2x100
    expect(r.pay.total).toBe(810.75)
  })

  it('same Friday ending 23:59: 1:59 at night, not a night shift, 8:36 day', () => {
    const r = single(FRI, '13:00', '23:59')
    expect(r.day).toMatchObject({ isNight: false, thresholdMinutes: 516 })
    expect(r.minutes).toEqual({ regular: 214, ot125: 0, ot150: 0, shabbat: 302, shabbatOt175: 120, shabbatOt200: 23 })
    expect(r.pay.total).toBe(768.75) // 178.50 + 377.25 + 175 + 38
  })

  it('Saturday 11h fully in Shabbat: 8:36 @150%, 2:00 @175%, 0:24 @200%', () => {
    const r = single(SAT, '06:00', '17:00')
    expect(r.minutes).toEqual({ regular: 0, ot125: 0, ot150: 0, shabbat: 516, shabbatOt175: 120, shabbatOt200: 24 })
    expect(r.pay.total).toBe(860) // 645 + 175 + 40
  })

  it('Shabbat premium off: Shabbat hours get only the overtime add (100 / 125 / 150%)', () => {
    const r = single(SAT, '06:00', '17:00', fiveDay, false)
    expect(r.pay.total).toBe(585) // 430 + 125 + 30
  })
})

describe('work day: shifts of the same job on the same date', () => {
  it('two shifts (6h + 4h) are combined: OT on the last 1:24', () => {
    const a = iv(WED, '08:00', '14:00')
    const b = iv(WED, '15:00', '19:00')
    const day = planWorkDay(WED, [{ key: 'b', ...b }, { key: 'a', ...a }], fiveDay)
    expect(day.minutesBefore.get('a')).toBe(0)
    expect(day.minutesBefore.get('b')).toBe(360)

    const segA = segmentShift(a, windows, day.thresholdMinutes, 0)
    const segB = segmentShift(b, windows, day.thresholdMinutes, 360)
    expect(bucketMinutes(segA)).toMatchObject({ regular: 360, ot125: 0 })
    expect(bucketMinutes(segB)).toMatchObject({ regular: 156, ot125: 84 })
    expect(segB[1].start).toEqual(jerusalemDateTime(WED, '17:36'))
    expect(bucketPay(50, bucketMinutes(segB), true).total).toBe(217.5) // 2.6x50 + 1.4x62.5
  })

  it('same start time: order is stable (by key), so overtime is never counted twice', () => {
    const a = iv(WED, '08:00', '13:00')
    const b = iv(WED, '08:00', '13:00')
    const day = planWorkDay(WED, [{ key: 'b', ...b }, { key: 'a', ...a }], fiveDay)
    expect([day.minutesBefore.get('a'), day.minutesBefore.get('b')]).toEqual([0, 300])
  })

  it('overtime disabled: threshold is infinite, no OT', () => {
    const r = single(WED, '08:00', '18:00', { ...fiveDay, enabled: false })
    expect(r.minutes).toMatchObject({ regular: 600, ot125: 0, ot150: 0 })
    expect(r.pay.total).toBe(500)
  })
})

describe('bucketPay', () => {
  it('without overtime matches the old Shabbat formula exactly', () => {
    // 5:00 regular + 6:00 Shabbat, the existing shiftPay test case
    const m = { regular: 300, ot125: 0, ot150: 0, shabbat: 360, shabbatOt175: 0, shabbatOt200: 0 }
    expect(bucketPay(50, m, true).total).toBe(700)
    expect(bucketPay(50, m, false).total).toBe(550)
  })

  it('parts add up to the total exactly', () => {
    const m = { regular: 214, ot125: 0, ot150: 0, shabbat: 206, shabbatOt175: 120, shabbatOt200: 120 }
    const p = bucketPay(47.3, m, true)
    const sum = p.regular + p.ot125 + p.ot150 + p.shabbat + p.shabbatOt175 + p.shabbatOt200
    expect(Math.round(sum * 100) / 100).toBe(p.total)
  })
})
