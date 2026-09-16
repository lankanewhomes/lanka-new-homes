# Groundworth Group batch (7 lands + 1 villa)

- **Source:** https://groundworthgroup.com — Lands index `/lands/`, Villas index `/villas/`
- **Developer record:** `groundworth-group` (verification_status: approved)
- **Award (on developer profile):** Asia Property Awards (Sri Lanka) 2025 — Special Recognition for Land Investments

Of 18 total land listings on the site, only 7 were "Available" (rest "Sold")
as of 2026-09-15 — those 7 were imported. Of 2 villas, only "Lake Road,
Battaramulla" was "For Sale" (the other, Homes at St. Katherine Gardens
Thalawathugoda, was "Sold") — that one villa was imported as a Project.

## Source-site quirks found (not our scraping)

1. **`/villas/` links 404.** The villas index page links to
   `/villas/<slug>/`, which 404s. The real pages live under
   `/land/<slug>/` — same URL structure as the land listings. Confirmed via
   direct navigation + HTTP status codes.
2. **Cross-listing content bleed.** Urban One's page serves Antara's gallery
   photos and Antara's brochure PDF; The Highway's page also serves
   Antara's brochure PDF and an Antara road-map image. Excluded all of
   these — only images/brochures whose filenames genuinely matched a
   listing's own name were imported. Worth re-checking if Groundworth fixes
   this later.
3. No listing had a real photo/video split into a "Portrait Views" /
   "Landscape Views" toggle in a way that changed which images existed —
   only The Highway showed that specific tab UI on its own page, and both
   tabs' images were already present in the page's DOM (no separate
   fetch needed); all of them were imported into one gallery.
4. Groundworth's site models per-perch subdivisions (e.g. "17 plots from
   6 perches") without publishing individual plot numbers/sizes/prices —
   unlike Prime Lands' interactive plot maps. No `plots` array entries were
   invented; `landSizePerches` uses the real published "starting from" size
   and `pricePerPerchLkrMin` the real per-perch price, `priceLkr: 0` (same
   placeholder convention already used for Nuwara Eliya's multi-plot
   Prime Lands releases).

## Schema change

Added `brochureUrl` to `Lands.ts` (text field, same as Projects). The
frontend (`Land` type, `landToProjectShape()`, `ProjectHero`'s Brochure
pill/download flow) already expected this field — only the Payload
collection was missing it, so 4 of 7 lands' real brochures are now usable
where they weren't storable before.

## Lands imported (all `status: Available`)

| Slug | Location | Price/perch (LKR) | Size from | Gallery photos | Brochure |
|---|---|---|---|---|---|
| urban-one | Malabe | 1,850,000 | 6 perches | 1 | — (bled Antara excluded) |
| antara | Thalawathugoda | 3,300,000 | 6.5 perches | 6 | ✅ |
| the-highway | Kottawa | 2,100,000 | 6.15 perches | 13 | — (bled Antara excluded) |
| isla-hokandara | Hokandara | 1,800,000 | 6 perches | 12 | ✅ |
| the-infinity-polgasowita | Kahathuduwa | 1,200,000 | 6.35 perches | 10 | ✅ |
| legado-homagama | Homagama | 1,200,000 | 10 perches | 10 (1 fetch failure*) | — (none published) |
| the-regal-ratmalana | Ratmalana | 2,975,000 | 6 perches | 10 | ✅ |

\* `legado-homagama`'s "New-Project.png" source image failed to fetch
during mirroring (`fetch failed`) — 10 of 11 intended images mirrored
successfully; not re-attempted since it's a generic promotional graphic,
not a unique property photo.

Coordinates for all 7 resolved from each listing's own "Get Direction"
Google Maps link (high confidence — developer's own pin, not a search
guess). `streetViewAvailable` left at its default (true) — not
individually re-checked for this batch; there's no automated way to check
this (no Google Maps Platform API key configured — a prior, explicit
decision), only manual per-listing verification.

## Villa imported

- **Slug:** `lake-road-battaramulla` · **Type:** Project (single-unit villa, not Land) · **Published:** no (draft, pending review)
- **Price:** LKR 120,000,000 · 4 bed / 3 bath / 3,307 sq ft / 10-perch plot / 2 garage spaces
- **Status:** Under Construction · Completion: August 2026 (per source)
- **Gallery:** 41 photos mirrored to R2 (all real photos from the page — no floor-plan drawing was published separately, so nothing was invented for a "Planning" tab)
- **Brochure:** mirrored (`Lake-Road-Brochure-Completed-Project_compressed.pdf`)
- Modeled as a Project (not Land) matching the existing convention for single/multi-unit house developments (e.g. Prime Lands' house-type projects) rather than a raw parcel.

## Developer profile

- **Social links (real, confirmed):** Facebook, Instagram, YouTube, LinkedIn, TikTok
- **Contact:** sales@groundworthgroup.com / +94 77 745 0050 (lands); a second contact set (builders@groundworthgroup.com / +94 77 706 9906) appeared in the villa page footer but wasn't used since the lands contact is the one repeated site-wide
- **Address:** 1112/3A, Level 03, Hasthanayake Building, Pannipitiya Road, Thalangama, Battaramulla, Sri Lanka
- **Logo:** mirrored to R2 (`logos/developers/groundworth-group-logo.png`)
- **Description:** drawn from the site's own About page copy (mission/vetting process/founders), plus the Asia Property Awards line

_Generated 2026-09-15 from the live Payload records._
