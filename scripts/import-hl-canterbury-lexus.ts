/* eslint-disable @typescript-eslint/no-explicit-any -- one-off import script */
// Home Lands Skyline listing import: UNPUBLISHED draft + to-dos. Idempotent (exits if the slug exists).
//   NODE_ENV=production npx tsx scripts/<this file>.ts
import fs from 'node:fs'
import path from 'node:path'
import { config as loadEnv } from 'dotenv'

loadEnv({ path: path.join(process.cwd(), '.env.local') })
const base = '/private/tmp/claude-501/-Users-rupansinnarajah-Desktop-lankanewhomes/e4990c10-5391-4fb0-8f5a-3a7fe8004abd/scratchpad/hl-mine'
const D: any = {
 "SLUG": "canterbury-lexus",
 "DIR": "lexus",
 "NB": "piliyandala",
 "PAGE": "canterbury-lexus-resort-apartments",
 "BROCHURE": "https://cms.homelandsskyline.lk/wp-content/uploads/2025/09/Canterbury-Stage-2-Brochure.pdf",
 "NAME": "Canterbury Lexus Golf Resort Apartments",
 "gal": [
  [
   "exterior-golf-view",
   "Lexus apartment blocks overlooking the golf course"
  ],
  [
   "exterior-palms",
   "Apartment blocks among palm trees"
  ],
  [
   "exterior-fairway",
   "Apartment blocks beside the fairway"
  ],
  [
   "exterior-towers",
   "Apartment towers and fairway"
  ],
  [
   "exterior-dusk-golf",
   "Balconies and golf course at dusk"
  ],
  [
   "golf-greens",
   "Golf greens with palm trees"
  ],
  [
   "pool-and-towers",
   "Swimming pool and apartment blocks"
  ],
  [
   "exterior-dusk",
   "Apartment blocks at dusk"
  ],
  [
   "street-view",
   "Apartment blocks from the street"
  ],
  [
   "garden-apartment-balcony",
   "Balcony and garden lounge"
  ],
  [
   "pergola-walkway",
   "Pergola walkway beside the blocks"
  ]
 ],
 "plans": [
  [
   "1",
   "2BR Apartment Type A, 860 sq ft",
   2,
   1,
   860,
   "2br-type-a"
  ],
  [
   "22",
   "2BR Apartment Type B, 985 sq ft",
   2,
   2,
   985,
   "2br-type-b"
  ],
  [
   "33333",
   "2BR Apartment Type C, 1,070 sq ft",
   2,
   2,
   1070,
   "2br-type-c"
  ],
  [
   "444",
   "3BR Apartment Type A, 1,270 sq ft",
   3,
   2,
   1270,
   "3br-type-a"
  ],
  [
   "5",
   "Penthouse Type 01, 3BR, 1,975 sq ft",
   3,
   3,
   1975,
   "penthouse-01"
  ],
  [
   "666",
   "Penthouse Type 02, 4BR, 2,575 sq ft",
   4,
   3,
   2575,
   "penthouse-02"
  ]
 ],
 "status": "Completed",
 "constructionStatus": "Ready to Move In",
 "typeNote": "Golf resort apartments and penthouses within Canterbury Golf City",
 "location": "Piliyandala - Kahathuduwa",
 "city": "Piliyandala",
 "district": "Colombo",
 "province": "Western",
 "units": 288,
 "floors": 11,
 "price": 47000000,
 "summary": "Golf resort apartments and penthouses at Kahathuduwa, Piliyandala, ready to occupy: 2, 3 and 4 bedroom homes from 860 to 2,575 sq ft beside the 9-hole Canterbury golf course, 20 minutes from Colombo city limits.",
 "description": "Canterbury Lexus Golf Resort Apartments sit inside Canterbury Golf City at Kahathuduwa, Piliyandala, beside the 9-hole golf course that the developer calls Sri Lanka's first day and night golf course. The site lists the stage as Ready to Occupy. Homes range from 2-bedroom apartments of 860 to 1,070 sq ft to a 3-bedroom of 1,270 sq ft and two penthouses: a 3-bedroom of 1,975 sq ft and a 4-bedroom of 2,575 sq ft. The developer lists a swimming pool, indoor gym, kids play area, restaurant, daycare centre, BBQ area, spa and 24-hour security, with golf-course views from the balconies, and an EV charging facility. One parking slot is allocated to each apartment (two for penthouses, per the brochure). The site is 5 minutes from the Kahathuduwa Highway Interchange and 20 minutes from Colombo city limits. Architect and developer are named on the page as Home Lands Skyline (Pvt) Ltd; the page's developer line names Heyraa Construction (Pvt) Ltd.",
 "highlights": [
  "Ready to occupy golf resort apartments beside a 9-hole golf course",
  "2, 3 and 4 bedroom homes including two penthouses",
  "Swimming pool, gym, spa, restaurant and daycare centre",
  "5 minutes to the Kahathuduwa Interchange, 20 minutes to Colombo city limits"
 ],
 "amenities": [
  "Pool",
  "Gym",
  "Children's Area",
  "Restaurant",
  "BBQ Area",
  "Spa",
  "Security",
  "EV Charging",
  "Parking"
 ],
 "specs": [
  [
   "Floor Area",
   "Living, dining, pantry, 2 or 3 bedrooms, toilets, verandah or balcony and one parking slot within the complex; penthouses have 4 bedrooms and 2 parking slots"
  ],
  [
   "Substructure",
   "Raft or individual footing foundation with RCC columns, plinth beam and random rubble masonry work, as suggested by the Structural Engineer"
  ],
  [
   "Superstructure",
   "RCC columns, beams and slabs; 9 inch clay bricks on the outer perimeter, 8 inch blocks as unit separation walls and 4 inch blocks on internal walls"
  ],
  [
   "Flooring",
   "Wooden laminated timber flooring in living and dining areas; glazed porcelain tiles (2 ft x 2 ft) in bedrooms and other internal areas; non-slip rustic ceramic tiles on verandas and balconies; non-slip ceramic tiles in toilets"
  ],
  [
   "Bathroom Walls",
   "Ceramic tiles up to 7 ft on shower areas and 5 ft elsewhere in the toilet"
  ],
  [
   "Painting",
   "Internal walls plastered smooth with two coats of wall putty, one coat of filler and two coats of emulsion paint. External walls plastered rough or semi-rough with a five-coat system"
  ],
  [
   "Ceiling",
   "Bulk head ceiling provided in penthouse living and dining areas"
  ],
  [
   "Pantry",
   "Pantry unit with quartz top, high-gloss doors, MDF internal partitioning, stainless-steel single bowl sink and chrome plated swan neck tap"
  ],
  [
   "Electrical",
   "Separate electricity meter, 13 amp sockets, one TV and telephone outlet, fans in living, dining, master and other bedrooms, air conditioning units in the bedrooms and living area"
  ],
  [
   "Lighting",
   "Point wiring only within the unit, except balcony lights; common area lighting supplied and fixed"
  ],
  [
   "Water Supply & Drainage",
   "PVC cold pipe network for each bathroom from a rooftop tank filled from an underground sump, separate water meter for each unit, waste and sewer lines to the nearest manhole"
  ],
  [
   "Plumbing & Sanitary Fittings",
   "Fully fitted bathrooms with ROCELL or equivalent fittings, tempered glass shower partition (except maid's bathroom), hot water via 15 litre geyser to the master bathroom, washing machine inlet and outlet point"
  ],
  [
   "Doors & Windows",
   "Class I engineered timber front and rear doors; solid plywood internal doors; powder-coated aluminium French and other windows"
  ],
  [
   "Waterproofing",
   "Bathroom floors, shower walls and balconies waterproofed by a reputed company with a ten-year warranty"
  ],
  [
   "Termite Treatment",
   "Ground floor of all blocks treated by a specialist with a minimum 10-year warranty"
  ]
 ],
 "general": [
  [
   "Parking",
   "One parking slot per apartment, fixed and not changeable; two slots for penthouses"
  ],
  [
   "Security",
   "24-hour security"
  ],
  [
   "Power",
   "Generator facility for common areas and elevators"
  ],
  [
   "Lifts",
   "One passenger lift"
  ],
  [
   "Waste",
   "A separate garbage collection area on the ground floor"
  ],
  [
   "Maid Facility",
   "Maid's room and toilet in the 3-bedroom and penthouse plans; maid facility in selected 2-bedroom plans"
  ]
 ],
 "parking": "One parking slot allocated to each apartment, fixed and not changeable; penthouses have two slots",
 "visitorParking": null,
 "nearby": [
  [
   "Transport",
   "Kahathuduwa Highway Interchange (5 min)"
  ],
  [
   "Shopping",
   "Supermarkets (5 min)"
  ],
  [
   "Hospital",
   "Medical centre (5 min)"
  ],
  [
   "Landmark",
   "Pearl Bay (10 min)"
  ],
  [
   "Landmark",
   "Colombo city limits (20 min)"
  ],
  [
   "Landmark",
   "Canterbury Golf Club"
  ]
 ],
 "coords": [
  6.769299193227536,
  80.0079985752955
 ],
 "videos": [],
 "wa": "https://wa.me/94710299444",
 "contractor": "Heyraa Construction (Pvt) Ltd",
 "todos": [
  [
   "Completion / handover date",
   "Site says \"Ready to Occupy\"; no completion year or handover date is published. Left blank; status entered as Completed with construction status Ready to Move In."
  ],
  [
   "Units available",
   "Page says \"288 Units\" in the specification but gives no available count; 288 also appears on the Bayfonte page (identical wording), so it may be copy-pasted. Entered 288 per the site; confirm."
  ],
  [
   "Floors",
   "Site says \"Ground + 10\"; entered as 11 floors."
  ],
  [
   "Floor areas: site vs brochure",
   "Site plans: 2BR 860 / 985 / 1,070 sq ft, penthouse type 01 1,975 sq ft. Brochure (Stage 2) shows 2BR 1,110 / 1,010 / 1,100 sq ft, 3BR 1,270, penthouse type 01 2,045 sq ft (3BR, 4 bathrooms), penthouse type 02 2,575 sq ft (3 bathrooms). Site values entered; brochure differs. Confirm."
  ],
  [
   "Bathrooms",
   "Bathrooms taken from the site plan captions (860 sq ft: 1; others 2; penthouses 3). Brochure shows 2 in each 2BR and 4 in penthouse type 01."
  ],
  [
   "Per-plan prices",
   "Only \"from Rs. 47M\" is published (entered). Per-plan prices not published; plans show \"Contact for pricing\"."
  ],
  [
   "Payment plan",
   "No payment plan is published on the page or in the brochure."
  ],
  [
   "Developer / contractor line",
   "The page \"Developer\" specification row says Heyraa Construction (Pvt) Ltd (the construction company elsewhere); entered as contractor. The brochure is the Stage 2 brochure (Lexus apartments and Canterbury Golf Villas)."
  ],
  [
   "Amenities with no match in the site vocabulary",
   "Not mapped: Daycare Centre, 9-Hole Golf Course, Star-Class Restaurant at Canterbury Golf Club (mapped to Restaurant). The brochure amenity page (image) was not transcribed beyond the site list."
  ],
  [
   "Images",
   "Three gallery images are named \"Garden Apartment\" and may belong to a different Canterbury product; they were used because the site shows them on this page. A blue-white tower render (Home-Lands-Group-all-set-to-open... press image) shows a different design and was not used; the card image was a duplicate of the hero."
  ],
  [
   "Videos",
   "The page has no videos."
  ],
  [
   "Map pin",
   "Developer's Google Maps embed (Canterbury Golf Resort Apartments & Residencies), a shared Canterbury Golf City location."
  ],
  [
   "Neighbourhood",
   "Linked to Piliyandala. A Kahathuduwa page also exists."
  ]
 ]
}
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
const SLUG: string = D.SLUG
const R2 = (sub: string, name: string) => `projects/${SLUG}/${sub}/${SLUG}_${name}`
const SOURCE = `https://www.homelandsskyline.lk/apartment-project/${D.PAGE}`

