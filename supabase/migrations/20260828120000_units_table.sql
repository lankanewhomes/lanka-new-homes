-- Units — per-unit inventory (floor, type, price, size, sale status).
-- Fully columnar (no `data` jsonb): structured tabular inventory, not
-- free-form marketing content, so every field is a real column.

create table if not exists units (
  id text primary key,
  project_slug text not null references projects(slug) on delete cascade,
  unit_number text not null,
  floor integer not null,
  apartment_type text not null,
  bedrooms integer not null default 0,
  area_sq_ft numeric not null,
  price_lkr numeric not null,
  price_usd numeric,
  status text not null default 'Available'
    check (status in ('Available', 'Reserved', 'Booked', 'Sold')),
  source_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_units_project_slug on units (project_slug, floor);
create index if not exists idx_units_status on units (project_slug, status);

drop trigger if exists trg_units_updated_at on units;
create trigger trg_units_updated_at before update on units
  for each row execute function set_updated_at();

-- RLS: public read only, matching projects/developers/neighborhoods —
-- writes go through the service_role key (unit-store.ts / admin API routes).
alter table units enable row level security;
drop policy if exists "units: public read" on units;
create policy "units: public read" on units for select using (true);
