-- Land listings can carry the same hero embeds as projects (owner, 2026-10-01):
-- a Google My Maps plot map ("Interactive map") and a 360° / Street View embed.
-- Payload-side columns (schema "payload"); the public.lands jsonb copy gets the
-- values through the existing afterChange sync hook.
alter table payload.lands add column if not exists interactive_map_url text;
alter table payload.lands add column if not exists view360_url text;
