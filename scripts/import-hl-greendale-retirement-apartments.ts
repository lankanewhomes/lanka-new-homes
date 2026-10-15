/* eslint-disable @typescript-eslint/no-explicit-any -- one-off import script */
// Greendale Retirement Resort Apartments, Athurugiriya (Home Lands Skyline): UNPUBLISHED draft + to-dos. Developer 69 already exists.
//   HL_DIR=<folder with web/, plans/, brochure.pdf> NODE_ENV=production npx tsx scripts/import-hl-greendale-retirement-apartments.ts
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
const SLUG = 'greendale-retirement-apartments'
const R2 = (sub: string, name: string) => `projects/${SLUG}/${sub}/${SLUG}_${name}`
const up = (sub: string, file: string, name: string, dir = 'web', type = 'image/jpeg') => mirrorToR2(R2(sub, name), fs.readFileSync(path.join(base, dir, file)), type)
const SOURCE = 'https://www.homelandsskyline.lk/apartment-project/greendale-retirement-resort-apartments'
if (await find('projects', SLUG)) { console.log('exists', SLUG); process.exit(0) }

const dev = await find('developers', 'home-lands-skyline')
if (!dev) throw new Error('developer missing')
const nb = await find('neighborhoods', 'athurugiriya')
const architect = ((await payload.find({ collection: 'architects' as never, where: { name: { like: 'Home Lands Skyline' } } as never, limit: 1, overrideAccess: true, depth: 0 })).docs[0] as any) ?? null

const gal: [string, string][] = [['exterior-lawn','Greendale apartment blocks across the lawn'],['exterior-front-elevation','Front elevation of the apartment blocks'],['clubhouse-dining-terrace','Clubhouse dining terrace'],['garden-giant-chess','Garden with giant chess set']]
const gallery: any[] = []
for (const [k, label] of gal) gallery.push({ label, image: await up('gallery', `${k}.jpg`, `${k}.jpg`) })
const brochureUrl = await up('brochure', 'brochure.pdf', 'brochure.pdf', '.', 'application/pdf')

