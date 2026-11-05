-- Land listing events (WhatsApp, email, brochure, enquiry clicks) were dropped because the analytics log only knew projects.
-- Adds an optional land link to the Payload analytics table and lets project be empty for those rows. Idempotent. Nothing is deleted.
alter table payload.analytics add column if not exists land_id integer references payload.lands(id) on delete set null;
create index if not exists analytics_land_idx on payload.analytics (land_id);
alter table payload.analytics alter column project_id drop not null;
