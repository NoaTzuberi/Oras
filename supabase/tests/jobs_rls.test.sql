-- RLS isolation for public.jobs. Run against LOCAL Supabase or staging:
--   npx supabase test db
-- Everything runs in a transaction and is rolled back.

begin;
create extension if not exists pgtap with schema extensions;
select plan(10);

insert into auth.users (id, email) values
  ('11111111-1111-1111-1111-111111111111', 'user-a@test.local'),
  ('22222222-2222-2222-2222-222222222222', 'user-b@test.local');

insert into public.jobs (id, user_id, name) values
  ('aaaaaaaa-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'A job'),
  ('bbbbbbbb-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222', 'B job');

select ok(
  (select relrowsecurity from pg_class where oid = 'public.jobs'::regclass),
  'RLS is enabled on public.jobs'
);

-- ── Act as user A ─────────────────────────────────
set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}', true);

select results_eq(
  'select name from public.jobs',
  $$values ('A job'::text)$$,
  'User A sees only their own jobs'
);

select is_empty(
  $$select 1 from public.jobs where id = 'bbbbbbbb-0000-0000-0000-000000000001'$$,
  'User A cannot read user B''s job even by id'
);

select throws_ok(
  $$insert into public.jobs (user_id, name) values ('22222222-2222-2222-2222-222222222222', 'planted')$$,
  '42501', null,
  'User A cannot create a job owned by user B'
);

select throws_ok(
  $$update public.jobs set user_id = '22222222-2222-2222-2222-222222222222'
    where id = 'aaaaaaaa-0000-0000-0000-000000000001'$$,
  '42501', null,
  'User A cannot hand their job over to user B'
);

select lives_ok(
  $$insert into public.jobs (user_id, name) values ('11111111-1111-1111-1111-111111111111', 'A second job')$$,
  'User A can create their own job'
);

-- New shift columns: a shift can only point at a job owned by the same
-- user (composite FK on (job_id, user_id)), even if the job id is known.
select throws_ok(
  $$insert into public.shifts
      (user_id, date, start_time, end_time, hours, salary_type, base_salary, tips,
       total_earnings, is_shabbat_or_holiday, used_150, job_id)
    values ('11111111-1111-1111-1111-111111111111', '2026-10-30', '09:00', '17:00', 8, 'hourly',
            400, 0, 400, false, false, 'bbbbbbbb-0000-0000-0000-000000000001')$$,
  '23503', null,
  'User A cannot attach a shift to user B''s job'
);

-- Silently affects 0 rows under RLS; verified below as superuser.
update public.jobs set name = 'hacked' where id = 'bbbbbbbb-0000-0000-0000-000000000001';
delete from public.jobs where id = 'bbbbbbbb-0000-0000-0000-000000000001';

-- ── Anonymous ─────────────────────────────────────
reset role;
set local role anon;
select set_config('request.jwt.claims', '{"role":"anon"}', true);

select is_empty('select 1 from public.jobs', 'Anonymous users see no jobs');

-- ── Back to superuser: check B's row survived ─────
reset role;

select is(
  (select name from public.jobs where id = 'bbbbbbbb-0000-0000-0000-000000000001'),
  'B job',
  'User A''s update and delete did not touch user B''s job'
);

select is(
  (select count(*)::int from public.jobs where user_id = '11111111-1111-1111-1111-111111111111'),
  2,
  'User A now has exactly their 2 jobs'
);

select * from finish();
rollback;
