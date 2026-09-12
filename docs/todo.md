# Open items / to-do

Running list of open work, checked/updated as items ship. Not a long-term
roadmap (see `docs/roadmap.md` for that) — this is near-term stuff that's
been raised but not yet done.

## Infra

- [ ] **Payload CMS cold starts.** Diagnosed 2026-09-08: warm requests are
  ~0.2–0.3s; first request after idle is 2–3s because Vercel boots the
  Payload function from scratch. Not the database, not the admin UI.
  Already done: `vercel.json` `regions: ["pdx1"]` (same AWS region as
  Supabase, us-west-2 — was `iad1`). Still to do:
  - Check **Vercel → Project → Settings → Functions → Fluid Compute** —
    turn on if off (keeps instances alive, no code change, included on
    Hobby).
  - If already on, set up a keep-warm ping: external monitor (e.g.
    UptimeRobot, free) hitting `https://www.lankanewhomes.com/payload-api/users/me`
    every 5 minutes (Hobby-plan Vercel crons can't run that often).
- [ ] **Retire the "Courtyard by Prime" seed data.** `src/data/projects.ts`
  (+ `src/data/developers.ts`) is hard-coded sample data whose images were
  deleted long ago. Still imported by `projects/[slug]/page.tsx`,
  `floor-plans/page.tsx`, `floor-plans/[floorPlanId]/page.tsx` (only for
  `generateStaticParams`), and `breadcrumb-bar.tsx` (label fallback).
  Effect: build pre-renders `/projects/courtyard-by-prime`, which 404s.
  Fix: point `generateStaticParams` at `getAllProjects()` and delete the
  seed files. Needs a yes from the user first.
- [ ] `scripts/delete-all-projects.ts` got committed as an undocumented
  wipe script — add a loud header or remove it.

## Developer-side features (priority order, medium priority)

- [x] Close the follow → notification loop (2026-09-08): weekly email to
  followers with new floor plans / price changes / construction updates,
  built on the analytics-digest cron. New table
  `project_notification_snapshots`, `src/lib/follower-digest.ts` +
  `follower-digest-email.ts`. Only actually reaches real buyers in
  production — local/preview always routes to the test inbox (same guard
  as lead alerts). See `docs/design.md` "Follow -> notification digest".
- [x] Construction-updates timeline on project pages (2026-09-08): dated
  photo + note, admin-entered on the Timeline tab (`constructionUpdates`
  field — a clean new field, not the old unused `statusHistory`). See
  `docs/design.md` "Construction updates timeline".
- [x] "Verified developer" badge (2026-09-08): cyan pill next to a
  developer's name (project/floor-plan/land heroes, builder card, profile
  header) once `Developer.verification_status` is set to `approved` in
  `/cms` — no new admin UI needed, the select field already did that. See
  `docs/design.md` "Verified badge". **Not done**: a "Verified" filter on
  `/developers` — that page has no filter UI of any kind today (bare A–Z
  directory), so adding one is a separate, larger redesign.
- [ ] Wire a payment gateway (PayHere) for placements + invoices, and for
  the Free/Featured/Premium listing packages (`docs/design.md` "Listing
  packages") — the `Subscriptions` collection's `provider`/
  `provider_subscription_id`/`provider_customer_id` fields are ready for
  this; today a subscription is activated manually by an admin, same as
  `Payments`.
- [ ] Add a "Verified" filter to `/developers` (needs the page redesigned
  with filter UI first — see note above).

## User's side (asked of the user, not us)

- [ ] Set up WhatsApp Cloud API + `lead_alert` template (app + number +
  System User token; see `docs/design.md` "Lead alerts"), then set
  `WHATSAPP_ACCESS_TOKEN` / `WHATSAPP_PHONE_NUMBER_ID` on Vercel.
- [ ] Add a `support@lankanewhomes.com` mailbox (site currently shows the
  Gmail address instead).
- [ ] Developers need to fill in Social Links → WhatsApp and Lead alerts
  on their profile.
- [ ] Native-speaker review of the Sinhala/Tamil listing copy before
  promoting the translation toggle (written by Claude for the 5 live
  projects, unreviewed).

## Listings / imports

- [x] Prime Lands houses (2026-09-09): 17 new listings from
  `https://www.primelands.lk/house/en` (2 of 19 — Cest La Vie Thalawathugoda,
  Viva La Vida Kottawa — already existed, skipped). One real unit type per
  project confirmed from its floor-plan drawing; left unpublished. Reports:
  `docs/listings/<slug>.md`, open items in `docs/listings/FOLLOW-UPS.md`
  under "Prime Lands houses".
- [ ] Prime Lands **Apartments** and **Lands** sections (same site, not
  done yet — "house only today" was the instruction for this pass).
- [ ] Prime Lands: ~90 additional unit/lot types across the 17 house
  projects exist on-site but aren't individually catalogued (only one
  confirmed type per project so far) — see FOLLOW-UPS.md for the per-project
  counts if full coverage is wanted later.
- [ ] Prime Lands houses have no prices published for 10 of the 17 and no
  Key Features/specifications section on any of them (confirmed absent on
  the source site, not missed) — ask the developer for a price list if one
  exists off-site.

## Smaller carry-overs

- [ ] Real neighborhood hero photos for Dehiwala / Kottawa /
  Bambalapitiya — currently Unsplash stand-ins (never a project's own
  render — see feedback memory `neighborhood-hero-no-listing-photos`).
- [ ] Barrington Types A/A1/B/B1 and Viva La Vida A/A1/B/B1 sq ft are
  estimates pending real developer figures (never derive/average these —
  see feedback memory `no-derived-numbers-from-estimates`).
- [ ] Missing nearby distances: Siddhalepa, Colombo South Teaching
  Hospital, Arpico Supercentre (Barrington).
- [ ] `capitol-twinpeaks` has both `business-center` and
  `business-centre` amenity images — likely a duplicate; user's call to
  delete one.
- [ ] Payload has no native year picker for Move-In Year — unresolved.
</content>
