# Edmonton Bliss Residencies

- **Slug:** `edmonton-bliss-residencies` · **Developer:** Global Housing & Real Estate (GHR Global) · **Published:** yes (published 2026-10-02) — live at `/projects/edmonton-bliss-residencies`
- **Source:** https://www.globalhousing.lk/projects/ongoing/edmonton-bliss-residencies (developer's own CMS data + brochure)
- **Location:** Andarewatta Road, Colombo 05, Colombo 5
- **Type / status:** Apartments · Under Construction · units 48 · floors 12 · expected handover 2028
- **Starting price:** Rs. 66,000,000
- **Brochure on listing:** yes (mirrored to R2)

## Floor plans

| Plan | Beds | Baths | SqFt | Available floors |
|---|---|---|---|---|
| Unit 01 / 3 Bed | 3 | 2 | 1102 | 3rd Floor |
| Unit 02 / 3 Bed | 3 | 2 | 1224 | none |
| Unit 03 / 3 Bed | 3 | 2 | 1369 | 3rd Floor, 7th Floor, 8th Floor, 9th Floor, 10th Floor, 11th Floor, 12th Floor |
| Unit 04 / 3 Bed | 3 | 2 | 1509 | 4th Floor, 7th Floor, 8th Floor, 9th Floor, 10th Floor, 11th Floor, 12th Floor |
| Unit 05 / 3 Bed | 3 | 2 | 1329 | 7th Floor, 8th Floor, 9th Floor, 12th Floor |

## Data captured

- Gallery images: 18
- Amenities: Pool, Gym, Clubhouse, Parking, Security
- Key Features groups: Indoor Features, Outdoor Features, Specifications (10 items)
- Nearby places: 11
- Videos: 2

## Notes, assumptions & gaps

- Brochure has no specification/finishes page, payment plan, sales partner name or project-specific phone; key features are limited to published unit/building facts
- Per-unit totalUnits(9)/availableUnits(6) in source conflict with per-floor data, so unitsInPlan/unitsAvailable were omitted; project availableUnits=19 matches the floor tracker
- Source Unit 04 description mentions a maid quarter and five balconies but brochure/plan show neither (brochure text says four balconies); Unit 04 maidsRoom not set
- Brochure location map not extracted as roadMapImages
- Source startDate 2025-08-31 vs started 2025-02-13: used started; groundbreaking video is 2025
- FAQs in source.json not imported (no CMS field)
- Floor ranges: Units 01-03 on 3rd-12th, Units 04-05 on 4th-12th from the floor tracker/brochure plans
- Club house lounge/seating photos labelled by inference (brochure shows them unlabelled; 3rd-floor plan has a club house)
- Nearby: source distances preferred; brochure rounds to 1 km and adds drive times; Park Hospital/HNB only in source
- Marketing office per brochure: No. 52, Sir Marcus Fernando Mawatha, Colombo 10, hotline 0768 78 78 78; email marketing@globalgrouplk.com

_Generated 2026-10-02 from the research files used for the import._

## Second pass: brochure additions applied (2026-10-02)

- Floor-plan facts added: 0 plan updates · Key Features added: 11 · amenities added: 0 · nearby added: 0 · highlights offered: 0
- Description addendum: yes · marketing contact stored: yes
- Left out on purpose (not added):
  - Per-room dimensions on unit plans (pages 12-16) — Printed as bare numbers; several rooms have only one dimension or ambiguous labels, not reliable for all rooms of a type
  - Brochure distances (Keells 500 m, Lanka Hospital 1 km, Asian International School 1 km) — Already present with more precise source distances (550/700/600 m); brochure rounds
  - Nearby Keells, Shalika Ground, Lanka Hospital, Asiri, Havelock City Mall, Asian Intl School, Royal Institute, Isipathana, St Peter's — already present
  - Unit 04 balcony count — Brochure text and plan show four balconies, confirming first-pass note that source's five balconies and maid quarter do not apply
  - Developer track record pages (completed projects, Ocean Breeze, Kingdom Residencies) — developer-level, not project-specific
  - ROI over 200% / over 120% ROI / capital gain claims for other GHR projects (page 24) — marketing claim
  - Company credentials, construction partners, banking partners, head office (No. 75A Arnold Rathnayaka Mawatha, Colombo 10), 12 completed / 6 ongoing, 900+ units, 15 cities — developer-level, not project-specific
  - Brochure copy 'ideal for families, professionals and investors looking for long-term value' — marketing claim
  - Marketing office Colombo 10 address — Reported as printed; if the website lists a different office (e.g. Colombo 07) that is a conflict to confirm; none checked in source.json
  - Two lifts, generator, rainwater tank, indoor pool, gym, club house, 48 units, 12 floors, maid's room Unit 05, pantry — already present
  - Parking space count — not printed (car icons only)
