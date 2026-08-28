-- Developer subscriptions — billing plan per developer company.

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

-- RLS: service_role only, matching the `leads` table pattern.
alter table developer_subscriptions enable row level security;
