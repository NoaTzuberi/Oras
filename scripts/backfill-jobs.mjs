#!/usr/bin/env node
// Backfill: one default job per user, attach existing shifts to it, and
// store each hourly shift's rate (undoing the x1.5 baked into base_salary).
// The default job has name NULL (the app shows a translated "Main job"),
// pays_shabbat_premium NULL (the user is asked in the app) and the first
// palette color (set by the jobs_assign_color trigger).
//
//   DATABASE_URL=postgres://... node scripts/backfill-jobs.mjs            # dry run (default)
//   DATABASE_URL=postgres://... node scripts/backfill-jobs.mjs --dry-run  # same
//   DATABASE_URL=postgres://... node scripts/backfill-jobs.mjs --apply    # writes
//
// Guarantees:
// - Runs in ONE transaction. Dry run always ends in ROLLBACK.
// - Idempotent: users who already have a job, and shifts that already have
//   job_id / hourly_rate, are skipped.
// - Never writes base_salary, total_earnings, hours, used_150. The script
//   checks the sums before and after and aborts if they moved.
// - Refuses to run if base_salary on used_150 shifts doesn't look
//   post-multiplier (the formula below would then be wrong).

import pg from 'pg'

const args = new Set(process.argv.slice(2))
const APPLY = args.has('--apply')
if (APPLY && args.has('--dry-run')) {
  console.error('Pass either --apply or --dry-run, not both.')
  process.exit(2)
}

const url = process.env.DATABASE_URL
if (!url) {
  console.error('DATABASE_URL is not set.')
  process.exit(2)
}

const host = (() => { try { return new URL(url).host } catch { return '(unparseable)' } })()
console.log(`Target: ${host}`)
console.log(`Mode:   ${APPLY ? 'APPLY (will COMMIT)' : 'DRY RUN (will ROLLBACK)'}\n`)

const client = new pg.Client({ connectionString: url, ssl: url.includes('localhost') || url.includes('127.0.0.1') ? false : { rejectUnauthorized: false } })

const totalsSql = `
  select count(*)::int as shifts,
         coalesce(sum(base_salary::numeric), 0)::text as base_salary,
         coalesce(sum(total_earnings::numeric), 0)::text as total_earnings,
         coalesce(sum(hours::numeric), 0)::text as hours,
         count(*) filter (where used_150)::int as used_150
  from public.shifts`

const fail = async (msg) => {
  console.error(`\nSTOP: ${msg}\nNothing was written.`)
  await client.query('rollback').catch(() => {})
  await client.end()
  process.exit(1)
}

