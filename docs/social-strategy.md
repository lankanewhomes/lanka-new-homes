# Social media strategy — Instagram, Facebook, TikTok

Source of truth for LankaNewHomes (LNH) social content. Owner brief of
2026-10-27. Where this file conflicts with older notes (`docs/social-publishing.md`,
earlier habits), **this file wins**. Listings are chosen by the owner; nothing
here picks or posts a listing.

Related: brand look in `docs/design.md`, the generator/poster in
`docs/social-publishing.md`, analytics in `docs/analytics.md`.

## 1. What already exists (reuse, don't rebuild)

| Resource | Where | Status for this strategy |
|---|---|---|
| Logo (black / white) | `public/brand/lankanewhomes-logo.png`, `lankanewhomes-logo-white.png` | Use as-is. White on dark/footage, black on light boxes |
| Typeface | Archivo (`scripts/social/assets/fonts/Archivo-VF.ttf`, site fonts) | Headlines weight 400, tight tracking |
| Colours | ink `#15141a`, paper `#f7f4ee`, line `#e2ddd0`, muted `#6b6355`, accent `#f47b36` (numbers/buttons only) | No new colours, no gradients, no orange bar/eyebrow labels |
| Reel/card renderer | `scripts/social/render_social.py`, `npm run social:generate` | **Does not meet the Reel rules yet** (see §12) |
| Post log | `social-posts` / `social-assets` collections, `/dashboard/social` | Log every published post; mark deleted with `removedAt` |
| Instagram bio pages | `/links`, `/links/projects`, `/links/land` | Already carry `utm_source=instagram&utm_medium=social&utm_campaign=bio-links` |
| UTM capture | `src/components/analytics/utm-capture.tsx` | First-touch UTMs persist for the session; GA4 reads them from the URL |
| Listing videos | `videos` array on Projects (`embedUrl`) and Lands (`url`) | YouTube/Vimeo links or R2 files; check per listing, many have none |
| Media | R2 `media.lankanewhomes.com`, fixed per-listing layout | Only authorised listing media |
| Listing URLs | `/projects/<slug>`, `/land/<slug>` | Take the slug from the CMS, never guess |

Not verified / not present: TikTok posting integration (collection lists
`tiktok`, no credentials), per-platform analytics APIs, Story link stickers
(manual only, Meta API cannot publish Stories), licensed music.

## 2. Positioning

Marketplace for new developments and developer-listed land in Sri Lanka
(developers/builders, not agent resales). Tone: professional, clear,
trustworthy, premium. No promises about returns, appreciation, rent,
availability, prices, legal ownership or completion. Unconfirmed = omit.
Existing owner rules still apply: no developer names in captions/content, no
flag emoji, real numbers only, brand written "LankaNewHomes".

Audiences: Sri Lankan buyers; local and overseas investors; diaspora (Canada,
UK, Australia, US, Europe, Middle East); people researching developments or land.

## 3. Objectives

Priority order: qualified website traffic → listing-page visits → followers →
brand trust → saves/shares/comments → developer contact clicks → a scalable
system. Each item has **one primary objective** (traffic, growth, engagement or
education). Do not chase views that never reach the site.

## 4. Content mix (starting targets, review monthly)

| Category | Share | Examples |
|---|---:|---|
| Property and development showcases | 45% | apartments, condos, houses, villas |
| Land showcases | 25% | developer-listed land, plot facts |
| Buyer education | 20% | questions to ask, specs, terminology |
| Neighbourhood and lifestyle | 5% | area tied to a listing, verified access |
| LNH brand and platform | 5% | how to search, new listings, real features |

Excluded entirely: construction progress, milestones, before/after, under-construction
vs completed comparisons. An under-construction project is shown as an ordinary
listing with verified facts only.

Series: New Developments in Sri Lanka · Sri Lanka Property Discovery · Land
Opportunities · Know Before You Buy · Explore Sri Lanka's Neighbourhoods · New on LNH.

## 5. Reels (TikTok, Instagram, Facebook) — mandatory spec

