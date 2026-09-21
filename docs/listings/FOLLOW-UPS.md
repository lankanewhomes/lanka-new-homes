# Listings — things to come back and check

Open questions and gaps per listing, from the 2026-09-08/09 import batch.
Tick items off (or delete them) as they're confirmed. Per-listing detail is
in the sibling `<slug>.md` files.

## All 8 listings
- [ ] **No unit prices published by either developer** — every plan shows "Contact for pricing". Ask Home Lands / Rush Lanka for price lists, then fill `startingPriceLkr` per plan (and the project's starting price).
- [ ] Both developers' `verification_status` is still **pending** — approve in `/cms` once vetted (turns on the "Verified" badge).
- [ ] Nothing has been sent to the developers for sign-off yet — send each the `/projects/<slug>` link and ask them to confirm facts.

## Oceana Wadduwa (`oceana-wadduwa`)
- [ ] **Villa bathroom counts are assumed** (1BR villa 1 · 2BR 2 · 3BR 3 · Mansion 3) — not on the site; confirm with Home Lands.
- [ ] Total number of units/villas is not published — `units` left blank.
- [ ] Construction status / move-in year not published — left blank (site only says villas 18 months, apartments 24 months to handover on the payment plan).
- [ ] Two of the four villa types are marked **sold** on their villas page, but not *which* two — all four left "Available".
- [ ] Contact email `info@oceana.lk` and socials were supplied by the owner, not scraped — the site masks the address.
- [ ] Home Lands' Instagram link on oceana.lk is generic (no handle) — not added.

## Rush City — South City Tower (`rush-city-dematagoda`)
- [x] ~~Hero stat "28 Residential Apartments" vs 109 units~~ — settled 2026-09-20: the page's per-floor tracker rows sum to exactly 109 (A 25 + B 27 + C 27 + D 27 + 3 first-floor units), matching the brochure; "28" is the residential floor count.
- [ ] Expected handover **2030** (page says 2030-05-25) — the "Move in 2030" badge is on; confirm.
- [ ] **Phase 2 (North City Tower)** has no brochure/unit data yet — add a second listing (or extend this one) when it launches.
- [x] ~~6 extra gallery images returned 403~~ — all 31 site photos mirrored to R2 on 2026-09-20 (9 exterior, 10 interior, 12 common-area).
- [x] ~~Only Units A–D imported~~ — 1st-floor Aqua Crest / South Crest / Urban Crest added 2026-09-20 with 2D + 3D plans.
- [ ] No construction tracker on the page yet — add `constructionUpdates` once Rush publishes milestones.
- [ ] **Lifestyle brochure** is mirrored to R2 (`brochure/rush-city-dematagoda_lifestyle-brochure.pdf`) but not linked — a project has one `brochureUrl` slot, holding the South City Tower brochure. Decide whether to add a second brochure field.
- [ ] Units A, C, D show **"Powder room: 1"**, which is really the maid's toilet on the drawings (the maid's room is already recorded) — clear it? (left as-is pending owner's call).
- [x] ~~Clubhouse / Security had no source~~ — Rush's 18 Aug 2026 blog lists "a clubhouse" and a key-card access system, and the Echelon interview mentions 24/7 smart security, CCTV and gated access, so both stay.
- [ ] The storefront render at the tower entrance (gallery "Entrance") looks like the **Mini Mart** but no brochure caption says so, so it is not tagged as the Mini Mart amenity photo.
- [ ] No **Dematagoda neighborhood page** exists (neighborhoods: no `dematagoda`) — the listing has no neighborhood link.
- [ ] No unit prices or payment plan published anywhere — pricing block shows "Contact us for current pricing and availability."
- [ ] Rush's own JSON-LD geo for this project (6.8794, 79.8653) is wrong; our pin (6.9315162, 79.8808925) matches their Google Maps link — no change needed, just don't "fix" ours from their JSON-LD.

## Rush Court 5 (`rush-court-5-colombo-14`)
- [ ] Tracker shows **Unit A sold out** (all 7 floors) and only floors 1–2 left for B/C — confirm; if the tower is nearly sold, switch project status to "Nearly Sold Out".
- [ ] Only 2 nearby places on the page (Baseline Road, Pettah) — brochure has no location page; ask for more.

## Rush Metropolis (`rush-metropolis-dehiwala`)
- [ ] **Answered 2026-09-20: it is sold out.** Rush's own news (16 Sep 2025) says all 125 apartments are sold, with completion still scheduled for 2028; their site also marks it as not open for visits. Our listing still says "Now Selling" — switch the status to Sold Out? (details: `rush-lanka-group-site-review-2026-09-20.md`)
- [ ] Page sqft (e.g. Unit A 1310) differs slightly from brochure (1312) — page figures used; confirm which is current.

## Rush Residencies, Allen (`rush-residencies-allen-dehiwala`)
- [ ] Only floor 14 of Unit A shows available — confirm the rest really are sold this early (handover 2029).
- [ ] Construction: only "site clearing (2026)" so far — check back for new milestones/photos.

## Rush Tower 2 (`rush-tower-2-dehiwala`)
- [ ] Expected handover **2026** with MEP work in progress — status may flip to "Nearly Complete"/"Completed" soon; check and update.
- [ ] Only Unit A floor 1 shows available — confirm.

## Street Rush Residencies (`street-rush-residencies-mount-lavinia`)
- [ ] Unit E (4-bed) tracker lists a single floor (10) — confirm it's a one-off penthouse-type unit.
- [ ] Construction at foundation stage (Apr 2025 last dated milestone) — check back for updates.

## Maimoona Residencies (`maimoona-residencies-dehiwala`)
- [ ] **No brochure** and milestone photos missing on the page — ask Rush for the brochure and progress photos; add to `constructionUpdates` when available.
- [ ] Tracker shows every floor sold (placeholder?) — confirm.
- [ ] Only 7 photos on the page (no exterior render except the thumbnail) — ask for a hero render.

## Prime Lands houses (17 new listings, 2026-09-09)
- [x] ~~Every project has more unit/lot types on-site than were individually confirmed~~ — **done**: went back through all 17 and read every type's own drawing (104 total). Remaining gaps are only where the developer itself never published a drawing: Prime Urban Art types B/C/D/E/SS-A/SS-D, Waterfall Residencies types A/B, and Scottish Island types B/C (drawings exist but no legible sqft printed on either floor).
- [x] ~~No "Key Features" section published~~ — re-examined the marketing bullet list per project: most of it *was* amenities/payment terms already used elsewhere, but 11 of 17 also had real specification/outdoor bullets (A/C provision, timber flooring, toilet fittings, water tanks, sports courts, etc.) that were being discarded. Added as Key Features. Also added Nearby Places (bus routes, highway entrances, schools) for 8 projects from the same leftover bullets.
- [x] ~~Hero images~~ — 14 of 17 had an unsuitable hero (10 were a bare project logo on a plain background, not a property photo at all; 4 were a real photo with a "TYPE X / SQFT" or "LOT N" label baked in, misrepresenting the whole project as one specific unit). Swapped all 14 for a real, generic exterior/site photo pulled from that project's own gallery. Two projects (Weera Mawatha, Signature Villas/Melder Place) only publish labeled renders — no fully clean option exists on their sites — so kept the one matching the project's primary confirmed type as the least-bad choice.
- [x] Project names shortened to drop the repeated "- City" suffix (city already shows on the line below the title in the hero) — three "Prime Villas" projects (Dalugama/Nugegoda/Weera Mawatha) keep a "(Neighborhood)" tag instead of dropping it fully, since all three share the same base name and would otherwise display identically.
- [ ] **No prices published** for 10 of the 17 (shows a "Contact for pricing" badge — now styled as a pill matching the hero badges, on the listing card, floor-plan card, and hero itself): Magna, Prime Urban Art, Prime Life Kadawatha, Prime Villas Nugegoda, Prime Villas Thalawathugoda/Weera Mawatha, Signature Villas, Water Estate. Ask Prime Lands for a price list.
- [ ] Developer Prime Lands' `verification_status` — check/approve in `/cms` if appropriate (turns on the "Verified" badge); developer record already existed before this batch.
- [x] All 17 **published** — publish confirmed 2026-09-09.
- [x] Confirmed **none of the 17 are sold out** — checked the hero-region status of each page directly (not a "Recommended" carousel entry from another project — see process note below).

## Process notes
- Rush's S3 bucket intermittently returns 403 for valid files — retry rather than assume missing.
- Rush pages hide most unit data behind tabs/popups; it's all in the page JSON (`nearbyLocations`, `progress`, unit `availability`) — see the listing-import checklist in the agent memory.
- **Sold-out/price text can belong to a different project.** Both Rush Lanka and Prime Lands pages show a "Recommended"/related-listings carousel of *other* projects near the bottom of the page. A naive full-page regex for "SOLD OUT" or a price can match text from one of those cards, not the current project. Always restrict the search window to the hero region (before "About the Project" or the recommend section).
- **A floor-plan drawing's stated area can be for one floor only, not the unit's total** — two Prime Lands drawings were labeled "GROUND FLOOR" with a sqft figure, for houses that turned out to have a first (and in one case second) floor with its own bedrooms. Always check whether more floor images exist for the same type (Ground/First/Second, or a G/1/R suffix in the filename) before treating one drawing's number as the total — read all of them and sum, or use an explicit "TOTAL AREA" figure if the drawing prints one.
- **The confirmed-type label must exactly match the site's own tab label**, not a label copied off the drawing image (which may add "(4BR)" or "| 3 Bed Room" annotations the site's tab text doesn't have). A mismatch here silently drops the one real floor plan entirely when a later cleanup pass removes "unconfirmed" (zero-value) placeholders — three of the 17 Prime Lands projects hit exactly this bug and had to be re-fixed.
- **A `selectWithOther` field's fallback branch needs real title-casing**, not a regex that only touches the first letter of each word — `"KAHATHUDUWA".replace(/\b\w/g, c => c.toUpperCase())` leaves it unchanged (every letter is already "first-letter-of-word" width once, but the rest of each word stays uppercase) because `\w` matches one character, so unless the string is lowercased first the rest of the word is untouched. Lowercase the whole string before title-casing it.
- **"One sample type per project, disclose the rest as uncatalogued" is not sufficient when the user asks for full coverage.** The user caught this directly ("you have missed lots of floor plans... go check all the pages") after the first Prime Lands pass sampled only one type per project. When a source site lists several unit/lot types, the expectation is every type gets its own confirmed entry, not a representative sample — reading ~90 more drawings across 16 projects took a while but surfaced two more real bugs worth checking for going forward (see below).
- **Always visually check what a "hero" image actually shows, not just that a URL exists.** 14 of 17 Prime Lands heroes turned out to be either a bare project logo (10) or a real photo with a "TYPE X"/"LOT N" label baked in (4) — both misrepresent the whole project. The tell: when a project's own marketing images are per-unit renders (common for house/villa developers who don't have a finished-site photo yet), the *first* gallery image is often the least neutral one, not the best. Check 2–3 gallery photos before picking a hero, and prefer one with no baked-in text at all.
- **Recheck "leftover" feature bullets before writing off Key Features/Nearby as unavailable.** After matching bullets to amenities and payment-plan terms, what's left over often still contains real specification bullets (A/C, flooring, fittings) and real distance/landmark bullets — both belong in dedicated fields (`unitFeatures`, `nearby`), not just discarded. Don't conclude "this site doesn't publish X" until the full bullet list has been triaged into every field it could feed, not just the first one it matched.

