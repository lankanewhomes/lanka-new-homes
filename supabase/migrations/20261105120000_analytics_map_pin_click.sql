-- 2026-11-05: map pin clicks are now logged in the analytics list (additive enum value, no data touched).
alter type payload.enum_analytics_event_type add value if not exists 'map_pin_click';
