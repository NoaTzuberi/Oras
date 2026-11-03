import { describe, it, expect, beforeEach, vi } from 'vitest'
import { fetchShabbatWindows, clearShabbatCache } from './shabbatApi'
import regular from './__fixtures__/hebcal_regular_2026-10.json'

const ok = (body: unknown) => Promise.resolve(new Response(JSON.stringify(body), { status: 200 }))

beforeEach(() => {
  clearShabbatCache()
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

describe('fetchShabbatWindows', () => {
  it('requests the Israeli calendar with candle times for the job city, covering the shift date -1..+2', async () => {
    const fetchMock = vi.fn(() => ok({ items: regular }))
    await fetchShabbatWindows('2026-10-31', 281184, fetchMock as unknown as typeof fetch)

    const url = new URL((fetchMock.mock.calls[0] as unknown as [string])[0])
    expect(url.searchParams.get('c')).toBe('on')
    expect(url.searchParams.get('i')).toBe('on')
    expect(url.searchParams.get('geonameid')).toBe('281184')
    expect(url.searchParams.get('geo')).toBeNull()
    // Saturday 2026-10-31: needs Fri 10-30 .. Mon 11-02
    expect(url.searchParams.get('start')! <= '2026-10-30').toBe(true)
    expect(url.searchParams.get('end')! >= '2026-11-02').toBe(true)
  })

  it('works for past months (users edit old shifts)', async () => {
    const fetchMock = vi.fn(() => ok({ items: [] }))
    await fetchShabbatWindows('2025-12-03', 293397, fetchMock as unknown as typeof fetch)
    const url = new URL((fetchMock.mock.calls[0] as unknown as [string])[0])
    expect(url.searchParams.get('start')).toBe('2025-11-29')
    expect(url.searchParams.get('end')).toBe('2025-12-08')
  })

  it('returns windows parsed from the response', async () => {
    const data = await fetchShabbatWindows('2026-10-30', 293397, (() => ok({ items: regular })) as unknown as typeof fetch)
    expect(data.windows).toHaveLength(1)
    expect(data.windows[0].start.toISOString()).toBe('2026-10-30T14:32:00.000Z')
  })

  it('caches by week and city', async () => {
    const fetchMock = vi.fn(() => ok({ items: regular }))
    const f = fetchMock as unknown as typeof fetch
    await fetchShabbatWindows('2026-10-26', 293397, f) // Mon
    await fetchShabbatWindows('2026-10-31', 293397, f) // Sat, same week
    expect(fetchMock).toHaveBeenCalledTimes(1)
    await fetchShabbatWindows('2026-10-31', 281184, f) // other city
    await fetchShabbatWindows('2026-11-01', 293397, f) // next week
    expect(fetchMock).toHaveBeenCalledTimes(3)
  })

  it('rejects on HTTP errors (checks res.ok) and does not cache the failure', async () => {
    const fetchMock = vi.fn()
      .mockImplementationOnce(() => Promise.resolve(new Response('nope', { status: 503 })))
      .mockImplementationOnce(() => ok({ items: regular }))
    const f = fetchMock as unknown as typeof fetch
    await expect(fetchShabbatWindows('2026-10-30', 293397, f)).rejects.toThrow(/HTTP 503/)
    await expect(fetchShabbatWindows('2026-10-30', 293397, f)).resolves.toBeDefined()
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('rejects on network errors', async () => {
    const f = (() => Promise.reject(new TypeError('Failed to fetch'))) as unknown as typeof fetch
    await expect(fetchShabbatWindows('2026-10-30', 293397, f)).rejects.toThrow(/Failed to fetch/)
  })

  it('rejects on an error body instead of treating it as "no Shabbat"', async () => {
    const f = (() => ok({ error: 'Sorry, invalid geonameid' })) as unknown as typeof fetch
    await expect(fetchShabbatWindows('2026-10-30', 1, f)).rejects.toThrow(/invalid geonameid/)
  })

  it('rejects when the data is incomplete', async () => {
    const f = (() => ok({ items: [{ category: 'candles', date: '2026-10-30T16:32:00+02:00' }] })) as unknown as typeof fetch
    await expect(fetchShabbatWindows('2026-10-30', 293397, f)).rejects.toThrow(/Incomplete/)
  })
})
