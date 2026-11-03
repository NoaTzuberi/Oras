export type WhatsNewState = {
  loading: boolean
  /** null = not seen; undefined = unknown (column missing or profile not loaded) */
  seenAt: string | null | undefined
  /** All of the user's shifts (not just the loaded window); null if the count failed */
  shiftCount: number | null
  /** Shifts currently loaded (fallback when the count failed) */
  loadedShifts: number
}

/** Show once to users who had shifts before the release (the migration marks everyone else as seen). */
export const shouldShowWhatsNew = ({ loading, seenAt, shiftCount, loadedShifts }: WhatsNewState): boolean =>
  !loading && seenAt === null && ((shiftCount ?? 0) > 0 || loadedShifts > 0)
