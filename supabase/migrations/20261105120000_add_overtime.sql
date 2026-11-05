-- Daily overtime (125% / 150%, and 175% / 200% inside Shabbat).
--
-- Additive only: new nullable columns, nothing dropped, renamed or
-- retyped. No stored pay (base_salary, total_earnings) changes, and no
-- existing shift is recalculated: their overtime columns stay NULL, which
-- the app reads as "saved before overtime" (previous calculation kept).
-- The app treats NULL job settings as the defaults (5-day week, overtime
-- on, short day Thursday), so it's safe before and after this runs.
-- The app writes these columns, so this must run BEFORE the code deploy.

-- Jobs: overtime rules. Existing jobs get the defaults filled in, which is
-- the same as the app's NULL handling.
alter table public.jobs
  add column if not exists week_pattern text default '5day'
    constraint jobs_week_pattern_values
    check (week_pattern is null or week_pattern in ('5day', '6day', 'custom')),
  -- Only used with week_pattern = 'custom'. NULL there = the 5-day rules.
  add column if not exists custom_daily_threshold_hours numeric(4, 2)
    constraint jobs_custom_daily_threshold_range
    check (custom_daily_threshold_hours is null or (custom_daily_threshold_hours >= 1 and custom_daily_threshold_hours <= 24)),
  add column if not exists overtime_enabled boolean default true,
  -- 0 = Sunday ... 6 = Saturday; 5-day week only. NULL = Thursday.
  add column if not exists short_day_weekday smallint
    constraint jobs_short_day_weekday_range
    check (short_day_weekday is null or (short_day_weekday >= 0 and short_day_weekday <= 6));

-- Shifts: the overtime result, in whole minutes. The four minute columns
-- are parts of the existing split: 125/150 are inside regular_hours,
-- 175/200 inside shabbat_hours (the 175/200 names assume the Shabbat
-- premium; with shabbat_premium_applied = false they're paid 125/150).
-- Plain minutes = hours - the four columns, so weekly overtime (over 42h)
-- can be added later without new data.
alter table public.shifts
  -- NULL = saved before overtime; true = computed with overtime;
  -- false = computed, overtime turned off for the job.
  add column if not exists overtime_calculated boolean,
  -- The threshold used for the work day. NULL when overtime is off.
  add column if not exists daily_threshold_minutes integer
    constraint shifts_daily_threshold_minutes_range
    check (daily_threshold_minutes is null or (daily_threshold_minutes >= 0 and daily_threshold_minutes <= 1440)),
  add column if not exists is_night_shift boolean,
  add column if not exists overtime_minutes_125 integer
    constraint shifts_overtime_minutes_125_nonneg check (overtime_minutes_125 is null or overtime_minutes_125 >= 0),
  add column if not exists overtime_minutes_150 integer
    constraint shifts_overtime_minutes_150_nonneg check (overtime_minutes_150 is null or overtime_minutes_150 >= 0),
  add column if not exists shabbat_ot_minutes_175 integer
    constraint shifts_shabbat_ot_minutes_175_nonneg check (shabbat_ot_minutes_175 is null or shabbat_ot_minutes_175 >= 0),
  add column if not exists shabbat_ot_minutes_200 integer
    constraint shifts_shabbat_ot_minutes_200_nonneg check (shabbat_ot_minutes_200 is null or shabbat_ot_minutes_200 >= 0);
