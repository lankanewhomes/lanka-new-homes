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