type P = { key: string; name: string; beds: number; baths: number; sqft: number }
const PLANS: P[] = [{key:'2br-unit-01',name:'2 Bedroom Unit 01, 815 sq ft',beds:2,baths:2,sqft:815},{key:'2br-unit-02',name:'2 Bedroom Unit 02, 780 sq ft',beds:2,baths:2,sqft:780},{key:'3br-unit-01',name:'3 Bedroom Unit 01, 980 sq ft',beds:3,baths:3,sqft:980},{key:'3br-unit-02',name:'3 Bedroom Unit 02, 1,060 sq ft',beds:3,baths:3,sqft:1060},{key:'retirement-1br-suite',name:'Retirement 1 Bedroom Suite, 750 sq ft',beds:1,baths:1,sqft:750},{key:'retirement-2br-suite',name:'Retirement 2 Bedroom Suite, 985 sq ft',beds:2,baths:1,sqft:985}]
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
const amenityNames = ['Pool', 'Gym', 'Spa', 'Jogging Track', 'EV Charging', 'Security', 'BBQ Area', 'Cafe', 'Mini Mart', 'Parking']
for (const a of amenityNames) if (!(SO.AMENITY_NAME_OPTIONS as string[]).includes(a)) throw new Error('amenity not in vocabulary ' + a)
const BROCHURE_SRC = 'https://cms.homelandsskyline.lk/wp-content/uploads/2025/11/Greendale-Resort-Apartment-Brochure.pdf'
const data: Record<string, any> = {
  slug: SLUG, name: 'Greendale Retirement Resort Apartments', developer: dev.id, isPublished: false,
  status: 'Under Construction', constructionStatus: 'Finishing',
  type: 'Apartments', typeNote: 'Retirement apartment development',
  location: 'Athurugiriya', city: 'Athurugiriya', district: 'Colombo', province: 'Western',
  neighborhood: nb?.id, architect: architect?.id,
  contractor: 'Heyraa Construction (Pvt) Ltd',
  units: 96, floors: 6,
  startingPriceLkr: 36100000, priceRange: 'From Rs. 36,100,000',
  parking: 'Comes with a dedicated parking slot',
  summary: 'Greendale Retirement Resort Apartments is a Ground + 5 retirement apartment development of 96 apartments in Athurugiriya, now at the finishing stage, within the Greendale Retirement Resort & Residencies village.',
  description:
    'Greendale Retirement Resort Apartments is the apartment part of the Greendale Retirement Resort & Residencies village in Athurugiriya, between Malabe and Athurugiriya and 900 m from the Athurugiriya expressway interchange. The developer lists 96 apartments across Ground + 5 floors, each with a dedicated parking slot, and gives the construction stage as Under Construction, Finishing Stage. The page lists two- and three-bedroom apartments from 780 to 1,060 sq ft, and the Greendale retirement brochure also shows one-bedroom (750 sq ft) and two-bedroom (985 sq ft) apartment suites. Facilities listed on the page include a swimming pool, medical center, gym, spa, jogging track, electric car charging points, 24-hour security, BBQ pavilion, coffee shop, 24x7 doctors service, backup generator and a mini market. The development is designed by Home Lands Skyline and built by Heyraa Construction (Pvt) Ltd.',
  highlights: [
    '96 retirement apartments, Ground + 5 floors',
    'Finishing stage of construction',
    '24x7 doctors service and an on-site medical center',
    '900 m to the Athurugiriya expressway interchange',
  ],
  heroImage: gallery[0].image, gallery, brochureUrl, floorPlans,
  amenities: amenityNames.map((name) => ({ name })),
  unitFeatures, nearby,
  coordinates: { lat: 6.8729419, lng: 79.9875968 },
  sourceUrl: SOURCE,
  contact: { email: 'info@homelandsskyline.lk', phone: '+94 702 444 111' },
  socialLinks: { whatsapp: 'https://wa.me/94710299444' },
}
const todos: [string, string?][] = [
  ['Conflict: unit count', 'The page says 96 units; the brochure PDF linked on the page says "392 spacious apartments" (it appears to be the Cressida brochure with the name changed). The Greendale retirement brochure says 96 apartment suites. Entered 96.'],
  ['Conflict: unit types', 'The page headline says 2 and 3 bedroom apartments (780-1,060 sq ft) while its spec table says "1, 2 & 3 Bedroom". The page has no unit plans. Plans shown: the 4 two/three-bedroom layouts from the page brochure (same layouts as Cressida) plus the 1BR 750 and 2BR 985 retirement suites from the Greendale retirement brochure. Confirm which layouts actually apply to this block.'],
  ['Per-unit price and availability', 'Only "36.1M upwards" is published (entered). No per-plan prices; no availability. Plans show Contact for pricing.'],
  ['Bathrooms', 'Page says "1-2 Bathrooms". 2BR and 3BR plans from the page brochure show 2 and 3 bathrooms; the retirement 1BR and 2BR suites show 1 bathroom each. Entered as shown on each plan.'],
  ['Completion date', 'Page says "Under Construction - Finishing Stage"; no handover date published.'],
  ['Developer vs contractor', 'The page spec table lists Heyraa Construction (Pvt) Ltd under "Developer"; entered as contractor, with Home Lands Skyline as developer.'],
  ['Amenities with no match in the list', 'Medical Center, 24x7 Doctors Service, Backup Generator. The brochure (copy of the Cressida one) lists 50+ more facilities that were not entered because it may not describe Greendale.'],
  ['Coordinates', 'Map pin taken from the developer\'s Google Maps link (maps.app.goo.gl/fZ62x442yBPLRkHfA, Greendale Retirement Leisure Village). The page\'s embed is centred elsewhere, so it was not used.'],
  ['Neighbourhood', nb ? 'Linked to the Athurugiriya neighbourhood page.' : 'No Athurugiriya neighbourhood page exists.'],
  ['Photos', 'Site photos: 2 exterior renders, a clubhouse terrace and a garden scene. Not used: a duplicate exterior on grey background. There are no interior photos for the apartments. Plan images are cropped from the brochures.'],
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
