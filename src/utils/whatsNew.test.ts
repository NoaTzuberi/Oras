import { describe, it, expect } from 'vitest'
import { shouldShowWhatsNew } from './whatsNew'

const base = { loading: false, seenAt: null, shiftCount: 103, loadedShifts: 40 }

describe('shouldShowWhatsNew', () => {
  it('shows for an unseen user with shifts', () => {
    expect(shouldShowWhatsNew(base)).toBe(true)
  })

  it('waits until data has loaded', () => {
    expect(shouldShowWhatsNew({ ...base, loading: true })).toBe(false)
  })

  it('never shows once seen, or when the column is unknown', () => {
    expect(shouldShowWhatsNew({ ...base, seenAt: '2026-11-04T10:00:00Z' })).toBe(false)
    expect(shouldShowWhatsNew({ ...base, seenAt: undefined })).toBe(false)
  })

  it('counts shifts outside the loaded window', () => {
    expect(shouldShowWhatsNew({ ...base, shiftCount: 103, loadedShifts: 0 })).toBe(true)
  })

  it('falls back to loaded shifts when the count failed', () => {
    expect(shouldShowWhatsNew({ ...base, shiftCount: null, loadedShifts: 3 })).toBe(true)
    expect(shouldShowWhatsNew({ ...base, shiftCount: null, loadedShifts: 0 })).toBe(false)
  })

  it('does not show to users with no shifts', () => {
    expect(shouldShowWhatsNew({ ...base, shiftCount: 0, loadedShifts: 0 })).toBe(false)
  })
})
