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

"Backend" means `/dashboard` (owner, 2026-11-15: "always work in /dashboard
backend for any backend work"). Build new backend pages and changes under
`src/app/(dashboard)/dashboard/` and give `/dashboard/...` links; do not add
screens to `/cms`, the owner does not use it.

The owner's standing rules (brand colours, typography, UI, Key Features, data, social, workflow, reply style) are in `docs/owner-rules/`; read
`docs/owner-rules/README.md` first and only the files that match the task. For any SEO work start at `docs/owner-rules/seo/README.md`.

For SEO/keyword/metadata work, check `docs/seo-strategy.md` for the
keyword-to-page mapping and tactics checklist.

## Working style

Always finish the task currently in progress — including verifying it
(type-check, load the affected page) — before starting a new one, even if
the user sends additional requests while you're mid-task. Queue new
requests and work through them in order rather than context-switching
mid-fix.

Always push finished work straight to the `cloudflare-migration` branch
(owner, 2026-11-05: "I don't want to use main anymore"). Do not push to
`main`, and don't open a PR unless asked. Before pushing, run lint,
type-check and tests. GitHub CI does not run on this branch, so say so
instead of claiming a green build; deploys are Cloudflare only.

Every session (all chats and worktrees) must write its changes into the
local folder `/Volumes/MyStorage/LNH/lankanewhomes` first, commit only its
own files there, then push to `cloudflare-migration` (owner, 2026-11-15:
"always update the local folder and push it after"). Scripts that change
Supabase data are saved in that folder's `scripts/` and pushed too.

## How to reply to the owner

The owner wants every status reply as simple tables with coloured dots
(owner, 2026-11-15: "I like when you give me with the green dot... can you
also do that for the other sessions too?"). Use tables, not bulleted lists,
for status, results, steps and comparisons, with a dot at the start of the
row or in a Status column: 🟢 done / working / good, 🟡 waiting / partly
done / needs attention, 🔴 failed / blocked / not done, ⚪ not applicable /
left alone on purpose. Plain words, short cells, and say clearly what was
not done or not checked.

## Data / Supabase

This project's live data (projects, developers, neighborhoods, hero ads,
construction companies, leads, project views) lives in Supabase, not local
JSON files. Before touching any data model, read `docs/supabase-workflow.md`
and `docs/supabase-schema.sql`. Key rules: push new fields to Supabase as
part of the same change that adds them to the app; never drop a column or
delete data without asking the user first, even if it looks unused.
