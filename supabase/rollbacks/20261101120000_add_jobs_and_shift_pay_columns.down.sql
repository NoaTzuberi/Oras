-- Rollback for migrations/20261101120000_add_jobs_and_shift_pay_columns.sql
--
-- Run manually in the SQL editor ONLY after the code deploy has been
-- reverted (the new code writes these columns, so it must not be live).
--
-- WARNING: this deletes data entered after the migration: every job, and
-- the job/rate/split values on shifts. Pay totals (base_salary,
-- total_earnings) live in the old columns and are NOT affected.
-- Take a backup first. If unsure, prefer leaving the schema in place:
-- unused nullable columns and an unused table are harmless to old code.

begin;

alter table public.shifts drop constraint if exists shifts_job_owner_fkey;
drop index if exists public.shifts_job_id_idx;

alter table public.shifts
  drop column if exists job_id,
  drop column if exists hourly_rate,
  drop column if exists regular_hours,
  drop column if exists shabbat_hours,
  drop column if exists shabbat_premium_applied,
  drop column if exists shabbat_verified;

drop table if exists public.jobs;

-- Remove the migration from history so `supabase db push` would re-apply it.
delete from supabase_migrations.schema_migrations where version = '20261101120000';

commit;
