import { describe, it, expect } from 'vitest'
import sql from '../../supabase/migrations/20261101120000_add_jobs_and_shift_pay_columns.sql?raw'
import { JOB_COLOR_PALETTE, jobColor, shade, withAlpha } from './jobColors'

describe('JOB_COLOR_PALETTE', () => {
  it('matches the palette the database trigger uses', () => {
    const block = sql.match(/palette text\[\] := array\[([^\]]+)\]/)
    expect(block).not.toBeNull()
    const fromSql = [...block![1].matchAll(/'(#[0-9A-Fa-f]{6})'/g)].map(m => m[1])
    expect(fromSql).toEqual([...JOB_COLOR_PALETTE])
  })

  it('has distinct colors', () => {
    expect(new Set(JOB_COLOR_PALETTE).size).toBe(JOB_COLOR_PALETTE.length)
  })
})

describe('color helpers', () => {
  it('falls back to the first palette color', () => {
    expect(jobColor(null)).toBe(JOB_COLOR_PALETTE[0])
    expect(jobColor({ color: null })).toBe(JOB_COLOR_PALETTE[0])
    expect(jobColor({ color: 'red' })).toBe(JOB_COLOR_PALETTE[0])
    expect(jobColor({ color: '#10B981' })).toBe('#10B981')
  })

  it('builds rgba and darker shades', () => {
    expect(withAlpha('#10B981', 0.1)).toBe('rgba(16, 185, 129, 0.1)')
    expect(shade('#FFFFFF', 0.5)).toBe('#808080')
  })

  // White text on every shaded palette color needs >= 4.5:1
  it('shaded palette colors are readable under white text', () => {
    const lum = (hex: string) => {
      const [r, g, b] = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255)
        .map(c => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4))
      return 0.2126 * r + 0.7152 * g + 0.0722 * b
    }
    for (const c of JOB_COLOR_PALETTE) {
      expect(1.05 / (lum(shade(c)) + 0.05)).toBeGreaterThanOrEqual(4.5)
    }
  })
})
