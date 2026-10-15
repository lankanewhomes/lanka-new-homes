/* eslint-disable @typescript-eslint/no-explicit-any -- one-off import script */
// Central Park Boulevard, Port City Colombo (Home Lands Skyline): UNPUBLISHED draft + to-dos.
//   HL_DIR=<hl scratch dir> NODE_ENV=production npx tsx scripts/import-hl-central-park-boulevard.ts
import fs from 'node:fs'
import path from 'node:path'
import { config as loadEnv } from 'dotenv'

loadEnv({ path: path.join(process.cwd(), '.env.local') })
const base = process.env.HL_DIR ?? ''
if (!base) throw new Error('Set HL_DIR')
const cfg = ((await import('../payload.config')) as any).default
const { getPayload } = await import('payload')
const { mirrorToR2 } = await import('../src/lib/listing-import/mirror')
const SO = (await import('../src/collections/shared-fields')) as any
const payload = await getPayload({ config: cfg })

const find = async (collection: string, slug: string) =>
  ((await payload.find({ collection: collection as never, where: { slug: { equals: slug } }, limit: 1, overrideAccess: true, depth: 0 })).docs[0] as any) ?? null
const n1 = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '')
const so = (o: any, name: string, opts: string[]) => {
  const v = o[name]; if (v == null || v === '') return
  const hit = opts.find((x) => n1(x) === n1(String(v)))
  if (hit) { o[name] = hit; return }
  o[`${name}_other`] = v; delete o[name]
}
const feat = (field_other: string, value_other: string) => ({ field_other, value_other })
const SLUG = 'central-park-boulevard-port-city-colombo'
const R2 = (sub: string, name: string) => `projects/${SLUG}/${sub}/${SLUG}_${name}`
const up = (sub: string, file: string, name: string, dir: string, type = 'image/jpeg') => mirrorToR2(R2(sub, name), fs.readFileSync(path.join(base, dir, file)), type)
const SOURCE = 'https://www.homelandsskyline.lk/apartment-project/central-park-boulevard-at-port-city-colombo'
if (await find('projects', SLUG)) { console.log('exists', SLUG); process.exit(0) }

const dev = await find('developers', 'home-lands-skyline')
if (!dev) throw new Error('developer missing')
const nb = await find('neighborhoods', 'port-city-colombo')
const architect = ((await payload.find({ collection: 'architects' as never, where: { name: { like: 'Weeraratne' } } as never, limit: 1, overrideAccess: true, depth: 0 })).docs[0] as any) ?? null

const gal: [string, string, string][] = [
  ['Selected-03-scaled.jpg', 'exterior-towers-waterfront', 'Central Park Boulevard towers above the landscaped waterfront'],
  ['PROPOSED-CAMERA-027.jpg-1-scaled.jpg', 'exterior-skybridge-park', 'Twin towers joined by a skybridge, set in the park'],
  ['02-New.jpg-scaled.jpg', 'aerial-dusk', 'Aerial view of the towers, canal and parks at dusk'],
  ['1.jpg-scaled.jpg', 'aerial-courtyard', 'Aerial view of the courtyard, pools and tennis court'],
  ['Final.jpg-scaled.jpg', 'aerial-courtyard-pool', 'Courtyard between the two towers with pool and court'],
  ['7.jpg.jpg', 'entrance-drop-off', 'Residence entrance and drop-off'],
  ['Building-closeup-017.jpg-scaled.jpg', 'park-lakeside', 'Park with water features and fountain jets'],
  ['v-scaled.jpg', 'sky-garden', 'Garden with a central fire feature and glass pavilion'],
  ['REF-018-scaled.jpg', 'planters-walkway', 'Walkway with large planters at dusk'],
  ['sky-pool-Level-31.jpg', 'sky-pool-level-31', 'Sky pool on Level 31'],
  ['ROOF-scaled.jpg', 'rooftop-lounge', 'Rooftop lounge at sunset'],
  ['VIP-Launge-scaled.jpg', 'vip-lounge', 'VIP lounge'],
  ['GYM-01-scaled.jpg', 'gym', 'Gymnasium'],
  ['Spa-01-A-scaled.jpg', 'spa', 'Spa lounge'],
  ['YOGA-002-scaled.jpg', 'yoga-room', 'Yoga room'],
  ['Building-closeup-10-scaled.jpg', 'court', 'Tennis court in the courtyard'],
  ['Building-closeup-12-scaled.jpg', 'chess-courtyard', 'Courtyard with oversized chess set'],
  ['GAMING-LOUNGE-02-scaled.jpg', 'golf-simulator-lounge', 'Golf simulation lounge'],
  ['KIDS-scaled.jpg', 'kids-playroom', "Children's playroom"],
  ['MEETING-ROOM-012-scaled.jpg', 'meeting-room', 'Meeting room'],
  ['SALON-OP-02-scaled.jpg', 'salon', 'Salon and nail bar'],
  ['SUPERMARKET-NEW.jpg-scaled.jpg', 'supermarket', 'Supermarket'],
]
const gallery: any[] = []
for (const [f, k, label] of gal) gallery.push({ label, image: await up('gallery', f, `${k}.jpg`, 'cp/g') })
const brochureUrl = await mirrorToR2(R2('brochure', 'brochure.pdf'), fs.readFileSync(path.join(base, 'cp.pdf')), 'application/pdf')

