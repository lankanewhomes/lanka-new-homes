/* eslint-disable @typescript-eslint/no-explicit-any -- one-off import script */
// Canterbury Golf Villas (Home Lands Skyline), Piliyandala / Kahathuduwa: UNPUBLISHED draft + to-dos.
//   NODE_ENV=production npx tsx scripts/import-hl-canterbury-golf-villas.ts
import { HL_DIR, SO, payload, find, so, feat, up, checkAmenities, addTodos } from './hl-common'

const SLUG = 'canterbury-golf-villas'
const SOURCE = 'https://www.homelandsskyline.lk/housing-project/canterbury-residencies-for-sale-in-piliyandala'
const BROCHURE = 'https://cms.homelandsskyline.lk/wp-content/uploads/2025/09/Canterbury-Stage-2-Brochure-1.pdf'
if (await find('projects', SLUG)) { console.log('exists', SLUG); process.exit(0) }
const dev = await find('developers', 'home-lands-skyline')
const nb = await find('neighborhoods', 'kahathuduwa')
const architect = ((await payload.find({ collection: 'architects', where: { name: { like: 'Weeraratne' } }, limit: 1, overrideAccess: true, depth: 0 })).docs[0] as any) ?? null
const D = `${HL_DIR}/out/can`

const gal: [string, string, string][] = [
  ['exterior-villa-row', 'Canterbury Golf Villas, row of villas', 'exterior-villa-row.jpg'],
  ['exterior-villas-street', 'Villas along the internal road', 'exterior-villas-street.jpg'],
  ['exterior-villas-pool-side', 'Villa frontage with timber screens', 'exterior-villas-pool-side.jpg'],
  ['villa-private-pool', 'Villa with private pool', 'villa-private-pool.jpg'],
  ['interior-living-room', 'Villa living room', 'interior-living-room.jpg'],
  ['interior-dining', 'Villa dining area', 'interior-dining.jpg'],
  ['interior-kitchen', 'Villa kitchen', 'interior-kitchen.jpg'],
  ['interior-bedroom', 'Villa bedroom', 'interior-bedroom.jpg'],
  ['interior-bathroom', 'Villa bathroom', 'interior-bathroom.jpg'],
]
const gallery: any[] = []
for (const [k, label, f] of gal) gallery.push({ label, image: await up(SLUG, 'gallery', `${k}.jpg`, `${D}/g/${f}`) })
const brochureUrl = await up(SLUG, 'brochure', 'brochure.pdf', `${HL_DIR}/can/brochure.pdf`, 'application/pdf')

const PLANS = [
  { key: '6p-3br-1825', name: '6 Perch Villa 3BR, 1,825 sq ft', beds: 3, sqft: 1825 },
  { key: '6p-sig-3br-2125', name: '6 Perch Signature Villa 3BR, 2,125 sq ft', beds: 3, sqft: 2125 },
  { key: '8p-sig-3br-2710', name: '8 Perch Signature Villa 3BR, 2,710 sq ft', beds: 3, sqft: 2710 },
  { key: '8p-sig-4br-2710', name: '8 Perch Signature Villa 4BR, 2,710 sq ft', beds: 4, sqft: 2710 },
  { key: '10p-4br-3185-a', name: '10 Perch Villa 4BR, 3,185 sq ft (plan 1)', beds: 4, sqft: 3185 },
  { key: '10p-4br-3185-b', name: '10 Perch Villa 4BR, 3,185 sq ft (plan 2)', beds: 4, sqft: 3185 },
]
const floorPlans: any[] = []
for (const p of PLANS) floorPlans.push({ planName: p.name, bedrooms: p.beds, bathrooms: p.beds === 4 ? 3 : 3, floorAreaSqFt: p.sqft, startingPriceLkr: 0, availability: 'Available', image: await up(SLUG, 'floor-plans', `${p.key}.jpg`, `${D}/plans/${p.key}.jpg`) })