| Rule | Requirement |
|---|---|
| Length | 15–20 s, 9:16, 1080×1920 |
| Logo | Official logo **top-left**, same size/position every time, inside platform safe area, white or black variant for contrast |
| URL | Burned into the video at the bottom, last 3–5 s |
| URL value | Listing Reel → full exact listing URL. Education, neighbourhood, brand, other → `lankanewhomes.com` |
| Media | Real listing video first; real photos when no video; mix when better. Never generic or AI architecture |
| Banned | Floor plans, construction progress, invented details |
| CTA | One primary CTA, in the closing section |

Structure:

| Seconds | Content |
|---|---|
| 0–3 | Hook: strongest real visual + short headline |
| 3–10 | Showcase: media is the focus, 2–3 verified points |
| 10–16 | Name, location, most useful verified fact (price only if developer-published) |
| 16–20 | Closing screen: URL at bottom + CTA, same layout on every Reel |

Photo-only Reels use subtle motion and are not presented as video. Closing
URL stays in the bottom area clear of platform buttons/captions.

## 6. Platforms

| | Instagram | Facebook | TikTok |
|---|---|---|---|
| Reels | 4/week, primary discovery | 4–5/week, same file, own caption | 5–7/week, hook-first, readable captions |
| Feed | 2 carousels/week (verified details, location, education; floor plans allowed here if authorised and appropriate) | 2 **direct listing link posts**/week: caption + automatic link preview | — |
| Stories | most days: new listings, polls, questions, manual link sticker to the exact listing | not needed | — |
| Not allowed | — | **No photo posts, albums or designed image posts** | — |

Adapt captions per platform; don't paste the same export/caption everywhere.
Quotas are targets: skip rather than publish weak or repeated content.

## 7. Captions, CTAs, hashtags

Caption order: what it is → one or two verified facts with the location →
reason to visit LNH → one CTA → URL (Facebook and TikTok description; on
Instagram the URL is non-clickable, so the video and Stories carry the link).
Sign-off: "Listed on lankanewhomes.com".

| Objective | CTA examples |
|---|---|
| Traffic | Explore the full project on LankaNewHomes.com · See the complete listing on LNH · Discover more land listings on LankaNewHomes.com |
| Growth | Follow LNH for more new developments in Sri Lanka · Follow to discover more developer-listed land |
| Engagement | Save this for your property search · Share this with someone exploring property in Sri Lanka · What would you want to know before buying? |

Hashtags: 3–6, relevant (`#LankaNewHomes`, `#SriLankaProperty`, location, type).
Natural keywords in titles/descriptions, no stuffing, no unverified features.
No keyword claims of investment returns.

## 8. UTM convention

Add to listing links in captions, Story stickers and Facebook link posts (not
to the text burned into videos, which stays the clean URL):

`?utm_source=<instagram|facebook|tiktok>&utm_medium=social&utm_campaign=<series-or-slug>-<yyyymm>`

Check each tracked URL loads before posting. Whether GA4 events and developer
contact clicks arrive per source is not verified: confirm in GA4 before
quoting social results (see `docs/analytics.md`).

## 9. Publishing and approval workflow

| Step | Who | Output |
|---|---|---|
| 1. Owner names listing/land | Owner | Listing slug |
| 2. Inventory row filled (§10) | Claude | Verified facts, URL, media, gaps |
| 3. Build Reel/carousel/link post | Claude | Files in R2 + private preview on phone |
| 4. QC checklist (§11) | Claude | Pass/fail list |
| 5. Owner approves | Owner | "approved" |
| 6. Post (Toronto/Eastern times) | Claude via Meta/CDP, TikTok manual | Live post |
| 7. Log | Claude | `social-posts` row with permalink |
| 8. Review at 48 h and 7 d | Claude | Row in the report (§13) |

"Create/prepare" never means publish. Nothing is posted without approval.

## 10. Listing and media inventory (template)

One row per candidate listing. Owner picks listings; leave the rest empty.

