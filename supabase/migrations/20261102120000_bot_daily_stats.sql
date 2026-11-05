-- Bot visit counts, one row per (day, bot, allowed/blocked): src/lib/bots.ts classifies a visit, middleware.ts calls increment_bot_hit()
-- without slowing the page. The day is the Sri Lanka day, the same clock as the analytics pages. Idempotent.

create table if not exists public.bot_daily_stats (
  date date not null,
  bot_name text not null,
  category text not null,
  action text not null check (action in ('allowed', 'blocked')),
  hits bigint not null default 0,
  last_path text,
  last_seen timestamptz not null default now(),
  primary key (date, bot_name, action)
);

create index if not exists bot_daily_stats_date_idx on public.bot_daily_stats (date desc);

-- Row level security with NO policy for anon / authenticated users: the public API key can neither read nor write this table.
-- Only the server (service role, which bypasses RLS) reads it, and only for a signed-in CMS admin (the /site-report/bots endpoint).
alter table public.bot_daily_stats enable row level security;

create or replace function public.increment_bot_hit(p_bot_name text, p_category text, p_action text, p_path text default null)
returns void
language sql
security definer
set search_path = public
as $$
  insert into public.bot_daily_stats as s (date, bot_name, category, action, hits, last_path, last_seen)
  values ((now() at time zone 'Asia/Colombo')::date, left(p_bot_name, 80), p_category, p_action, 1, left(p_path, 200), now())
  on conflict (date, bot_name, action)
  do update set hits = s.hits + 1, last_path = excluded.last_path, last_seen = now(), category = excluded.category;
$$;

-- Inserts go through this function with the service role only.
revoke all on function public.increment_bot_hit(text, text, text, text) from public, anon, authenticated;
grant execute on function public.increment_bot_hit(text, text, text, text) to service_role;
