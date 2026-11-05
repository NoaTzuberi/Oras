import { useTranslation } from 'react-i18next'
import type { Job } from '../../context/ShiftContext'
import { hasOvertime, hasPayBreakdown, hasShabbatHours, type ShabbatLookup, type ShiftPayResult } from '../../utils/shiftPay'
import { cityName } from '../../utils/cities'
import { shiftInterval } from '../../utils/shabbat'
import { buildPayTimeline, jerusalemTime, jerusalemWeekdayIndex, overlappingWindow, type PayTimelineTick } from '../../utils/shabbatTimeline'
import { bucketLabel, bucketsText, usedBuckets } from '../../utils/payLabels'
import { formatHM, formatMoney } from '../../utils/format'
import { Switch } from '../Switch/Switch'
import './PayBreakdownSection.css'

type Props = {
  lookup: ShabbatLookup
  onRetry: () => void
  pay: ShiftPayResult | null
  shift: { date: string; startTime: string; endTime: string }
  salaryType: 'hourly' | 'total'
  geonameid: number
  job: Job | null
  premiumApplied: boolean
  onPremiumChange: (applied: boolean) => void
  /** Saves the job's answer the first time; the question then never shows again for that job. */
  onAnswerJobPremium: (pays: boolean) => void
  answering?: boolean
}

/** Ticks near the bar's ends get their label aligned inward so it isn't cut off. */
const tickEdge = (tick: PayTimelineTick) => (tick.pct < 10 ? ' is-start' : tick.pct > 90 ? ' is-end' : '')

/** Labels closer than this (percent of the bar) to the previous one are hidden so they don't overlap. */
const MIN_LABEL_GAP = 12

/**
 * Pay breakdown card for the shift forms: Shabbat times, a timeline of the
 * shift by pay rate, a stat block per rate that applies, the premium
 * switch and the base salary total. Shown when the shift has Shabbat or
 * overtime hours (plus the Shabbat times loading / error states).
 */
export const PayBreakdownSection = ({
  lookup, onRetry, pay, shift, salaryType, geonameid, job,
  premiumApplied, onPremiumChange, onAnswerJobPremium, answering,
}: Props) => {
  const { t, i18n } = useTranslation()

  if (lookup.status === 'loading') {
    return pay ? <p className="shabbat-hint">{t('shabbat.loading')}</p> : null
  }

  const warning = lookup.status === 'error' && (
    <button type="button" className="shabbat-warning" onClick={onRetry}>
      ⚠️ {t('shabbat.loadFailed')}
      <span className="shabbat-warning__sub">{t('shabbat.loadFailedSub')}</span>
    </button>
  )

  if (!pay || !hasPayBreakdown(pay)) return warning || null

  const windows = lookup.status === 'ok' ? lookup.windows : []
  const { start, end } = shiftInterval(shift)
  const ot = pay.overtime
  const { segments, ticks } = buildPayTimeline(start, end, ot.segments, windows)
  const window = overlappingWindow(start, end, windows)
  const withShabbat = hasShabbatHours(pay)
  const hourly = salaryType === 'hourly'
  const premium = hourly && premiumApplied

  const weekdays = t('shabbat.weekdays', { returnObjects: true }) as string[]
  const boundary = (at: Date, kind: 'in' | 'out') => {
    const d = jerusalemWeekdayIndex(at)
    const day = kind === 'out' && d === 6 ? t('shabbat.saturdayNight') : weekdays[d]
    return t('shabbat.boundary', { day, time: jerusalemTime(at) })
  }

  const labelled = new Set<PayTimelineTick>()
  let lastPct = -Infinity
  for (const tick of ticks) {
    if (tick.pct - lastPct >= MIN_LABEL_GAP) { labelled.add(tick); lastPct = tick.pct }
  }

  const needsAnswer = hourly && withShabbat && job !== null && job.paysShabbatPremium === null
  const buckets = usedBuckets(ot.minutes)
  const partsText = bucketsText(t, ot.minutes, premium)

  return (
    <>
      {warning}
      <div className="shabbat-card">
        <div className="shabbat-card__header">
          <span className="shabbat-card__icon" aria-hidden="true">{withShabbat ? '🕯️' : '⏱️'}</span>
          <div className="shabbat-card__heading">
            <p className="shabbat-card__title">{t('pay.cardTitle')}</p>
            {window && (
              <p className="shabbat-card__times">
                {t('shabbat.windowTimes', {
                  city: cityName(geonameid, i18n.language),
                  from: boundary(window.start, 'in'),
                  to: boundary(window.end, 'out'),
                })}
              </p>
            )}
            {ot.enabled && hasOvertime(pay) && (
              <p className="shabbat-card__times">{t('pay.overtimeAfter', { hours: formatHM(ot.thresholdMinutes / 60) })}</p>
            )}
            {ot.enabled && ot.minutesBefore > 0 && (
              <p className="shabbat-card__times">{t('pay.earlierToday', { hours: formatHM(ot.minutesBefore / 60) })}</p>
            )}
          </div>
        </div>

        {/* Explains the 7h day, so the jump at exactly 2 night hours doesn't look like a bug */}
        {ot.enabled && ot.isNight && (
          <p className="pay-night-note">🌙 {t('pay.nightShift')}</p>
        )}

        <div
          className="shabbat-timeline"
          role="img"
          aria-label={t('pay.timelineLabel', { start: shift.startTime, end: shift.endTime, parts: partsText })}
        >
          <div className="shabbat-timeline__ends" aria-hidden="true">
            <span>{shift.startTime}</span>
            <span>{shift.endTime}</span>
          </div>
          <div className="shabbat-timeline__bar">
            {segments.map(seg => (
              <span
                key={seg.from}
                className={`shabbat-timeline__seg pay-seg--${seg.kind}`}
                style={{ insetInlineStart: `${seg.from}%`, width: `${seg.to - seg.from}%` }}
              />
            ))}
            {ticks.map(tick => (
              <span key={`${tick.kind}-${tick.pct}`} className="shabbat-timeline__tick" style={{ insetInlineStart: `${tick.pct}%` }} />
            ))}
          </div>
          {labelled.size > 0 && (
            <div className="shabbat-timeline__labels" aria-hidden="true">
              {ticks.filter(tick => labelled.has(tick)).map(tick => (
                <span
                  key={`${tick.kind}-${tick.pct}`}
                  className={`shabbat-timeline__label${tick.kind === 'ot' ? ' is-ot' : ''}${tickEdge(tick)}`}
                  style={{ insetInlineStart: `${tick.pct}%` }}
                  title={t(tick.kind === 'in' ? 'shabbat.tickIn' : tick.kind === 'out' ? 'shabbat.tickOut' : 'pay.tickOt')}
                >
                  {jerusalemTime(tick.at)}
                </span>
              ))}
            </div>
          )}
        </div>

        {hourly ? (
          <div className="shabbat-stats">
            {buckets.map(key => (
              <div key={key} className={`shabbat-stat pay-stat--${key}`}>
                <span className="shabbat-stat__label">{bucketLabel(t, key, premium)}</span>
                <span className="shabbat-stat__hours">{t('shabbat.hoursValue', { hours: formatHM(ot.minutes[key] / 60) })}</span>
                <span className="shabbat-stat__money">{ot.pay ? formatMoney(ot.pay[key]) : '—'}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="shabbat-card__info">{t('pay.dailyTotalInfo', { parts: partsText })}</p>
        )}

        {hourly && withShabbat && (needsAnswer ? (
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
    </>
  )
}
