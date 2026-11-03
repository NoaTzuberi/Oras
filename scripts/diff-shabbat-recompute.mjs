#!/usr/bin/env node
// READ-ONLY review: what existing shifts' totals WOULD become if they were
// recalculated with the Shabbat split. Writes nothing to the database
// (the transaction is READ ONLY); it only prints a diff and writes CSVs.
//
//   DATABASE_URL=postgres://... node scripts/diff-shabbat-recompute.mjs [--out dir]
//
// Assumptions (printed again in the output):
// - Only hourly shifts change. Daily-total shifts keep their amount.
// - Rate: shifts.hourly_rate if set (after backfill), else
//   base_salary / hours / (used_150 ? 1.5 : 1).
// - Premium: applied only where the user chose 150% (used_150 = true).
// - City: the shift's job city if the jobs migration is in, else Tel Aviv.
// - Hours: real elapsed time between start and end in Israel time.
// - Tips are unchanged.

import pg from 'pg'
import { mkdirSync, writeFileSync } from 'fs'
import { join } from 'path'
import { runnerImport } from 'vite'

const { module: shabbat } = await runnerImport(new URL('../src/utils/shabbat.ts', import.meta.url).pathname)
const { addDays, buildShabbatWindows, calcShiftPay, shiftInterval, splitShiftHours } = shabbat

const DEFAULT_GEONAMEID = 293397
const argOut = process.argv.indexOf('--out')
const outDir = argOut > -1 ? process.argv[argOut + 1] : `shabbat-diff-${new Date().toISOString().slice(0, 10)}`

const url = process.env.DATABASE_URL
if (!url) { console.error('DATABASE_URL is not set.'); process.exit(2) }
const local = url.includes('localhost') || url.includes('127.0.0.1')
const client = new pg.Client({ connectionString: url, ssl: local ? false : { rejectUnauthorized: false } })

// ── Hebcal, one request per (week, city), same parameters as the app ──
const weeks = new Map()
const weekStart = (date) => {
  const [y, m, d] = date.split('-').map(Number)
  return addDays(date, -new Date(Date.UTC(y, m - 1, d)).getUTCDay())
}
const windowsFor = async (date, geonameid) => {
  const sunday = weekStart(date)
  const key = `${sunday}:${geonameid}`
  if (!weeks.has(key)) {
    const params = new URLSearchParams({
      v: '1', cfg: 'json', c: 'on', i: 'on', maj: 'on', min: 'off', mod: 'off', nx: 'off', mf: 'off', ss: 'off', s: 'off',
      geonameid: String(geonameid), start: addDays(sunday, -1), end: addDays(sunday, 8),
    })
    const res = await fetch(`https://www.hebcal.com/hebcal?${params}`)
    if (!res.ok) throw new Error(`Hebcal HTTP ${res.status} for ${key}`)
    const data = await res.json()
    if (!Array.isArray(data.items)) throw new Error(`Hebcal invalid response for ${key}`)
    weeks.set(key, buildShabbatWindows(data.items))
    await new Promise(r => setTimeout(r, 150)) // be polite to the free API
  }
  return weeks.get(key)
}

