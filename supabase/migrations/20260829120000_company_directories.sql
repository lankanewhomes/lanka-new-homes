-- Partner directories linked from a project's "Connected Pages" section —
-- marketing companies, sales companies, architects, interior designers.
-- Same shape/behavior as construction_companies (added directly to the live
-- DB earlier without a tracked migration — recreated here for parity so the
-- schema is reproducible from migrations alone).

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

drop trigger if exists trg_construction_companies_updated_at on construction_companies;
create trigger trg_construction_companies_updated_at before update on construction_companies
  for each row execute function set_updated_at();

drop trigger if exists trg_marketing_companies_updated_at on marketing_companies;
create trigger trg_marketing_companies_updated_at before update on marketing_companies
  for each row execute function set_updated_at();

drop trigger if exists trg_sales_companies_updated_at on sales_companies;
create trigger trg_sales_companies_updated_at before update on sales_companies
  for each row execute function set_updated_at();

drop trigger if exists trg_architects_updated_at on architects;
create trigger trg_architects_updated_at before update on architects
  for each row execute function set_updated_at();

drop trigger if exists trg_interior_designers_updated_at on interior_designers;
create trigger trg_interior_designers_updated_at before update on interior_designers
  for each row execute function set_updated_at();

alter table construction_companies enable row level security;
drop policy if exists "construction_companies: public read" on construction_companies;
create policy "construction_companies: public read" on construction_companies for select using (true);

alter table marketing_companies enable row level security;
drop policy if exists "marketing_companies: public read" on marketing_companies;
create policy "marketing_companies: public read" on marketing_companies for select using (true);

alter table sales_companies enable row level security;
drop policy if exists "sales_companies: public read" on sales_companies;
create policy "sales_companies: public read" on sales_companies for select using (true);

alter table architects enable row level security;
drop policy if exists "architects: public read" on architects;
create policy "architects: public read" on architects for select using (true);

alter table interior_designers enable row level security;
drop policy if exists "interior_designers: public read" on interior_designers;
create policy "interior_designers: public read" on interior_designers for select using (true);
