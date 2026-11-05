-- Monthly search volume per keyword (Sri Lanka), pulled from Ubersuggest and shown as a column on the dashboard's Keywords page.
-- Filled by a refresh run from Claude Code (the live site cannot call Ubersuggest itself). Idempotent.

create table if not exists public.keyword_volumes (
  keyword text primary key,
  monthly_searches integer,
  cpc numeric,
  seo_difficulty integer,
  search_intent text,
  source text not null default 'Ubersuggest',
  location text not null default 'Sri Lanka',
  checked_at timestamptz not null default now()
);

-- Row level security with NO policy: only the server (service role) reads or writes it, and only for a signed-in CMS admin.
alter table public.keyword_volumes enable row level security;
