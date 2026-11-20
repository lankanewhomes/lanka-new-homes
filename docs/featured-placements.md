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
