-- Saved searches — a buyer's saved filter set (distinct from saved_listings,
-- which is a saved *project*, not a search).

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

-- RLS: service_role only, matching the `leads` table pattern per this
-- migration's spec (note: this means a signed-in user can't read/write their
-- own saved searches directly via the anon key the way saved_listings works
-- — that would need an API route using the service_role key instead).
alter table saved_searches enable row level security;
