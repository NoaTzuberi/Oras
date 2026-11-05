# Deploy: daily overtime

Migration `supabase/migrations/20261105120000_add_overtime.sql`. It only
adds nullable columns:

- `jobs`:
  - `week_pattern` (`'5day'` default, `'6day'`, `'custom'`)
  - `custom_daily_threshold_hours` (NULL, 1–24; only for `'custom'`)
  - `overtime_enabled` (default true)
  - `short_day_weekday` (NULL = Thursday, 0–6)
- `shifts`:
  - `overtime_calculated` (NULL = saved before overtime)
  - `daily_threshold_minutes`, `is_night_shift`
  - `overtime_minutes_125`, `overtime_minutes_150` (parts of `regular_hours`)
  - `shabbat_ot_minutes_175`, `shabbat_ot_minutes_200` (parts of `shabbat_hours`)

No stored pay changes and no shift is recalculated. Existing shifts get
NULL overtime columns and keep their pay, including when they're edited,
until the user changes date/times/job/premium or confirms "Recalculate".

Existing jobs get `week_pattern = '5day'` and `overtime_enabled = true`
from the column defaults. The app treats NULL the same way. So **new**
shifts on existing jobs get overtime right away, which is the intended
behavior.

## Order

**Backup → staging rehearsal → prod migration → code deploy.** The code
writes the new columns, so it must not go live before the migration.

### 0. Backup

```sh
pg_dump "$PROD_DB_URL" --format=custom --no-owner \
  --file="oras-prod-$(date +%Y%m%d-%H%M).dump"
```

Keep the file outside the repo.

### 1. Staging

```sh
npx supabase link --project-ref <staging-ref>
npx supabase migration list          # only 20261105120000 should be pending
npm run db:push
npx supabase test db --linked        # runs supabase/tests/overtime.test.sql (needs Docker)
```

Point a local build at staging (`VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`
in `.env.local`), run `npm run dev`, and check (₪50/h job, 5-day week):

- [ ] Add a weekday shift 08:00–18:00. The pay card shows 8:36 Regular ₪430 and 1:24 Overtime 125% ₪87.50, total ₪517.50.
- [ ] Add a Friday 13:00–00:00 shift (winter, Tel Aviv). The night note "Night shift (2+ hours between 22:00–06:00): 7h work day" shows, the timeline has 4 colors, and there are stat blocks at 100 / 150 / 175 / 200%.
- [ ] Change the end time to 23:59. The night note disappears, overtime starts at 21:36, and the total drops by ~₪42.
- [ ] Save 14:00–18:00, then add 08:00–14:00 for the same job and date. Before saving it shows "This also updates your 14:00–18:00 shift: +₪17.50", and after saving both shifts are updated.
- [ ] Delete the 08:00–14:00 shift. The confirm box includes the "−₪17.50" line, and the 14:00–18:00 shift goes back to ₪200.
- [ ] Repeat with two different jobs on the same day: no overtime and no notice.
- [ ] Settings → job: turn overtime off. A 10h shift is plain rate × hours. Try the 6-day pattern (Friday 9h → 7h + 2h at 125%), a custom threshold, and a short-day change. Every setting should save and reload.
- [ ] Open an old shift (saved before this deploy) and save it unchanged: same pay. "Recalculate" previews with overtime.
- [ ] Dashboard: the Overtime card shows hours per rate, on "All" and on the job's tab.
- [ ] Hebrew (RTL): the card, the notice and the "+₪" amounts read correctly.

### 2. Production

1. `npx supabase link --project-ref <prod-ref>` and `npx supabase migration list`. Only `20261105120000` should be pending.
2. `npm run db:push`
3. Deploy the code (merge to the branch Render builds from).

## Backward compatibility

- **Old app versions after the migration.** They don't send the new columns, so the shifts they save have NULL overtime (old calculation). They never read the new columns.
- **New code, shifts saved by an old version.** These are treated as old shifts and keep their pay.
- `base_salary`, `total_earnings`, `regular_hours`, `shabbat_hours` and `used_150` keep their meaning, so totals stay correct in old versions.

## Known limits

- Weekly overtime (over 42h) is not calculated yet.
- Weekday holidays are treated as normal days, same as the Shabbat premium.
- The other shifts of a day are updated one by one after the main save. If one update fails, the user is told to open that shift and save it again.
- If Shabbat times can't load, the other shifts of that day are left as they are.

## Rollback

1. Revert the code deploy first: Render → Deploys → Rollback, or `git revert` the merge.
2. Usually leave the schema: unused nullable columns are harmless to old code.
3. If needed, run `supabase/rollbacks/20261105120000_add_overtime.down.sql`. It loses the job overtime settings and the overtime minutes. Pay totals saved with overtime stay as saved.
