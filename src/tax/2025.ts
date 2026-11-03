import type { Sourced, TaxYearConfig } from './types'

const YEAR = 2025

// Israel Tax Authority, monthly deductions booklet for January 2025 onward
// (brackets before the 2026 widening, credit point, pension qualifying-income
// ceiling, 3% surtax above 60,130 ₪/month).
const TAX_BOOKLET =
  'https://www.gov.il/BlobFolder/generalpage/income-tax-monthly-deductions-booklet/he/generalInformation_income-tax-monthly-deductions-booklet_monthly-deductions-booklet-2025.pdf'

// Bituach Leumi circular: change in national + health insurance from
// February 2025. In January 2025 the full health rate was still 5.16%
// (5.17% from February); this config uses the February–December rate, a
// difference of at most ~₪4 for that one month.
const BTL_CIRCULAR =
  'https://www.btl.gov.il/Insurance/HozrimBituah/Hozrim/%D7%A9%D7%99%D7%A0%D7%95%D7%99%20%D7%91%D7%AA%D7%A9%D7%9C%D7%95%D7%9D%20%D7%93%D7%9E%D7%99%20%D7%91%D7%99%D7%98%D7%95%D7%97%20%D7%9C%D7%90%D7%95%D7%9E%D7%99%20%D7%95%D7%93%D7%9E%D7%99%20%D7%91%D7%99%D7%98%D7%95%D7%97%20%D7%91%D7%A8%D7%99%D7%90%D7%95%D7%AA%20%D7%9C%D7%A9%D7%A0%D7%AA%202025%20%D7%94%D7%97%D7%9C%20%D7%9E%D7%97%D7%95%D7%93%D7%A9%20%D7%A4%D7%91%D7%A8%D7%95%D7%90%D7%A8%202025.pdf'

const PENSION_CREDIT =
  'https://www.kolzchut.org.il/he/%D7%96%D7%99%D7%9B%D7%95%D7%99_%D7%9E%D7%9E%D7%A1_%D7%94%D7%9B%D7%A0%D7%A1%D7%94_%D7%91%D7%92%D7%99%D7%9F_%D7%94%D7%A4%D7%A8%D7%A9%D7%95%D7%AA_%D7%9C%D7%91%D7%99%D7%98%D7%95%D7%97_%D7%A4%D7%A0%D7%A1%D7%99%D7%95%D7%A0%D7%99'

// Same table as 2026 (in force from tax year 2024). Ages 6–18 from
// secondary guides; see 2026.ts.
const CHILD_POINTS =
  'https://www.kolzchut.org.il/he/%D7%A0%D7%A7%D7%95%D7%93%D7%95%D7%AA_%D7%96%D7%99%D7%9B%D7%95%D7%99_%D7%9E%D7%9E%D7%A1_%D7%94%D7%9B%D7%A0%D7%A1%D7%94_%D7%9C%D7%94%D7%95%D7%A8%D7%94_%D7%9C%D7%99%D7%9C%D7%93_%D7%A2%D7%93_%D7%92%D7%99%D7%9C_5'

const v = <T>(value: T, source: string): Sourced<T> => ({ value, year: YEAR, source })

export const TAX_2025: TaxYearConfig = {
  year: YEAR,
  creditPointMonthly: v(242, TAX_BOOKLET),
  brackets: v([
    { upTo: 7_010, rate: 0.10 },
    { upTo: 10_060, rate: 0.14 },
    { upTo: 16_150, rate: 0.20 },
    { upTo: 22_440, rate: 0.31 },
    { upTo: 46_690, rate: 0.35 },
    { upTo: 60_130, rate: 0.47 },
    // 47% + 3% surtax, which employers withhold monthly above 60,130 ₪
    { upTo: Infinity, rate: 0.50 },
  ], TAX_BOOKLET),
  bituachLeumi: {
    reducedThreshold: v(7_522, BTL_CIRCULAR),
    ceiling: v(50_695, BTL_CIRCULAR),
    nationalReducedRate: v(0.0104, BTL_CIRCULAR),
    nationalFullRate: v(0.07, BTL_CIRCULAR),
    healthReducedRate: v(0.0323, BTL_CIRCULAR),
    healthFullRate: v(0.0517, BTL_CIRCULAR),
  },
  pension: {
    creditRate: v(0.35, PENSION_CREDIT),
    maxCreditedShare: v(0.07, PENSION_CREDIT),
    qualifyingIncomeCeiling: v(9_700, TAX_BOOKLET),
  },
  childPoints: v([
    { minAge: 0, maxAge: 0, column1: 2.5, column2: 2.5 }, // birth year
    { minAge: 1, maxAge: 2, column1: 4.5, column2: 4.5 },
    { minAge: 3, maxAge: 3, column1: 3.5, column2: 3.5 },
    { minAge: 4, maxAge: 5, column1: 2.5, column2: 2.5 },
    { minAge: 6, maxAge: 17, column1: 2, column2: 1 },
    { minAge: 18, maxAge: 18, column1: 0.5, column2: 0 },
  ], CHILD_POINTS),
}
