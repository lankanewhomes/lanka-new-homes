-- Reviews and follows for every profile page, not just developers.
--
-- Until now a review could only target a developer (`reviews.developer_slug`
-- NOT NULL) and a follow could only target a developer (`saved_developers`
-- has a foreign key to `developers`). The partner-directory profile pages
-- (marketing companies, sales companies, architects, interior designers,
-- construction companies) now render the same page as a developer, so:
--
-- 1. `reviews` gains `entity_type` + `entity_slug` (what the public pages
--    query) and `developer_slug` becomes nullable. Existing rows are all
--    developer reviews and are backfilled accordingly.
-- 2. `saved_companies` holds follows for the non-developer profile types,
--    keyed by (entity_type, entity_slug) — no FK, since the slug lives in
--    one of five different tables. Developers stay in `saved_developers`
--    (the account dashboard reads it).

alter table reviews alter column developer_slug drop not null;
alter table reviews add column if not exists entity_type text not null default 'developer';
alter table reviews add column if not exists entity_slug text;
update reviews set entity_slug = developer_slug where entity_slug is null and developer_slug is not null;
create index if not exists idx_reviews_entity on reviews (entity_type, entity_slug);

create table if not exists saved_companies (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  entity_type text not null,
  entity_slug text not null,
  created_at timestamptz not null default now(),
  unique (user_id, entity_type, entity_slug)
);
create index if not exists idx_saved_companies_user on saved_companies (user_id, created_at);

alter table saved_companies enable row level security;
drop policy if exists "saved_companies: read own" on saved_companies;
create policy "saved_companies: read own" on saved_companies for select using (auth.uid() = user_id);
drop policy if exists "saved_companies: insert own" on saved_companies;
create policy "saved_companies: insert own" on saved_companies for insert with check (auth.uid() = user_id);
drop policy if exists "saved_companies: delete own" on saved_companies;
create policy "saved_companies: delete own" on saved_companies for delete using (auth.uid() = user_id);