const unitFeatures = [
  {
    key: 'specifications',
    items: [
      feat('Substructure', 'Pile foundation'),
      feat('Superstructure', 'RCC columns, walls, beams and slabs, with bricks or cement blocks on walls and aluminium framing and glazing'),
      feat('Flooring', 'High-quality floor tiles in Deluxe apartments; wooden flooring in the living and dining areas of Sky Villas and Penthouses, and throughout Emerald Mansions; non-slip tiles in verandas, balconies, terraces and bathrooms'),
      feat('Bathroom Walls', 'Wall tiles up to the ceiling level'),
      feat('Painting', 'Internal walls plastered smooth with emulsion paint. External walls: rough or semi-rough finish with a five-coat paint system and 10 years warranty'),
      feat('Pantry', 'Fully equipped international-standard pantry with kitchen cabinets, hob, hood, electric oven, microwave oven, refrigerator, dishwasher, washing machine and sink with mixer tap'),
      feat('Electrical', '230V supply with separate electric meter, 13 amp sockets, ceiling fans in all bedrooms, air conditioning in the living area and all bedrooms except the maid\'s room, TV, telephone and data outlets, separate gas meters, BMS billing facility, fire detection and protection system, video door phone, visitor access control, standby generator power'),
      feat('Lighting', 'LED panel light fittings; decorative light fittings in living and dining areas of Penthouses and Emerald Mansions'),
      feat('Water Supply & Drainage', 'PVC cold water pipe network for each bathroom, separate water meter for each unit, sewer and waste water discharge as per the MEP engineer'),
      feat('Plumbing & Sanitary Fittings', 'International-standard fully fitted bathrooms, hot water via geyser for the master bathroom and common bathrooms; a bathtub in specific Penthouse and Emerald Mansion units'),
      feat('Doors & Windows', 'Fire-rated engineering timber main door with smart door lock; engineering composite doors for bedrooms, bathrooms and servant room; powder-coated aluminium French and other windows'),
      feat('Storage', 'Wardrobe units in all bedrooms; a completed linen room in Sky Villas, Penthouses and Emerald Mansions'),
      feat('Waterproofing', 'Bathroom floors, shower walls, balconies and terraces waterproofed by a reputed company with a 10-year warranty'),
      feat('Termite Treatment', 'Ground floor termite treatment by a reputed company with a 10-year warranty'),
    ],
  },
  {
    key_other: 'General Features',
    items: [
      feat('Security', '24/7 CCTV monitoring of common areas'),
      feat('EV Charging', 'Common EV charging facility (Deluxe); EV charging provision for the parking slot (Penthouses and Emerald Mansions)'),
      feat('Parking', 'A dedicated parking slot with each apartment'),
    ],
  },
]
for (const g of unitFeatures) for (const it of g.items as any[]) { so(it, 'field', SO.KEY_FEATURE_FIELD_OPTIONS); so(it, 'value', SO.KEY_FEATURE_VALUE_OPTIONS) }

