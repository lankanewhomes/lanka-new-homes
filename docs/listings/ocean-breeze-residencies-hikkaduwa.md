# Ocean Breeze Hikkaduwa

- **Slug:** `ocean-breeze-residencies-hikkaduwa` · **Developer:** Global Housing & Real Estate (GHR Global) · **Published:** yes (published 2026-10-02) — live at `/projects/ocean-breeze-residencies-hikkaduwa`
- **Source:** https://www.globalhousing.lk/projects/ongoing/ocean-breeze-residencies-hikkaduwa (developer's own CMS data + brochure)
- **Location:** Ocean Breeze Residencies, Galle Road, Hikkaduwa, Madampagama, Hikkaduwa
- **Type / status:** Serviced Apartment · Under Construction · units 276 · floors 20 · expected handover —
- **Starting price:** Rs. 28,000,000
- **Brochure on listing:** yes (mirrored to R2)

## Floor plans

| Plan | Beds | Baths | SqFt | Available floors |
|---|---|---|---|---|
| Studio | 1 | 1 | 448 | — |
| One Bedroom | 1 | 1 | 523 | — |
| Two Bedroom | 2 | 1 | 1031 | — |
| Two Bedroom Dual Key | 2 | 2 | 1022 | — |
| One Bedroom Duplex | 1 | 1 | 587 | — |
| Two Bedroom Duplex Dual Key | 2 | 2 | 1500 | — |
| Three Bedroom Duplex Dual Key | 3 | 3 | 1721 | — |
| Three Bedroom Duplex | 3 | 2 | 1574 | — |

## Data captured

- Gallery images: 40
- Amenities: Pool, Gym, Parking, Security, Cafe, Function Room, Hotel, Beachfront, Sea View
- Key Features groups: Indoor Features, Outdoor Features (12 items)
- Nearby places: 9
- Videos: 1

## Notes, assumptions & gaps

- Brochure (24 pages) has NO specification/finishes pages, NO payment plan, NO price; 'specifications' Key Features group left out
- No completion year published (projectHeader null, brochure silent)
- CMS 'started' date is 2026-10-01T15:49Z which looks like a CMS entry timestamp, not a real construction start; verify before publishing
- floorAvailability skipped: source floors list units only as 'Unit 1..20' per floor (floors 07-18 R1-R12 and 19&20 R14), no unit-type mapping; brochure unit numbers include 14A/14B and no 13 so numbering cannot be matched safely. Floor-level totals (43 available) were used for availableUnits
- Per-type unit counts in CMS (total 256, available 96) conflict with project totals (276 total, 43 available; stats say 258 apartment units; floor grid gives 258) so unitsInPlan/unitsAvailable not set
- Studio sizes in brochure are 400/437/448 sq ft and 1BR duplex 587/620/823 sq ft; plan uses CMS size (448, 587); starting-price figure Rs. 28M is tied to 400 sq ft
- Galle Fort/airport distances differ between CMS (27/130 km) and brochure (25/100 km)
- Per-plan prices not published (startingPriceLkr 0 per plan)
- Floor-plan SVGs are raster images wrapped in SVG (no vector data)
- type mapped to Serviced Apartment (closest to Hotel Residency) with typeNote
- floors=20 inferred from floor labels (Floor 07 to Floor 19 & 20 residential floors)
- units=276 from CMS totalUnits / site page; stats say 258
- floorRange from brochure: typical units floors 07-18, duplex units floors 19-20
- Not repeated in description: developer claims 'forecasted capital gain of over 120%' and 'annual rental income projection approx 10% of capital'; brochure also says 'forecasting high ROI'

_Generated 2026-10-02 from the research files used for the import._

## Second pass: brochure additions applied (2026-10-02)