const unitFeatures = [{
  key: 'specifications',
  items: [
    feat('Substructure', 'Individual footing foundation with R.C.C. columns, plinth beam and random rubble masonry'),
    feat('Superstructure', 'R.C.C. columns, beams and slabs, 9 inch thick bricks on the outer perimeter and 4 inch cement blocks on internal walls'),
    feat('Flooring', 'Floor tiles in living, dining, bedrooms and other internal areas; non-slip tiles on balconies and terraces'),
    feat('Bathroom Walls', 'Ceramic tiles up to 7 ft in shower areas and 5 ft elsewhere, plastered and painted above'),
    feat('Roof & Ceiling', 'Zn/Al sheet roof on exposed rafters with ipanel or equivalent sloping ceiling'),
    feat('Pantry', 'Pantry unit with granite or quartz worktop and stainless steel single-bowl sink with chromium-plated swan neck tap'),
    feat('Electrical', 'Single-phase supply with separate electric meter and 13 amp sockets; provision for a solar panel system'),
    feat('Water Supply & Drainage', 'PVC cold water pipe network to each bathroom via a roof-top tank; individual septic tank and soakage pit'),
    feat('Plumbing & Sanitary Fittings', 'Fully fitted bathrooms with water closet and wash basin, except the maid\'s toilet; solar water tank supply for master and common bathrooms'),
    feat('Doors & Windows', 'Engineering timber front and rear doors; solid plywood internal doors; powder-coated aluminium French and other windows'),
    feat('External Works', 'Boundary wall, landscaping and a car porch with interlocking paving'),
  ],
}]
for (const g of unitFeatures) for (const it of g.items as any[]) { so(it, 'field', SO.KEY_FEATURE_FIELD_OPTIONS); so(it, 'value', SO.KEY_FEATURE_VALUE_OPTIONS) }

const amenityNames = ['Pool', 'Gym', "Children's Area", 'Badminton Court', 'Cafe', 'Restaurant', 'Spa', 'Clubhouse', 'Garden', 'Gated Community']
checkAmenities(amenityNames)

const data: Record<string, any> = {
  slug: SLUG, name: 'Canterbury Golf Villas', developer: dev.id, isPublished: false,
  status: 'Completed', constructionStatus: 'Ready to Move In',
  type: 'Villas', typeNote: 'Victorian-inspired golf villas, 3 and 4 bedrooms, 6 to 10 perch plots',
  location: 'Kahathuduwa, Piliyandala', city: 'Piliyandala', district: 'Colombo', province: 'Western',
  neighborhood: nb?.id, architect: architect?.id, contractor: 'Heyraa Construction (Pvt) Ltd.',
  units: 158, floors: 2,
  startingPriceLkr: 55000000, priceRange: 'From Rs. 55,000,000',
  parking: '1 to 2 private parking spaces depending on the unit',
  summary: '158 two-storey 3 and 4 bedroom golf villas at Kahathuduwa, Piliyandala, from 1,825 to 3,185 sq ft, in the Canterbury golf resort development. Construction is completed and the developer states the villas are ready to move in.',
  description:
    'Canterbury Golf Villas is a villa development at Kahathuduwa, Piliyandala, designed by architect Philip Weeraratne and built by Heyraa Construction (Pvt) Ltd. The developer lists 158 two-storey villas of 3 and 4 bedrooms, from 1,825 to 3,185 sq ft, in five layouts: 6 perch villa (3 bedrooms), 6 perch signature villa (3 bedrooms), 8 perch signature villas (3 and 4 bedrooms) and 10 perch villas (4 bedrooms). Each villa has 1 to 2 private parking spaces, depending on the unit. The developer describes Victorian-inspired architecture with paddy field views or green surroundings, and says only 20% of the land is developed, with the remaining 80% kept as open green space. Residents have access to the resort amenities listed by the developer, including a swimming pool, gym, spa, clubhouse, coffee shop, restaurant, tennis and badminton court, children\'s areas, daycare and pre-school, and a day and night golf course. The construction stage on the developer\'s page is "Construction Completed, Ready to Move in".',
  highlights: [
    '158 two-storey villas of 3 and 4 bedrooms, 1,825 to 3,185 sq ft',
    'Victorian-inspired architecture by Philip Weeraratne',
    'Developer states only 20% of the land is built on, 80% is open green space',
    'Golf resort amenities: pool, gym, spa, clubhouse, restaurant, day and night golf course',
  ],
  heroImage: gallery[0].image, gallery, brochureUrl, floorPlans,
  amenities: amenityNames.map((name) => ({ name })),
  unitFeatures,
  sourceUrl: SOURCE,
  contact: { email: 'info@homelandsskyline.lk', phone: '+94 702 444 111' },
  socialLinks: { whatsapp: 'https://wa.me/94710299444' },
}
for (const k of ['district', 'city', 'province'] as const) so(data, k, SO[`${k.toUpperCase()}_OPTIONS`])
const created: any = await payload.create({ collection: 'projects', data, overrideAccess: true })
console.log('created', created.id, created.slug, 'published:', created.isPublished, 'plans', created.floorPlans?.length, 'gallery', created.gallery?.length)

