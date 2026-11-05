import { describe, it, expect } from 'vitest'
import { earlierUpdatesExpanded, shouldShowWhatsNew, WHATS_NEW_RELEASED_AT } from './whatsNew'

const base = { loading: false, seenAt: null, shiftCount: 103, loadedShifts: 40 }
const RELEASE = '2026-11-05T00:00:00Z'

describe('shouldShowWhatsNew', () => {
  it('shows for an unseen user with shifts', () => {
    expect(shouldShowWhatsNew(base, RELEASE)).toBe(true)
  })

  it('waits until data has loaded', () => {
    expect(shouldShowWhatsNew({ ...base, loading: true }, RELEASE)).toBe(false)
  })

  it('shows again to users who dismissed an earlier version', () => {
    expect(shouldShowWhatsNew({ ...base, seenAt: '2026-11-04T10:00:00+00:00' }, RELEASE)).toBe(true)
  })

  it('does not show once this version was dismissed', () => {
    expect(shouldShowWhatsNew({ ...base, seenAt: '2026-11-05T09:30:00.123+00:00' }, RELEASE)).toBe(false)
    expect(shouldShowWhatsNew({ ...base, seenAt: RELEASE }, RELEASE)).toBe(false)
  })

  it('reads Postgres timestamptz as Supabase returns it (microseconds)', () => {
    expect(shouldShowWhatsNew({ ...base, seenAt: '2026-11-04T23:59:59.999999+00:00' }, RELEASE)).toBe(true)
    expect(shouldShowWhatsNew({ ...base, seenAt: '2026-11-05T02:10:41.483921+02:00' }, RELEASE)).toBe(false)
  })

  it('new signups (seen_at defaults to the signup time) never see it', () => {
    expect(shouldShowWhatsNew({ ...base, seenAt: '2026-11-20T08:00:00+00:00' }, RELEASE)).toBe(false)
  })

  it('never shows when the column is unknown or the date is unreadable', () => {
    expect(shouldShowWhatsNew({ ...base, seenAt: undefined }, RELEASE)).toBe(false)
    expect(shouldShowWhatsNew({ ...base, seenAt: 'garbage' }, RELEASE)).toBe(false)
  })

  it('counts shifts outside the loaded window', () => {
    expect(shouldShowWhatsNew({ ...base, shiftCount: 103, loadedShifts: 0 }, RELEASE)).toBe(true)
  })

  it('falls back to loaded shifts when the count failed', () => {
    expect(shouldShowWhatsNew({ ...base, shiftCount: null, loadedShifts: 3 }, RELEASE)).toBe(true)
    expect(shouldShowWhatsNew({ ...base, shiftCount: null, loadedShifts: 0 }, RELEASE)).toBe(false)
  })

  it('does not show to users with no shifts', () => {
    expect(shouldShowWhatsNew({ ...base, shiftCount: 0, loadedShifts: 0 }, RELEASE)).toBe(false)
  })

  it('uses the current release constant by default', () => {
    expect(Date.parse(WHATS_NEW_RELEASED_AT)).not.toBeNaN()
    expect(shouldShowWhatsNew({ ...base, seenAt: '2000-01-01T00:00:00Z' })).toBe(true)
  })
})

describe('earlierUpdatesExpanded', () => {
  it('open only for users who never saw the previous version', () => {
    expect(earlierUpdatesExpanded(null)).toBe(true)
    expect(earlierUpdatesExpanded('2026-11-04T10:00:00Z')).toBe(false)
    expect(earlierUpdatesExpanded(undefined)).toBe(false)
  })
})
