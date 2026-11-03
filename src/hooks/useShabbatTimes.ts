import { useEffect, useState } from 'react'
import { fetchShabbatWindows, type ShabbatData } from '../utils/shabbatApi'
import { yomTovOn } from '../utils/shabbat'
import type { ShabbatLookup } from '../utils/shiftPay'

type Result = { key: string; data?: ShabbatData; failed?: boolean }

/**
 * Shabbat windows for a date + city, with a retry. Status is derived from
 * whether the stored result matches the current request, so changing the
 * date shows "loading" without setting state inside the effect.
 */
export const useShabbatTimes = (date: string, geonameid: number) => {
  const [attempt, setAttempt] = useState(0)
  const [result, setResult] = useState<Result | null>(null)
  const key = date ? `${date}|${geonameid}|${attempt}` : null

  useEffect(() => {
    if (!key) return
    let cancelled = false
    fetchShabbatWindows(date, geonameid).then(
      data => { if (!cancelled) setResult({ key, data }) },
      () => { if (!cancelled) setResult({ key, failed: true }) },
    )
    return () => { cancelled = true }
  }, [key, date, geonameid])

  const current = result && result.key === key ? result : null
  const lookup: ShabbatLookup =
    !current ? { status: 'loading' }
    : current.failed || !current.data ? { status: 'error' }
    : { status: 'ok', windows: current.data.windows, isYomTov: yomTovOn(current.data.items, date).length > 0 }

  const holidayNames = current?.data ? yomTovOn(current.data.items, date) : []

  return { lookup, holidayNames, retry: () => setAttempt(a => a + 1) }
}
