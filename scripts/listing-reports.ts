// Regenerates docs/listings/<slug>.md (one report per imported listing) from
// the live Payload records, plus the hand-written source/assumption notes
// below. Run with: NODE_ENV=production npx tsx scripts/listing-reports.ts
// (production mode skips Drizzle's schema push, which is what exhausts the
// connection pool while `next dev` is running).
import path from 'node:path'
import { writeFileSync, mkdirSync } from 'node:fs'
import { config as loadEnv } from 'dotenv'
loadEnv({ path: path.join(process.cwd(), '.env.local') })
const payloadConfig = (await import('../payload.config')).default
const { getPayload } = await import('payload')
const payload = await getPayload({ config: payloadConfig })

const SOURCES: Record<string, { site: string; brochures: string[]; notes: string[] }> = {
  'oceana-wadduwa': {
    site: 'https://www.oceana.lk/ — home, villas-in-wadduwa, home/apartments, facilities, activities, payment-plans, about-us, contact-us and all 10 unit pages',
    brochures: ['No project brochure — each unit publishes "Download Floor Plan ft² / m²" PDFs (attached per plan as Downloads, m² drawing shown as the second plan image).'],
    notes: [
      'No unit prices published — every plan is "Contact for pricing". Reservation terms (Rs 1M, 30% in 2 months, 60% interest-free, 10% at handover, or 70% bank loan) lead the pricing block.',
      'Villa bathroom counts are ASSUMED (1BR 1 / 2BR 2 / 3BR 3 / Mansion 3) — not published; confirm with Home Lands. Apartment bathrooms (1) and villa perches (6.1 / 6.1 / 8.15 / 10) are from the unit pages.',
      'Key Specifications differ for apartments vs villas — both in Key Features → Specifications. Nearby landmarks (with drive times) from the unit pages.',
      'Total unit count and handover year are not published. Two of four villa types are marked sold on the villas page, but not which — all left Available.',
      'Generic interior renders removed from the gallery at the owner\'s request; facility/activity photos live under amenities/ (never in the hero). Hero = beach-villa-01 by the owner\'s choice.',
      'Developer Home Lands created new (verification pending); email/socials supplied by the owner (the site masks the address).',
    ],
  },
  'rush-city-dematagoda': {
    site: 'https://www.rushlankagroup.com/projects/rush-city-dematagoda',
    brochures: [
      'South City Tower brochure (attached) — https://rushgroup-s3.s3.ap-southeast-1.amazonaws.com/projects40-rush-city/project-40_rush-city-colombo-9-b-1.pdf (byte-identical to the copy already on R2)',
      'Lifestyle brochure — https://rushgroup-s3.s3.ap-southeast-1.amazonaws.com/projects40-rush-city/project-40_life-style-final.pdf — mirrored to R2 (brochure/rush-city-dematagoda_lifestyle-brochure.pdf) but not linked: a project has a single brochureUrl slot',
      'North City Tower brochure — button exists, no file (Phase 2 not launched)',
    ],
    notes: [
      'Phase 1 (South City Tower, 109 units, 35 levels) selling; Phase 2 not launched. 350+ units across both towers. Hero stat "28" is residential floors, not units. Expected handover 2030-05-25 (page).',
      'Re-pass 2026-09-20 (owner: "info missing"): the page has 7 units in two groups — 1st floor: Aqua Crest (4bd/3ba/2,181), South Crest (3bd/2ba/1,304), Urban Crest (3bd/2ba/1,273); 2nd–28th floor: Units A–D. The first import had only A–D. Crest units added with 2D + 3D images; bed/bath counts checked against the drawings.',
      'Per-floor tracker rows sum to exactly 109 (A 25 + B 27 + C 27 + D 27 + 3 first-floor) = the tower\'s stated total units; Unit A has no rows for floors 9 and 19. Availability snapshot 2026-09-20: 36 available (A 2, B 2, C 17, D 12, each Crest 1) — moves as units sell, so unitsAvailable / floorAvailability are point-in-time. Crest plans skip the per-floor row (it just repeats "floor 1 of 1").',
      'Gallery: all 31 site photos mirrored (9 exterior, 10 interior, 12 common-area — all developer 3D renders). Six common-area shots sit under amenities/ (one per amenity: Gym (Her), Swimming Pool, Children\'s Area, Jogging Track, Multifunctional Room, Parking); the rest stay in gallery/. Room labels follow the lifestyle brochure\'s own captions. Hero unchanged.',
      'Typical floor plan (main brochure p.3) rendered and attached as a download on Units A–D. Main brochure also gave the correct Key Features wording — "Three" elevators (site says "These"), "lighting" (site typo "lightning" ×2), "porcelain tiles", "tile flooring for staircase and lobby" — fixed.',
      'Nearby 8 → 21 from the developer\'s own map page (banks, mosques, temple, market, cinema, police, filling stations) plus the site\'s timings (Baseline Rd & Kolonnawa Rd 1 min, Nalanda College 4 min, Dematagoda station 1 km). "Baseline Road Railway Station" renamed "Baseline Railway Station" per the brochure. No hospitals are published anywhere.',
      'Bedrooms now "2–4" (developer copy says "2/3" but Aqua Crest is 4-bed). Floor range on A–D corrected 1–28 → 2–28. Added ensuite baths (site: 1 attached each; Aqua 2), utility room where a drawing labels one (Aqua, Urban, C, D), maid\'s washroom only on South Crest. Carpark levels 7, floor-area range, highlights and YouTube video (dCe9xizyeRM) added. R2H Realtors (brochure back page: "Sales & Marketing Partner") linked as sales + marketing company.',
      'Gaps / flags: "Powder room: 1" already on Units A, C, D is really the maid\'s toilet on the drawings (left as-is, owner to decide); "Clubhouse" and "Security" are sourced only by Rush\'s Aug 2026 blog / Echelon interview, not the site or brochures (kept); no Dematagoda neighborhood page exists yet; no prices or payment plan published ("Contact us"); the developer\'s JSON-LD geo (6.8794, 79.8653) is wrong — our pin (6.9315162, 79.8808925) matches their own Google Maps link.',
    ],
  },
  'rush-court-5-colombo-14': { site: 'https://www.rushlankagroup.com/projects/rush-court-5-colombo-14', brochures: ['rush-court-5-colombo-14-broucher.pdf (attached)'], notes: ['Units A–C from page unit data; tracker: Unit A all 7 floors sold, B/C floors 1–2 available. Handover 2026.', 'Construction: 8 milestones with photos (Sep 2023 → roof slab / brickwork ongoing).'] },
  'rush-metropolis-dehiwala': { site: 'https://www.rushlankagroup.com/projects/rush-metropolis-dehiwala', brochures: ['rush-metropolis-dehiwala-brochure.pdf (attached)'], notes: ['Units A–G from page unit data (page sqft used; brochure differs by a few sqft). Handover 2028.', 'Per-floor tracker shows EVERY floor sold while marketed as selling — hidden as a placeholder; confirm.', 'Construction: 6 milestones with photos. Sales & marketing partner Rush2Homes.'] },
  'rush-residencies-allen-dehiwala': { site: 'https://www.rushlankagroup.com/projects/rush-residencies-allen-dehiwala', brochures: ['project-37_rra-brochure.pdf (attached)'], notes: ['Units A–D from page unit data; only Unit A floor 14 shows available. Handover 2029.', 'Construction: site clearing ongoing (2026).'] },
  'rush-tower-2-dehiwala': { site: 'https://www.rushlankagroup.com/projects/rush-tower-2-dehiwala', brochures: ['rush-tower-2-dehiwala-brochure.pdf (attached)'], notes: ['Units A–F from page unit data (A and F: 3 bathrooms per the developer). Only Unit A floor 1 available. Handover 2026.', 'Construction: 9 milestones with photos (Dec 2021 → MEP in progress).'] },
  'street-rush-residencies-mount-lavinia': { site: 'https://www.rushlankagroup.com/projects/street-rush-residencies-mount-lavinia', brochures: ['street-rush-residencies-mount-lavinia-broucher.pdf (attached)'], notes: ['Units A–E (1–4 bed) from page unit data; available floors per unit from the tracker. Handover 2028.', 'Construction: 4 milestones with photos (Nov 2024 → foundation in progress).'] },
  'maimoona-residencies-dehiwala': { site: 'https://www.rushlankagroup.com/projects/maimoona-residencies-dehiwala', brochures: ['None published'], notes: ['Units A–C (2BR 1,280 / 1BR 618 / 3BR 1,898 sqft) from page unit data. 12 apartments, handover 2027. Tracker shows every floor sold — hidden as placeholder.', 'Milestones exist (Feb 2024 → ground floor slab in progress) but carry no photos — description text only.'] },

  // Prime Lands houses batch (2026-09-09) — https://www.primelands.lk/house/en
  // lists 19 house projects; 2 (Cest La Vie – Thalawathugoda, Viva La Vida –
  // Kottawa) already existed and were skipped. First pass (2026-09-09
  // morning) only read one sample type per project; the user caught this
  // ("you have missed lots of floor plans") and asked for every page to be
  // checked properly. Second pass (same day, afternoon) read every unit/lot
  // type's own drawing for all 17 projects — 104 types total, every
  // bed/bath/sqft figure printed on that type's own drawing (summed across
  // floors where a unit spans more than one, per the multi-floor lesson
  // below). The only unconfirmed gaps left are types the developer never
  // published a drawing for at all (Prime Urban Art B/C/D/E/SS-A/SS-D;
  // Waterfall A/B) — noted per project. Also fixed in this pass, caught by
  // the user while reviewing: hero images that were bare project logos or a
  // single unit type's marketing render (misrepresenting the whole project)
  // on 14 of the 17 — swapped for a real, generic exterior/site photo from
  // each project's own gallery; project names that repeated the city in the
  // hero title ("Prime Urban Art - Kottawa") — shortened to just the brand
  // name (city already shows on the line below); and Key Features/Nearby
  // Places, built from feature bullets that had only been used for amenity
  // and payment-plan matching until re-examined.
  '88-residence-kahathuduwa': { site: 'https://www.primelands.lk/house/88-RESIDENCE-KAHATHUDUWA/en', brochures: ['88-residence-kahathuduwa_brochure.pdf (attached)'], notes: ['All 3 types confirmed: A (3bd/2ba/1,490 sqft), B (3bd/2ba/1,354 sqft), C (3bd/2ba/1,282 sqft) — each a 2-storey unit, ground+first floor areas summed per drawing.', 'Payment plan published: Rs. 10M down payment to move in today, balance over 10 years via bank loan.', '3 nearby transport points from the page (bus route, proposed highway entrance).'] },
  'clover-thalawathugoda': { site: 'https://www.primelands.lk/house/CLOVER-THALAWATHUGODA/en', brochures: ['clover-thalawathugoda_brochure.pdf (attached)'], notes: ['All 16 types (A–R, skipping I/O) confirmed — each drawing prints its own "Total Floor Area" so no summing was needed. 3–4 bed, 2–3 bath (+ a powder room on several), 2,415–3,274 sqft.', 'Key Features (Specifications: A/C, timber flooring, European toilet fittings, teak/mahogany doors, etc.) added from the brand\'s standard-fittings bullet list.', 'No payment-plan bullets published on this page (price Rs 118.5M is a "from" figure). No nearby-distance bullets published either.'] },
  'courtyard-by-prime-samagi-mawatha-thalawathugoda': { site: 'https://www.primelands.lk/house/COURTYARD-BY-PRIME-SAMAGI-MAWATHA-THALAWATHUGODA/en', brochures: ['courtyard-by-prime-samagi-mawatha-thalawathugoda_brochure.pdf (attached)'], notes: ['All 10 types (A–J) confirmed — each is a 3-storey unit; ground+first+second floor areas (printed per floor) summed per drawing. 4BR types (A–D) total 3,414–3,416 sqft; 3BR types (E–G) 2,910 sqft; 3BR (H–I) 2,477 sqft; 3BR (J) 3,249 sqft. All floor images attached as Downloads.', 'Key Features (private elevator, Padel Court, resident lounge, outdoor kitchen) and 3 nearby places (Thalawathugoda Town, bus route, Vidura College) added from the page\'s bullet list.', 'Payment plan published: 25% down, 1% monthly ×30, 5% at months 12 & 24, 35% at handover.'] },
  'elemint-suites-gampaha': { site: 'https://www.primelands.lk/house/ELEMINT-SUITES-GAMPAHA/en', brochures: ['No brochure found on the page'], notes: ['All 7 types (A–G) confirmed — A–F are 2-storey (ground+first summed per drawing; A was corrected from a ground-floor-only 899 sqft first read to its real 1,728 sqft total), G is a single-storey 855 sqft unit with its own printed total.', 'Key Features (jogging track, kids\' play area) and 2 nearby points (Colombo–Kandy road, Gampaha town) added.', 'Payment plan published: 40% down within 12 months, bank loan available for the balance.'] },
  'kaloora-kalutara': { site: 'https://www.primelands.lk/house/KALOORA-KALUTARA/en', brochures: ['No brochure found on the page'], notes: ['All 6 types (A–F) confirmed from their drawings — A/B are the same 1,182 sqft footprint (A has an extra bathroom), C 1,464 sqft (+powder), D 1,316 sqft, E 812 sqft (single storey), F 858 sqft (single storey, +powder).', 'Key Features (indoor cricket area, multifunctional room) added.', 'Payment plan published: 30% down (90 days), 1% monthly ×33, 10% bullet payments (months 12 & 24), 22% balance at handover (month 34).'] },
  'magna-mattegoda': { site: 'https://www.primelands.lk/house/MAGNA-MATTEGODA/en', brochures: ['magna-mattegoda_brochure.pdf (attached)'], notes: ['All 3 types (A–C) confirmed — each single-storey with its own printed total: A 742, B 774, C 848 sqft, all 2bd/1ba.', '4 nearby transport points added (transport hub, two bus routes, highway entrance, all with stated minutes rather than km).', 'No price or payment-plan terms published ("Contact for pricing").'] },
  'prime-evoke-kadawatha': { site: 'https://www.primelands.lk/house/PRIME-EVOKE-KADAWATHA/en', brochures: ['prime-evoke-kadawatha_brochure.pdf (attached)'], notes: ['All 9 types confirmed: B (2bd/1ba/752), C (2/1/774), D (2/1/761), E (2/1/774), F (2/1/765), F1 (3/1/1,142 — 2-storey), G (2/1/731), H (2/1/761), H1 (3/2/1,165 — 2-storey). No "Type A" exists on this site — B is the first type published.', "Key Features (kids' play area) and 2 nearby points (Kadawatha/Kandy highway) added."] },
  'prime-life-kadawatha': { site: 'https://www.primelands.lk/house/PRIME-LIFE-KADAWATHA/en', brochures: ['prime-life-kadawatha_brochure.pdf (attached)'], notes: ['Both types confirmed — A and B are the same 2-storey layout (Ground 713 + First 642 with balcony = 1,355 sqft; the ground-floor-only 713 figure was initially mistaken for the total, corrected), 3bd/2ba each. Both floors attached as Downloads.', 'Key Features (10-year structural warranty, scenic roof terrace) and 3 nearby points (Mankada road, Kadawatha town, highway entrance) added.', 'No price published ("Contact for pricing"); title has no city suffix on the source site — city inferred from the project location and confirmed against the page address.'] },
  'prime-urban-art-kottawa': { site: 'https://www.primelands.lk/house/PRIME-URBAN-ART-KOTTAWA/en', brochures: ['prime-urban-art-kottawa_brochure.pdf (attached)'], notes: ['Both types with a published drawing are confirmed: A1 (2bd/2ba/1,383 sqft) and A2 (3bd/2ba+1 powder/1,433 sqft). 6 more tabs (B, C, D, E, SS-A, SS-D) exist on the site\'s type list but the developer never attached a drawing image to any of them — genuinely nothing to confirm, not a missed page.', 'Key Features (servant toilet, 1000L water tank, basketball/badminton courts, roof terrace) added.', 'No price published ("Contact for pricing").'] },
  'prime-villas-dalugama': { site: 'https://www.primelands.lk/house/PRIME-VILLAS-DALUGAMA/en', brochures: ['prime-villas-dalugama_brochure.pdf (attached)'], notes: ['All 3 types (A–C) confirmed — A single-storey 1,002 sqft; B and C are 2-storey (ground+first summed), 1,586 and 1,517 sqft.', 'Key Features (hot water facility, pet friendly) added.', 'Payment plan published: Rs 1,000,000 reservation fee, 30% down within 3 months, bank loan available for the balance.'] },
  'prime-villas-nugegoda': { site: 'https://www.primelands.lk/house/PRIME-VILLAS-NUGEGODA/en', brochures: ['prime-villas-nugegoda_brochure.pdf (attached)'], notes: ['All 13 lots (01, 02, 04, 06–12, 14, 16, 17 — the site skips 03, 05, 13, 15) confirmed from their drawings, 1,516–2,002 sqft, all 3-bedroom.', 'No price published ("Contact for pricing"); no Key Features or nearby-distance bullets published on this page.'] },
  'prime-villas-thalawathugoda-weera-mawatha': { site: 'https://www.primelands.lk/house/PRIME-VILLAS-THALAWATHUGODA-WEERA-MAWATHA/en', brochures: ['prime-villas-thalawathugoda-weera-mawatha_brochure.pdf (attached)'], notes: ['All 4 lots confirmed, each with its drawing\'s own printed "Total Floor Area": Plan 8293 Lot 2 (3bd/3ba/2,227), Lot 3 (3/2/1,543), Plan 8294 Lot 2 (3/2/2,008), Lot 3/4/5 (3/2/1,943).', 'No price published ("Contact for pricing"); no Key Features or nearby bullets on this page. Distinct from "Prime Villas (Dalugama)" and "Prime Villas (Nugegoda)" — same brand, three different sites; "(Weera Mawatha)" kept in the name to tell the three apart.'] },
  'scottish-island-digana': { site: 'https://www.primelands.lk/house/SCOTTISH-ISLAND-DIGANA/en', brochures: ['scottish-island-digana_brochure.pdf (attached)'], notes: ['All 3 types confirmed: A (3bd/2ba/1,856 sqft, has an explicit summary block on its drawing), B and C (3bd/3ba each — no legible total sqft printed on either floor of B/C\'s drawings, left blank/"Contact for pricing"-style rather than guessed).', 'Key Features (A/C, timber flooring, European fittings, teak/mahogany doors) added — same standard-fittings template as Clover.', 'Only project in this batch outside Colombo/Gampaha/Kalutara — Digana is Kandy District, Central Province.'] },
  'signature-villas-nugegoda': { site: 'https://www.primelands.lk/house/SIGNATURE-VILLAS-NUGEGODA/en', brochures: ['signature-villas-nugegoda_brochure.pdf (attached)'], notes: ['All 5 types (A–E) confirmed — each drawing has an explicit summary block: A (3/3/2,455), B (3/3/2,372), C (4/3/2,839), D (4/3/2,801), E (3/3/2,854).', 'Key Features (A/C provision, geezer hot water, pantry cupboard set, water tank) added.', 'No price published ("Contact for pricing"); title has no city suffix on the source site — city inferred from the project location and confirmed against the page address.'] },
  'the-residence-samagi-mawatha-thalawathugoda': { site: 'https://www.primelands.lk/house/THE-RESIDENCE-SAMAGI-MAWATHA-THALAWATHUGODA/en', brochures: ['the-residence-samagi-mawatha-thalawathugoda_brochure.pdf (attached)'], notes: ['Structured differently from every other project in this batch: the site publishes one "MASTER PLAN" (a 22-lot site/block layout, each lot split into 4 townhouse units A–D) plus per-floor drawings rather than per-type tabs. Re-derived as 2 real unit types: "Type A-B (3 Bed)" (Ground Floor 986 sqft; Total Area 2,012 sqft — both printed on the ground-floor drawing) and "Type C-D (2 Bed)" (986 sqft, single storey) — both confirmed from the drawings. The master-plan image is kept as a "Site Plan (Lot & Unit Layout)" gallery photo, not a floor plan.', '3 nearby points (bus route/SLIIT, Thalawathugoda town, Vidura College) added.', 'Payment plan published: 30% down, 5% monthly, 15% balance at handover.'] },
  'water-estate-moratuwa': { site: 'https://www.primelands.lk/house/WATER-ESTATE-MORATUWA/en', brochures: ['water-estate-moratuwa_brochure.pdf (attached)'], notes: ['All 15 types confirmed ("Type 1, 2" through Type 18, skipping 9/13; two — 14 and 15 — share an identical mirrored layout). Single-storey types (3–11) read straight off one explicit "TOTAL SQFT" label each; 2-storey types (1/2, 12, 14–18) summed from ground+first.', 'Hero image was a Type-4-labeled render with no view of the actual property from outside — swapped for a clean lifestyle photo (kayaking on the estate\'s lake) from the gallery; the old render kept, demoted to the end of the gallery.', 'No price published ("Contact for pricing"); no Key Features or nearby bullets on this page.'] },
  'waterfall-residencies-malabe': { site: 'https://www.primelands.lk/house/WATERFALL-RESIDENCIES-MALABE/en', brochures: ['waterfall-residencies-malabe_brochure.pdf (attached)'], notes: ['Only Type C has a published drawing (3bd/2ba/1,627 sqft, confirmed) — Types A and B are listed on the site with no image attached to either, so genuinely nothing to confirm for those two.', 'Key Features are unusually rich here — yoga deck, sunset deck with Colombo skyline views, outdoor fitness center, hiking trail, bicycle paths, concierge, BBQ area, a 100ft rock waterfall, communal vegetable patch, compost system, solar lighting — all added.'] },
  // Excello (excello.lk) — owner asked 2026-09-20 for every ongoing (In Progress) project, no completed/sold ones,
  // new developments only. Excello's archive has 7 projects; only these 3 are In Progress. Created as unpublished drafts.
  'aathavan-apartments-dehiwala': {
    site: `https://excello.lk/projects/aathavan-dehiwala-apartment — plus the unit availability register embedded at https://excello.lk/aathavan-availability (https://aathavan-unit-availability.excellodesign.chatgpt.site) and the launch note https://excello.lk/insights/aathavan-residential-project-launched (7 Aug 2026)`,
    brochures: [`No brochure published — the register page and project page are the only sources.`],
    notes: [
      `Excello is the developer (page: "Developer, architecture, interiors and build coordination"). 44 residences at No. 6, Carron Place, Dehiwala; 2- and 3-bedroom, selected 3-bedroom units with maid's quarters; launched Aug 2026.`,
      `The register lists all 44 units: Types 1–8, floors 1–7, size, price and status. Snapshot 2026-09-20: 27 Available, 17 Reserved (floors 6–7 all reserved, plus 403, 502, 505). "Reserved" is stored as not-available — it is not "sold". The register is "checked daily", so unitsAvailable / floorAvailability are point-in-time.`,
      `Prices are Excello's own "standard prices", calculated at LKR 40,000 per sq.ft. (promotional / negotiated / launch prices may differ). Every unit's price was checked to equal size × 40,000. Payment: LKR 1M reservation, 30% down payment, 22 monthly instalments for the 70% balance (register page).`,
      `NOT published, so left blank: bathroom counts (stored as 0 = hidden; the plan page shows no Baths chip), floor-plan drawings (plan pages fall back to the project photos), handover date, ownership type, parking count, total floors, nearby place names (page only says "close to hospitals, schools, transport links").`,
      `Gallery: 8 photos + hero, all developer 3D renders (4 exterior, a landscaped walkway, living, dining, bedroom, bathroom). A near-duplicate low-resolution copy of the entrance render was skipped. Amenities from the page: Parking, Gym + Rooftop (rooftop gym), Outdoor Gym (outdoor exercise areas), Multifunctional Room (community hall); solar infrastructure and rainwater management are in Key Features.`,
      `Location: pin is the OpenStreetMap centre of Carron Place (Pamankada, Kalubowila, Dehiwala) — lane-level, not the building. Linked to the Dehiwala neighborhood page.`,
    ],
  },
  'panimozhi-club-house-kalkudah': {
    site: `https://excello.lk/projects/panimozhi-club-house`,
    brochures: [`None published.`],
    notes: [
      `Excello's site describes only its own role ("hospitality concept, architecture, interior design and project delivery") and offers no sale terms. The owner told us on 2026-09-20 that Panimozhi is a property that can be bought and run as a hotel, so it is listed as a Hospitality property — that buy-and-operate fact comes from the owner, not from Excello's website. No price or completion date is published ("Contact Excello").`,
      `A 15-room coastal retreat close to the beach in Kalkudah. Badge: Hospitality. Type stored as "Hotel / Coastal Retreat" (no hotel option in the type list). Status Under Construction (from Excello's "In Progress"). Published 2026-09-20.`,
      `8 render photos (7 + hero). No room types, floor plans, amenities list or nearby places published. Pin is the Kalkudah village centre (approximate, Street View off) — the site's exact location is not published.`,
    ],
  },
  'rudra-wellness-retreat-kalkudah': {
    site: `https://excello.lk/projects/rudra-wellness-retreat-kalkudah`,
    brochures: [`None published.`],
    notes: [
      `A proposed (concept-stage) 25-acre wellness village in Kalkudah: 48 fully furnished villas "offering opportunities for ownership and potential hospitality use" plus a 27-room holiday retreat, with community-empowerment initiatives. Excello's role: master planning, architecture, property development, hospitality and wellness concept development.`,
      `Excello's archive says "In Progress" but the page and meta description say "concept" / "proposed", so status is Coming Soon. Badge: Hospitality (owner's request — added as a new marketing-badge option).`,
      `18 render photos: master-plan aerial filed as the Block Plan; hero is a villa exterior; 16 gallery photos labelled neutrally (the page doesn't caption them, so no facility claims were made). No villa sizes, types, prices or timeline published; no floor plans. Pin is the Kalkudah village centre (approximate, Street View off).`,
    ],
  },
}

