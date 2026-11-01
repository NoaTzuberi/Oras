-- READ-ONLY. Run in the Supabase SQL editor (staging first, then prod).
-- The base tables aren't in the repo's migrations, so this confirms that
-- shifts/user_profiles already have RLS. The new shift columns are covered
-- by whatever policies shifts already has.

select relname as table_name, relrowsecurity as rls_enabled, relforcerowsecurity as rls_forced
from pg_class
where oid in ('public.shifts'::regclass, 'public.user_profiles'::regclass)
   or (relname = 'jobs' and relnamespace = 'public'::regnamespace);

select tablename, policyname, cmd, roles, qual, with_check
from pg_policies
where schemaname = 'public'
order by tablename, cmd;

-- Column types the new FK depends on (expects uuid / uuid):
select column_name, data_type, is_nullable
from information_schema.columns
where table_schema = 'public' and table_name = 'shifts'
order by ordinal_position;