const amenityNames = ['Boutique Shops', 'Mini Mart', 'Reception & Lobby', 'Games Room', 'Meeting Room', 'Restaurant', 'Gym', 'Spa', 'Lounge', 'Garden', 'Infinity Pool', "Children's Area", 'Rooftop', 'Parking', 'EV Charging', 'CCTV']
for (const a of amenityNames) if (!(SO.AMENITY_NAME_OPTIONS as string[]).includes(a)) throw new Error('amenity not in vocabulary ' + a)

const data: Record<string, any> = {
  slug: SLUG, name: 'Central Park Boulevard', developer: dev.id, isPublished: false,
  status: 'Under Construction', constructionStatus: 'Under Construction',
  type: 'Apartments', typeNote: 'Ultra luxury twin-tower development: Deluxe 1 to 3 bedroom apartments, Sky Villas, Penthouses and Emerald Mansions',
  location: 'Central Park district, Port City Colombo', city: 'Port City Colombo', district: 'Colombo', province: 'Western',
  neighborhood: nb?.id, architect: architect?.id,
  contractor: 'The China Harbour Engineering Company (CHEC) & Heyraa Construction (Pvt) Ltd.',
  units: 634, floors: 35,
  startingPriceLkr: 60000000, priceRange: 'From Rs. 60,000,000',
  summary: 'Ultra luxury twin towers of 35 levels in the Central Park district of Port City Colombo: 634 units from 1 to 3 bedrooms, plus Sky Villas, Penthouses and Emerald Mansions, with 50+ resort amenities.',
  description:
    'Central Park Boulevard is an ultra luxury apartment development by Home Lands Skyline in the Central Park district of Port City Colombo. Two towers of 35 levels, joined by a skybridge, hold 634 units: 1, 2 and 3 bedroom Deluxe apartments, Sky Villas, Penthouses and the Emerald Mansions, from 465 to 4,830 sq ft. The architecture is a collaboration between SOG Architects (Singapore) and PWA Architects (Sri Lanka), and the interiors are by Blaine Robert Design (Malaysia). The developer lists more than 50 resort-style amenities arranged in zones: retail, reception, entertainment, business, restaurant and recreation, wellness and fitness, a VIP zone and a sky garden, including a sky pool on Level 31, a rooftop lounge, gym, spa, a children\'s playroom and a golf simulation lounge. Each apartment comes with a dedicated parking slot. Construction update from the developer: ceremonial groundbreaking was held, and 60% of the piling work is complete. The towers are being built by The China Harbour Engineering Company (CHEC) and Heyraa Construction (Pvt) Ltd.',
  highlights: [
    'Twin towers of 35 levels joined by a skybridge in the Central Park district of Port City Colombo',
    '634 units: Deluxe apartments, Sky Villas, Penthouses and Emerald Mansions',
    '50+ resort amenities including a sky pool, spa, gym and rooftop lounge',
    'A dedicated parking slot with every apartment',
  ],
  heroImage: gallery[0].image, gallery, brochureUrl,
  amenities: amenityNames.map((name) => ({ name })),
  unitFeatures,
  coordinates: { lat: 6.9355118, lng: 79.8349274 },
  videos: [
    { label: 'Teaser Video', embedUrl: 'https://www.youtube.com/watch?v=oEC6t6uAUOM' },
    { label: 'Press Conference', embedUrl: 'https://www.youtube.com/watch?v=nmfp50B0kc4' },
    { label: 'Launch Event', embedUrl: 'https://www.youtube.com/watch?v=lb71Ru3Mh3A' },
    { label: 'Launch Event 2', embedUrl: 'https://www.youtube.com/watch?v=yjgm3eoZsMM' },
    { label: 'Sales Gallery Opening Event', embedUrl: 'https://www.youtube.com/watch?v=DphV882-HSc' },
  ],
  sourceUrl: SOURCE,
  contact: { email: 'info@homelandsskyline.lk', phone: '+94 702 444 111' },
  socialLinks: { whatsapp: 'https://wa.me/94710299444' },
}
for (const k of ['district', 'city', 'province'] as const) so(data, k, SO[`${k.toUpperCase()}_OPTIONS`])
const created: any = await payload.create({ collection: 'projects', data: data as never, overrideAccess: true })
console.log('created', created.id, created.slug, 'published:', created.isPublished)

