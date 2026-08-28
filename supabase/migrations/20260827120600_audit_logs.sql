-- Admin audit log — who changed what, before/after values.

create table if not exists audit_logs (
  id bigint generated always as identity primary key,
  admin_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id text not null,
  old_value jsonb,
  new_value jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_audit_logs_entity on audit_logs (entity_type, entity_id, created_at);
create index if not exists idx_audit_logs_admin_id on audit_logs (admin_id, created_at);

-- RLS: service_role only, matching the `leads` table pattern.
alter table audit_logs enable row level security;
