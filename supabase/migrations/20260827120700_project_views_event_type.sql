-- Extended engagement tracking — project_views widens from page-view-only
-- to a general engagement event log.

alter table project_views add column if not exists event_type text not null default 'view'
  check (event_type in (
    'view', 'favorite', 'lead', 'phone_click', 'email_click', 'website_click',
    'brochure_download', 'floor_plan_view', 'virtual_tour_view', 'share'
  ));

create index if not exists idx_project_views_event_type on project_views (event_type);