await client.connect()
try {
  await client.query('begin')
  await client.query(`set local lock_timeout = '5s'`)
  await client.query(`set local statement_timeout = '60s'`)

  // ── 1. Verify what base_salary holds on used_150 shifts ──────────
  const { rows: verify } = await client.query(`
    with usual as (
      select user_id, mode() within group (order by round((base_salary / hours)::numeric, 2)) as rate
      from public.shifts
      where salary_type = 'hourly' and not used_150 and hours > 0 and base_salary > 0
      group by user_id
    )
    select s.date::text, s.hours::float, s.base_salary::float,
           round((s.base_salary / s.hours)::numeric, 2)::float as per_hour,
           u.rate::float as usual_rate,
           round((s.base_salary / s.hours)::numeric / nullif(u.rate, 0), 3)::float as ratio
    from public.shifts s join usual u using (user_id)
    where s.salary_type = 'hourly' and s.used_150 and s.hours > 0
    order by s.date desc`)

  const near = (r, target) => Math.abs(r - target) <= 0.05
  const bucket = (r) =>
    near(r, 1.0) ? '~1.0 (pre-multiplier)'
    : near(r, 1.5) ? '~1.5 (post-multiplier)'
    : near(r, 2.25) ? '~2.25 (inflated by edit bug)'
    : 'other (likely a different rate that day)'
  const counts = {}
  for (const v of verify) counts[bucket(v.ratio)] = (counts[bucket(v.ratio)] ?? 0) + 1
  console.log(`1. base_salary check: ${verify.length} used_150 shifts comparable to the user's usual rate`)
  console.table(counts)
  console.log('   Examples:')
  console.table(verify.slice(0, 10))

  // ~2.25 rows are post-multiplier too (x1.5 applied twice by the old
  // edit form); the backfill leaves their rate NULL for review.
  // "other" rows are fine on their own: base_salary / hours / 1.5 still
  // gives that day's rate (e.g. 67.50 / 1.5 = 45 after a rate change).
  // Only a pattern of them is suspicious: stop if they're the majority.
  const pre = counts['~1.0 (pre-multiplier)'] ?? 0
  const other = counts['other (likely a different rate that day)'] ?? 0
  if (pre > 0 || (verify.length > 0 && other / verify.length > 0.5)) {
    await fail('base_salary on used_150 shifts is not consistently post-multiplier. Review the examples above before backfilling.')
  }

  const before = (await client.query(totalsSql)).rows[0]

  // ── 2. Derived rates ─────────────────────────────────────────────
  await client.query(`
    create temp table _derived on commit drop as
    select s.id, s.user_id, s.used_150,
           round((s.base_salary / s.hours)::numeric / (case when s.used_150 then 1.5 else 1 end), 2) as rate
    from public.shifts s
    where s.salary_type = 'hourly' and s.hours > 0 and s.base_salary > 0`)

  await client.query(`
    create temp table _user_rate on commit drop as
    select u.user_id,
           coalesce(
             (select mode() within group (order by d.rate) from _derived d where d.user_id = u.user_id and not d.used_150),
             (select mode() within group (order by d.rate) from _derived d where d.user_id = u.user_id),
             (select p.default_hourly_rate::numeric from public.user_profiles p where p.id = u.user_id)
           ) as rate
    from (select distinct user_id from public.shifts) u`)

  // ── 3. One default job per user who has none ─────────────────────
  const { rows: newJobs } = await client.query(`
    insert into public.jobs (user_id, name, hourly_rate, pays_shabbat_premium)
    select r.user_id, null, r.rate, null
    from _user_rate r
    where not exists (select 1 from public.jobs j where j.user_id = r.user_id)
    returning user_id, hourly_rate::float, color`)
  console.log(`\n2. Jobs to create: ${newJobs.length}`)
  console.table(newJobs.slice(0, 20))

  // ── 4. Attach shifts without a job ───────────────────────────────
  const attached = await client.query(`
    update public.shifts s
    set job_id = (select j.id from public.jobs j
                   where j.user_id = s.user_id and not j.archived
                   order by j.created_at limit 1)
    where s.job_id is null
      and exists (select 1 from public.jobs j where j.user_id = s.user_id and not j.archived)`)
  console.log(`3. Shifts to attach to a job: ${attached.rowCount}`)

  // ── 5. Per-shift hourly rate (hourly shifts only) ────────────────
  // A used_150 shift still ~1.5x the usual rate after dividing was
  // inflated by the old edit form: left NULL for manual review.
  // Any other difference from the usual rate is kept as that shift's rate.
  const rated = await client.query(`
    update public.shifts s
    set hourly_rate = d.rate
    from _derived d
    left join _user_rate r on r.user_id = d.user_id
    where s.id = d.id
      and s.hourly_rate is null
      and not (d.used_150 and r.rate > 0 and abs(d.rate / r.rate - 1.5) < 0.05)`)
  console.log(`4. Hourly shifts to get hourly_rate: ${rated.rowCount}`)

  const { rows: review } = await client.query(`
    select s.id, s.user_id, s.date::text, s.hours::float, s.base_salary::float, s.used_150
    from public.shifts s
    where s.salary_type = 'hourly' and s.hours > 0 and s.hourly_rate is null
    order by s.date desc`)
  console.log(`5. Hourly shifts left WITHOUT a rate (need review): ${review.length}`)
  if (review.length) console.table(review.slice(0, 20))

  // ── 6. Pay data must be untouched ────────────────────────────────
  const after = (await client.query(totalsSql)).rows[0]
  console.log('\n6. Pay columns before/after (must be identical):')
  console.table({ before, after })
  if (JSON.stringify(before) !== JSON.stringify(after)) {
    await fail('pay columns changed during the backfill.')
  }

  if (APPLY) {
    await client.query('commit')
    console.log('\nCOMMITTED.')
  } else {
    await client.query('rollback')
    console.log('\nDry run: ROLLED BACK. Re-run with --apply to write.')
  }
} catch (e) {
  await client.query('rollback').catch(() => {})
  console.error('\nError, rolled back:', e.message)
  process.exitCode = 1
} finally {
  await client.end()
}
