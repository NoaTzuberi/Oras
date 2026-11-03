import { useShifts } from '../../context/ShiftContext'
import { WhatsNewModal } from './WhatsNewModal'

/**
 * Shows the one-time What's New modal on whatever page the user opens,
 * not just Home (Safari reopens a tab on its last URL, e.g. /settings).
 */
export const WhatsNewGate = () => {
  const { whatsNewPending, markWhatsNewSeen } = useShifts()
  return whatsNewPending ? <WhatsNewModal onClose={markWhatsNewSeen} /> : null
}
