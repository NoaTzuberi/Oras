-- Rollback for migrations/20261103120000_add_tax_settings.sql
--
-- Run manually in the SQL editor ONLY after the code deploy has been
-- reverted (the new code writes these columns, so it must not be live).
--
-- Loses the pension/tips settings users saved on their jobs and their
-- chosen parent column. No pay data is affected. Children's birth years
-- live in the children jsonb and are not touched (old code reads "age",
-- which keeps being written). Take a backup first. If unsure, leave the
-- columns in place: unused nullable columns are harmless to old code.

begin;

alter table public.jobs
  drop column if exists pension_active,
  drop column if exists pension_employee_pct,
  drop column if exists tips_in_payslip;

alter table public.user_profiles
  drop column if exists parent_column;

delete from supabase_migrations.schema_migrations where version = '20261103120000';

commit;
