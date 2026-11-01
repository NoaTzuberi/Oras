-- Jobs: a user can work for several employers, each with its own rate,
-- city (for Shabbat times) and Shabbat premium policy.
-- Additive only: no existing column is changed or dropped.

create table if not exists public.jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 80),
  hourly_rate numeric(10, 2) check (hourly_rate is null or hourly_rate >= 0),
  geonameid integer not null default 293397, -- Tel Aviv
  pays_shabbat_premium boolean not null default true,
  archived boolean not null default false,
  created_at timestamptz not null default now(),
  -- Lets shifts reference (id, user_id) so a shift can only point at a job
  -- owned by the same user.
  unique (id, user_id)
);

create index if not exists jobs_user_id_idx on public.jobs (user_id);

alter table public.jobs enable row level security;

drop policy if exists "jobs_select_own" on public.jobs;
create policy "jobs_select_own" on public.jobs
  for select using (auth.uid() = user_id);

drop policy if exists "jobs_insert_own" on public.jobs;
create policy "jobs_insert_own" on public.jobs
  for insert with check (auth.uid() = user_id);

drop policy if exists "jobs_update_own" on public.jobs;
create policy "jobs_update_own" on public.jobs
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- The UI archives jobs instead of deleting them. A delete of a job that
-- still has shifts is rejected by shifts_job_owner_fkey, so shift data
-- can't be orphaned.
drop policy if exists "jobs_delete_own" on public.jobs;
create policy "jobs_delete_own" on public.jobs
  for delete using (auth.uid() = user_id);

-- Shift columns. All nullable: rows created before this migration stay as-is.
alter table public.shifts
  add column if not exists job_id uuid,
  add column if not exists hourly_rate numeric(10, 2),
  add column if not exists regular_hours numeric(6, 2),
  add column if not exists shabbat_hours numeric(6, 2),
  add column if not exists shabbat_premium_applied boolean,
  add column if not exists shabbat_verified boolean;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'shifts_job_owner_fkey'
  ) then
    -- MATCH SIMPLE (default): the check is skipped while job_id is null.
    -- Archiving is the only way a job goes away, so no ON DELETE action is needed.
    alter table public.shifts
      add constraint shifts_job_owner_fkey
      foreign key (job_id, user_id) references public.jobs (id, user_id);
  end if;
end $$;

create index if not exists shifts_job_id_idx on public.shifts (job_id);
