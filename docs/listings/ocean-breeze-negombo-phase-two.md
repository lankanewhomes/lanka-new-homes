# Ocean Breeze Negombo - Phase 2

- **Slug:** `ocean-breeze-negombo-phase-two` · **Developer:** Global Housing & Real Estate (GHR Global) · **Published:** yes (published 2026-10-02) — live at `/projects/ocean-breeze-negombo-phase-two`
- **Source:** https://www.globalhousing.lk/projects/ongoing/ocean-breeze-negombo-phase-two (developer's own CMS data + brochure)
- **Location:** Ocean Breeze Negombo Phase 2, Porutota Rd, Negombo, Negombo
- **Type / status:** Apartments · Under Construction · units 298 · floors 25 · expected handover —
- **Starting price:** Rs. 39,400,000
- **Brochure on listing:** yes (mirrored to R2)

## Floor plans

| Plan | Beds | Baths | SqFt | Available floors |
|---|---|---|---|---|
| 3 Bedroom Suite - Type A | 3 | 2 | 702 | none |
| 3 Bedroom Suite - Type B | 3 | 2 | 662 | Floor 17 (R15), Floor 20 (R18) |
| 3 Bedroom Suite - Type C | 3 | 2 | 652 | Floor 18 (R16), Floor 21 (R19) |
| 3 Bedroom Suite - Type N | 3 | 2 | 932 | Floor 15 (R12), Floor 17 (R15), Floor 18 (R16), Floor 20 (R18), Floor 21 (R19), Floor 23 (R21) |
| 3 Bedroom Suite - Type O | 3 | 2 | 916 | Floor 16 (R14), Floor 18 (R16), Floor 19 (R17), Floor 22 (R20) |
| 3 Bedroom Suite - Type P | 3 | 2 | 940 | Floor 16 (R14), Floor 17 (R15), Floor 19 (R17), Floor 20 (R18), Floor 22 (R20), Floor 23 (R21) |
| 3 Bedroom Suite - Type S | 3 | 3 | 1049 | none |
| 2 Bedroom Suite - Type A1 | 2 | 1 | 503 | none |
| 2 Bedroom Suite - Type B1 | 2 | 1 | 492 | Floor 05 (R2) |
| 2 Bedroom Suite - Type C1 | 2 | 1 | 470 | none |
| 2 Bedroom Suite - Type D | 2 | 2 | 607 | none |
| 2 Bedroom Suite - Type E | 2 | 2 | 593 | none |
| 2 Bedroom Suite - Type F | 2 | 2 | 579 | none |
| 1 Bedroom Suite - Type G | 1 | 1 | 410 | none |
| 1 Bedroom Suite - Type H | 1 | 1 | 441 | Floor 20 (R18) |
| 1 Bedroom Suite - Type J | 1 | 1 | 536 | none |
| Deluxe Studio - Type A2 | 0 | 1 | 247 | none |
| Deluxe Studio - Type B2 | 0 | 1 | 241 | none |
| Deluxe Studio - Type C2 | 0 | 1 | 233 | none |
| Deluxe Studio - Type K | 0 | 1 | 293 | none |
| Deluxe Studio - Type L | 0 | 1 | 263 | none |
| Deluxe Studio - Type M | 0 | 1 | 231 | none |

## Data captured

- Gallery images: 36
- Amenities: Pool, Gym, Parking, Security, Clubhouse, Rooftop, Roof Terrace, Games Room, Cafe, Hotel, Meeting Room, Sea View
- Key Features groups: Indoor Features, Outdoor Features, General Features (12 items)
- Nearby places: 9
- Videos: 1

## Notes, assumptions & gaps