// Rush Lanka Group COMPLETED projects — imported 2026-09-21 as unpublished drafts from each project's own page on
// rushlankagroup.com (owner: "add the completed projects"). Skipped on purpose: rush-courts-colombo-14 (a duplicate URL
// of Rush Court 5 — same project id 10), al-kareem-tower-borella (a commercial office tower, not a home) and the hidden
// Rush Tower 3 (14 apartments, 2030, no data).
const RUSH_COMPLETED_EXTRA: Record<string, string> = {
  'rush-residencies-watarappala': `Rush's unit tracker lists 40 rows while its page headline says 35 apartments — their own numbers disagree; the headline is used for total units. Rush's own Google Maps link for this project is a copy of the Dehiwala project's ("Rush Residencies, No 15 Campbell Pl"), so the pin is instead the area-level OpenStreetMap point for Watarappala Road, Ratmalana (Street View off) — ask Rush for the real site.`,
  'rush-ebenez-dehiwala': `Rush's unit tracker lists 24 rows while its page headline says 26 apartments — their own numbers disagree; the headline is used for total units. Only a 2D drawing is published for each unit (no 3D render).`,
  'rush-residencies-colombo-6': `Rush's unit tracker lists 24 rows while its page headline says 25 apartments — their own numbers disagree; the headline is used for total units.`,
  'rush-reliance-mount-lavinia': `Unit B's 2D drawing is not available on Rush's site (the file 404s) — that plan is stored without an image.`,
  'rush-residencies-kawdana': `Unit J's 2D drawing is not available on Rush's site (the file 404s) — that plan is stored without an image.`,
  'rush-tower-dehiwala': `Only a 3D plan render is published for each unit (no 2D drawing) — the render is used as the plan image.`,
  'rush-court-2-kolonnawa': `Only a 3D plan render is published for each unit (no 2D drawing) — the render is used as the plan image.`,
  'rush-homes-dehiwala': `Only a 3D plan render is published for each unit (no 2D drawing) — the render is used as the plan image.`,
  'rush-residencies-dehiwala': `Only a 2D drawing is published for each unit (no 3D render), and one unit type has no plan image at all.`,
  'rush-villa-dehiwala': `Villa project (2 units): no unit types or tracker are published, so no floor plans and no sold claim. Type "Luxury Villas" is inferred from Rush's own history page ("ultra-luxury villa projects: Rush Villa Saranankara 2010, Rush Palm Grove 2012, Rush Villa Park Road 2012"). Pin comes from a coordinate-only Google Maps link.`,
  'rush-palm-grove-colombo-3': `Villa project (1 unit): no unit types or tracker are published, so no floor plans and no sold claim. Type "Luxury Villas" is inferred from Rush's history page ("ultra-luxury villa projects").`,
  'rush-park-colombo-5': `Villa project (2 units): no unit types, tracker or gallery photos are published — the listing has only the site's thumbnail and a road map. Type "Luxury Villas" is inferred from Rush's history page.`,
}
for (const s of ['rush-court-4-mount-lavinia', 'rush-court-3-ratmalana', 'rush-residencies-watarappala', 'rush-reliance-mount-lavinia', 'rush-residencies-kawdana', 'rush-tower-dehiwala', 'rush-court-2-kolonnawa', 'rush-homes-dehiwala', 'rush-ebenez-dehiwala', 'rush-residencies-dehiwala', 'rush-palm-grove-colombo-3', 'rush-park-colombo-5', 'rush-broadway-grandpass', 'rush-villa-dehiwala', 'rush-residencies-colombo-6']) {
  SOURCES[s] = {
    site: `https://www.rushlankagroup.com/projects/${s} (listed under Completed Projects: https://www.rushlankagroup.com/projects/completed)`,
    brochures: [`None published on the project page.`],
    notes: [
      `Imported 2026-09-21 as an unpublished draft (owner: "add the completed projects"). Status Completed; handover year from the page's own handover date.`,
      `Unit sizes, bedrooms, bathrooms and maid's rooms are parsed from Rush's unit data; every unit's tracker row shows sold, so plans are marked Sold Out (per-floor rows are not stored, since "None — all N floors sold" reads oddly for a finished building). No price, payment plan or brochure is published.`,
      `Hero = the site's own thumbnail (a photo of the completed building), checked visually. Pin = Rush's own Google Maps link — the JSON-LD location on Rush's pages is a placeholder that is 1–7 km off on every project. Key Features come from the page's specification groups; amenities only where the page names a supported facility.`,
      ...(RUSH_COMPLETED_EXTRA[s] ? [RUSH_COMPLETED_EXTRA[s]] : []),
    ],
  }
}

