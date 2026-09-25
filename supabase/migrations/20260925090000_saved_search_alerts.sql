-- Saved-search alert emails (owner, 2026-09-24 build note item 9) — until
-- now `saved_searches.is_active` was a real toggle with no consumer (see
-- the existing column comment). This adds what the weekly alert cron
-- (src/lib/saved-search-alerts.ts) needs to diff "new since last email"
-- per search, same snapshot-style pattern as project_notification_snapshots
-- for the follower digest.
alter table saved_searches add column if not exists last_notified_at timestamptz;
comment on column saved_searches.is_active is 'Alerts panel "email notifications" on/off flag — consumed by the weekly saved-search alert cron (src/lib/saved-search-alerts.ts) since 2026-09-25.';
comment on column saved_searches.last_notified_at is 'Last time this search''s weekly alert email was sent — a project created/published after this counts as "new" for the next email. Null until the first email goes out.';
