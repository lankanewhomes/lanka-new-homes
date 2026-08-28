-- Lead status — the Lead TS type already declares `status`, but no column
-- ever backed it (see docs/roadmap.md "Admin -> Developments" gap note).
-- This migration only adds the column; wiring insertLead/updates to actually
-- set it is application-layer work, not included here.

alter table leads add column if not exists status text not null default 'New'
  check (status in ('New', 'Contacted', 'Qualified', 'Closed'));

create index if not exists idx_leads_status on leads (status);
