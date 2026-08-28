-- Lead activity / history — internal notes and status changes on a lead.
-- leads.id is `text` (not uuid), so lead_id follows that type.

create table if not exists lead_activity (
  id bigint generated always as identity primary key,
  lead_id text not null references leads(id) on delete cascade,
  note text not null,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists idx_lead_activity_lead_id on lead_activity (lead_id, created_at);

-- RLS: service_role only, same pattern as `leads` — no anon/authenticated
-- policies at all.
alter table lead_activity enable row level security;
