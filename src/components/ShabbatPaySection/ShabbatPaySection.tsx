import { useTranslation } from 'react-i18next'
import type { Job } from '../../context/ShiftContext'
import type { ShabbatLookup, ShiftPayResult } from '../../utils/shiftPay'
import { cityName } from '../../utils/cities'
import { shiftInterval } from '../../utils/shabbat'
import { buildShiftTimeline, jerusalemTime, jerusalemWeekdayIndex, overlappingWindow, type TimelineTick } from '../../utils/shabbatTimeline'
import { formatHM, formatMoney } from '../../utils/format'
import { Switch } from '../Switch/Switch'
import './ShabbatPaySection.css'

type Props = {
  lookup: ShabbatLookup
  onRetry: () => void
  pay: ShiftPayResult | null
  shift: { date: string; startTime: string; endTime: string }
  /** Base hourly rate (hourly mode), for the per-part amounts */
  rate: number | null
  salaryType: 'hourly' | 'total'
  geonameid: number
  job: Job | null
  premiumApplied: boolean
  onPremiumChange: (applied: boolean) => void
  /** Saves the job's answer the first time; the question then never shows again for that job. */
  onAnswerJobPremium: (pays: boolean) => void
  answering?: boolean
}

const round2 = (n: number) => Math.round(n * 100) / 100

/** Ticks near the bar's ends get their label aligned inward so it isn't cut off. */
const tickEdge = (tick: TimelineTick) => (tick.pct < 10 ? ' is-start' : tick.pct > 90 ? ' is-end' : '')

/**
 * Shabbat card for the shift forms: times, a timeline of the shift, the
 * regular / Shabbat split, the premium switch and the base salary total.
 * Shown only when the shift has Shabbat hours (plus loading / error states).
 */
export const ShabbatPaySection = ({
  lookup, onRetry, pay, shift, rate, salaryType, geonameid, job,
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
  if (!pay || !split || split.shabbatHours <= 0) return null

  const { start, end } = shiftInterval(shift)
  const { segments, ticks } = buildShiftTimeline(start, end, lookup.windows)
  const window = overlappingWindow(start, end, lookup.windows)

  const weekdays = t('shabbat.weekdays', { returnObjects: true }) as string[]
  const boundary = (at: Date, kind: 'in' | 'out') => {
    const d = jerusalemWeekdayIndex(at)
    const day = kind === 'out' && d === 6 ? t('shabbat.saturdayNight') : weekdays[d]
    return t('shabbat.boundary', { day, time: jerusalemTime(at) })
  }

  const regularHM = formatHM(split.regularHours)
  const shabbatHM = formatHM(split.shabbatHours)
  const needsAnswer = salaryType === 'hourly' && job !== null && job.paysShabbatPremium === null

  // Regular part from the rate; Shabbat part is the rest, so both add up to the total exactly
  const regularPay = salaryType === 'hourly' && rate != null && !isNaN(rate) ? round2(split.regularHours * rate) : null
  const shabbatPay = regularPay != null && pay.baseSalary != null ? round2(pay.baseSalary - regularPay) : null

  return (
    <div className="shabbat-card">
      <div className="shabbat-card__header">
        <span className="shabbat-card__icon" aria-hidden="true">🕯️</span>
        <div className="shabbat-card__heading">
          <p className="shabbat-card__title">{t('shabbat.cardTitle')}</p>
          {window && (
            <p className="shabbat-card__times">
              {t('shabbat.windowTimes', {
                city: cityName(geonameid, i18n.language),
                from: boundary(window.start, 'in'),
                to: boundary(window.end, 'out'),
              })}
            </p>
          )}
        </div>
      </div>

      <div
        className="shabbat-timeline"
        role="img"
        aria-label={t('shabbat.timelineLabel', { start: shift.startTime, end: shift.endTime, regular: regularHM, shabbat: shabbatHM })}
      >
        <div className="shabbat-timeline__ends" aria-hidden="true">
          <span>{shift.startTime}</span>
          <span>{shift.endTime}</span>
        </div>
        <div className="shabbat-timeline__bar">
          {segments.map(seg => (
            <span
              key={seg.from}
              className={`shabbat-timeline__seg shabbat-timeline__seg--${seg.kind}`}
              style={{ insetInlineStart: `${seg.from}%`, width: `${seg.to - seg.from}%` }}
            />
          ))}
          {ticks.map(tick => (
            <span key={tick.pct} className="shabbat-timeline__tick" style={{ insetInlineStart: `${tick.pct}%` }} />
          ))}
        </div>
        {ticks.length > 0 && (
          <div className="shabbat-timeline__labels" aria-hidden="true">
            {ticks.map(tick => (
              <span
                key={tick.pct}
                className={`shabbat-timeline__label${tickEdge(tick)}`}
                style={{ insetInlineStart: `${tick.pct}%` }}
                title={t(tick.kind === 'in' ? 'shabbat.tickIn' : 'shabbat.tickOut')}
              >
                {jerusalemTime(tick.at)}
              </span>
            ))}
          </div>
        )}
      </div>

      {salaryType === 'hourly' ? (
        <div className="shabbat-stats">
          <div className="shabbat-stat">
            <span className="shabbat-stat__label">{t('shabbat.regular')}</span>
            <span className="shabbat-stat__hours">{t('shabbat.hoursValue', { hours: regularHM })}</span>
            <span className="shabbat-stat__money">{regularPay != null ? formatMoney(regularPay) : '—'}</span>
          </div>
          <div className="shabbat-stat shabbat-stat--shabbat">
            <span className="shabbat-stat__label">
              {t(premiumApplied ? 'shabbat.shabbatPremium' : 'shabbat.shabbatNoPremium')}
            </span>
            <span className="shabbat-stat__hours">{t('shabbat.hoursValue', { hours: shabbatHM })}</span>
            <span className="shabbat-stat__money">{shabbatPay != null ? formatMoney(shabbatPay) : '—'}</span>
          </div>
        </div>
      ) : (
        <p className="shabbat-card__info">{t('shabbat.dailyTotalSplit', { regular: regularHM, shabbat: shabbatHM })}</p>
      )}

      {salaryType === 'hourly' && (needsAnswer ? (
        <div className="shabbat-question">
          <p className="shabbat-question__text">{t('shabbat.askJobPremium')}</p>
          <div className="shabbat-question__actions">
            <button type="button" className="shabbat-btn shabbat-btn--primary" disabled={answering} onClick={() => onAnswerJobPremium(true)}>{t('shabbat.yes')}</button>
            <button type="button" className="shabbat-btn" disabled={answering} onClick={() => onAnswerJobPremium(false)}>{t('shabbat.no')}</button>
          </div>
          <p className="shabbat-hint">{t('shabbat.askJobPremiumSub')}</p>
        </div>
      ) : (
        <Switch checked={premiumApplied} onChange={onPremiumChange} label={t('shabbat.applyPremium')} />
      ))}

      {pay.baseSalary != null && (
        <div className="shabbat-card__total">
          <span className="shabbat-card__total-label">{t('shabbat.baseSalaryHours', { hours: formatHM(pay.hours) })}</span>
          <span className="shabbat-card__total-value">{formatMoney(pay.baseSalary)}</span>
        </div>
      )}
    </div>
  )
}