const links = [SOURCE, 'https://cms.homelandsskyline.lk/wp-content/uploads/2026/06/Central-Park-Boulevard-at-Port-City-Colombo.pdf', `https://www.lankanewhomes.com/listing-preview/${SLUG}`]
const todos: [string, string?][] = [
  ['No floor plans published', 'The page has no unit plans and the brochure shows only interior renders per collection (Deluxe 1/2/3 bedroom, Premium: Sky Villas and Penthouses, Emerald Mansions). No per-unit bedrooms, bathrooms or sizes, so the Floor Plans tab is empty. Ask the developer for plans.'],
  ['Starting price conflict', 'The page header says "Starting Price 60M" (entered as Rs. 60,000,000) but the specification list on the same page says "153M Upwards". Likely 60M is the 1-bedroom and 153M the larger collection; confirm with the developer.'],
  ['Size range', 'Page header shows 465 - 4,830 sq ft and 1 - 3 bathrooms, but the spec list says 1, 2, 3 bedroom apartments & more (Sky Villas, Penthouses, Emerald Mansions). Per-unit bedrooms and bathrooms are not published.'],
  ['Unit mix and counts', '634 units total (page). No breakdown by collection.'],
  ['Completion / handover date', 'Not published. Page says "Under Construction", ground-breaking held (card dated 2026-07-26) and 60% of piling complete (card dated 2026-09-03). Left blank.'],
  ['Payment plan', 'No payment plan or deposit terms published.'],
  ['Architect', 'Architecture is by SOG Architects (Singapore) with PWA Architects (Sri Lanka, Philip Weeraratne); interiors by Blaine Robert Design. Only PWA exists in our architects list and is linked; SOG and Blaine Robert are not in the system.'],
  ['Exact address and nearby places', 'Only "Central Park district, Port City Colombo" is published. Map pin taken from the developer\'s Google Maps embed. The page has no area guide, so no Nearby list was added.'],
  ['Amenities not in the vocabulary', 'Business zone, wellness zone, VIP zone, salon and nail bar, supermarket, golf simulation lounge, yoga room, tennis/padel-style court, chess courtyard, floating sky pool (Level 31) were only partly mappable (mapped: Boutique Shops, Mini Mart, Reception & Lobby, Games Room, Meeting Room, Restaurant, Gym, Spa, Lounge, Garden, Infinity Pool, Rooftop, Children\'s Area). The court is described as a tennis court in the image data, so Padel Court was not added.'],
  ['Gallery images not used', 'A lifestyle photo of a woman at a bar (0345-Edit.jpg) was left out. Several gallery images are marketing renders and not project photos.'],
  ['Specification table varies by collection', 'The brochure specification table differs between Deluxe, Sky Villas, Penthouses and Emerald Mansions (flooring, bathtub, linen room, EV, pantry accessories). Entered as a single combined list with the differences noted.'],
  ['WhatsApp number', 'Project WhatsApp set to +94 71 029 9444 (site default); the page itself shows no number.'],
  ['Publish?'],
]
for (const [title, notes] of todos) {
  await payload.create({ collection: 'listing-todos' as never, data: { title, listingType: 'project', project: created.id, notes, sourceLinks: links.join('\n') } as never, overrideAccess: true })
}
console.log('todos', todos.length)
process.exit(0)
