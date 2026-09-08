-- Lead pipeline + alerts (2026-09-08).
--
-- Payload is where developers work leads (New → Contacted → Site visit →
-- Closed); this table is the buyer's copy under Account → My enquiries.
-- The status check gains 'Site visit' (kept 'Qualified' so no existing row
-- breaks), and two columns the inquiry form now sends: which floor plan the
-- buyer asked from, and whether it was a request-info or brochure request.

alter table leads drop constraint if exists leads_status_check;
alter table leads add constraint leads_status_check
  check (status in ('New', 'Contacted', 'Qualified', 'Site visit', 'Closed'));

alter table leads add column if not exists floor_plan text;
alter table leads add column if not exists source text not null default 'request_info';
