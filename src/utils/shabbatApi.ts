import { reportError } from '../lib/sentry'
import { addDays, buildShabbatWindows, yomTovOn, type HebcalTimeItem, type TimeWindow } from './shabbat'
import type { ShabbatLookup } from './shiftPay'

export type ShabbatData = {
  windows: TimeWindow[]
  /** Raw items, also used for yom tov names (Israeli calendar). */
  items: HebcalTimeItem[]
}

type Fetch = typeof fetch

// One request per (week, city). Stores the promise so parallel callers share
// a request. Failed requests are removed so a retry fetches again.
const cache = new Map<string, Promise<ShabbatData>>()

/** Sunday of the week containing `date` ("YYYY-MM-DD"). Weekday of a calendar date doesn't depend on time zone. */
const weekStart = (date: string): string => {
  const [y, m, d] = date.split('-').map(Number)
  return addDays(date, -new Date(Date.UTC(y, m - 1, d)).getUTCDay())
}

export const hebcalUrl = (geonameid: number, start: string, end: string): string => {
  const params = new URLSearchParams({
    v: '1', cfg: 'json',
    c: 'on',   // candle lighting + havdalah
    i: 'on',   // Israeli holiday schedule (not diaspora)
    maj: 'on', // major holidays, for the yom tov flag/badge
    min: 'off', mod: 'off', nx: 'off', mf: 'off', ss: 'off', s: 'off',
    geonameid: String(geonameid),
    start, end,
  })
  return `https://www.hebcal.com/hebcal?${params}`
}

const load = async (date: string, geonameid: number, fetchImpl: Fetch): Promise<ShabbatData> => {
  // The whole week plus a day each side: covers shiftDate-1 .. shiftDate+2
  // for every day of the week, so one cached response serves the week.
  const sunday = weekStart(date)
  const res = await fetchImpl(hebcalUrl(geonameid, addDays(sunday, -1), addDays(sunday, 8)))
  if (!res.ok) throw new Error(`Hebcal request failed: HTTP ${res.status}`)

  const data: unknown = await res.json()
  const items = (data as { items?: unknown })?.items
  if (!Array.isArray(items)) {
    const message = (data as { error?: string })?.error ?? 'missing items'
    throw new Error(`Hebcal response invalid: ${message}`)
  }
  const typed = items as HebcalTimeItem[]
  return { windows: buildShabbatWindows(typed), items: typed }
}

/**
 * Shabbat windows around `date` for a city (GeoNames id).
 * Rejects on any network/HTTP/data problem, after reporting it to Sentry.
 * Never falls back to "no Shabbat".
 */
export const fetchShabbatWindows = (date: string, geonameid: number, fetchImpl: Fetch = fetch): Promise<ShabbatData> => {
  const key = `${weekStart(date)}:${geonameid}`
  const cached = cache.get(key)
  if (cached) return cached

  const request = load(date, geonameid, fetchImpl).catch(error => {
    cache.delete(key)
    console.error('Shabbat times error:', error)
    reportError(error)
    throw error
  })
  cache.set(key, request)
  return request
}

/** The same as useShabbatTimes' lookup, for code outside a render (e.g. before a delete). Never rejects. */
export const fetchShabbatLookup = async (date: string, geonameid: number): Promise<ShabbatLookup> => {
  try {
    const data = await fetchShabbatWindows(date, geonameid)
    return { status: 'ok', windows: data.windows, isYomTov: yomTovOn(data.items, date).length > 0 }
  } catch {
    return { status: 'error' }
  }
}

/** For tests. */
export const clearShabbatCache = () => cache.clear()
