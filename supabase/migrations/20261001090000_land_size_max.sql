-- Land size range (owner, 2026-10-01): Gangani Land Sales lists plots as e.g.
-- "10.00 p to 18.90p". landSizePerches stays the lower end; this is the upper end.
-- Payload-side column (schema "payload"); the public.lands jsonb copy gets the
-- value through the existing afterChange sync hook, so no public-table change.
alter table payload.lands add column if not exists land_size_perches_max numeric;
