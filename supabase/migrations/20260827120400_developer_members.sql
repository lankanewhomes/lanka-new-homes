-- Developer team members — multiple user accounts under one developer
-- company. Profile.developer_slug (single-developer link) stays as-is for
-- backward compatibility; this table is additive.

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

-- RLS: service_role only, matching the `leads` table pattern.
alter table developer_members enable row level security;
