# Supabase — data workflow rules

This project's data (projects, developers, neighborhoods, hero ads,
construction companies, leads, project views) lives in Supabase. Follow
these rules whenever the data model changes.

## Standing rules

1. **Adding a field**: whenever a new field is added to any data model
   (e.g. a new `Project` or `Developer` property), push the matching
   column/schema change to Supabase as part of that same change — don't
   leave the app-level type ahead of the database. Update `schema.sql` in
   this repo to reflect the new column so the file stays the source of
   truth for the live schema.
2. **Deleting a field or dropping data**: never drop a column, delete rows,
   or otherwise remove data from Supabase without asking the user first and
   getting explicit confirmation. This applies even if a field looks
   unused — ask before removing it from the schema.
3. Keep `docs/supabase-schema.sql` (or the most recent schema file) in sync
   with the actual live schema — treat schema drift as a bug.

## Connection

- Credentials live in `.env.local` (git-ignored, never commit):
  `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`.
- The service_role key is used **server-side only** (API routes, store
  files) — it must never be sent to the browser or referenced from a
  client component.
- Client setup: `src/lib/supabase.ts`.

## Tables

See `docs/supabase-schema.sql` for the full schema. Summary:

| Table | Maps to |
|---|---|
| `projects` | `src/types/index.ts` `Project` |
| `developers` | `Developer` |
| `neighborhoods` | `Neighborhood` |
| `hero_ads` | `HeroAd` |
| `construction_companies` | `ConstructionCompany` |
| `marketing_companies` | `MarketingCompany` — linked from a project's Connected Pages |
| `sales_companies` | `SalesCompany` — linked from a project's Connected Pages |
| `architects` | `Architect` — linked from a project's Connected Pages |
| `interior_designers` | `InteriorDesigner` — linked from a project's Connected Pages |
| `lands` | `Land` — land parcels for sale, separate from `projects` (see `src/lib/land-store.ts`) |
| `leads` | contact form submissions (was `data/tracking.sqlite`) |
| `project_views` | view-count analytics (was `data/tracking.sqlite`) |

Not migrated (static reference data, no admin editing): Sri Lanka
provinces/districts/cities geo lookups.

## Payload CMS (new, additive backend layer)

A second backend, Payload CMS, was added on top of this same Supabase
Postgres database — **not** a replacement for the tables above. Payload's
tables live in a dedicated `payload` Postgres schema (via `schemaName:
'payload'` in `payload.config.ts`), fully isolated from the `public` schema
tables/RLS policies/triggers documented in this file, which are untouched
and still power the existing site.

- Config: `payload.config.ts` (repo root). Collections:
  `src/collections/*.ts`.
- Admin panel: `/cms`. REST/GraphQL API: `/payload-api/*` —
  deliberately not `/admin` or `/api`, since the existing app already owns
  those paths (`src/app/(frontend)/admin`, `src/app/(frontend)/api/*`).
- Auth is Payload's own (`users` collection, email/password + a custom
  magic-link flow) — entirely separate from Supabase Auth
  (`auth.users`/`profiles`), which still powers the existing
  login/signup/`middleware.ts` flow.
- One-time data copy from the tables above into Payload's collections:
  `scripts/migrate-to-payload.ts` (`npx tsx scripts/migrate-to-payload.ts`,
  safe to re-run). Not copied: Users/accounts (password hashes aren't
  portable), Hero Slides (shape doesn't map cleanly from `hero_ads`), Saved
  Listings (needs a Payload user per buyer).
- The existing frontend (`src/app/(frontend)/**`) has not been wired to
  Payload's API — it still reads/writes the tables above exactly as before.
  Moving the frontend onto Payload is a separate, future step.
