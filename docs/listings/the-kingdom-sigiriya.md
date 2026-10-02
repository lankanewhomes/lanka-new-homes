# The Kingdom Residencies, Sigiriya

- **Slug:** `the-kingdom-sigiriya` · **Developer:** Global Housing & Real Estate (GHR Global) · **Published:** yes (published 2026-10-02) — live at `/projects/the-kingdom-sigiriya`
- **Source:** https://www.globalhousing.lk/projects/the-kingdom-sigiriya (developer's own CMS data + brochure)
- **Location:** The Kingdom Residencies, Inamaluwa Sigiriya Road, Sigiriya, Sigiriya
- **Type / status:** Apartments · Under Construction · units 108 · floors — · expected handover —
- **Starting price:** Rs. 26,600,000
- **Brochure on listing:** yes (mirrored to R2)

## Floor plans

| Plan | Beds | Baths | SqFt | Available floors |
|---|---|---|---|---|
| Studio | 1 | 1 | 433 | Second Floor |
| Two Bedroom | 2 | 1 | 612 | none |

## Data captured

- Gallery images: 17
- Amenities: Pool, Gym, EV Charging, Parking, Security, Mini Mart, Laundry Service, Cafe, Function Room
- Key Features groups: specifications, General Features, outdoor (19 items)
- Nearby places: 8
- Videos: 1

## Notes, assumptions & gaps

- No per-unit prices, payment plan, completion year or deposit terms published (brochure 24 pages read; no pricing page). floorPlans have no startingPriceLkr but the CMS marks it required: if the import rejects floorPlans, set it manually once the developer confirms unit prices.
- source.json lists the Two Bedroom plan as beds:1; the drawing and description show two bedrooms, so bedrooms:2 was used (1 washroom per drawing).
- source.json unit availableUnits (48 studio / 9 two-bed) contradicts its own floor tracker and project total (4 available, all studios on Second Floor: units 2, 4, 21, 24). Used 4; Studio plan Available, Two Bedroom plan Sold Out.
- Source "Forth Floor" corrected to Fourth Floor. floors count not set (4 residential floors in tracker plus ground-level commercial; not stated explicitly).
- constructionStarted from CMS "started" (2026-08-01) although the developer says construction is nearing completion; verify.
- Distances differ between website and brochure (Sigiriya Rock 6 km vs 5 km / 8 min; Kandalama 4 km vs 5 km / 8 min); website values with coordinates used.
- Brochure has no specification/finishes pages; unitFeatures built from source description and unit descriptions.
- Floor plans are SVG (embedded raster) and uploaded as .svg.
- No road-map image file available (map exists only as a brochure page).
- type set to Apartments (CMS has no Hotel Residency option); hotel-residency nature stated in description
- district Matale / province Central for Sigiriya
- Marketing ROI / capital-gain claims in source and brochure deliberately omitted
- contact phone = brochure hotline 0768 78 78 78
- Developer pages in brochure: head office 75A Arnold Ratnayake Mawatha, Colombo 10

_Generated 2026-10-02 from the research files used for the import._

## Second pass: brochure additions applied (2026-10-02)

- Floor-plan facts added: 1 plan updates · Key Features added: 14 · amenities added: 3 · nearby added: 0 · highlights offered: 1
- Description addendum: no · marketing contact stored: yes
- Left out on purpose (not added):
  - Two-bedroom unit bedroom count — Brochure (page 3) says 'studio and two-bedroom apartments': 2 bedrooms confirmed, stored value 2 is correct. No two-bedroom plan, size, bathroom count or photos in brochure (the 612 sq ft figure is not printed).
  - Available units / 108 total / per-floor counts — Not printed. Brochure only shows a 'Units Available' badge for The Kingdom Residencies (page 22); no count. Typical floor shows 27 numbered units but total and floors are not stated, so no derived total. CMS vs tracker contradiction is not resolvable from the brochure.
  - Construction start date (Aug 2026) / completion date — No dates printed. Only wording is 'construction nearing completion' (page 3), which supports statusNote; stored start date cannot be verified.
  - Distance conflict: Sigiriya Rock — Brochure page 15: 5 km, 8 mins drive; stored 6 km. Not changed, owner to decide.
  - Distance conflict: Kandalama Reservoir — Brochure page 15: 05 km, 08 mins drive; stored 4 km. Not changed, owner to decide.
  - Drive times for stored Landmarks other than first two — Already stored and match brochure (Pidurangala 10 km/10 min, Dambulla 11/11, Kaludiya Pokuna 11/11, Minneriya 13/12).
  - Over 120% capital gain projection (page 22) — marketing claim
  - 'Steady rental income and resilient long-term returns' (page 3); 'proven ROI of over 200%' for other GHR projects — marketing claim
  - Floor count / lifts count — Not stated; renders and stored First-Fourth floors not verifiable from brochure; lifts shown on plan but no count printed.
  - Studio aspect and view fields — Brochure says each studio is either Dambulla view or Sigiriya view (east and west sides) while master plan marks Sigiriya view north and Dambulla south; orientation inconsistent, so left in text only. View select options have no matching value.
  - Studio interior vs balcony areas, ceiling height, room dimensions — Not printed on the studio drawing; only total 433 sq ft.
  - Furnishing, AC, hot water, finishes brand — Not stated in text; renders show furnished interiors but this is illustrative only.
  - Sustainable design — Printed as a phrase only, no specific systems; used in highlights.
  - Developer credentials (ISO 9001:2015, CIDA, IAF, IOSG Gold Award 2025), group companies (MET Developers, interior design, travel, Corundum hotel management, vending), construction partners, banking partners (Sampath, Pan Asia, NDB, Seylan, HNB, Commercial), 12 completed projects, 900+ units, 15 cities, past project showcase — developer-level
  - Brochure fine print: floor plans not to scale, indicative only — Disclaimer; not a listing fact.
  - Website email conflict check — Printed emails are info@globalgrouplk.com and marketing@globalgrouplk.com; website domain is globalhousing.lk. Compare with CMS email before use.
  - Payment plan, prices — None printed in brochure.
