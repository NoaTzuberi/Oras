-- STAGING ONLY. Synthetic data for rehearsing the jobs backfill.
-- Never run against production. No real user data.
--
-- User A: rate 50. Regular shifts, one 150% shift stored correctly (600),
--         one 150% shift re-saved via the old edit form (900 = 2.25x),
--         one daily-total shift.
-- User B: rate 60, regular shifts only, no profile default.

insert into auth.users (id, email) values
  ('11111111-1111-1111-1111-111111111111', 'staging-a@test.local'),
  ('22222222-2222-2222-2222-222222222222', 'staging-b@test.local')
on conflict (id) do nothing;

insert into public.user_profiles (id, gender, default_hourly_rate)
values ('11111111-1111-1111-1111-111111111111', 'female', 50)
on conflict (id) do nothing;

insert into public.shifts
  (user_id, date, start_time, end_time, hours, salary_type, base_salary, tips, total_earnings, is_shabbat_or_holiday, used_150)
values
  ('11111111-1111-1111-1111-111111111111', '2026-10-05', '09:00', '17:00', 8, 'hourly', 400, 0,   400, false, false),
  ('11111111-1111-1111-1111-111111111111', '2026-10-06', '09:00', '17:00', 8, 'hourly', 400, 50,  450, false, false),
  ('11111111-1111-1111-1111-111111111111', '2026-10-10', '09:00', '17:00', 8, 'hourly', 600, 0,   600, true,  true),
  ('11111111-1111-1111-1111-111111111111', '2026-10-17', '09:00', '17:00', 8, 'hourly', 900, 0,   900, true,  true),
  ('11111111-1111-1111-1111-111111111111', '2026-10-20', '10:00', '18:00', 8, 'total',  450, 0,   450, false, false),
  ('22222222-2222-2222-2222-222222222222', '2026-10-07', '08:00', '14:00', 6, 'hourly', 360, 0,   360, false, false),
  ('22222222-2222-2222-2222-222222222222', '2026-10-08', '08:00', '16:00', 8, 'hourly', 480, 20,  500, false, false);

-- Expected backfill result:
--   2 jobs created (A: 50.00, B: 60.00)
--   7 shifts attached
--   5 shifts get hourly_rate (A: 50, 50, 50 ; B: 60, 60)
--   1 shift left for review (A, 2026-10-17, base_salary 900)
--   daily-total shift: job attached, hourly_rate stays NULL
--   pay columns unchanged
-- Re-running: 0 jobs, 0 attached, 0 rated.