if (await find('projects', SLUG)) { console.log('exists', SLUG); process.exit(0) }
const dev = await payload.findByID({ collection: 'developers', id: 69, overrideAccess: true, depth: 0 }) as any
if (dev.slug !== 'home-lands-skyline') throw new Error('developer 69 is not home-lands-skyline')
const nb = await find('neighborhoods', D.NB)

const gallery: any[] = []
for (const [k, label] of D.gal) gallery.push({ label, image: await mirrorToR2(R2('gallery', `${k}.jpg`), fs.readFileSync(`${base}/${D.DIR}/out/web/${k}.jpg`), 'image/jpeg') })
const brochureUrl = await mirrorToR2(R2('brochure', 'brochure.pdf'), fs.readFileSync(`${base}/${D.DIR}/brochure.pdf`), 'application/pdf')

const floorPlans: any[] = []
for (const [file, planName, bedrooms, bathrooms, floorAreaSqFt, key] of D.plans) {
  floorPlans.push({
    planName, bedrooms, bathrooms, floorAreaSqFt, startingPriceLkr: 0, availability: 'Available',
    image: await mirrorToR2(R2('floor-plans', `${key}.jpg`), fs.readFileSync(`${base}/${D.DIR}/out/plans/${file}.jpg`), 'image/jpeg'),
  })
}

