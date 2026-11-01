-- READ-ONLY. Run in the Supabase SQL editor before the backfill.
--
-- Checks whether base_salary on used_150 shifts is stored before or after
-- the x1.5 multiplier, by comparing each shift's base_salary/hours with
-- the same user's usual rate on non-150 hourly shifts.
--
--   ratio ~ 1.00 -> base_salary is PRE-multiplier
--   ratio ~ 1.50 -> base_salary is POST-multiplier (what the code does)
--   ratio ~ 2.25 -> shift was re-saved via the old edit form, rate got
--                   inflated twice (bug fixed in this change)

with usual_rate as (
  select user_id,
         mode() within group (order by round((base_salary / hours)::numeric, 2)) as rate,
         count(*) as n_regular_shifts
  from public.shifts
  where salary_type = 'hourly' and not used_150 and hours > 0
  group by user_id
)
select s.user_id,
       s.date,
       s.start_time,
       s.end_time,
       s.hours,
       s.base_salary,
       round((s.base_salary / s.hours)::numeric, 2)                     as base_per_hour,
       coalesce(u.rate, p.default_hourly_rate)               as usual_rate,
       round((s.base_salary / s.hours)::numeric
             / nullif(coalesce(u.rate, p.default_hourly_rate)::numeric, 0), 2) as ratio
from public.shifts s
left join usual_rate u on u.user_id = s.user_id
left join public.user_profiles p on p.id = s.user_id
where s.salary_type = 'hourly' and s.used_150 and s.hours > 0
order by ratio nulls last, s.date desc
limit 100;
