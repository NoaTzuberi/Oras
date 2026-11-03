# Deploy: 2026 tax / net update

Migration `supabase/migrations/20261103120000_add_tax_settings.sql`. It only
adds nullable columns:

- `jobs`:
  - `pension_active` (default true)
  - `pension_employee_pct` (default 6, 0–20)
  - `tips_in_payslip` (default true)
- `user_profiles.parent_column` (NULL, or 1 / 2)

No stored pay changes. `base_salary` and `total_earnings` are not touched.
Net, tax and deductions are computed in the app, so they change for
everyone as soon as the code is live. That is the intended fix.

## Order

1. Take a backup of the project (Dashboard → Database → Backups, or
   `npx supabase db dump -f backup-before-tax-2026.sql`).
2. Staging first:
   - `npx supabase db push`
   - then `npx supabase test db` (runs `supabase/tests/tax_settings.test.sql`)
3. Deploy the code to staging and check:
   - Settings → children: the one-time birth-year prompt appears for
     profiles saved with ages. Confirming saves `birthYear` + `age` in
     `children`.
   - Settings → jobs: pension / tips settings save and reload.
   - Dashboard net matches the examples in the PR description.
4. Production: run `db push` first, then deploy the code. The new code
   writes `parent_column` and the job columns, so it must not go live
   before the migration.

## What users see

- **Dashboard:** a one-time notice, shown to users who have shifts. It says
  the net now includes pension and the 2026 rules, and that stored shifts
  didn't change. Dismissing it is remembered per device (localStorage).
- **Months in 2025** use `src/tax/2025.ts`, with no "estimate" label.
- **Settings:** profiles saved with ages show the birth-year check until the
  user presses confirm. A normal Save keeps them marked as estimated
  (`birthYearEstimated: true` in the jsonb).

## Backward compatibility

- Old app versions keep working after the migration: they don't send the
  new columns, and the defaults fill them in.
- Old versions read `children[].age`, which the new code keeps writing.
- `is_moshav_member` / `is_priority_area` are kept and still written. They
  are just no longer shown or counted.

## Rollback

1. Revert the code deploy first.
2. Then run `supabase/rollbacks/20261103120000_add_tax_settings.down.sql`.
   This loses only the saved pension/tips settings and the parent column.
   Birth years stay in the jsonb, and old code ignores them.
