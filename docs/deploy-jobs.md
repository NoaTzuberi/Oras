# Deploy plan: jobs + shift pay columns (Phase 1)

Order: **backup → staging rehearsal → prod migration → code deploy → backfill (dry run, then apply)**.

The code needs the migration (it writes `job_id`, `hourly_rate`, … on save),
so the migration must go first. The code does **not** need the backfill:
users without a job see "No job" and the rate comes from their profile
default, the same as today.

Old app version + new schema is safe: the old code never reads or writes
the new columns or the `jobs` table.

---

## 0. One-time: create a staging project

There is no staging project yet, and the base tables (`shifts`,
`user_profiles`) aren't in `supabase/migrations/`, so the repo alone can't
rebuild the database. Steps:

1. Install Postgres client tools (gives `pg_dump` and `psql` v17, matching Supabase):
   ```sh
   brew install libpq && brew link --force libpq
   ```
2. In the Supabase dashboard, create a new project `oras-staging` (free tier allows 2).
3. Copy the **prod schema only** (no user data):
   ```sh
   pg_dump "$PROD_DB_URL" --schema-only --schema=public --no-owner --no-privileges \
     --file=supabase/staging/prod_schema.sql
   ```
   `PROD_DB_URL`: Dashboard → Connect → **Session pooler** connection string (port 5432).
4. Load it into staging, then mark the existing migration as applied so the
   rehearsal matches prod:
   ```sh
   psql "$STAGING_DB_URL" -f supabase/staging/prod_schema.sql
   npx supabase link --project-ref <staging-ref>
   npx supabase migration repair 20260729160847 --status applied
   ```
5. Seed synthetic data: `psql "$STAGING_DB_URL" -f supabase/staging/seed.sql`

## 1. Rehearse on staging

```sh
npx supabase link --project-ref <staging-ref>
npx supabase migration list            # only 20261101120000 should be pending
npm run db:push                        # applies the jobs migration
npx supabase test db --linked          # RLS test: supabase/tests/jobs_rls.test.sql (needs Docker running)
psql "$STAGING_DB_URL" -f supabase/backfills/00_check_existing_rls.sql
psql "$STAGING_DB_URL" -f supabase/backfills/01_verify_base_salary.sql
DATABASE_URL="$STAGING_DB_URL" npm run backfill:jobs -- --dry-run
DATABASE_URL="$STAGING_DB_URL" npm run backfill:jobs -- --apply
DATABASE_URL="$STAGING_DB_URL" npm run backfill:jobs -- --dry-run   # must report 0 / 0 / 0
```
Compare with the expected result at the bottom of `supabase/staging/seed.sql`.
Then point a local build at staging (`VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`
of the staging project in `.env.local`), run `npm run dev`, and try: add a
job, add/edit a shift with and without a job, archive a job, edit an old 150% shift.

## 2. Production

1. **Backup first.**
   ```sh
   pg_dump "$PROD_DB_URL" --format=custom --no-owner \
     --file="oras-prod-$(date +%Y%m%d-%H%M).dump"
   ```
   Keep the file somewhere safe and outside the repo. Also check Dashboard → Database → Backups
   for the latest automatic backup (the free plan may not offer downloadable backups,
   so the pg_dump file is the one to rely on).
2. Check what will be applied (read-only):
   ```sh
   npx supabase link --project-ref <prod-ref>
   npx supabase migration list
   ```
   Only `20261101120000` should be pending. If `20260729160847` also shows as
   pending, it's safe (it only uses `add column if not exists`), but tell me first.
3. Apply the migration: `npm run db:push`
4. Run `supabase/backfills/00_check_existing_rls.sql` in the SQL editor:
   `shifts`, `user_profiles` and `jobs` must all have `rls_enabled = true`.
5. Deploy the code (merge to the branch Render builds from).
6. Backfill:
   ```sh
   DATABASE_URL="$PROD_DB_URL" npm run backfill:jobs -- --dry-run
   ```
   Review the output, then `-- --apply`.

## Rollback

**Code (Render):** Dashboard → the `oras` service → **Deploys** → the last
deploy before this one → **Rollback**. Or `git revert` the merge commit and
push. Rolling back the code while keeping the schema is safe.
One caveat: if a shift is edited with the old code, its new `hourly_rate`
column isn't updated, so the edit form would show the old rate after re-deploying.

**Migration:** `supabase/rollbacks/20261101120000_add_jobs_and_shift_pay_columns.down.sql`.
Revert the code first. This deletes all jobs and the new shift columns, but not
pay totals. Usually better to just leave the schema in place.

**Backfill:** only writes the new columns, so it's undone by:
```sql
begin;
update public.shifts set job_id = null, hourly_rate = null;
-- default jobs never renamed or answered; removes nothing users created
delete from public.jobs j where j.name is null and j.pays_shabbat_premium is null;
commit;
```

## Review: existing shifts under the Shabbat split (read-only)

Never rewrites anything. Prints per-user/month totals before vs after and
writes CSVs (`monthly.csv`, `changed_shifts.csv`) to `./shabbat-diff-<date>/`.
Contains user ids: keep the output out of the repo.

```sh
DATABASE_URL="$STAGING_DB_URL" npm run diff:shabbat     # rehearse
DATABASE_URL="$PROD_DB_URL" npm run diff:shabbat        # after backfill, for review
```