const fmt = (v: unknown) => (v === undefined || v === null || v === '' ? '—' : String(v))
const cell = (v: unknown) => fmt(v).replace(/\|/g, '\\|')
mkdirSync(path.join(process.cwd(), 'docs/listings'), { recursive: true })
let index = '# Listing reports\n\nOne file per listing built from a developer\'s website — what was captured, where it came from, and what is assumed or missing. Regenerate with `NODE_ENV=production npx tsx scripts/listing-reports.ts`; the live record in `/cms` is the source of truth. Open questions across all listings: [FOLLOW-UPS.md](FOLLOW-UPS.md).\n\n'
for (const [slug, src] of Object.entries(SOURCES)) {
  const res = await payload.find({ collection: 'projects', where: { slug: { equals: slug } }, limit: 1, depth: 1, overrideAccess: true })
  const p = res.docs[0]
  if (!p) continue
  const dev = typeof p.developer === 'object' ? p.developer?.name : p.developer
  const plans = p.floorPlans ?? []
  const gallery = p.gallery ?? []
  const byFolder = (f: string) => gallery.filter((g) => g.image?.includes(`/${f}/`)).length
  const L: string[] = []
  L.push(`# ${p.name}`, '', `- **Slug:** \`${slug}\` · **Developer:** ${fmt(dev)} · **Published:** ${p.isPublished ? 'yes' : 'no'}`, `- **Source:** ${src.site}`, `- **Location:** ${fmt(p.location)}${p.road ? `, ${p.road}` : ''}, ${fmt(p.city)}, ${fmt(p.district)} District, ${fmt(p.province)} Province`, `- **Type / status:** ${fmt(p.type)} · ${fmt(p.status)} · units ${fmt(p.units)} · floors ${fmt(p.floors)} · beds ${fmt(p.bedrooms)} · expected handover ${fmt(p.completionYear)}`, `- **Payment plan badge:** ${fmt(p.paymentPlanBadge)} · **Deposit terms:** ${p.depositPaymentStructure ? 'yes' : '—'}`, `- **Brochure on listing:** ${p.brochureUrl ?? '—'}`, `- **Live:** /projects/${slug}`, '')
  L.push('## Floor plans', '', '| Plan | Beds | Baths | SqFt | Perches | 2D | m² | 3D | Downloads | Availability | Available floors |', '|---|---|---|---|---|---|---|---|---|---|---|')
  for (const fp of plans) {
    const fa = fp.floorAvailability ?? []
    const open = fa.filter((f) => f.available).map((f) => f.floor).join(', ')
    L.push(`| ${cell(fp.planName)} | ${fp.bedrooms} | ${fp.bathrooms} | ${fp.floorAreaSqFt} | ${fmt(fp.landPerches)} | ${fp.image ? '✅' : '—'} | ${fp.imageMetric ? '✅' : '—'} | ${fp.image3d ? '✅' : '—'} | ${(fp.planDocuments ?? []).length || '—'} | ${fmt(fp.availability)} | ${fa.length ? (open || 'none') + ` of ${fa.length}` : '—'} |`)
  }
  L.push('', '## Media (Cloudflare R2, media.lankanewhomes.com)', '', `- Hero: ${p.heroImage ?? '—'}`, `- Property photos (gallery/): ${byFolder('gallery')} · amenity photos (amenities/): ${byFolder('amenities')} · road map: ${byFolder('road-map') ? 'yes' : '—'}`, `- Construction updates (dated photos): ${(p.constructionUpdates ?? []).length}`, '')
  if ((p.constructionUpdates ?? []).length) { L.push('| Date | Milestone |', '|---|---|'); for (const c of p.constructionUpdates ?? []) L.push(`| ${String(c.date).slice(0, 10)} | ${cell(c.note)} |`); L.push('') }
  L.push('## Data captured', '', `- Amenities: ${(p.amenities ?? []).map((a) => a.name).join(', ') || '—'}`, `- Key Features groups: ${(p.unitFeatures ?? []).map((g) => `${g.label || g.key_other || g.key} (${(g.items ?? []).length})`).join(', ') || '—'}`, `- Nearby places: ${(p.nearby ?? []).length}`, `- Contact: ${fmt(p.contact?.name)} · ${fmt(p.contact?.phone)} · ${fmt(p.contact?.email)}`, `- Project verification checklist: ${p.isVerified ? 'verified' : 'not yet'}`, '')
  L.push('## Sources & brochures', '', ...src.brochures.map((b) => `- ${b}`), '', '## Notes, assumptions & gaps', '', ...src.notes.map((n) => `- ${n}`), '', `_Generated ${new Date().toISOString().slice(0, 10)} from the live Payload record._`, '')
  writeFileSync(path.join(process.cwd(), 'docs/listings', `${slug}.md`), L.join('\n'))
  index += `- [${p.name}](${slug}.md) — ${fmt(p.type)}, ${fmt(p.location)}; ${plans.length} plans, ${gallery.length} images${p.brochureUrl ? ', brochure' : ''}, handover ${fmt(p.completionYear)}\n`
  console.log('wrote docs/listings/' + slug + '.md')
}
writeFileSync(path.join(process.cwd(), 'docs/listings/README.md'), index)
process.exit(0)
