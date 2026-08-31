-- Saved searches now need direct client access, not just service_role.
--
-- The original saved_searches migration (20260827120300) enabled RLS with
-- no policies, commented "service_role only, matching the leads table" —
-- that made sense for leads (staff-only data) but not for saved searches,
-- which are buyer-owned data exactly like saved_listings. The map sidebar's
-- Alerts panel needs to read/write a signed-in user's own saved searches
-- directly from the browser client, so it gets the same owner-scoped
-- policies saved_listings already has, plus an update policy (saved_listings
-- doesn't need one — you don't edit a saved project — but a saved search's
-- name and is_active flag both need to be editable in place).

drop policy if exists "saved_searches: read own" on saved_searches;
create policy "saved_searches: read own" on saved_searches for select using (auth.uid() = user_id);

drop policy if exists "saved_searches: insert own" on saved_searches;
create policy "saved_searches: insert own" on saved_searches for insert with check (auth.uid() = user_id);

drop policy if exists "saved_searches: update own" on saved_searches;
create policy "saved_searches: update own" on saved_searches for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "saved_searches: delete own" on saved_searches;
create policy "saved_searches: delete own" on saved_searches for delete using (auth.uid() = user_id);

-- is_active is repurposed as the Alerts panel's "email notifications" on/off
-- flag — no new column needed. No email is actually sent yet (no email
-- provider/cron infra exists in this repo); the flag just persists for now.
comment on column saved_searches.is_active is 'Alerts panel "email notifications" on/off flag. No email is sent yet — this only persists the toggle state for a future notification job.';
