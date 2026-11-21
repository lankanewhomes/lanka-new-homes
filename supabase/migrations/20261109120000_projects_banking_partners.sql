-- 2026-11-09: projects get a "Banking partners" text field (own row in the Pricing section). Payload column only; the public
-- projects table keeps the full doc in its `data` jsonb, so nothing changes in public.projects. Additive, nothing is deleted.
alter table payload.projects add column if not exists banking_partners varchar;
