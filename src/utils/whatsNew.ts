/**
 * When the current What's New content was released. Users who dismissed
 * the modal before this see it again. Next release: bump this. No
 * migration needed: whats_new_seen_at is compared to it.
 */
export const WHATS_NEW_RELEASED_AT = '2026-11-05T00:00:00Z'

export type WhatsNewState = {
  loading: boolean
  /** null = never seen; undefined = unknown (column missing or profile not loaded) */
  seenAt: string | null | undefined
  /** All of the user's shifts (not just the loaded window); null if the count failed */
  shiftCount: number | null
  /** Shifts currently loaded (fallback when the count failed) */
  loadedShifts: number
}

/**
 * Show to users with shifts who haven't seen this version: never seen, or
 * seen before the release. New signups get seen_at = signup time (the
 * column default), so they never see it.
 */
export const shouldShowWhatsNew = (
  { loading, seenAt, shiftCount, loadedShifts }: WhatsNewState,
  releasedAt: string = WHATS_NEW_RELEASED_AT,
): boolean => {
  if (loading || seenAt === undefined) return false
  if (!((shiftCount ?? 0) > 0 || loadedShifts > 0)) return false
  // An unreadable date gives NaN, which compares false: don't show
  return seenAt === null || Date.parse(seenAt) < Date.parse(releasedAt)
}

/** "Earlier updates" starts open only for users who never saw the previous version. */
export const earlierUpdatesExpanded = (seenAt: string | null | undefined): boolean => seenAt === null