const round2 = (n) => Math.round(n * 100) / 100
const toCsv = (rows) => {
  if (!rows.length) return ''
  const cols = Object.keys(rows[0])
  const esc = (v) => (v == null ? '' : /[",\n]/.test(String(v)) ? `"${String(v).replace(/"/g, '""')}"` : String(v))
  return [cols.join(','), ...rows.map(r => cols.map(c => esc(r[c])).join(','))].join('\n') + '\n'
}

await client.connect()
try {
  await client.query('begin read only')

  const hasJobs = (await client.query(
    `select 1 from information_schema.columns where table_schema = 'public' and table_name = 'shifts' and column_name = 'job_id'`,
  )).rowCount > 0

  const { rows: shifts } = await client.query(`
    select s.id, s.user_id, s.date::text as date, s.start_time::text as start_time, s.end_time::text as end_time,
           s.hours::float as hours, s.salary_type, s.base_salary::float as base_salary, s.tips::float as tips,
           s.total_earnings::float as total_earnings, s.used_150,
           ${hasJobs ? 's.hourly_rate::float as hourly_rate, j.geonameid' : 'null::float as hourly_rate, null::int as geonameid'}
    from public.shifts s
    ${hasJobs ? 'left join public.jobs j on j.id = s.job_id' : ''}
    order by s.user_id, s.date`)
  await client.query('rollback')

  const perShift = []
  const failures = []
  for (const s of shifts) {
    const month = s.date.slice(0, 7)
    const base = { user_id: s.user_id, month, shift_id: s.id, date: s.date, start: s.start_time?.slice(0, 5), end: s.end_time?.slice(0, 5), used_150: s.used_150 }
    let newBase = s.base_salary
    let note = ''
    let split = null

    if (s.salary_type === 'hourly' && s.hours > 0 && s.start_time && s.end_time) {
      const rate = s.hourly_rate ?? s.base_salary / s.hours / (s.used_150 ? 1.5 : 1)
      try {
        const interval = shiftInterval({ date: s.date, startTime: s.start_time.slice(0, 5), endTime: s.end_time.slice(0, 5) })
        split = splitShiftHours(interval.start, interval.end, await windowsFor(s.date, s.geonameid ?? DEFAULT_GEONAMEID))
        newBase = calcShiftPay(rate, split, s.used_150)
      } catch (e) {
        failures.push({ ...base, error: e.message })
        note = 'not recalculated (error)'
      }
    } else if (s.salary_type !== 'hourly') {
      note = 'daily total: unchanged'
    }

    const oldTotal = s.total_earnings
    const newTotal = round2(newBase + (s.tips ?? 0))
    perShift.push({
      ...base,
      stored_hours: s.hours,
      regular_hours: split?.regularHours ?? '',
      shabbat_hours: split?.shabbatHours ?? '',
      old_total: oldTotal,
      new_total: newTotal,
      delta: round2(newTotal - oldTotal),
      note,
    })
  }

  // ── Per user per month ────────────────────────────
  const groups = new Map()
  for (const r of perShift) {
    const k = `${r.user_id}|${r.month}`
    const g = groups.get(k) ?? { user_id: r.user_id, month: r.month, shifts: 0, changed: 0, old_total: 0, new_total: 0 }
    g.shifts++
    if (Math.abs(r.delta) >= 0.01) g.changed++
    g.old_total = round2(g.old_total + r.old_total)
    g.new_total = round2(g.new_total + r.new_total)
    groups.set(k, g)
  }
  const monthly = [...groups.values()].map(g => ({ ...g, delta: round2(g.new_total - g.old_total) }))
  const changed = perShift.filter(r => Math.abs(r.delta) >= 0.01)

  console.log('Assumptions: hourly shifts only; premium only where used_150; rate from hourly_rate or base_salary/hours/(1.5 if used_150);')
  console.log(`             city = ${hasJobs ? "the shift's job (Tel Aviv when none)" : 'Tel Aviv (jobs migration not applied)'}; tips unchanged.\n`)
  console.log(`Shifts: ${perShift.length}, would change: ${changed.length}, errors: ${failures.length}`)
  console.log(`Total before: ${round2(perShift.reduce((a, r) => a + r.old_total, 0))}  after: ${round2(perShift.reduce((a, r) => a + r.new_total, 0))}\n`)
  console.log('Per user per month (only months with a change):')
  console.table(monthly.filter(m => m.changed > 0))

  mkdirSync(outDir, { recursive: true })
  writeFileSync(join(outDir, 'monthly.csv'), toCsv(monthly))
  writeFileSync(join(outDir, 'changed_shifts.csv'), toCsv(changed))
  if (failures.length) writeFileSync(join(outDir, 'errors.csv'), toCsv(failures))
  console.log(`\nCSV written to ${outDir}/ (monthly.csv, changed_shifts.csv${failures.length ? ', errors.csv' : ''}). Nothing was written to the database.`)
} catch (e) {
  await client.query('rollback').catch(() => {})
  console.error('Error:', e.message)
  process.exitCode = 1
} finally {
  await client.end()
}
