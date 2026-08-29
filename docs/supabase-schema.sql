-- NewHomesSrilanka — Supabase schema
-- Run this once in the Supabase SQL Editor (Project → SQL Editor → New query).
-- Safe to re-run: every statement is idempotent (IF NOT EXISTS / CREATE OR REPLACE).
--
-- Design: each table has a few indexed scalar columns for filtering/sorting,
-- plus a `data jsonb` column holding the full object exactly as the app's
-- TypeScript types define it (src/types/index.ts). This means most new
-- fields just land inside `data` with zero schema change needed — a real
-- ALTER TABLE is only required when a field needs to be filtered/sorted at
-- the database level. See docs/supabase-workflow.md for the update rules.

create extension if not exists "pgcrypto";

-- Projects ---------------------------------------------------------------

create table if not exists projects (
  slug text primary key,
  name text not null,
  developer_slug text not null,
  developer_name text not null,
  status text,
  type text,
  starting_price_lkr numeric,
  location text,
  city text,
  district text,
  province text,
  neighborhood text,
  is_featured boolean not null default false,
  is_move_in_now boolean not null default false,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_projects_developer_slug on projects (developer_slug);
create index if not exists idx_projects_status on projects (status);
create index if not exists idx_projects_city on projects (city);
create index if not exists idx_projects_district on projects (district);
create index if not exists idx_projects_data_gin on projects using gin (data);

-- Developers ---------------------------------------------------------------

create table if not exists developers (
  slug text primary key,
  name text not null,
  location text,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_developers_data_gin on developers using gin (data);

-- Neighborhoods --------------------------------------------------------------

create table if not exists neighborhoods (
  slug text primary key,
  name text not null,
  city text,
  province text,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Hero ads -----------------------------------------------------------------

create table if not exists hero_ads (
  id text primary key,
  developer_slug text,
  project_slug text,
  status text,
  "order" integer not null default 0,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_hero_ads_status on hero_ads (status);
create index if not exists idx_hero_ads_developer_slug on hero_ads (developer_slug);

-- Construction companies, and the lighter-weight partner directories linked
-- from a project's "Connected Pages" section (marketing companies, sales
-- companies, architects, interior designers). All share the same shape.
-- (supabase/migrations/20260829120000_company_directories.sql)

create table if not exists construction_companies (
  slug text primary key,
  name text not null,
  location text,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists marketing_companies (
  slug text primary key,
  name text not null,
  location text,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists sales_companies (
  slug text primary key,
  name text not null,
  location text,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists architects (
  slug text primary key,
  name text not null,
  location text,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists interior_designers (
  slug text primary key,
  name text not null,
  location text,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Lands (raw land parcels for sale — separate inventory type from projects) -
-- (supabase/migrations/20260828200000_lands_table.sql)

create table if not exists lands (
  slug text primary key,
  title text not null,
  seller_type text not null check (seller_type in ('developer', 'construction_company', 'builder')),
  seller_slug text,
  seller_name text not null,
  status text not null default 'Available' check (status in ('Available', 'Reserved', 'Sold')),
  price_lkr numeric,
  district text,
  city text,
  province text,
  is_featured boolean not null default false,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_lands_status on lands (status);
create index if not exists idx_lands_district on lands (district);
create index if not exists idx_lands_seller on lands (seller_type, seller_slug);

-- Leads (contact form submissions) ------------------------------------------

create table if not exists leads (
  id text primary key,
  name text not null,
  email text not null,
  phone text not null,
  preferred_contact_method text not null,
  message text not null,
  project_slug text not null,
  developer_slug text not null,
  marketing_opt_in boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_leads_developer_slug on leads (developer_slug, created_at);
create index if not exists idx_leads_project_slug on leads (project_slug, created_at);

-- Project views (analytics) -------------------------------------------------

create table if not exists project_views (
  id bigint generated always as identity primary key,
  project_slug text not null,
  developer_slug text not null,
  session_id text not null,
  viewed_at timestamptz not null default now()
);

create index if not exists idx_views_developer_slug on project_views (developer_slug, viewed_at);
create index if not exists idx_views_project_slug on project_views (project_slug, viewed_at);
create index if not exists idx_views_session on project_views (project_slug, session_id, viewed_at);

-- updated_at auto-touch ------------------------------------------------------

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_projects_updated_at on projects;
create trigger trg_projects_updated_at before update on projects
  for each row execute function set_updated_at();

drop trigger if exists trg_developers_updated_at on developers;
create trigger trg_developers_updated_at before update on developers
  for each row execute function set_updated_at();

drop trigger if exists trg_neighborhoods_updated_at on neighborhoods;
create trigger trg_neighborhoods_updated_at before update on neighborhoods
  for each row execute function set_updated_at();

drop trigger if exists trg_hero_ads_updated_at on hero_ads;
create trigger trg_hero_ads_updated_at before update on hero_ads
  for each row execute function set_updated_at();

drop trigger if exists trg_construction_companies_updated_at on construction_companies;
create trigger trg_construction_companies_updated_at before update on construction_companies
  for each row execute function set_updated_at();

drop trigger if exists trg_lands_updated_at on lands;
create trigger trg_lands_updated_at before update on lands
  for each row execute function set_updated_at();

-- Auth: profiles, saved listings, developer account linking ----------------
-- profiles.role: 'buyer' | 'developer'. developer_slug is set once a
-- developer account is linked to a row in `developers` (via developers.auth_user_id).

alter table developers add column if not exists auth_user_id uuid unique references auth.users(id) on delete set null;

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'buyer',
  full_name text,
  avatar_url text,
  developer_slug text references developers(slug) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_profiles_updated_at on profiles;
create trigger trg_profiles_updated_at before update on profiles
  for each row execute function set_updated_at();

-- Auto-create a profile row whenever a new auth user is created (email,
-- Google, Facebook, or LinkedIn signup all go through auth.users the same
-- way). Role defaults to 'buyer'; the developer registration flow upgrades
-- it to 'developer' once a company profile is created.
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, avatar_url, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    new.raw_user_meta_data->>'avatar_url',
    case when new.raw_user_meta_data->>'intended_role' = 'developer' then 'developer' else 'buyer' end
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists trg_auth_user_created on auth.users;
create trigger trg_auth_user_created after insert on auth.users
  for each row execute function handle_new_user();

create table if not exists saved_listings (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  project_slug text not null references projects(slug) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, project_slug)
);

create index if not exists idx_saved_listings_user on saved_listings (user_id, created_at);

-- Row Level Security: end users only ever see/touch their own rows. Admin
-- code paths use the service_role key, which bypasses RLS entirely.

alter table profiles enable row level security;
drop policy if exists "profiles: read own" on profiles;
create policy "profiles: read own" on profiles for select using (auth.uid() = id);
drop policy if exists "profiles: update own" on profiles;
create policy "profiles: update own" on profiles for update using (auth.uid() = id);

alter table saved_listings enable row level security;
drop policy if exists "saved_listings: read own" on saved_listings;
create policy "saved_listings: read own" on saved_listings for select using (auth.uid() = user_id);
drop policy if exists "saved_listings: insert own" on saved_listings;
create policy "saved_listings: insert own" on saved_listings for insert with check (auth.uid() = user_id);
drop policy if exists "saved_listings: delete own" on saved_listings;
create policy "saved_listings: delete own" on saved_listings for delete using (auth.uid() = user_id);

-- Public listing data: readable by anyone (the site's anon key is exposed in
-- the browser for auth), but never writable except via the service_role key
-- (the store files / admin API routes), so RLS is enabled with select-only
-- policies and no insert/update/delete policies at all.

alter table projects enable row level security;
drop policy if exists "projects: public read" on projects;
create policy "projects: public read" on projects for select using (true);

alter table developers enable row level security;
drop policy if exists "developers: public read" on developers;
create policy "developers: public read" on developers for select using (true);

alter table neighborhoods enable row level security;
drop policy if exists "neighborhoods: public read" on neighborhoods;
create policy "neighborhoods: public read" on neighborhoods for select using (true);

alter table hero_ads enable row level security;
drop policy if exists "hero_ads: public read" on hero_ads;
create policy "hero_ads: public read" on hero_ads for select using (true);

alter table construction_companies enable row level security;
drop policy if exists "construction_companies: public read" on construction_companies;
create policy "construction_companies: public read" on construction_companies for select using (true);

alter table lands enable row level security;
drop policy if exists "lands: public read" on lands;
create policy "lands: public read" on lands for select using (true);

-- Leads and view analytics hold contact PII / raw analytics — RLS is
-- enabled with zero policies, so the anon/authenticated roles get no access
-- at all (not even read); only the service_role key (used by the API
-- routes and dashboard queries) can touch these.

alter table leads enable row level security;
alter table project_views enable row level security;

-- Lead status, assignment, and activity history -----------------------------
-- (supabase/migrations/20260827120000_lead_status.sql,
--  .../20260827120100_lead_assignment.sql, .../20260827120200_lead_activity.sql)

alter table leads add column if not exists status text not null default 'New'
  check (status in ('New', 'Contacted', 'Qualified', 'Closed'));
create index if not exists idx_leads_status on leads (status);

alter table leads add column if not exists assigned_to uuid references auth.users(id) on delete set null;
alter table leads add column if not exists assigned_at timestamptz;
create index if not exists idx_leads_assigned_to on leads (assigned_to);

create table if not exists lead_activity (
  id bigint generated always as identity primary key,
  lead_id text not null references leads(id) on delete cascade,
  note text not null,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists idx_lead_activity_lead_id on lead_activity (lead_id, created_at);
alter table lead_activity enable row level security;

-- Saved searches -------------------------------------------------------------
-- (supabase/migrations/20260827120300_saved_searches.sql)

create table if not exists saved_searches (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  filters jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_saved_searches_user_id on saved_searches (user_id, created_at);
drop trigger if exists trg_saved_searches_updated_at on saved_searches;
create trigger trg_saved_searches_updated_at before update on saved_searches
  for each row execute function set_updated_at();
alter table saved_searches enable row level security;

-- Developer team members -----------------------------------------------------
-- (supabase/migrations/20260827120400_developer_members.sql)

create table if not exists developer_members (
  id bigint generated always as identity primary key,
  developer_slug text not null references developers(slug) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('owner', 'sales', 'marketing', 'member')),
  created_at timestamptz not null default now(),
  unique (developer_slug, user_id)
);
create index if not exists idx_developer_members_developer_slug on developer_members (developer_slug);
create index if not exists idx_developer_members_user_id on developer_members (user_id);
alter table developer_members enable row level security;

-- Verification workflow -------------------------------------------------------
-- (supabase/migrations/20260827120500_verification_workflow.sql)
-- Indexed columns only — NOT mirrored into `data` jsonb yet, so
-- rowToProject/rowToDeveloper won't return these until the TS types and
-- projectToRow/developerToRow are updated (deliberately left for later).

alter table developers add column if not exists verification_status text not null default 'pending'
  check (verification_status in ('pending', 'approved', 'rejected', 'changes_requested'));
alter table projects add column if not exists is_verified boolean not null default false;
create index if not exists idx_developers_verification_status on developers (verification_status);

-- Admin audit log -------------------------------------------------------------
-- (supabase/migrations/20260827120600_audit_logs.sql)

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
alter table audit_logs enable row level security;

-- Extended engagement tracking ------------------------------------------------
-- (supabase/migrations/20260827120700_project_views_event_type.sql)

alter table project_views add column if not exists event_type text not null default 'view'
  check (event_type in (
    'view', 'favorite', 'lead', 'phone_click', 'email_click', 'website_click',
    'brochure_download', 'floor_plan_view', 'virtual_tour_view', 'share'
  ));
create index if not exists idx_project_views_event_type on project_views (event_type);

-- Developer subscriptions -----------------------------------------------------
-- (supabase/migrations/20260827120800_developer_subscriptions.sql)

create table if not exists developer_subscriptions (
  id bigint generated always as identity primary key,
  developer_slug text not null references developers(slug) on delete cascade,
  plan text not null check (plan in ('free', 'professional', 'premium', 'enterprise')),
  status text,
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists idx_developer_subscriptions_developer_slug on developer_subscriptions (developer_slug);
alter table developer_subscriptions enable row level security;
