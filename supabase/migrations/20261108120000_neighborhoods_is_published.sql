-- 2026-11-08: neighbourhood pages can be kept as drafts (hidden from the live site, viewable at /neighborhood-preview/<slug>).
-- Payload column for the new checkbox. Every existing page is set to published so nothing disappears when it is next edited.
-- The public site reads neighborhoods.data (jsonb) in the public schema, where a missing isPublished counts as published, so no public column is needed.
alter table payload.neighborhoods add column if not exists is_published boolean default true;
update payload.neighborhoods set is_published = true where is_published is null;