const links = [SOURCE, BROCHURE, `https://www.lankanewhomes.com/listing-preview/${SLUG}`]
await addTodos(created.id, links, [
  ['Unit sizes conflict: page cards vs brochure', 'The page unit cards show Type A (3BR) 1,218 sq ft / 3 bed 2 bath and Type B (4BR) 1,506 sq ft / 4 bed 3 bath, while the same page header and the brochure give 1,825 to 3,185 sq ft. The brochure plans were used (6 plans). Bathrooms are 3 on every brochure plan (the page header says "1-2 Bathrooms"). The two 3,185 sq ft 10 perch plans look near-identical (plan 1 / plan 2 are as printed).'],
  ['Private pools: not on every plan', 'The page says each villa has a private pool. In the brochure only the 10 perch villa plans show a swimming pool. The Pool amenity is listed as published, but the per-plan pool is not stated.'],
  ['Brochure is a combined Canterbury brochure', 'The PDF (Canterbury Stage 2) also covers the Lexus golf resort apartments. Only the villa pages were used. Footers name "Canterbury Lexus Golf Resort Apartments - Piliyandala Kahathuduwa".'],
  ['Price per plan and units available', 'Only "from Rs. 55M" is published (entered). No per-plan prices and no per-plan availability (all set Available as on the page).'],
  ['Payment plan', 'No payment plan is published on the page or in the brochure.'],
  ['Amenities not in our list', 'Not mapped: Tennis Court, Day & Night Golf Course, Gateway Daycare Center & Pre School. Mapped: Pool, Gym, Badminton Court, Cafe (coffee shop), Restaurant, Spa, Clubhouse, Garden, Gated Community, Children\'s Area.'],
  ['Nearby places and map pin', 'The villa page has no area guide and no Google Maps embed, so no nearby list and no coordinates were entered. The brochure has a "city within your reach" map (pages 7-8) that could be transcribed.'],
  ['Parking', 'Page: "1 - 2 Private parking Space available depending on the unit". The floor plans show 1 car (6 perch) or 2 cars (8 and 10 perch).'],
  ['Construction status', 'Page says "Construction Completed, Ready to Move in", entered as status Completed with all plans Available (completed listings stay only while at least 1 unit is available). No completion year published.'],
  ['Villa count vs plots', 'Page spec says 158 Villas (entered). The brochure does not repeat a total.'],
  ['WhatsApp number', 'Project WhatsApp set to +94 71 029 9444 (the number the Skyline site uses). Contact email is the developer\'s info@homelandsskyline.lk.'],
  ['Unused images', 'Not used: best-choice banner (generic), designer portrait, brochure aerial/map pages with text overlays.'],
  ['Publish?'],
])
process.exit(0)
