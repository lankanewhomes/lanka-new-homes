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
| `leads` | contact form submissions (was `data/tracking.sqlite`) |
| `project_views` | view-count analytics (was `data/tracking.sqlite`) |
| `units` | `Unit` — per-project floor/unit inventory (fully columnar, no `data` jsonb; see `src/lib/unit-store.ts`) |

Not migrated (static reference data, no admin editing): Sri Lanka
provinces/districts/cities geo lookups.