## Excello — Aathavan, Panimozhi, Rudra (created and published 2026-09-20)
Excello's archive has 7 projects; only these 3 are "In Progress" — completed ones (Sea Esta Villas, Café Kaapi, Bambalapitiya Residence, Coffee Patrol Mobile Cafe) were skipped per the owner's scope. All three went live on 2026-09-20 at the owner's request.
- [x] ~~Panimozhi: keep or delete?~~ — owner confirmed it is a property that can be bought and run as a hotel (not stated on Excello's site), so it stays.
- [ ] **Deploy pending** (also: plan pages show only the plan's own pricing and no stand-in building photo; the plan cards drop their photo — see design.md "Floor plan page facts & chips"): the fix that hides "0 bathrooms" (plan page description + plan-card Bath icon) and the new **Hospitality** badge option are uncommitted code changes (`src/app/(frontend)/projects/[slug]/floor-plans/[floorPlanId]/page.tsx`, `src/components/marketplace/components.tsx`, `src/collections/Projects.ts`, `src/payload-types.ts`, `docs/design.md`). Until deployed, Aathavan's plan cards show a Bath icon with "0" and the plan-page description says "0 bathrooms". The database enum is already updated.
- [ ] **Aathavan**: ask Excello for bathroom counts, floor-plan drawings (their page only says "ask the team about floor plans"), handover date, ownership type, parking count and nearby places — none are published.
- [ ] **Aathavan availability is a snapshot (2026-09-20: 27 available, 17 reserved)** — Excello's register is updated daily, ours isn't.
- [ ] **Rudra**: no villa sizes, prices or timeline published (concept stage, status Coming Soon); Excello's archive calls it "In Progress" — confirm.
- [ ] Pins: Aathavan = centre of Carron Place (lane-level); Panimozhi/Rudra = Kalkudah village centre (approximate, Street View off). Ask for exact sites.
- [x] ~~No Kalkudah neighborhood page~~ — created 2026-09-21 (`/neighborhoods/kalkudah`: verified facts from Wikipedia, hero = an Unsplash photo tagged Pasikuda by Charuka Herath, free under the Unsplash License); Panimozhi and Rudra link to it, Aathavan links to Dehiwala.
- [ ] The page `<title>` template in `projects/[slug]/page.tsx` is hardcoded "{name} - New Apartments in {location}" for every listing, so the hotel (Panimozhi) and villa (Rudra) titles say "New Apartments" — site-wide pre-existing behaviour; consider a type-aware title.
- [ ] Sitemap regenerates hourly (`revalidate = 3600`) — the new project, plan and developer pages appear there within an hour; resubmit in Search Console after that.
- [ ] Excello Developers profile: verification pending; no socials on their site except WhatsApp; logo is their monogram mark.

## Rush Lanka Group — decisions applied 2026-09-21 (from the 2026-09-20 site review)
- [x] **Rush Metropolis marked sold out** (Rush's own news, 16 Sep 2025): status Under Construction (there is no project-level "Sold Out" status), all 7 plans Sold Out, sold 125 / available 0, an orange "Sold Out" availability badge, and a note at the top of the description. Backup of the old record was kept locally.
- [x] **Price ranges applied** from Rush's payment-calculator feed to Rush City (Rs 34.0M–49.9M), Rush Court 5 (30.0M–33.6M), Rush Court 6 (27.1M–45.6M), Street Rush Residencies (40.2M–58.2M) and Rush Residencies, Allen (43.7M–64.5M) — project level only; per-plan prices stay "Contact for pricing".
- [ ] **Imaarat left unchanged** at "From Rs 88.5M" — Rush's calculator says Rs 92.0M–100.0M and I can't trace where 88.5M came from. Which is right?
- [ ] The calculator's payment defaults (initial 15–60%, 12–60 month periods) were **not** applied — they are calculator defaults, not a published payment plan.
- [x] **Developer profile** (`rush-lanka-group`): 7 credentials added to a new Awards field (CIDA LB1, ISO 9001:2015, Great Place to Work®, BOI, CMA, COC, Amana Bank tripartite agreement), leadership team, vision/mission and history in the description, active projects = 9. The `awards` field + its sync mapping are **uncommitted code** (deploy pending) — until deployed, editing this developer in the production CMS could drop the awards.
- [ ] Team is written into the description; a structured "Team" section would need a small UI addition. Not added: press mentions (Echelon Magazine ×2), complaints@pfm.lk, careers@rushlankagroup.com.
- [x] **15 completed projects created as unpublished drafts** (Rush Court 2/3/4, Rush Residencies ×4, Rush Reliance, Rush Tower, Rush Homes, Rush Ebenez, Rush Broadway, Rush Palm Grove, Rush Park, Rush Villa) — each with photos, unit plans, specifications, road map, pin, and every unit marked Sold Out per Rush's own tracker.
  - [ ] **Publish them?** Once published they appear in the "New Projects" grid and category pages (Colombo, etc.) beside new developments, with a "Completed" status. Preview each at `/listing-preview/<slug>`.
  - [ ] Rush's own numbers disagree on three: Watarappala (tracker 40 vs headline 35), Ebenez (24 vs 26), Colombo 6 (24 vs 25) — headline used for total units.
  - [ ] Missing on Rush's site: Reliance Unit B and Kawdana Unit J 2D drawings; the three villa projects (Rush Villa, Palm Grove, Rush Park) publish no unit types, so no floor plans and no sold claim; Rush Park has no gallery photos at all.
  - [ ] Rush's location data is unreliable: the JSON-LD location on every project page is a placeholder 1–7 km off (same for Rush City); Watarappala's Google Maps link duplicates the Dehiwala project's, so it uses an area-level point (Watarappala Road, Ratmalana, Street View off) — ask Rush for the real address.
  - [ ] "Luxury Villas" type for Rush Villa / Palm Grove / Park is inferred from Rush's history page ("ultra-luxury villa projects").
- Skipped on purpose: **Rush Courts** (`rush-courts-colombo-14`, a duplicate of Rush Court 5), **AL Kareem Tower** (a 6-storey commercial office building) and the hidden **Rush Tower 3** (14 apartments, 2030, an empty page).
