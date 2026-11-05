-- Leads list shows the listing and developer names (saved on the lead, so the list never falls back to "Project 86").
alter table payload.leads add column if not exists listing_name varchar;
alter table payload.leads add column if not exists developer_name varchar;
update payload.leads l set listing_name = p.name, developer_name = d.name
from payload.projects p left join payload.developers d on d.id = p.developer_id
where p.id = l.project_id;
-- Land leads (seller is a polymorphic relation) are filled by the Leads beforeChange hook; the three existing ones were set by script.
