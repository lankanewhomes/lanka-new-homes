-- Last-notified values per project, diffed weekly by the follower-digest
-- cron (src/lib/follower-digest.ts) to detect new floor plans, price
-- changes, and construction updates for buyers following that developer.

create table if not exists project_notification_snapshots (
  project_slug text primary key references projects(slug) on delete cascade,
  starting_price_lkr numeric,
  floor_plan_count int not null default 0,
  available_units int not null default 0,
  construction_update_count int not null default 0,
  updated_at timestamptz not null default now()
);

-- RLS: service_role only, matching the audit_logs pattern — buyers never
-- read this table directly, only supabaseAdmin (bypasses RLS) does.
alter table project_notification_snapshots enable row level security;
