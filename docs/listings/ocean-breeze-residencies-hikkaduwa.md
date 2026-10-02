# Ocean Breeze Hikkaduwa

- **Slug:** `ocean-breeze-residencies-hikkaduwa` · **Developer:** Global Housing & Real Estate (GHR Global) · **Published:** no (draft — preview at `/listing-preview/ocean-breeze-residencies-hikkaduwa`)
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
