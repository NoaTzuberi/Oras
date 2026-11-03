/** A figure from the law, with the tax year it was checked for and where. */
export type Sourced<T> = { value: T; year: number; source: string }

export type Bracket = { upTo: number; rate: number }

/** Credit points per child, by the child's age in the tax year. */
export type ChildPointsRow = { minAge: number; maxAge: number; column1: number; column2: number }

export type TaxYearConfig = {
  year: number
  /** Monthly value of one credit point (₪). */
  creditPointMonthly: Sourced<number>
  /** Monthly income-tax brackets on employment income, last one open-ended. */
  brackets: Sourced<Bracket[]>
  bituachLeumi: {
    /** Monthly income up to this is charged the reduced rates (₪). */
    reducedThreshold: Sourced<number>
    /** No contributions on monthly income above this (₪). */
    ceiling: Sourced<number>
    nationalReducedRate: Sourced<number>
    nationalFullRate: Sourced<number>
    healthReducedRate: Sourced<number>
    healthFullRate: Sourced<number>
  }
  pension: {
    /** Share of the employee's contribution credited against tax. */
    creditRate: Sourced<number>
    /** Contributions count for the credit up to this share of qualifying income. */
    maxCreditedShare: Sourced<number>
    /** Monthly qualifying-income ceiling for the credit (₪). */
    qualifyingIncomeCeiling: Sourced<number>
  }
  childPoints: Sourced<ChildPointsRow[]>
}
