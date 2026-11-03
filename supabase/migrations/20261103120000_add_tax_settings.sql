-- 2026 tax/net: per-job pension and tips settings, and the Form 101
-- parent column for child credit points.
--
-- Additive only: new nullable columns, nothing dropped, renamed or
-- retyped. The app treats NULL as the default (pension on at 6%, tips on
-- the payslip, column 1 for women / 2 for men), so it works before and
-- after this runs. No stored pay (base_salary, total_earnings) changes.
--
-- Children's birth years go into the existing user_profiles.children jsonb
-- (each entry gains "birthYear"; "age" keeps being written), so no column
-- is needed for that.

alter table public.jobs
  add column if not exists pension_active boolean default true,
  add column if not exists pension_employee_pct numeric(4,2) default 6
    constraint jobs_pension_employee_pct_range
    check (pension_employee_pct is null or (pension_employee_pct >= 0 and pension_employee_pct <= 20)),
  add column if not exists tips_in_payslip boolean default true;

alter table public.user_profiles
  add column if not exists parent_column smallint
    constraint user_profiles_parent_column_values
    check (parent_column is null or parent_column in (1, 2));
