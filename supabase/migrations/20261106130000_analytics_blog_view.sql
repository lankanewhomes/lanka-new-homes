-- 2026-11-06: blog article views are logged in the analytics list. Adds an optional blog_slug and a blog_view event value. Idempotent, nothing is deleted.
alter table payload.analytics add column if not exists blog_slug varchar;
create index if not exists analytics_blog_slug_idx on payload.analytics (blog_slug);
alter type payload.enum_analytics_event_type add value if not exists 'blog_view';
