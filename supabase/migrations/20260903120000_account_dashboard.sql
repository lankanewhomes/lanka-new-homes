-- User account dashboard: links leads back to the signed-in buyer who sent
-- them, adds a "saved developments" table (follow a developer/builder,
-- distinct from saving individual project listings), and extends profiles
-- with the contact/preference/notification fields the dashboard's Profile
-- and Settings pages edit.

alter table leads add column if not exists user_id uuid references auth.users(id) on delete set null;
create index if not exists idx_leads_user_id on leads (user_id, created_at);

-- RLS: a signed-in buyer can read their own enquiries, matched either by
-- the user_id captured at submit time (going forward) or by email (so
-- enquiries sent before the buyer had an account still show up once they
-- sign up with the same email). Leads previously had zero select policies
-- (service_role only) — this adds the first one; write access is still
-- service_role only (insertLead/admin routes), no insert/update/delete
-- policy is added here.
drop policy if exists "leads: read own" on leads;
create policy "leads: read own" on leads for select
  using (auth.uid() = user_id or auth.email() = email);

alter table profiles add column if not exists phone text;
alter table profiles add column if not exists preferred_locations text[] not null default '{}';
alter table profiles add column if not exists preferred_property_types text[] not null default '{}';
alter table profiles add column if not exists budget_min numeric;
alter table profiles add column if not exists budget_max numeric;
alter table profiles add column if not exists preferred_bedrooms text;
alter table profiles add column if not exists notify_email boolean not null default true;
alter table profiles add column if not exists notify_new_properties boolean not null default true;
alter table profiles add column if not exists notify_price_changes boolean not null default true;
alter table profiles add column if not exists marketing_opt_in boolean not null default false;

create table if not exists saved_developers (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  developer_slug text not null references developers(slug) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, developer_slug)
);
create index if not exists idx_saved_developers_user on saved_developers (user_id, created_at);

alter table saved_developers enable row level security;
drop policy if exists "saved_developers: read own" on saved_developers;
create policy "saved_developers: read own" on saved_developers for select using (auth.uid() = user_id);
drop policy if exists "saved_developers: insert own" on saved_developers;
create policy "saved_developers: insert own" on saved_developers for insert with check (auth.uid() = user_id);
drop policy if exists "saved_developers: delete own" on saved_developers;
create policy "saved_developers: delete own" on saved_developers for delete using (auth.uid() = user_id);
