-- 2026-11-07: opening a floor plan (project) or plot (land) page is logged in the analytics list. Additive enum value, nothing is deleted.
alter type payload.enum_analytics_event_type add value if not exists 'floor_plan_view';
