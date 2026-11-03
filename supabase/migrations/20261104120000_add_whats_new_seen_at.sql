-- "What's New" modal (Shabbat split, jobs, 2026 net, children's birth
-- years): shown once per user, remembered across devices.
--
-- Additive only: one new nullable column. NULL = not seen yet.
--   - Existing users with shifts keep NULL, so they see it once.
--   - Existing users with no shifts are marked as seen: nothing changed for them.
--   - New sign-ups get now() from the default (the signup trigger inserts
--     only the id), so they never see it.
-- The app only shows the modal when the column is present and NULL, so it
-- is safe to deploy the app before or after this runs.

alter table public.user_profiles
  add column if not exists whats_new_seen_at timestamptz;

update public.user_profiles p
set whats_new_seen_at = now()
where p.whats_new_seen_at is null
  and not exists (select 1 from public.shifts s where s.user_id = p.id);

-- After the update, so existing rows stay NULL
alter table public.user_profiles
  alter column whats_new_seen_at set default now();
