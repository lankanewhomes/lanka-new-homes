-- Lead assignment — which admin/developer user a lead is assigned to.

alter table leads add column if not exists assigned_to uuid references auth.users(id) on delete set null;
alter table leads add column if not exists assigned_at timestamptz;

create index if not exists idx_leads_assigned_to on leads (assigned_to);
