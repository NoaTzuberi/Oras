import { TAX_2025 } from './2025'
import { TAX_2026 } from './2026'
import type { TaxYearConfig } from './types'

// Add a year here (and its file) when its figures are published.
const CONFIGS: TaxYearConfig[] = [TAX_2025, TAX_2026]

/**
 * The figures for a tax year. A year without its own file uses the closest
 * year that has one, and `exact` is false so the UI can say so.
 */
export const taxConfigFor = (year: number): { config: TaxYearConfig; exact: boolean } => {
  const exactMatch = CONFIGS.find(c => c.year === year)
  if (exactMatch) return { config: exactMatch, exact: true }
  const closest = [...CONFIGS].sort((a, b) => Math.abs(a.year - year) - Math.abs(b.year - year))[0]
  return { config: closest, exact: false }
}

export type { TaxYearConfig } from './types'
