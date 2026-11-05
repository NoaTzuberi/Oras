import { useNavigate } from 'react-router-dom'
import { useShifts } from '../../context/ShiftContext'
import { WhatsNewModal } from './WhatsNewModal'

/** Settings → My jobs (the anchor is on JobsManager; SettingsPage scrolls to it). */
export const JOBS_SECTION_PATH = '/settings#jobs'

/**
 * Shows the What's New modal on whatever page the user opens, not just
 * Home (Safari reopens a tab on its last URL, e.g. /settings). Both
 * buttons mark this version as seen.
 */
export const WhatsNewGate = () => {
  const { whatsNewPending, whatsNewEarlierExpanded, markWhatsNewSeen } = useShifts()
  const navigate = useNavigate()
  if (!whatsNewPending) return null
  return (
    <WhatsNewModal
      earlierExpanded={whatsNewEarlierExpanded}
      onLater={markWhatsNewSeen}
      onReviewJobs={() => { markWhatsNewSeen(); navigate(JOBS_SECTION_PATH) }}
    />
  )
}
