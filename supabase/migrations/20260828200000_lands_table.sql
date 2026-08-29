-- Lands — raw land parcels for sale, sold by developers, construction
-- companies, or independent builders. Separate inventory type from
-- projects (new-construction developments) — see src/types/index.ts `Land`.

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

drop trigger if exists trg_lands_updated_at on lands;
create trigger trg_lands_updated_at before update on lands
  for each row execute function set_updated_at();

alter table lands enable row level security;
drop policy if exists "lands: public read" on lands;
create policy "lands: public read" on lands for select using (true);
