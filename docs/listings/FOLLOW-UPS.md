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
- [ ] Hero stat on the page reads "28 Residential Apartments" while the brochure says 109 units / 28 residential floors — 109 kept; confirm with Rush.
- [ ] Expected handover **2030** (page) — the "Move in 2030" badge is on; confirm.
- [ ] **Phase 2 (North City Tower)** has no brochure/unit data yet — add a second listing (or extend this one) when it launches.
- [ ] 6 extra exterior/interior gallery images kept returning 403 from Rush's S3 bucket — retry later (URLs in the listing report).
- [ ] No construction tracker on the page yet — add `constructionUpdates` once Rush publishes milestones.
- [ ] Brochure lists 3 elevators, 10 ft floor-to-floor, gas system — in Key Features; confirm with the developer whether the "Lifestyle" brochure should also be attached.

## Rush Court 5 (`rush-court-5-colombo-14`)
- [ ] Tracker shows **Unit A sold out** (all 7 floors) and only floors 1–2 left for B/C — confirm; if the tower is nearly sold, switch project status to "Nearly Sold Out".
- [ ] Only 2 nearby places on the page (Baseline Road, Pettah) — brochure has no location page; ask for more.

## Rush Metropolis (`rush-metropolis-dehiwala`)
- [ ] **Availability tracker shows every floor of every unit sold** while the project is marketed as selling — hidden as a placeholder. Confirm: sold out, or tracker not maintained?
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