const unitFeatures = [
  { key: 'specifications', items: D.specs.map(([a, b]: string[]) => feat(a, b)) },
  { key_other: 'General Features', items: D.general.map(([a, b]: string[]) => feat(a, b)) },
]
for (const g of unitFeatures) for (const it of g.items as any[]) { so(it, 'field', SO.KEY_FEATURE_FIELD_OPTIONS); so(it, 'value', SO.KEY_FEATURE_VALUE_OPTIONS) }
for (const a of D.amenities) if (!(SO.AMENITY_NAME_OPTIONS as string[]).includes(a)) throw new Error('amenity not in vocabulary ' + a)

const data: Record<string, any> = {
  slug: SLUG, name: D.NAME, developer: 69, isPublished: false,
  status: D.status, constructionStatus: D.constructionStatus,
  type: 'Apartments', typeNote: D.typeNote,
  location: D.location, city: D.city, district: D.district, province: D.province,
  neighborhood: nb?.id,
  contractor: D.contractor,
  units: D.units, floors: D.floors,
  startingPriceLkr: D.price, priceRange: `From Rs. ${D.price.toLocaleString('en-US')}`,
  summary: D.summary, description: D.description, highlights: D.highlights,
  heroImage: gallery[0].image, gallery, brochureUrl, floorPlans,
  amenities: D.amenities.map((name: string) => ({ name })),
  unitFeatures,
  nearby: D.nearby.map(([category, name]: string[]) => ({ category, name })),
  parking: D.parking,
  coordinates: { lat: D.coords[0], lng: D.coords[1] },
  videos: D.videos.map(([label, embedUrl]: string[]) => ({ label, embedUrl })),
  sourceUrl: SOURCE,
  contact: { email: 'info@homelandsskyline.lk', phone: '+94 702 444 111' },
  socialLinks: { whatsapp: D.wa },
}
if (D.visitorParking) data.visitorParking = D.visitorParking
for (const k of ['district', 'city', 'province'] as const) so(data, k, SO[`${k.toUpperCase()}_OPTIONS`])
for (const p of data.floorPlans) so(p, 'furnishing', SO.FURNISHING_OPTIONS)
const created: any = await payload.create({ collection: 'projects', data: data as never, overrideAccess: true })
console.log('created', created.id, created.slug, 'published:', created.isPublished, 'plans', created.floorPlans?.length, 'gallery', created.gallery?.length, 'nb', nb?.id)

const links = [SOURCE, D.BROCHURE, `https://www.lankanewhomes.com/listing-preview/${SLUG}`]
const todos: [string, string?][] = [...D.todos, ['Publish?']]
for (const [title, notes] of todos) {
  await payload.create({ collection: 'listing-todos' as never, data: { title, listingType: 'project', project: created.id, notes, sourceLinks: links.join('\n') } as never, overrideAccess: true })
}
console.log('todos', todos.length)
process.exit(0)
