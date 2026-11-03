import { describe, it, expect } from 'vitest'
import { pickLastUsedJobId } from './jobs'
import type { Job, Shift } from '../context/ShiftContext'

const job = (id: string, archived = false): Job => ({
  id, name: id, hourlyRate: 50, geonameid: 293397, paysShabbatPremium: true, color: null, archived,
})

const shift = (jobId: string | null): Shift => ({
  id: 's', date: '2026-10-01', startTime: '09:00', endTime: '17:00', hours: 8,
  salaryType: 'hourly', baseSalary: 400, tips: 0, totalEarnings: 400,
  isShabbatOrHoliday: false, used150: false,
  jobId, hourlyRate: null, regularHours: null, shabbatHours: null,
  shabbatPremiumApplied: null, shabbatVerified: null,
})

describe('pickLastUsedJobId', () => {
  it('prefers the remembered job', () => {
    expect(pickLastUsedJobId([job('a'), job('b')], [shift('a')], 'b')).toBe('b')
  })

  it('ignores a remembered job that was archived', () => {
    expect(pickLastUsedJobId([job('a'), job('b', true)], [], 'b')).toBe('a')
  })

  it('falls back to the job of the newest shift', () => {
    expect(pickLastUsedJobId([job('a'), job('b')], [shift(null), shift('b'), shift('a')], null)).toBe('b')
  })

  it('returns null when the user has no jobs yet (pre-backfill)', () => {
    expect(pickLastUsedJobId([], [shift(null)], null)).toBeNull()
  })
})
