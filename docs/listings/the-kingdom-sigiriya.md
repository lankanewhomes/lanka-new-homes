# The Kingdom Residencies, Sigiriya

- **Slug:** `the-kingdom-sigiriya` · **Developer:** Global Housing & Real Estate (GHR Global) · **Published:** no (draft — preview at `/listing-preview/the-kingdom-sigiriya`)
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
