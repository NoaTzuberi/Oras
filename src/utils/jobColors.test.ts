import { describe, it, expect } from 'vitest'
import sql from '../../supabase/migrations/20261101120000_add_jobs_and_shift_pay_columns.sql?raw'
import { JOB_COLOR_PALETTE } from './jobColors'

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