- Floor-plan facts added: 0 plan updates · Key Features added: 4 · amenities added: 0 · nearby added: 0 · highlights offered: 1
- Description addendum: yes · marketing contact stored: yes
- Left out on purpose (not added):
  - Per-type unit counts (256 total / 96 available) vs project totals (276 / 43) — Brochure prints NO unit counts at all (no totals, no per-type counts, no availability), so it cannot resolve the conflict; keep 276/43 from the developer site project header and leave per-type unitsInPlan/unitsAvailable unset. The site stat card says 258 apartment units.
  - Number of floors — Brochure never prints a total. Plan captions put typical units on floors 07-18 and duplexes on floors 19 and 20, which is consistent with the stored 20. Keep floors=20.
  - Floor ranges per plan — Already stored and confirmed: Studio, 1BR, 2BR, 2BR dual key = 07-18 (R1-R12); all duplexes = 19-20 (R14). No change.
  - Unit Location Guide headings 'Residential floors 01-10' and 'Floors 11, 12 & 14' — These headings are inconsistent with the plan captions (R1-R12 = floors 07-18; R14 = floors 19-20) and look like R-codes rather than real floor numbers; not used.
  - Floor availability per floor / per type — Brochure prints a unit-number-to-type mapping (e.g. units 02/03 studio, 10/15 studio, 11/12/14A/14B one-bed, 09/16 two-bed, 01/04 dual key; duplex units likewise) but not which floors are sold or available. CMS tracker lists only 'Unit 1..20' per floor without type, and brochure numbering has 14A/14B and no 13, so a safe match is not possible. Skipped.
  - Galle Fort distance — Brochure prints 25 km, 40 min drive (page 18); CMS/site says 27 km. Stored nearby entry already reports both; brochure is the primary source if one number must be chosen.
  - Bandaranaike International Airport distance — Brochure prints 100 km, 2 hours drive (page 18); CMS/site says 130 km. Stored entry already reports both.
  - Madu River Safari 6 km / 10 min — Already stored (as 'Madu Ganga Lake Safari'); brochure calls it 'Madu River Safari'. No change needed.
  - Turtle Hatchery distance — Brochure says 'along the coast' with no distance; stored entry says 1 km (from developer site). Not changed.
  - Kurundugahetekma interchange 10 km and bank facilities 1 km — Stored from developer site; not printed in the brochure.
  - 'Unlock High-Return Coastal Investment Opportunities', 'forecasting high ROI along with outstanding rental income' (page 3) — marketing claim
  - Ocean Breeze Negombo 'proven ROI of over 200%'; Lakefront Residencies and The Kingdom Residencies 'over 120% capital gain' (page 19) — marketing claim (and other projects)
  - Hotel management services / rent individually — Already stored as developer-stated; no new detail printed.
  - GHR track record: 12 completed projects, 5 pipeline (page 21) vs 6 ongoing (page 24), 900+ units, 15 cities, 'No.1 hotel residency developer', 20+ years — developer-level (and the brochure itself is inconsistent on pipeline: five vs six ongoing)
  - Certifications (ISO 9001:2015, IAF, CIDA, IOSG Gold Award 2025), group companies (MET Developers, ETM Leisure, Corundum hotel management, ETM Vending), construction partners (suppliers' logos) and banking partners (Sampath, DFCC, NDB, Seylan, HNB, Commercial Bank) — developer-level; banking logos give no loan or payment terms for this project
  - Other projects (Grand, Lakeside, Marriot, Monash, Palladium, Paragon, Scenic View, The Kingdom, Vantage, VIP, Springfield, Monarch) — developer-level / not this listing
  - Email conflict check — Brochure prints info@globalgrouplk.com (head office) and marketing@globalgrouplk.com (marketing office); the brochure's back page website is globalhousing.lk. If the website shows a different address, the brochure's marketing address is only a printed contact, not a verified lead inbox. Hotline 0768 78 78 78 matches the stored +94768787878. Do not route test leads to these.
  - Payment plan, prices, deposits, completion date — None printed in the brochure.
  - Specifications / finishes, ceiling height, maid's room, pantry, parking per unit, interior vs balcony areas — Not printed. Plans give a single total area per unit; no room dimensions, no balcony areas.
  - Balcony counts per plan — Every plan shows a balcony, but the wrap-around balconies on two- and three-bedroom plans are drawn as segmented strips, so a reliable count cannot be read. Already covered by 'Private balcony in every floor plan'.
  - Rooftop / roof garden, restaurant, lounge and pool facilities seen in renders (pages 4, 5, 7, 24) — Renders carry no captions or text; facility list is printed only in the page 3 paragraph (beachfront swimming pool, gym, 24/7 security, restaurant, bar, cafes), all already stored.
