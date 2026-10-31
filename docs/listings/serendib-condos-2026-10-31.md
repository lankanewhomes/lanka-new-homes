# Serendib Condos portal (9 projects, imported 2026-10-31)

Owner request: "Add this listing" (https://www.serendibcondos.com/), then, after being told the site is a demo, "You can add those listings."

**All 9 are UNPUBLISHED drafts.** The site's JS bundle flags every project `demo: true`: descriptions say "demonstration listing" / "concept" / "example", photos are labelled "illustrative stock photo", and no developer is named. The portal is Canada-based and routes enquiries to hello@serendibcondos.com. Publish only after the owner confirms the projects are real. Developer record created: Serendib Condos (id 73, `serendib-condos`, placeholder). Script: `scripts/import-serendib-condos.ts`; data: `scripts/data-serendib-condos.json` (extracted from the bundle).

| ID | Project | Area | Stage on site | Beds | Units | Expected completion | Slug |
|---|---|---|---|---|---|---|---|
| 165 | Trend Grand | Nuwara Eliya | Ongoing | 2-3 | 12 | Mid 2028 | `trend-grand-nuwara-eliya` |
| 166 | City (Twin Tower) | Capt. Sumudu Rajapaksa Mw, Dehiwala | Upcoming | 2-3 | 76 | End 2030 | `city-twin-tower-colombo` |
| 167 | Fairline | Fairline Rd, Dehiwala | Upcoming | 2-3 | 60 | End 2031 | `fairline-fairline-rd` |
| 168 | Aurora Residences | Rajagiriya | Upcoming | 1-3 | 12 | — | `aurora-residences-rajagiriya` |
| 169 | Coastline Living | Negombo | Upcoming | 1-2 | 12 | — | `coastline-living-negombo` |
| 170 | Skyline Court | Colombo 05 | Ongoing | 1-3 | 12 | — | `skyline-court-colombo-05` |
| 171 | Garden Residences | Kandy | Ongoing | 2-3 | 12 | — | `garden-residences-kandy` |
| 172 | Harbour View Apartments | Colombo 03 | Completed | 1-3 | 12 | — | `harbour-view-apartments-colombo-03` |
| 173 | Lake Gardens | Battaramulla | Completed | 2-3 | 12 | — | `lake-gardens-battaramulla` |

## Captured
Name, area, coordinates, stage (ongoing = Under Construction, upcoming = Coming Soon, completed = Now Selling / Completed), bedroom range, unit count, expected completion where given, amenities (Trend Grand, City, Fairline only; unmapped ones such as Internet, Janitor Service, Generator and Community center are in the description), the site's stock photo as hero.

## Missing
No prices, floor plans, unit sizes, bathrooms, brochure, developer names or exact addresses are published, so none are entered (all prices 0). Harbour View has no neighbourhood (no Colombo 03 record exists).
