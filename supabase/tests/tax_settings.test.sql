-- Tax settings columns. Run against LOCAL Supabase or staging:
--   npx supabase test db
-- Everything runs in a transaction and is rolled back.

begin;
create extension if not exists pgtap with schema extensions;
select plan(7);

insert into auth.users (id, email) values
  ('11111111-1111-1111-1111-111111111111', 'user-a@test.local');

insert into public.jobs (id, user_id, name) values
  ('aaaaaaaa-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'A job');

select is((select pension_active from public.jobs where id = 'aaaaaaaa-0000-0000-0000-000000000001'),
  true, 'new job: pension on by default');
select is((select pension_employee_pct from public.jobs where id = 'aaaaaaaa-0000-0000-0000-000000000001'),
  6.00::numeric, 'new job: 6% employee pension by default');
select is((select tips_in_payslip from public.jobs where id = 'aaaaaaaa-0000-0000-0000-000000000001'),
  true, 'new job: tips on the payslip by default');

select throws_ok(
  $$update public.jobs set pension_employee_pct = 25 where id = 'aaaaaaaa-0000-0000-0000-000000000001'$$,
  '23514', null, 'pension % above 20 is rejected');
select lives_ok(
  $$update public.jobs set pension_active = null, pension_employee_pct = null, tips_in_payslip = null
    where id = 'aaaaaaaa-0000-0000-0000-000000000001'$$,
  'all three settings accept NULL (= app default)');

insert into public.user_profiles (id) values ('11111111-1111-1111-1111-111111111111')
  on conflict (id) do nothing;
select throws_ok(
  $$update public.user_profiles set parent_column = 3 where id = '11111111-1111-1111-1111-111111111111'$$,
  '23514', null, 'parent_column only allows 1 or 2');
select is((select parent_column from public.user_profiles where id = '11111111-1111-1111-1111-111111111111'),
  null::smallint, 'parent_column defaults to NULL');

select * from finish();
rollback;
