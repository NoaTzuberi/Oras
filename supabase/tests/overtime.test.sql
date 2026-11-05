-- Overtime columns. Run against LOCAL Supabase or staging:
--   npx supabase test db
-- Everything runs in a transaction and is rolled back.

begin;
create extension if not exists pgtap with schema extensions;
select plan(9);

insert into auth.users (id, email) values
  ('22222222-2222-2222-2222-222222222222', 'user-ot@test.local');

insert into public.jobs (id, user_id, name) values
  ('bbbbbbbb-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222', 'OT job');

select is((select week_pattern from public.jobs where id = 'bbbbbbbb-0000-0000-0000-000000000001'),
  '5day', 'new job: 5-day week by default');
select is((select overtime_enabled from public.jobs where id = 'bbbbbbbb-0000-0000-0000-000000000001'),
  true, 'new job: overtime on by default');
select is((select short_day_weekday from public.jobs where id = 'bbbbbbbb-0000-0000-0000-000000000001'),
  null::smallint, 'new job: short day NULL (= not sure in the app)');

select throws_ok(
  $$update public.jobs set week_pattern = '4day' where id = 'bbbbbbbb-0000-0000-0000-000000000001'$$,
  '23514', null, 'unknown week pattern is rejected');
select throws_ok(
  $$update public.jobs set short_day_weekday = 7 where id = 'bbbbbbbb-0000-0000-0000-000000000001'$$,
  '23514', null, 'short day outside 0..6 is rejected');
select throws_ok(
  $$update public.jobs set custom_daily_threshold_hours = 30 where id = 'bbbbbbbb-0000-0000-0000-000000000001'$$,
  '23514', null, 'custom threshold above 24h is rejected');

insert into public.shifts (id, user_id, date, start_time, end_time, hours, salary_type, base_salary, total_earnings)
values ('cccccccc-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222',
  '2026-11-04', '08:00', '18:00', 10, 'hourly', 500, 500);

select is((select overtime_calculated from public.shifts where id = 'cccccccc-0000-0000-0000-000000000001'),
  null::boolean, 'a shift inserted without overtime columns stays NULL (old calculation)');
select throws_ok(
  $$update public.shifts set overtime_minutes_125 = -1 where id = 'cccccccc-0000-0000-0000-000000000001'$$,
  '23514', null, 'negative overtime minutes are rejected');
select lives_ok(
  $$update public.shifts set overtime_calculated = true, daily_threshold_minutes = 516, is_night_shift = false,
      overtime_minutes_125 = 84, overtime_minutes_150 = 0, shabbat_ot_minutes_175 = 0, shabbat_ot_minutes_200 = 0
    where id = 'cccccccc-0000-0000-0000-000000000001'$$,
  'overtime result can be stored');

select * from finish();
rollback;
