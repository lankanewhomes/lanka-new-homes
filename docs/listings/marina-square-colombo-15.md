# Marina Square - Uptown Colombo (imported 2026-11-08)

Owner request: "do this listing" (https://marinasquare.lk/en). **Published.** Project id 189, `/projects/marina-square-colombo-15`. Developer created: Access Engineering PLC (id 76, `access-engineering-plc`). Script: `scripts/import-marina-square.ts`.

## Sources
Site pages: home, condo-types, penthouses, compare-apartments, project-progress, gallery, indulgence, faq, about-us, plus the "Typical Floor Plans" PDF. 38 gallery renders, 2 floor plans (2D + 3D) and the PDF were mirrored to R2.

## Captured
- Colombo 15, five towers on five acres; construction milestones 100% incl. COC received, internal finishing ongoing (status Nearly Complete / Finishing).
- Two floor-plan rows, both 4-bedroom penthouses on levels 35-36: 4 D/E (2,104 sq ft, from LKR 192,209,929) and 4 F/G (2,047 sq ft, from LKR 172,222,237). 4 baths, maids room, 2 car parks (compare page, FAQ).
- 11 amenities, 3 nearby places, payment plan wording, contact phone, 5 reference links.

## Missing / assumed
- **Only two unit types are shown on the site**, both penthouses. The 1 to 3 bedroom types the site mentions have no sizes, prices or availability anywhere, so they are not rows. Open question: ask whether the rest is sold out.
- No handover date, unit/floor counts, or payment-plan terms are published ("interest free payment plans", customised).
- Neighbourhood: none exists for Colombo 15, so the custom value "Colombo 15 (Mutwal)" is used. Open question: create a Colombo 15 neighbourhood page.
- F/G view is "City / Mountain"; only City View exists in the picker.
- Contact email `inquiries@01awards.lk` is what the site publishes (looks like an agency address).
- Progress photos not added (the site's month labels do not map reliably to image batches). Individual brochures are not published; the typical-floor-plans PDF is used as the brochure.

## Update 2026-11-09 (`scripts/update-marina-square-hero-extras.ts`)
- Description shortened to two short paragraphs (owner: "too much").
- Hero pills added: map pin (6.95226, 79.85592, from the developer's Google Maps embed on /en/contact, so Map and Street View show), YouTube video, Matterport show-apartment tour, and a site plan (page 1 of the "Aerial view" PDF) as the Block Plan. No Road Map pill: the site publishes no road map.
- Colombo 15 neighbourhood (id 160) set to published. The live page kept serving a cached 404 for a while after publishing (data in Supabase is isPublished true).

## Update 2026-11-09 (second pass)
| Change | Detail |
|---|---|
| Progress | Construction stage 100%, status note, 12 monthly progress photos (Mar 2025 to Feb 2026) from /en/location-living/project-progress. `scripts/update-marina-square-progress-amenities.ts` |
| Amenities | 25 from /en/indulgence and its social, active and wellness pages (medical center and childcare center are mentioned in the Spa description; they are not in the amenity list). |
| Payment | Badge "Interest-Free Payment Plans" plus payment plan lines and financing note in the pricing section. |
| Site plan | "Aerial view" PDF page also added to the Photos gallery (4th photo). |
| Floor plates | Six typical floor pages of the "Typical Floor Plans" PDF added as Block Plan images (`scripts/add-marina-square-floor-plates.ts`). They label units 1A to 4G with view direction but give no sizes, bathrooms or prices, so no per-unit floor-plan rows were made. |
| Contact | Sales gallery, 250 Srimath Ramanathan Mawatha, Colombo 15, phone +94 76 305 0000, no email (the agency email was removed). |

## Update 2026-11-09 (third pass)
| Change | Detail |
|---|---|
| URL | Slug renamed to `marina-square-uptown-colombo` (owner request). Old `/projects/` and `/listing-preview/` URLs redirect. R2 files stay under the old `projects/marina-square-colombo-15/` folder. The stale old-slug row in `public.projects` was removed after the new row existed. Older scripts here still use the old slug. |
| Status | Construction status Completed, status Now Selling. |
| Banking partners | New `bankingPartners` field (own row in Pricing): DFCC, Commercial Bank, Sampath Bank (from /en/about-us). Migration `20261109120000_projects_banking_partners.sql`. |
| Neighborhood | 25 places added with coordinates (Wikipedia article positions, straight-line distances from the pin) by `scripts/add-marina-square-nearby.ts`; the three developer-stated items are kept. |
| Contact card | Email row removed from the listing contact card for all projects and land (owner request). |

## Update 2026-11-09 (floor plans from the developer's own pages)
Owner: list every floor plan on the PDF, mark sold-out ones, give each its own detail page. The PDF itself has only unlabelled-size floor plates (vector, no sizes or bathrooms), so the real data came from the developer's own condo-types pages (Wayback snapshot 2022-12-06, still hosting the plan images). `scripts/update-marina-square-floor-plans-from-developer.ts` replaced the 29 placeholder rows with 18 design rows plus the two penthouses (20 floor plans, each with its own `/floor-plans/<slug>` page, all returning 200).

| Design | Size sq ft | Beds / baths | Floors (towers) | Status |
|---|---|---|---|---|
| 4 D/E, 4 F/G | 2,104, 2,047 | 4 / 4 | 35-36 (D, J, P) | Available (only ones on the current site) |
| 3 P-TR/Q-TR duplex | 1,822 | 3 / 3 | 6-7 (D, J, P) | Sold Out |
| 3 A, 3 B, 3 C, 3 R | 1,292, 1,107, 1,313, 1,197 | 3 / 2 | 5-31 (B, C) | Sold Out |
| 3 F/G/H/J | 1,074 | 3 / 2 | 11-34 (D, J, P) | Sold Out |
| 2.5 P-TR/Q-TR, 2 P-TR/Q-TR duplex | 1,824, 1,708 | 2.5 and 2 / 2 | 6-7 (D, J, P) | Sold Out |
| 2 L/M, 2 F/G, 2 H/J, 2 S, 2 T | 1,074, 961, 904, 846, 885 | 2 / 2 | various | Sold Out |
| 2 A/B/C/D, 1.5 A/B/C/D | 736, 741 | 2 and 1.5 / 1 | 7-10 (D, J, P) | Sold Out |
| 1 A/B, 1 C/D, 1 E | 625, 568, 727 | 1 / 1 | various | Sold Out |

Sold-out basis: the current developer site lists only 4 D/E and 4 F/G; 1 A/B to 2 A/B/C/D were explicitly marked SOLD OUT in the 2022 snapshot. The 2022 "price from" figures for the other designs are not entered (outdated). Open question: confirm with the developer that the 3 and 2 bedroom designs are truly sold out.

## Update 2026-11-09 (key features, design count)
| Item | Detail |
|---|---|
| Key Features | 3 groups, 13 items (Indoor, Building & Services, Outdoor) from the developer's compare/unit pages, FAQ and progress page. `scripts/add-marina-square-key-features.ts` |
| Design count | The home page says "21 designs". The developer's condo-types page has listed 20 distinct designs in every archived snapshot since Dec 2021 (the only extras were a "test" page in Jan 2025 and an old name for the 1.5 design). The listing shows 20. Open question: ask the developer what the 21st is. |
| Brochure | The site has no brochure; its downloads are only the Typical Floor Plans and Aerial view PDFs. |
