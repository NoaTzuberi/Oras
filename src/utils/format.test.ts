import { describe, it, expect } from 'vitest'
import { formatHM, formatMoney } from './format'

describe('formatHM', () => {
  it('formats whole and partial hours', () => {
    expect(formatHM(0)).toBe('0:00')
    expect(formatHM(8)).toBe('8:00')
    expect(formatHM(3.43)).toBe('3:26')
    expect(formatHM(7.57)).toBe('7:34')
    expect(formatHM(0.25)).toBe('0:15')
  })

  it('rounds to the nearest minute without showing 60', () => {
    expect(formatHM(1.9999)).toBe('2:00')
  })
})

describe('formatMoney', () => {
  it('shows agorot only when present', () => {
    expect(formatMoney(700)).toBe('₪700')
    expect(formatMoney(171.5)).toBe('₪171.50')
    expect(formatMoney(567.75)).toBe('₪567.75')
  })
})
