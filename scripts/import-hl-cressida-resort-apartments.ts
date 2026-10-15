/* eslint-disable @typescript-eslint/no-explicit-any -- one-off import script */
// Cressida Resort Apartments, Athurugiriya (Home Lands Skyline): UNPUBLISHED draft + to-dos. Developer 69 already exists.
//   HL_DIR=<folder with web/, plans/, brochure.pdf> NODE_ENV=production npx tsx scripts/import-hl-cressida-resort-apartments.ts
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
const SLUG = 'cressida-resort-apartments'
const R2 = (sub: string, name: string) => `projects/${SLUG}/${sub}/${SLUG}_${name}`
const up = (sub: string, file: string, name: string, dir = 'web', type = 'image/jpeg') => mirrorToR2(R2(sub, name), fs.readFileSync(path.join(base, dir, file)), type)
const SOURCE = 'https://www.homelandsskyline.lk/apartment-project/cressida-resort-apartments-for-sale-in-athurugiriya'
if (await find('projects', SLUG)) { console.log('exists', SLUG); process.exit(0) }

const dev = await find('developers', 'home-lands-skyline')
if (!dev) throw new Error('developer missing')
const nb = await find('neighborhoods', 'athurugiriya')
const architect = ((await payload.find({ collection: 'architects' as never, where: { name: { like: 'Home Lands Skyline' } } as never, limit: 1, overrideAccess: true, depth: 0 })).docs[0] as any) ?? null

const gal: [string, string][] = [['exterior-entrance','Cressida Resort Apartments entrance'],['exterior-coffee-shop','Entrance with coffee shop'],['exterior-sports-court','Apartment blocks beside the sports court'],['interior-living-dining','Apartment living and dining area'],['interior-living','Apartment living room'],['interior-dining','Apartment dining area'],['interior-living-tv-wall','Living room with feature wall'],['interior-living-dining-lounge','Living and dining area'],['interior-living-sofa','Living room seating'],['interior-living-tv','Living room with TV wall'],['interior-living-dining-feature-wall','Living and dining area with feature wall'],['interior-kitchen','Apartment kitchen'],['interior-bedroom','Apartment bedroom'],['interior-master-bedroom','Master bedroom'],['interior-bedroom-lounge-chair','Bedroom with lounge chair'],['interior-bedroom-curtains','Bedroom with garden view']]
const gallery: any[] = []
for (const [k, label] of gal) gallery.push({ label, image: await up('gallery', `${k}.jpg`, `${k}.jpg`) })
const brochureUrl = await up('brochure', 'brochure.pdf', 'brochure.pdf', '.', 'application/pdf')

