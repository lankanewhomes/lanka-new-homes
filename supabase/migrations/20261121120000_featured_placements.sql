-- Paid "Featured" placements. APPLIED to the live database on 2026-11-21 (owner: "make it live").
-- Nothing in the app creates or alters these tables on its own (Payload's dev schema push is off unless PAYLOAD_DB_PUSH=true).
-- Until the tables exist the app treats them as empty, so every Featured slot renders nothing. Additive only: no drops, no deletes.

-- A package belongs to the DEVELOPER, not a project. The developer picks which of their projects fill the slots and may swap them
-- any time until end_date.
create table if not exists featured_packages (
  id text primary key,
  developer_slug text not null,
  tier text not null check (tier in ('featured', 'premium', 'elite')),
  start_date date not null,
  end_date date not null,
  slots integer not null check (slots between 1 and 6),
  project_slugs text[] not null default '{}',
  founding_partner boolean not null default false,
  note text,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint featured_packages_dates check (end_date >= start_date),
  constraint featured_packages_slots_filled check (coalesce(array_length(project_slugs, 1), 0) <= slots)
);
create index if not exists idx_featured_packages_developer on featured_packages (developer_slug);
create index if not exists idx_featured_packages_active on featured_packages (start_date, end_date);

-- One row per booked add-on (hero slide, announcement bar, Developer of the Month, new launch, city tile, sponsored article,
-- social post, reel, newsletter). The creative is an image + headline + CTA link.
-- A hero-slide booking may point at the existing hero_ads row that renders it (hero_ad_id): hero_ads is reused for the homepage hero.
create table if not exists featured_addons (
  id text primary key,
  type text not null check (type in ('hero-slide', 'announcement-bar', 'developer-of-month', 'new-launch', 'city-tile', 'sponsored-article', 'social-post', 'reel', 'newsletter')),
  developer_slug text not null,
  project_slug text,
  city text,
  start_date date not null,
  end_date date not null,
  creative_image text,
  creative_headline text,
  creative_subline text,
  creative_cta_label text,
  creative_cta_href text,
  hero_ad_id text,
  price_lkr integer,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint featured_addons_dates check (end_date >= start_date)
);
create index if not exists idx_featured_addons_type on featured_addons (type);
create index if not exists idx_featured_addons_developer on featured_addons (developer_slug);
create index if not exists idx_featured_addons_active on featured_addons (start_date, end_date);

-- Impressions, clicks and leads per placement, for the monthly developer report (the same events also go to GA4).
create table if not exists featured_events (
  id bigint generated always as identity primary key,
  at timestamptz not null default now(),
  event text not null check (event in ('impression', 'click', 'lead')),
  placement text not null,
  project_slug text,
  developer_slug text,
  path text
);
create index if not exists idx_featured_events_developer_at on featured_events (developer_slug, at);
create index if not exists idx_featured_events_placement on featured_events (placement);

-- Same updated_at trigger the other tables use (function already exists in docs/supabase-schema.sql).
drop trigger if exists trg_featured_packages_updated_at on featured_packages;
create trigger trg_featured_packages_updated_at before update on featured_packages for each row execute function set_updated_at();
drop trigger if exists trg_featured_addons_updated_at on featured_addons;
create trigger trg_featured_addons_updated_at before update on featured_addons for each row execute function set_updated_at();

-- Server-only tables (the app reads and writes them with the service-role key); no public access.
alter table featured_packages enable row level security;
alter table featured_addons enable row level security;
alter table featured_events enable row level security;