| Field | Value |
|---|---|
| Listing / category (project, house, villa, land) | |
| Location | |
| Verified URL (`/projects/…` or `/land/…`) | |
| Photos available (count, R2 path) | |
| Video available (source, rights) | |
| Verified facts usable | |
| Media restrictions | |
| Reel-ready (video / photos / not yet) | |
| Platforms | |
| Hook / CTA | |
| Missing / next best option | |

## 11. Quality-control checklist

Never post a sold-out listing (owner rule, 2026-10-30). Check the project's status before choosing it, on every platform and format.

Reel:
- [ ] 15–20 s, 9:16
- [ ] Logo top-left, consistent
- [ ] URL burned in at the bottom for the final 3–5 s, correct value, loads
- [ ] One CTA, readable on mobile, clear of platform UI
- [ ] Authorised real media, no floor plans, no construction progress
- [ ] Every claim verified from the listing; no invented prices/dates/availability
- [ ] Music licence suitable for business use (or none)

Instagram carousel/Story: design system followed · facts verified · CTA and
destination right · Story link sticker added to the exact listing.

Facebook link post: exact listing URL · accurate caption · automatic preview ·
no photo post/album/designed image.

All: listing is not sold out · positioning fits · permissions confirmed · single objective · no developer name.

## 12. Gaps to close before the first Reel

| Gap | Action |
|---|---|
| Renderer makes ~30 s Reels with a floor-plan blueprint scene, "NEW HOMES IN SRI LANKA" end card, no top-left logo, no per-listing URL on the end card | Add a 15–20 s "brief mode": no blueprint/hologram scenes, logo top-left, closing screen with exact URL. Not built yet |
| Real listing video not used by the renderer | Add clips from the listing `videos` field when a downloadable file exists (YouTube/Vimeo need the owner's source file) |
| Facebook posting code supports carousel/reel and past practice included photo posts | Use Reels and link posts only |
| TikTok has no integration | Export the same Reel and upload by hand, log it |
| Earlier rule "logo bottom-right" on social | Replaced for Reels by top-left |

## 13. Calendar template (weekly)

| Date (Toronto) | Platform | Category | Audience | Listing/topic | Media + path | Hook / headline | Caption | CTA | URL | Hashtags | Status | Published URL | Results |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|

Status: planned → in production → ready for review → approved → published.

Suggested week, to be filled once listings are named: Mon property Reel ·
Tue land Reel + IG carousel + FB link post · Wed education Reel · Thu property
Reel · Fri land or neighbourhood Reel + FB link post · Sat property Reel + IG
carousel · Sun review. Stories most days.

## 14. Community management

- Reply within a day; answer only from the listing (price, location, status as published). Anything else: "Please see the listing at <URL>" or ask the developer.
- No legal, tax, financing or investment advice; suggest an attorney-at-law.
- Note repeated questions → Know Before You Buy topics.
- DMs about a listing: send its exact URL. Instagram DMs are already synced to the developer's contact log.

## 15. Monthly report (template)

| Section | Content |
|---|---|
| Published | counts by platform and format |
| Top content | top 5 by reach, saves/shares, link clicks |
| Video | views, avg watch time, completion |
| Audience | follower change per platform |
| Website | social sessions by `utm_source`, listing views, developer contact clicks, leads |
| Categories | which category performed best |
| Changes next month | 3–5 decisions |

Report only figures that were actually read from a platform or GA4.

## 16. 30-day launch plan

| Week | Focus |
|---|---|
| 1 | Owner names first listings; build brief-mode Reel renderer; fill inventory; make 2 Reels, 1 carousel, 1 link post; QC |
| 2 | Post per cadence; log each post; record baselines (followers, reach, site sessions from social) |
| 3 | Add land Reels and education; try two hook styles on comparable listings |
| 4 | First 30-day review, report, drop what underperforms |

## 17. 60–90 day improvements

- Set numeric targets only after the 30-day baseline.
- A/B hooks, opening visuals, pacing, caption CTAs, listing vs education.
- Turn top-saved topics into a recurring series; repurpose across platforms.
- Raise cadence only when real media supports it.
- Add TikTok analytics reading and GA4 social breakdown to the monthly report once verified.