- Unit count: developer headline 298 apartments (stats, description, brochure); CMS totalUnits field says 287; the floor availability tracker lists 292 units; sum of per-type totalUnits in CMS is only 110. Used 298.
- No payment plan, deposit or per-unit-type prices published (brochure has none); every floorPlans.startingPriceLkr set to 0 (schema requires a number; 0 = unpriced). Pricing section only has the "from" price.
- Completion / handover year not published in CMS or brochure; completionYear omitted.
- Floors: description/brochure say 25 floors (ground, P1-P2 parking, R1-R21 residential, rooftop); availability tracker covers 20 residential floors R1-R21 (R13 absent).
- Brochure areas differ slightly from CMS: Type A 700 vs 702, Type C 653 vs 652, Type P 941 vs 940 sq ft; CMS values used.
- CMS says Type O has 2 beds and 1-bed types have 2 baths; brochure (and unit descriptions) say Type O 3 beds and 1-bed types 1 bath; brochure used. Studios recorded as 0 bedrooms (CMS says 1).
- Brochure lists 3BR Type A floors R01,R04 etc. but the floor-plan layouts show those slots as 2BR Type A1 / studio A2 on R01 and R04; availability for types A/B/C is split by floor accordingly (R1-R6 = 2BR A1/B1/C1 + studios A2/B2/C2, R7+ = 3BR A/B/C).
- CMS per-type availableUnits/totalUnits do not match the availability tracker; unitsAvailable per plan was set from the tracker (tracker shows 22 available in total vs CMS availableUnits 21; project availableUnits kept at the published 21). Per-type unitsInPlan not set.
- Negombo Beach distance: CMS says 50 m, brochure says 80 m; CMS used.
- Brochure site plan labels the street as B Albert Perera Mawatha; CMS address says Porutota Rd; CMS used.
- Source nearby has no schools or hospitals; none published.
- type=Apartments with typeNote "Hotel residency" (not a listed project type)
- marketingBadges Hospitality and locationBadges Ocean View added as hotel-residency / ocean-view units are published
- Pool "on 7th floor" per CMS description; brochure R07 plan shows pool deck, clubhouse and fitness at that podium-roof level
- floorAvailability: one row per floor per plan, available=true if any unit of that type on that floor is Available; names mapped by type letter (D,E,F=2BR; G,H,J=1BR; K,L,M=studios; N,O,P,S=3BR)
- Brochure floor plan images not extracted; developer SVG floor plans from CMS used (SVGs have no text labels so visually unverified here but match brochure types).
- Contact email not set; brochure lists marketing@globalgrouplk.com and info@globalgrouplk.com, hotline 0768 78 78 78, marketing office No. 52 Sir Marcus Fernando Mawatha, Colombo 10.

_Generated 2026-10-02 from the research files used for the import._

## Second pass: brochure additions applied (2026-10-02)

- Floor-plan facts added: 22 plan updates · Key Features added: 7 · amenities added: 2 · nearby added: 0 · highlights offered: 0
- Description addendum: no · marketing contact stored: yes
- Left out on purpose (not added):
  - Unit total — Brochure p3 prints 298 apartments, matching stored value. 287 (CMS field) and 292 (tracker) are not in the brochure; keep 298.
  - Available-unit count — Brochure prints no available/sold counts; stored 21 stays from developer site.
  - Completion year — Not printed anywhere in the 56-page brochure.
  - Number of floors — p3 says 25 floors: confirms stored 25. Plans show ground, P1-P2, R01-R21 (R13 skipped).
  - Rooftop pool on '7th floor' — Brochure shows pool deck, clubhouse and fitness center on the 'Residential Floor R07' plan (p40); it does not say '7th floor' or 'podium roof'. R07 label vs physical floor is ambiguous; consider rewording.
  - Area conflicts — Brochure: Type A 700, Type C 653, Type P 941 sq ft vs stored 702, 652, 940 (p19, p22). Left unchanged for owner decision.
  - Beach distance — Brochure p49 says Negombo Beach 80M away; stored 50 m (from website). Conflict, not changed.
  - Other nearby items — Phase 1 900 m/2 min, St Mary's 3 km/8 min, Fort 3.5 km/10 min, airport 8.5 km/25 min all already stored; walking-distance restaurants already stored.
  - Room dimensions, ceiling heights, balcony areas, maid's room, pantry — Plans are not-to-scale illustrations with no readable dimensions; 'service room' label is not a verified maid's room.
  - Balcony counts, view labels — View labels (Ocean View; Pool/City on K-P) and balcony counts already stored.
  - ROI over 200% (Phase 1), over 120% (other projects), 'high yield', 'high occupancy', 'strong rental demand' — marketing claim
  - Phase 1 operational, 12 completed projects, 900+ units, 15 cities, No.1 hotel residency developer, partners/banks/credentials, Hikkaduwa/Nuwara Eliya/Sigiriya sister projects — developer-level
  - Contact email conflict — Brochure emails are info@/marketing@globalgrouplk.com; stored phone +94768787878 equals hotline 0768 78 78 78 (consistent). Website addresses may differ.
  - Payment plan / prices — None printed in the brochure.
  - Hotel management services — Mentioned for Phase 1 (p50) and already stored.
