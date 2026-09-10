// Regenerates docs/listings/<slug>.md (one report per imported listing) from
// the live Payload records, plus the hand-written source/assumption notes
// below. Run with: NODE_ENV=production npx tsx scripts/listing-reports.ts
// (production mode skips Drizzle's schema push, which is what exhausts the
// connection pool while `next dev` is running).
import path from 'node:path'
import { writeFileSync, mkdirSync } from 'node:fs'
import { config as loadEnv } from 'dotenv'
loadEnv({ path: path.join(process.cwd(), '.env.local') })
const payloadConfig = ((await import('../payload.config')) as any).default
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
    brochures: ['South City Tower brochure (attached)', 'Lifestyle brochure (downloaded, not attached)', 'North City Tower brochure — button exists, no file (Phase 2 not launched)'],
    notes: [
      'Phase 1 (South City Tower, 109 units, 35 levels) selling; Phase 2 not launched. 350+ units across both towers. Hero stat "28" is residential floors, not units.',
      'Units A–D specs, 2D/3D images and per-floor availability from the page\'s unit data. Expected handover 2030 (page).',
      'Some S3 gallery images returned 403 intermittently — 6 extra exterior/interior shots not mirrored. No construction tracker yet.',
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
}

const fmt = (v: unknown) => (v === undefined || v === null || v === '' ? '—' : String(v))
const cell = (v: unknown) => fmt(v).replace(/\|/g, '\\|')
mkdirSync(path.join(process.cwd(), 'docs/listings'), { recursive: true })
let index = '# Listing reports\n\nOne file per listing built from a developer\'s website — what was captured, where it came from, and what is assumed or missing. Regenerate with `NODE_ENV=production npx tsx scripts/listing-reports.ts`; the live record in `/cms` is the source of truth. Open questions across all listings: [FOLLOW-UPS.md](FOLLOW-UPS.md).\n\n'
for (const [slug, src] of Object.entries(SOURCES)) {
  const res = await payload.find({ collection: 'projects', where: { slug: { equals: slug } }, limit: 1, depth: 1, overrideAccess: true })
  const p: any = res.docs[0]
  if (!p) continue
  const dev = typeof p.developer === 'object' ? p.developer?.name : p.developer
  const plans: any[] = p.floorPlans ?? []
  const gallery: any[] = p.gallery ?? []
  const byFolder = (f: string) => gallery.filter((g) => g.image?.includes(`/${f}/`)).length
  const L: string[] = []
  L.push(`# ${p.name}`, '', `- **Slug:** \`${slug}\` · **Developer:** ${fmt(dev)} · **Published:** ${p.isPublished ? 'yes' : 'no'}`, `- **Source:** ${src.site}`, `- **Location:** ${fmt(p.location)}${p.road ? `, ${p.road}` : ''}, ${fmt(p.city)}, ${fmt(p.district)} District, ${fmt(p.province)} Province`, `- **Type / status:** ${fmt(p.type)} · ${fmt(p.status)} · units ${fmt(p.units)} · floors ${fmt(p.floors)} · beds ${fmt(p.bedrooms)} · expected handover ${fmt(p.completionYear)}`, `- **Payment plan badge:** ${fmt(p.paymentPlanBadge)} · **Deposit terms:** ${p.depositPaymentStructure ? 'yes' : '—'}`, `- **Brochure on listing:** ${p.brochureUrl ?? '—'}`, `- **Live:** /projects/${slug}`, '')
  L.push('## Floor plans', '', '| Plan | Beds | Baths | SqFt | Perches | 2D | m² | 3D | Downloads | Availability | Available floors |', '|---|---|---|---|---|---|---|---|---|---|---|')
  for (const fp of plans) {
    const fa: any[] = fp.floorAvailability ?? []
    const open = fa.filter((f) => f.available).map((f) => f.floor).join(', ')
    L.push(`| ${cell(fp.planName)} | ${fp.bedrooms} | ${fp.bathrooms} | ${fp.floorAreaSqFt} | ${fmt(fp.landPerches)} | ${fp.image ? '✅' : '—'} | ${fp.imageMetric ? '✅' : '—'} | ${fp.image3d ? '✅' : '—'} | ${(fp.planDocuments ?? []).length || '—'} | ${fmt(fp.availability)} | ${fa.length ? (open || 'none') + ` of ${fa.length}` : '—'} |`)
  }
  L.push('', '## Media (Cloudflare R2, media.lankanewhomes.com)', '', `- Hero: ${p.heroImage ?? '—'}`, `- Property photos (gallery/): ${byFolder('gallery')} · amenity photos (amenities/): ${byFolder('amenities')} · road map: ${byFolder('road-map') ? 'yes' : '—'}`, `- Construction updates (dated photos): ${(p.constructionUpdates ?? []).length}`, '')
  if ((p.constructionUpdates ?? []).length) { L.push('| Date | Milestone |', '|---|---|'); for (const c of p.constructionUpdates) L.push(`| ${String(c.date).slice(0, 10)} | ${cell(c.note)} |`); L.push('') }
  L.push('## Data captured', '', `- Amenities: ${(p.amenities ?? []).map((a: any) => a.name).join(', ') || '—'}`, `- Key Features groups: ${(p.unitFeatures ?? []).map((g: any) => `${g.label || g.key_other || g.key} (${(g.items ?? []).length})`).join(', ') || '—'}`, `- Nearby places: ${(p.nearby ?? []).length}`, `- Contact: ${fmt(p.contact?.name)} · ${fmt(p.contact?.phone)} · ${fmt(p.contact?.email)}`, `- Project verification checklist: ${p.isVerified ? 'verified' : 'not yet'}`, '')
  L.push('## Sources & brochures', '', ...src.brochures.map((b) => `- ${b}`), '', '## Notes, assumptions & gaps', '', ...src.notes.map((n) => `- ${n}`), '', `_Generated ${new Date().toISOString().slice(0, 10)} from the live Payload record._`, '')
  writeFileSync(path.join(process.cwd(), 'docs/listings', `${slug}.md`), L.join('\n'))
  index += `- [${p.name}](${slug}.md) — ${fmt(p.type)}, ${fmt(p.location)}; ${plans.length} plans, ${gallery.length} images${p.brochureUrl ? ', brochure' : ''}, handover ${fmt(p.completionYear)}\n`
  console.log('wrote docs/listings/' + slug + '.md')
}
writeFileSync(path.join(process.cwd(), 'docs/listings/README.md'), index)
process.exit(0)
