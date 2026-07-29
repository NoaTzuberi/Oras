-- Replaces the old "military_years" number field with a simpler
-- service-type + discharge-date model. The old military_years column is
-- intentionally left in place (not dropped) so existing data isn't lost
-- automatically; drop it manually once you're confident it's no longer needed:
--   alter table user_profiles drop column military_years;

alter table user_profiles
  add column if not exists service_type text not null default 'none'
    check (service_type in ('none', 'military', 'national')),
  add column if not exists discharge_date date;
