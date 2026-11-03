import type { Sourced, TaxYearConfig } from './types'

const YEAR = 2026

// Israel Tax Authority, monthly deductions booklet for January 2026 onward
// (brackets after the widening, retroactive to January; credit point;
// pension qualifying-income ceiling; 3% surtax above 60,130 ₪/month).
const TAX_BOOKLET =
  'https://www.gov.il/BlobFolder/generalpage/income-tax-monthly-deductions-booklet/he/generalInformation_income-tax-monthly-deductions-booklet_monthly-deductions-booklet-2026.pdf'

// Bituach Leumi circular: change in national + health insurance for 2026.
const BTL_CIRCULAR =
  'https://www.btl.gov.il/Insurance/HozrimBituah/Hozrim/%D7%A9%D7%99%D7%A0%D7%95%D7%99%20%D7%91%D7%AA%D7%A9%D7%9C%D7%95%D7%9D%20%D7%93%D7%9E%D7%99%20%D7%91%D7%99%D7%98%D7%95%D7%97%20%D7%9C%D7%90%D7%95%D7%9E%D7%99%20%D7%95%D7%93%D7%9E%D7%99%20%D7%91%D7%99%D7%98%D7%95%D7%97%20%D7%91%D7%A8%D7%99%D7%90%D7%95%D7%AA%20%D7%9C%D7%A9%D7%A0%D7%AA%202026.pdf'

// Kol Zchut: 35% credit on employee pension contributions, up to 7% of
// qualifying income.
const PENSION_CREDIT =
  'https://www.kolzchut.org.il/he/%D7%96%D7%99%D7%9B%D7%95%D7%99_%D7%9E%D7%9E%D7%A1_%D7%94%D7%9B%D7%A0%D7%A1%D7%94_%D7%91%D7%92%D7%99%D7%9F_%D7%94%D7%A4%D7%A8%D7%A9%D7%95%D7%AA_%D7%9C%D7%91%D7%99%D7%98%D7%95%D7%97_%D7%A4%D7%A0%D7%A1%D7%99%D7%95%D7%A0%D7%99'

// Child credit points. Ages 0–5: Kol Zchut, same table from tax year 2024
// on. Ages 6–18 (column 1 / column 2) are from secondary 2026 guides, not
// an official table; verify before relying on them.
const CHILD_POINTS =
  'https://www.kolzchut.org.il/he/%D7%A0%D7%A7%D7%95%D7%93%D7%95%D7%AA_%D7%96%D7%99%D7%9B%D7%95%D7%99_%D7%9E%D7%9E%D7%A1_%D7%94%D7%9B%D7%A0%D7%A1%D7%94_%D7%9C%D7%94%D7%95%D7%A8%D7%94_%D7%9C%D7%99%D7%9C%D7%93_%D7%A2%D7%93_%D7%92%D7%99%D7%9C_5'

const v = <T>(value: T, source: string): Sourced<T> => ({ value, year: YEAR, source })

export const TAX_2026: TaxYearConfig = {
  year: YEAR,
  creditPointMonthly: v(242, TAX_BOOKLET),
  brackets: v([
    { upTo: 7_010, rate: 0.10 },
    { upTo: 10_060, rate: 0.14 },
    { upTo: 19_000, rate: 0.20 },
    { upTo: 25_100, rate: 0.31 },
    { upTo: 46_690, rate: 0.35 },
    { upTo: 60_130, rate: 0.47 },
    // 47% + 3% surtax, which employers withhold monthly above 60,130 ₪
    { upTo: Infinity, rate: 0.50 },
  ], TAX_BOOKLET),
  bituachLeumi: {
    reducedThreshold: v(7_703, BTL_CIRCULAR),
    ceiling: v(51_910, BTL_CIRCULAR),
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
