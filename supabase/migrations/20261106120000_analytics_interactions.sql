-- 2026-11-06: compare add/remove and inquiry form field taps are logged in the analytics list (additive enum values, no data touched).
alter type payload.enum_analytics_event_type add value if not exists 'compare_add';
alter type payload.enum_analytics_event_type add value if not exists 'compare_remove';
alter type payload.enum_analytics_event_type add value if not exists 'form_field_focus';
