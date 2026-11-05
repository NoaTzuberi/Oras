import { describe, it, expect } from 'vitest'
import type { Job, Shift } from '../context/ShiftContext'
import { affectsDay, planDayUpdates, workDayOthers } from './workDay'
import type { ShabbatLookup } from './shiftPay'

const WED = '2026-11-04'
const ok: ShabbatLookup = { status: 'ok', windows: [], isYomTov: false }

const job = (id: string, over: Partial<Job> = {}): Job => ({
  id, name: id, hourlyRate: 50, geonameid: 293397, paysShabbatPremium: true, color: null, archived: false,
  pensionActive: null, pensionEmployeePct: null, tipsInPayslip: null,
  weekPattern: null, customDailyThresholdHours: null, overtimeEnabled: null, shortDayWeekday: null,
  ...over,
})

/** A shift saved with the overtime calculation, at ₪50/h, no OT stored. */
const shift = (id: string, startTime: string, endTime: string, over: Partial<Shift> = {}): Shift => {
  const [sh, sm] = startTime.split(':').map(Number)
  const [eh, em] = endTime.split(':').map(Number)
  const hours = ((eh * 60 + em) - (sh * 60 + sm)) / 60
  return {
    id, date: WED, startTime, endTime, hours,
    salaryType: 'hourly', baseSalary: hours * 50, tips: 10, totalEarnings: hours * 50 + 10,
    isShabbatOrHoliday: false, used150: false,
    jobId: 'A', hourlyRate: 50, regularHours: hours, shabbatHours: 0, shabbatPremiumApplied: true, shabbatVerified: true,
    overtimeCalculated: true, dailyThresholdMinutes: 516, isNightShift: false,
    overtimeMinutes125: 0, overtimeMinutes150: 0, shabbatOtMinutes175: 0, shabbatOtMinutes200: 0,
    ...over,
  }
}

const jobs = [job('A'), job('B')]
const plan = (after: Shift[], changedId: string | null, lookup: ShabbatLookup = ok) =>
  planDayUpdates({ after, days: [{ jobId: 'A', date: WED }], changedId, jobs, lookupFor: () => lookup })

describe('workDayOthers', () => {
  it('only the same job on the same date, never itself, never no-job shifts', () => {
    const all = [
      shift('s1', '08:00', '12:00'),
      shift('s2', '13:00', '15:00'),
      shift('other-job', '16:00', '18:00', { jobId: 'B' }),
      shift('other-date', '16:00', '18:00', { date: '2026-11-05' }),
      shift('no-job', '19:00', '20:00', { jobId: null }),
    ]
    expect(workDayOthers(all, { id: 's1', jobId: 'A', date: WED }).map(o => o.key)).toEqual(['s2'])
    expect(workDayOthers(all, { jobId: null, date: WED })).toEqual([])
  })
})

describe('planDayUpdates', () => {
  it('adding an earlier shift moves the OT onto the stored later one: +₪17.50', () => {
    const later = shift('later', '14:00', '18:00')
    const added = shift('\uffff', '08:00', '14:00')
    const [u, ...rest] = plan([later, added], '\uffff')
    expect(rest).toEqual([])
    expect(u.shift.id).toBe('later')
    expect(u.deltaPay).toBe(17.5)
    expect(u.fields).toMatchObject({ baseSalary: 217.5, totalEarnings: 227.5, overtimeMinutes125: 84, tips: 10 })
    expect(u.fields).not.toHaveProperty('id')
  })

  it('deleting the earlier shift takes the OT back off: -₪17.50', () => {
    const later = shift('later', '14:00', '18:00', { baseSalary: 217.5, totalEarnings: 227.5, overtimeMinutes125: 84 })
    const [u] = plan([later], 'earlier')
    expect(u.deltaPay).toBe(-17.5)
    expect(u.fields).toMatchObject({ baseSalary: 200, overtimeMinutes125: 0 })
  })

  it('old shifts (overtime NULL) count toward the day but are never updated', () => {
    const old = shift('old', '14:00', '18:00', { overtimeCalculated: null })
    expect(plan([old, shift('\uffff', '08:00', '14:00')], '\uffff')).toEqual([])
  })

  it('unverified shifts are not updated', () => {
    const unverified = shift('u', '14:00', '18:00', { shabbatVerified: false })
    expect(plan([unverified, shift('\uffff', '08:00', '14:00')], '\uffff')).toEqual([])
  })

  it('nothing to update when the day has no OT change', () => {
    expect(plan([shift('a', '08:00', '10:00'), shift('\uffff', '11:00', '12:00')], '\uffff')).toEqual([])
  })

  it('Shabbat times not loaded: skipped, never guessed', () => {
    expect(plan([shift('later', '14:00', '18:00'), shift('\uffff', '08:00', '14:00')], '\uffff', { status: 'error' })).toEqual([])
  })

  it('daily-total shift: OT minutes updated, pay unchanged', () => {
    const total = shift('t', '14:00', '18:00', { salaryType: 'total', hourlyRate: null, baseSalary: 300, totalEarnings: 310, shabbatPremiumApplied: null })
    const [u] = plan([total, shift('\uffff', '08:00', '14:00')], '\uffff')
    expect(u.deltaPay).toBe(0)
    expect(u.fields).toMatchObject({ baseSalary: 300, overtimeMinutes125: 84 })
  })

  it('job with overtime off: no updates', () => {
    const offJobs = [job('A', { overtimeEnabled: false })]
    const later = shift('later', '14:00', '18:00', { overtimeCalculated: false, dailyThresholdMinutes: null })
    const updates = planDayUpdates({
      after: [later, shift('\uffff', '08:00', '14:00')], days: [{ jobId: 'A', date: WED }],
      changedId: '\uffff', jobs: offJobs, lookupFor: () => ok,
    })
    expect(updates).toEqual([])
  })
})

describe('affectsDay', () => {
  it('only date, times or job', () => {
    const s = shift('a', '08:00', '12:00')
    expect(affectsDay(s, { ...s })).toBe(false)
    expect(affectsDay(s, { ...s, endTime: '13:00' })).toBe(true)
    expect(affectsDay(s, { ...s, jobId: 'B' })).toBe(true)
  })
})
