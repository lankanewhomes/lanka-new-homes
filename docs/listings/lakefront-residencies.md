# Lakefront Residencies

- **Slug:** `lakefront-residencies` · **Developer:** Global Housing & Real Estate (GHR Global) · **Published:** yes (published 2026-10-02) — live at `/projects/lakefront-residencies`
- **Source:** https://www.globalhousing.lk/projects/ongoing/lakefront-residencies (developer's own CMS data + brochure)
- **Location:** Lady Horton Rd, Nuwara Eliya, Nuwara Eliya
- **Type / status:** Apartments · Under Construction · units 31 · floors 4 · expected handover —
- **Starting price:** Rs. 72,000,000
- **Brochure on listing:** yes (mirrored to R2)

## Floor plans

| Plan | Beds | Baths | SqFt | Available floors |
|---|---|---|---|---|
| Studio (Type A) | 1 | 1 | 472 | none |
| One Bedroom (Type B) | 1 | 1 | 721 | none |
| Two Bedroom (Type C) | 2 | 2 | 815 | none |
| Two Bedroom (Type D) | 2 | 1 | 903 | First Floor, Second Floor |
| Two Bedroom (Type E) | 2 | 2 | 936 | First Floor |
| Two Bedroom (Type F) | 2 | 2 | 953 | none |
| Two Bedroom Duplex (Type G) | 2 | 2 | 968 | Third Floor |
| Three Bedroom (Type H) | 3 | 2 | 1081 | none |
| Three Bedroom Duplex (Type J) | 3 | 2 | 1184 | none |
| Four Bedroom Duplex (Type K) | 4 | 4 | 1600 | none |

## Data captured

- Gallery images: 37
- Amenities: Pool, Gym, Parking, Security, Garden, Lake View, Hotel, Games Room
- Key Features groups: Outdoor Features, General Features (10 items)
- Nearby places: 8
- Videos: 1

## Notes, assumptions & gaps

- Brochure (22 pages) has no specification, payment-plan, price or completion-date pages; only unit plans, location, company info
- No completion year published
- Per-unit prices not published
- Source stats say 35 apartment units; page/availability list say 31 (31 used). Per-type totals on the site sum to 41, so unitsInPlan/unitsAvailable left blank
- Brochure labels Type J "Four Bed" but title and plan show three bedrooms (3 used)
- Brochure page 14 and others are renders only
- Site per-type availability (e.g. Type F 10 available) conflicts with the floor tracker (F sold out); floor tracker used, which sums to 9 available = published total
- type Apartments + type_other Hotel Residency (matches ocean-breeze-galle)
- CMS Ongoing -> Under Construction
- floors=4 from Ground/First/Second/Third in the availability tracker
- floorAvailability: one row per floor; available if any unit of that type on the floor is Available; plan availability Sold Out only if none
- Studio counted as 1 bedroom per source; Pool/Gym/Parking/Security/Garden/Lake View from published amenity list, Hotel from hotel-residency branding, Games Room from brochure render
- Balcony feature taken from floor plans (all types show a balcony)
- ROI/rental return claims in source omitted
- Contact phone +94768787878 = brochure hotline 0768 78 78 78
- Source typo Stuido corrected to Studio

_Generated 2026-10-02 from the research files used for the import._

## Second pass: brochure additions applied (2026-10-02)

- Floor-plan facts added: 10 plan updates · Key Features added: 5 · amenities added: 0 · nearby added: 0 · highlights offered: 2
- Description addendum: yes · marketing contact stored: yes
- Left out on purpose (not added):
  - Unit count 31 vs 35 — RESOLVED to 31: the Unit Location Guide (p.5) numbers 4 + 8 + 8 + 11 = 31 units (ground 01-04, first and second floors 01-08 each, third floor 01-11). The per-type counts used for unitsInPlan (A5 B2 C3 D5 E4 F2 G6 H2 J1 K1) are counts of the numbered positions on that guide and also sum to 31. The website's 35 is not supported by the brochure.
  - Type J bedrooms — RESOLVED to 3: the page 12 title reads Three Bedroom Duplex Apartment and the plan draws 2 bedrooms on the lower floor and 1 upstairs with 2 W/C; only the classification line says Four Bed (brochure typo). Page 3 copy also says studio, 1, 2 and 3-bedroom. Keep 3 bedrooms, 2 bathrooms.
  - Type B drawn on two levels — Plan shows lower and upper floor with a staircase but the brochure does not call it a duplex, so planType not set
  - Room dimensions, interior vs balcony areas, ceiling height — Brochure plans carry no dimensions or sub-areas; only total area per type
  - Per-plan lake view / aspect — Only a general 'Lake Gregory view' arrow on the unit guide (p.5); no per-type view printed
  - Ensuite bath counts, maid's room, pantry — Plans label W/C only; ensuite relationship not reliably readable; no maid's room or pantry shown
  - Brochure typos — Page 7 reads 'STUIDO'; guide on page 5 says Type K 'PG 01' (plan is on PG 13); 'CELING' in partner logos
  - ROI 120%+ and 10% annual rental income (p.3); Ocean Breeze 200% ROI, 120% capital gain (p.16) — marketing claim
  - Nearby places — All six brochure places (Lake Gregory 150 m, Race Course 800 m, Galway National Park 800 m, Victoria Park 1.8 km, Pedro Tea Estate 400 m, Golf Club 2 km) already stored
  - Contact conflict check — Brochure hotline 0768 78 78 78 matches stored phone; marketing@globalgrouplk.com and info@globalgrouplk.com are brochure-only addresses, source.json has no website contact email to compare
  - Completion date, payment plan, prices, specifications, parking count, lifts, generator — Not in brochure (lift, generator and parking come only from the website amenity list, already stored)
  - 12 completed projects, 5 active (p.18) / 12 completed and 6 ongoing (back cover), 900+ units in 15 cities, No.1 hotel residency developer, ISO 9001:2015, CIDA, IAF, Royal Gem awards, Global Group companies, construction partners, banking partners (Sampath, DFCC, NDB, Seylan, HNB, Commercial Bank), track record and similar projects — developer-level