type P = { key: string; name: string; beds: number; baths: number; sqft: number }
const PLANS: P[] = [{key:'2br-unit-01',name:'2 Bedroom Unit 01, 815 sq ft',beds:2,baths:2,sqft:815},{key:'2br-unit-02',name:'2 Bedroom Unit 02, 815 sq ft',beds:2,baths:2,sqft:815},{key:'3br-unit-01',name:'3 Bedroom Unit 01, 980 sq ft',beds:3,baths:3,sqft:980},{key:'3br-unit-02',name:'3 Bedroom Unit 02, 1,060 sq ft',beds:3,baths:3,sqft:1060}]
const floorPlans: any[] = []
for (const p of PLANS) {
  floorPlans.push({
    planName: p.name, bedrooms: p.beds, bathrooms: p.baths, floorAreaSqFt: p.sqft, startingPriceLkr: 0, availability: 'Available',
    image: await up('floor-plans', `${p.key}.jpg`, `${p.key}.jpg`, 'plans'),
  })
}
const near = (category: string, names: string[]) => names.map((name) => ({ category, name }))
const unitFeatures: any[] = [
  {
    key: 'specifications',
    items: [
      feat('Substructure', 'Raft or individual footing foundation with RCC columns, plinth beam and random rubble masonry work as suggested by the structural engineer'),
      feat('Superstructure', 'RCC columns, beams and slabs; internal and perimeter walls in solid or hollow blocks'),
      feat('Flooring', 'Glazed porcelain floor tiles in living, dining, bedrooms and other internal areas; non-slippery rustic ceramic tiles on verandas and balconies; non-slippery ceramic tiles in toilets on a waterproofed surface, with toilet wall tiles to full height in shower areas and 5 ft elsewhere'),
      feat('Painting', 'Internal walls: smooth plaster, two coats of wall putty, one coat of filler and two coats of emulsion paint. External walls: rough or semi-rough plaster with a five-coat paint system'),
      feat('Pantry', 'Pantry unit with granite or quartz top, stainless-steel single-bowl single-drain sink and chrome swan-neck tap'),
      feat('Water Supply & Drainage', 'PVC cold water pipe network to each bathroom from a rooftop tank, underground sump filled from the National Water Supply and Drainage Board main, separate water meter for each unit, waste and sewer lines connected to the nearest manhole'),
      feat('Electrical', 'Power supply with separate electricity meter, 13 amp sockets, one TV and telephone outlet, a socket in the master bathroom, AC provision for the master bedroom and instant geyser provision in all bathrooms except the maid\'s toilet'),
      feat('Electrical Fittings', 'Common area lighting supplied; one air conditioner supplied and fixed in the master bedroom; fans for living, dining and other bedrooms; point wiring only for in-unit lights'),
      feat('Plumbing & Sanitary Fittings', 'Fully fitted bathrooms with water closet, semi-pedestal wash basin, soap tray, toothbrush holder, hand bidet, toilet paper holder, pencil-edged mirror and tempered glass shower partition (except the maid\'s toilet)'),
      feat('Doors & Windows', 'Front and rear doors in class I engineered timber with class I timber frame, internal doors in plywood with class I timber frame, powder-coated aluminium French and other windows'),
    ],
  },
]
for (const g of unitFeatures) for (const it of g.items as any[]) { so(it, 'field', SO.KEY_FEATURE_FIELD_OPTIONS); so(it, 'value', SO.KEY_FEATURE_VALUE_OPTIONS) }
const nearby = [
  ...near('Transport', ['Athurugiriya Expressway Interchange (900 m)']),
  ...near('School', ['SLIIT', 'Horizon College International', 'CINEC Campus', 'SAITM Campus', 'Colombo Academy of Hospitality Management (CAHM)']),
  ...near('Hospital', ['Dr. Neville Fernando Hospital']),
  ...near('Landmark', ['MillenniumIT Software', 'ITN', 'Ministry of Defence', 'Millennium City Housing Scheme']),
]
const amenityNames = ['Pool', 'Gym', 'Outdoor Gym', 'Spa', 'Cafe', 'BBQ Area', "Children's Area", 'Jogging Track', 'Security', 'Kids Pool', 'Sauna', 'Steam Room', 'Library', 'Basketball Court', 'Cycling Paths', 'EV Charging', 'Clubhouse', 'Mini Mart', 'Laundry Service', 'CCTV', 'Parking']
for (const a of amenityNames) if (!(SO.AMENITY_NAME_OPTIONS as string[]).includes(a)) throw new Error('amenity not in vocabulary ' + a)
const BROCHURE_SRC = 'https://cms.homelandsskyline.lk/wp-content/uploads/2025/09/Cressida-Brochure.pdf'
const data: Record<string, any> = {
  slug: SLUG, name: 'Cressida Resort Apartments', developer: dev.id, isPublished: false,
  status: 'Now Selling', constructionStatus: undefined,
  type: 'Apartments', typeNote: 'Resort-style apartment development',
  location: 'Athurugiriya', city: 'Athurugiriya', district: 'Colombo', province: 'Western',
  neighborhood: nb?.id, architect: architect?.id,
  contractor: 'Heyraa Construction (Pvt) Ltd',
  units: 392, floors: 6,
  startingPriceLkr: 38000000, priceRange: 'From Rs. 38,000,000',
  parking: 'Comes with a dedicated parking slot within the complex',
  summary: 'Cressida Resort Apartments is a Ground + 5 development of 392 two- and three-bedroom apartments in Athurugiriya, about 900 m from the expressway interchange, with more than 50 resort-style facilities.',
  description:
    'Cressida Resort Apartments is a resort-style apartment community in Athurugiriya, between Malabe and Athurugiriya and 900 m from the Athurugiriya expressway interchange. The developer places it about 10 minutes from Colombo. The development has 392 apartments across Ground + 5 floors, in two- and three-bedroom layouts from 780 to 1,060 sq ft (the developer lists 2 bedrooms from 815 sq ft and 3 bedrooms at 980 and 1,060 sq ft). Each apartment comes with a dedicated parking slot within the complex. The developer describes more than 50 international-standard facilities and services, including a swimming pool and kids pool, indoor and outdoor gyms, a spa, sauna and steam room, a coffee shop, BBQ pavilion, jogging and cycling tracks, a kids play area, a library, a mini market and EV charging points. Cressida is designed by Home Lands Skyline and built by Heyraa Construction (Pvt) Ltd.',
  highlights: [
    '392 apartments, Ground + 5 floors',
    '2 and 3 bedroom apartments, 780 to 1,060 sq ft',
    '50+ resort-style facilities including a pool, spa and gyms',
    '900 m to the Athurugiriya expressway interchange',
  ],
  heroImage: gallery[0].image, gallery, brochureUrl, floorPlans,
  amenities: amenityNames.map((name) => ({ name })),
  unitFeatures, nearby,
  coordinates: { lat: 6.8725705, lng: 79.9880198 },
  sourceUrl: SOURCE,
  contact: { email: 'info@homelandsskyline.lk', phone: '+94 702 444 111' },
  socialLinks: { whatsapp: 'https://wa.me/94710299444' },
}
delete data.constructionStatus
const todos: [string, string?][] = [
  ['Construction stage and completion date', 'The page and brochure do not state a construction stage or completion date. Status entered as Now Selling (site default); not shown on the page. Please confirm status (ongoing/completed) with the developer.'],
  ['Conflict: 2BR Unit 02 floor area', 'The page lists 2BR Unit 02 as 815 sq ft (same as Unit 01); the brochure layout page shows 780 sq ft, and the page\'s own area range starts at 780. Entered 815 per the page. Confirm.'],
  ['Per-unit price and availability', 'Only "38M upwards" is published (entered as the starting price). No per-plan prices, so each plan shows Contact for pricing. The page marks all four unit types as available.'],
  ['Unit counts per type', 'Total is 392 units (page and brochure). No split by unit type or floor is published.'],
  ['Bathrooms', 'The page says "1-2 Bathrooms"; the brochure layouts say 2BR = 2 bathrooms and 3BR = 3 bathrooms. Brochure values entered.'],
  ['Amenities with no match in the list', 'Brochure facilities not in our vocabulary and left out: Party Lawn, Tennis Court, Cricket Nets, Multi-Purpose Court, Car Washing Bay, Pool Parlor, Salon, Medical Center, Pharmacy, Physiotherapy Area, ATM and bill paying, Golf Cart Service, Backup generator, Community Hall, Baby Sitting, House Keeping, Butler Service, Shuttle Service, Tuition class facility, Janitorial area.'],
  ['Coordinates', 'Map pin taken from the developer\'s own Google Maps link (maps.app.goo.gl/NgnKpC3imGbGozTR8, "Cressida Resort Apartments & Residencies by Home Lands Skyline").'],
  ['Neighbourhood', nb ? 'Linked to the Athurugiriya neighbourhood page.' : 'No Athurugiriya neighbourhood page exists.'],
  ['Photos', 'Gallery uses the site gallery (13 interior photos, labelled by room) plus 3 exterior renders. Not used: the black-background building cut-out (best-choice image), pool-table and gym close-ups from the brochure. Interiors are marketing photos, not confirmed to be this exact unit.'],
  ['Parent/duplicate page', 'The site also has a hidden duplicate page (cressida-resort-apartment-for-sale-in-athurugiriya) that was ignored.'],
  ['Publish?'],
]
for (const k of ['district', 'city', 'province'] as const) so(data, k, SO[`${k.toUpperCase()}_OPTIONS`])
for (const p of data.floorPlans) { so(p, 'furnishing', SO.FURNISHING_OPTIONS) }
const created: any = await payload.create({ collection: 'projects', data: data as never, overrideAccess: true })
console.log('created', created.id, created.slug, 'published:', created.isPublished, 'plans', created.floorPlans?.length, 'gallery', created.gallery?.length)
const links = [SOURCE, BROCHURE_SRC, `https://www.lankanewhomes.com/listing-preview/${SLUG}`]
for (const [title, notes] of todos) {
  await payload.create({ collection: 'listing-todos' as never, data: { title, listingType: 'project', project: created.id, notes, sourceLinks: links.join('\n') } as never, overrideAccess: true })
}
console.log('todos', todos.length)
process.exit(0)
