-- Rollback for migrations/20261105120000_add_overtime.sql
--
-- Run manually in the SQL editor ONLY after the code deploy has been
-- reverted (the new code writes these columns, so it must not be live).
--
-- Loses the overtime settings users saved on their jobs and the overtime
-- minutes on shifts. Pay totals (base_salary, total_earnings) live in the
-- old columns and are NOT affected: shifts saved with overtime keep the
-- amount that included it. Take a backup first. If unsure, leave the
-- columns in place: unused nullable columns are harmless to old code.

begin;

alter table public.jobs
  drop column if exists week_pattern,
  drop column if exists custom_daily_threshold_hours,
  drop column if exists overtime_enabled,
  drop column if exists short_day_weekday;

alter table public.shifts
  drop column if exists overtime_calculated,
  drop column if exists daily_threshold_minutes,
  drop column if exists is_night_shift,
  drop column if exists overtime_minutes_125,
  drop column if exists overtime_minutes_150,
  drop column if exists shabbat_ot_minutes_175,
  drop column if exists shabbat_ot_minutes_200;

delete from supabase_migrations.schema_migrations where version = '20261105120000';

commit;
