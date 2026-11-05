-- Leads can now be for a land plot as well as a project (a land enquiry used to be saved to the buyer's Supabase row but never to the backend).
alter table payload.leads add column if not exists land_id integer references payload.lands(id) on delete set null;
create index if not exists leads_land_idx on payload.leads (land_id);
alter table payload.leads alter column project_id drop not null;
