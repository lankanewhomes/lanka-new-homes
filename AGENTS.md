<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Project conventions

Before making UI/design changes, check `docs/design.md` for established
visual conventions (nav patterns, badge/pill colors, listing page layout,
etc.) so new work stays consistent without re-deriving it each time. Keep
that file updated when a new convention is set.

For SEO/keyword/metadata work, check `docs/seo-strategy.md` for the
keyword-to-page mapping and tactics checklist.

## Working style

Always finish the task currently in progress — including verifying it
(type-check, load the affected page) — before starting a new one, even if
the user sends additional requests while you're mid-task. Queue new
requests and work through them in order rather than context-switching
mid-fix.

## Data / Supabase

This project's live data (projects, developers, neighborhoods, hero ads,
construction companies, leads, project views) lives in Supabase, not local
JSON files. Before touching any data model, read `docs/supabase-workflow.md`
and `docs/supabase-schema.sql`. Key rules: push new fields to Supabase as
part of the same change that adds them to the app; never drop a column or
delete data without asking the user first, even if it looks unused.
