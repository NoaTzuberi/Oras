import type { TFunction } from 'i18next'
import { BUCKET_KEYS, bucketMultiplier, type BucketKey, type Buckets } from './overtime'
import { formatHM, formatMoney } from './format'

const pctOf = (key: BucketKey, premiumApplied: boolean) => Math.round(bucketMultiplier(key, premiumApplied) * 100)

/** "Regular", "Overtime 125%", "Shabbat 150%", "Shabbat + overtime 175%"... with the rate actually paid. */
export const bucketLabel = (t: TFunction, key: BucketKey, premiumApplied: boolean): string => {
  const pct = pctOf(key, premiumApplied)
  switch (key) {
    case 'regular': return t('pay.regular')
    case 'ot125':
    case 'ot150': return t('pay.overtime', { pct })
    case 'shabbat': return premiumApplied ? t('pay.shabbat', { pct }) : t('pay.shabbatNoPremium')
    default: return t('pay.shabbatOvertime', { pct })
  }
}

/** Buckets with minutes, in display order. */
export const usedBuckets = (minutes: Buckets): BucketKey[] => BUCKET_KEYS.filter(k => minutes[k] > 0)

/** "8:36 h Regular · 1:24 h Overtime 125%" */
export const bucketsText = (t: TFunction, minutes: Buckets, premiumApplied: boolean): string =>
  usedBuckets(minutes)
    .map(k => t('pay.part', { hours: formatHM(minutes[k] / 60), label: bucketLabel(t, k, premiumApplied) }))
    .join(' · ')

/** "+₪17.50" / "−₪17.50", kept left-to-right inside Hebrew text. */
export const signedMoney = (n: number): string => `\u2066${n >= 0 ? '+' : '−'}${formatMoney(Math.abs(n))}\u2069`

/** "This also updates your 14:00–18:00 shift: +₪17.50" */
export const dayUpdateMessage = (t: TFunction, u: { shift: { startTime: string; endTime: string }; deltaPay: number }): string =>
  u.deltaPay === 0
    ? t('pay.dayUpdateHoursOnly', { start: u.shift.startTime, end: u.shift.endTime })
    : t('pay.dayUpdate', { start: u.shift.startTime, end: u.shift.endTime, delta: signedMoney(u.deltaPay) })
