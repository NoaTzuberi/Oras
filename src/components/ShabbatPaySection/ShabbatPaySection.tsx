import { useTranslation } from 'react-i18next'
import type { Job } from '../../context/ShiftContext'
import type { ShabbatLookup, ShiftPayResult } from '../../utils/shiftPay'
import { cityName } from '../../utils/cities'
import './ShabbatPaySection.css'

type Props = {
  lookup: ShabbatLookup
  onRetry: () => void
  pay: ShiftPayResult | null
  salaryType: 'hourly' | 'total'
  geonameid: number
  job: Job | null
  premiumApplied: boolean
  onPremiumChange: (applied: boolean) => void
  /** Saves the job's answer the first time; the question then never shows again for that job. */
  onAnswerJobPremium: (pays: boolean) => void
  answering?: boolean
}

/** Shabbat breakdown, premium choice and API status for the shift forms. */
export const ShabbatPaySection = ({
  lookup, onRetry, pay, salaryType, geonameid, job,
  premiumApplied, onPremiumChange, onAnswerJobPremium, answering,
}: Props) => {
  const { t, i18n } = useTranslation()

  if (lookup.status === 'error') {
    return (
      <button type="button" className="shabbat-warning" onClick={onRetry}>
        ⚠️ {t('shabbat.loadFailed')}
        <span className="shabbat-warning__sub">{t('shabbat.loadFailedSub')}</span>
      </button>
    )
  }

  if (lookup.status === 'loading') {
    return pay ? <p className="shabbat-hint">{t('shabbat.loading')}</p> : null
  }

  const split = pay?.split
  if (!split || split.shabbatHours <= 0) return null

  const city = cityName(geonameid, i18n.language)
  const hours = { regular: split.regularHours, shabbat: split.shabbatHours }

  if (salaryType === 'total') {
    return (
      <div className="shabbat-box">
        <p className="shabbat-breakdown">{t('shabbat.breakdownInfo', hours)}</p>
        <p className="shabbat-hint">{t('shabbat.dailyTotalInfo', { city })}</p>
      </div>
    )
  }

  const needsAnswer = job !== null && job.paysShabbatPremium === null

  return (
    <div className="shabbat-box">
      <p className="shabbat-breakdown">
        {premiumApplied ? t('shabbat.breakdownPremium', hours) : t('shabbat.breakdownNoPremium', hours)}
      </p>
      <p className="shabbat-hint">{t('shabbat.timesFor', { city })}</p>

      {needsAnswer ? (
        <div className="shabbat-question">
          <p className="shabbat-question__text">{t('shabbat.askJobPremium')}</p>
          <div className="shabbat-question__actions">
            <button type="button" className="shabbat-btn shabbat-btn--primary" disabled={answering} onClick={() => onAnswerJobPremium(true)}>{t('shabbat.yes')}</button>
            <button type="button" className="shabbat-btn" disabled={answering} onClick={() => onAnswerJobPremium(false)}>{t('shabbat.no')}</button>
          </div>
          <p className="shabbat-hint">{t('shabbat.askJobPremiumSub')}</p>
        </div>
      ) : (
        <label className="shabbat-override">
          <input type="checkbox" checked={premiumApplied} onChange={e => onPremiumChange(e.target.checked)} />
          <span>{t('shabbat.applyPremium')}</span>
        </label>
      )}
    </div>
  )
}
