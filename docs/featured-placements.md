# Featured placements (paid) — branch `feature/featured-placements`

PREVIEW ONLY until launch. Nothing here is live, nothing in the database has been changed.

## What it is
A paid package belongs to the **developer** (tier, start, end, number of project slots). The developer picks which of their projects fill the slots and may swap them until the end date. Add-ons (hero slide, announcement bar, Developer of the Month, new launch, city tile, sponsored article, social post, reel, newsletter) are separate bookings with a creative (image, headline, CTA link).

## Where things live
| Thing | File |
|---|---|
| All prices, tier perks, discounts, contact details (edit here) | `src/lib/featured/config.ts` |
| Selection rules (tier order, fair rotation, same place/type, max 3 pinned, competitor-free) + tests | `src/lib/featured/engine.ts`, `engine.test.ts` |
| Reading packages/bookings (demo or database) | `src/lib/featured/store.ts` |
| **DEMO flag + demo data** (remove before launch) | `src/lib/featured/demo.ts` (`FEATURED_DEMO`) |
| The slot component `<FeaturedSlot placement="…" context={…} />` | `src/components/featured/featured-slot.tsx` |
| Featured card, GA4 tracking (`featured_impression`, `featured_click`) | `featured-card.tsx`, `featured-track.tsx` |
| Hero slides (max 3; reuses `hero_ads` outside the demo) | `src/lib/featured/hero.ts` |
| Dashboard (assign package, pick projects, add-ons, creative upload, report) | `/dashboard/featured`, `/dashboard/featured/addons`, `/dashboard/featured/report` |
| Pricing page (noindex, not in the nav) | `/advertise` |
| Migration (WRITTEN, NOT RUN) | `supabase/migrations/20261121120000_featured_placements.sql` |

## Placements wired in
Homepage: hero (3), Featured Projects carousel, New Launches, Developer of the Month, logo bar, city tiles. Results pages (every `ProjectListingShell` page): pinned top 3, sponsored card after every 6th result, premium map pin, banner, "no results" fallback. Project pages: Similar and Nearby. Thank-you page `/thank-you?project=<slug>` and the enquiry/brochure dialog. `/developers`, `/construction-companies`, `/land`. Guides: cards inside and at the end, `/guides/developer-spotlight/<developer>` article template. Site-wide: announcement bar, Projects menu card, search autocomplete, "Recommended for you" on `/account/saved`.

## Before launch
1. Set `FEATURED_DEMO = false` in `src/lib/featured/demo.ts` (this also lifts the site-wide noindex: header, robots.txt, meta tag).
2. Review and run the migration by hand. Until then every slot renders nothing.
3. Book real packages in `/dashboard/featured`.
4. Decide whether `/advertise` should be indexed and linked.

## Rules implemented
Only projects matching the page's place/type; order elite → premium → featured, fair rotation inside a tier (hourly); max 3 pinned per page; organic order untouched; "Featured" label on project cards, "Sponsored" on banners/articles; empty slot renders nothing; server-rendered with fixed sizes.

## Switches (LIVE since 2026-11-21, owner: "make it live")

The migration is applied and real paid placements are ON by default (`src/lib/featured/demo.ts`). A slot with no booking renders
nothing, and the homepage hero is unchanged until a hero slide or Elite package is booked.

| Variable (build time) | Effect |
|---|---|
| none (live today) | Featured ON: slots read `featured_packages` / `featured_addons`, events go to `featured_events`, dashboard menu item shown. `/advertise` is 404 (preview only). |
| `NEXT_PUBLIC_FEATURED_ENABLED=0` | Kill switch: every slot off again, no reads of the `featured_*` tables. |
| `NEXT_PUBLIC_ADVERTISE_PUBLIC=1` | Publishes the `/advertise` pricing page (owner, 2026-11-21: keep it preview-only for now). |
| `NEXT_PUBLIC_FEATURED_DEMO=1` | Preview only: demo data in every slot, whole site noindex, saving disabled, `/advertise` visible. Build with this, then `wrangler versions upload --preview-alias featured-placements`. Never set it on the live build. |

First live package: Maison Ceylon, Elite (upgraded from Premium on 2026-11-22), all 4 projects, free test 2026-11-21 to 2026-12-21 (`scripts/featured-assign-maison-ceylon.ts`).
Results: `/dashboard/featured/report`.

The header mega menu shows at most 2 paid Featured project tiles (orange Featured badge), then tops up with the normal tiles.

## /advertise layout (redesign 2026-11-22)

Dark split hero, then contained boxes in this order: packages (months switch 1/3/6/12 and a Founding Partner tick box that re-price the
three cards; `src/components/featured/advertise-packages.tsx`), compare table "Where your project appears" (built from
`PLACEMENT_MIN_TIER`), add-ons as two price lists ("On the site", "Content and social"), pay per lead, three numbered steps, FAQ, dark
closing contact box. All numbers still come from `src/lib/featured/config.ts`. Styles: `.adv-*` in `featured.css`.

## Featured cards in the phone search pop-up (2026-11-26)

Placement `search-autocomplete` (Premium and Elite, unchanged tier). `/api/search/suggest` now also returns `featured`: up to 4 paid
projects whose name, place, type or developer matches what was typed, best tier first with the usual fair rotation. On phones the
search pop-up (header search icon: `mobile-search-overlay.tsx`; home hero: `home-client.tsx`) shows them as one swipeable row of photo
cards above the suggestions (`SearchFeaturedStrip` in `src/components/featured/search-featured.tsx`, styles `.fp-search*`): cream box,
heading "Featured projects", photo, orange Featured badge, name, place. One match fills the width. Nothing typed or no match: no box.
The plain "Sponsored" row is dropped from the phone list when cards show; desktop keeps the single Sponsored row. Each card counts one
view (half on screen) and its clicks under `search-autocomplete`; the phone pop-up did not count either before this date.

## Website link add-on (2026-11-26)

Owner: a developer who wants their own website on the Featured search cards pays extra, as an add-on. Add-on type `website-link`
("Website link in search", Rs 10,000 per month in `config.ts`: Claude's suggested price, owner to confirm). Booked by an admin in
`/dashboard/featured/addons`: developer, dates, the website (https://…) in the CTA link box; Project on (none) covers all the
developer's Featured projects, a chosen project covers that one only (`websiteLinkFor` in `engine.ts`, tested). The card then shows a
thin "Visit <domain>" row under the photo (new tab, `rel="sponsored noopener"`); it only appears on cards the developer already has
through a Premium or Elite package. A tap counts as a click of `search-autocomplete` plus the GA4 event `featured_website_click`.
Database: `featured_addons.type` accepts `website-link` (migration `20261126120000_featured_addons_website_link.sql`, applied
2026-11-26; `scripts/featured-addons-type-check.ts` reads the rule back). Phone search cards only; the desktop row has no website link.

## Internal traffic is not counted (2026-11-22)

Featured views, clicks and leads from the owner's own devices are never recorded: `featured-track.tsx` skips the beacon when
`isInternalBrowser()` is true, and `/api/featured/track` checks `isInternalRequest()` again on the server (opt-out cookie
`lnh_internal=1`, CMS login cookie, `INTERNAL_IPS`, bots). GA4 `featured_*` events were already skipped by `trackEvent`. Rows recorded
before this date may include internal visits; they cannot be told apart afterwards.
