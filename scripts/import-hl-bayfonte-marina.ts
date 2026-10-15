/* eslint-disable @typescript-eslint/no-explicit-any -- one-off import script */
// Home Lands Skyline listing import: UNPUBLISHED draft + to-dos. Idempotent (exits if the slug exists).
//   NODE_ENV=production npx tsx scripts/<this file>.ts
import fs from 'node:fs'
import path from 'node:path'
import { config as loadEnv } from 'dotenv'

loadEnv({ path: path.join(process.cwd(), '.env.local') })
const base = '/private/tmp/claude-501/-Users-rupansinnarajah-Desktop-lankanewhomes/e4990c10-5391-4fb0-8f5a-3a7fe8004abd/scratchpad/hl-mine'
const D: any = {
 "SLUG": "bayfonte-marina",
 "DIR": "bay",
 "NB": "negombo",
 "PAGE": "bayfonte-marina-resort-apartment-for-sale-in-negombo",
 "BROCHURE": "https://cms.homelandsskyline.lk/wp-content/uploads/2025/08/Bayfonte-Brochure.pdf",
 "NAME": "Bayfonte Marina Resort Apartments",
 "gal": [
  [
   "exterior-lagoon-dusk",
   "Bayfonte towers on the Negombo Lagoon at dusk"
  ],
  [
   "exterior-lagoon-day",
   "Bayfonte towers across the lagoon"
  ],
  [
   "exterior-twilight",
   "Towers at twilight above the marina"
  ],
  [
   "exterior-dusk-marina",
   "Towers at dusk with marina berths"
  ],
  [
   "garden-aerial",
   "Landscaped garden path from above"
  ],
  [
   "dining-deck",
   "Outdoor dining deck from above"
  ],
  [
   "outdoor-dining",
   "Outdoor dining terrace"
  ],
  [
   "kayak-sculpture",
   "Garden feature with kayak"
  ],
  [
   "lounge-deck",
   "Lounge deck"
  ],
  [
   "promenade",
   "Landscaped promenade"
  ],
  [
   "play-lounge",
   "Play area and lounge seating"
  ],
  [
   "bbq-pergola",
   "Pergola and BBQ lawn"
  ],
  [
   "boat-dock",
   "Private boat dock"
  ],
  [
   "promenade-steps",
   "Garden steps and promenade"
  ],
  [
   "entrance-gate",
   "Entrance gate"
  ],
  [
   "sports-court",
   "Sports court"
  ],
  [
   "courts-aerial",
   "Courts and pool from above"
  ],
  [
   "podium-parking",
   "Podium and car park"
  ],
  [
   "pool-deck",
   "Swimming pool deck"
  ],
  [
   "pool-aerial",
   "Swimming pool from above"
  ]
 ],
 "plans": [
  [
   "Bayfonte_2BR-Unit-0104-scaled",
   "2BR Unit 01/04, 1,095 sq ft",
   2,
   2,
   1095,
   "2br-01-04"
  ],
  [
   "Bayfonte_2BR-Unit-0203-scaled",
   "2BR Unit 02/03, 1,085 sq ft",
   2,
   2,
   1085,
   "2br-02-03"
  ],
  [
   "Bayfonte_2BR-Unit-0508-scaled",
   "2BR Unit 05/08, 1,015 sq ft",
   2,
   2,
   1015,
   "2br-05-08"
  ],
  [
   "Bayfonte_2BR-Unit-0607-scaled",
   "2BR Unit 06/07, 900 sq ft",
   2,
   1,
   900,
   "2br-06-07"
  ],
  [
   "Bayfonte_3BR-Unit-0104-scaled",
   "3BR Unit 01/04, 1,290 sq ft",
   3,
   2,
   1290,
   "3br-01-04"
  ],
  [
   "Bayfonte_3BR-Unit-0203-scaled",
   "3BR Unit 02/03, 1,270 sq ft",
   3,
   2,
   1270,
   "3br-02-03"
  ],
  [
   "Bayfonte_3BR-Unit-0508-scaled",
   "3BR Unit 05/08, 1,375 sq ft",
   3,
   2,
   1375,
   "3br-05-08"
  ],
  [
   "Bayfonte_3BR-Unit-0607-scaled",
   "3BR Unit 06/07, 1,355 sq ft",
   3,
   2,
   1355,
   "3br-06-07"
  ]
 ],
 "status": "Under Construction",
 "constructionStatus": "Under Construction",
 "typeNote": "Lagoon-side resort apartments with a private boat pier and jet ski access",
 "location": "Negombo Lagoon, Negombo",
 "city": "Negombo",
 "district": "Gampaha",
 "province": "Western",
 "units": 288,
 "floors": 12,
 "price": 54000000,
 "summary": "288 two- and three-bedroom lagoon-side apartments in Negombo, ground plus 11 floors, with private lagoon access, a boat pier, jet ski access, a resident club and over 40 amenities; 10 minutes to the airport and the Katunayake interchange.",
 "description": "Bayfonte Marina Resort Apartments rise on the Negombo Lagoon facing the Negombo-Colombo main road, with 288 apartments in towers of ground plus 11 floors. The developer describes it as a resort-style development with private lagoon access, jet ski access, kayaking and boating, a private boat parking pier and a fishing pier. Choose 2-bedroom apartments of 900 to 1,095 sq ft or 3-bedroom apartments of 1,270 to 1,375 sq ft, each with a dedicated parking slot. The brochure lists 41 amenities, including a swimming pool and kids pool, gymnasium, spa, sauna and steam room, tennis and pickleball courts, a yoga and meditation deck, jogging path, restaurant, coffee shop, bar, banquet hall, meeting rooms and karaoke room, plus EV charging stations, standby generators and a smart vehicle gate system. The site is 10 minutes from the Katunayake Highway Interchange and Bandaranaike International Airport and about 20 minutes from Colombo city limits. Construction stage on the page: piling completed, structural work ongoing. Homes are built by Heyraa Construction (Pvt) Ltd.",
 "highlights": [
  "288 lagoon-side apartments, ground plus 11 floors",
  "Private lagoon access, boat parking pier and jet ski access",
  "41 amenities including pool, spa, gym, restaurant and bar",
  "10 minutes to Bandaranaike International Airport"
 ],
 "amenities": [
  "Pool",
  "Kids Pool",
  "Spa",
  "Cafe",
  "Gym",
  "Restaurant",
  "Bar",
  "EV Charging",
  "Yoga Deck",
  "Jogging Track",
  "Karaoke Room",
  "Sauna",
  "Steam Room",
  "Pickleball Court",
  "Meeting Room",
  "Function Room",
  "Garden",
  "Security",
  "Parking",
  "Children's Area"
 ],
 "specs": [
  [
   "Floor Area",
   "Living, dining, pantry, bedrooms, bathrooms, verandah, balcony and one parking slot within the complex"
  ],
  [
   "Substructure",
   "Pile foundation with RCC ground slab, as suggested by the Structural Engineer"
  ],
  [
   "Superstructure",
   "RCC columns, beams and slabs, with brick, pre-cast panel or cement block walls as directed by the Architect"
  ],
  [
   "Flooring",
   "Superior-quality tiles in living, dining, bedrooms and other internal areas; non-slip tiles on verandas, balconies, terraces and bathroom floors"
  ],
  [
   "Bathroom Walls",
   "Wall tiles up to the soffit"
  ],
  [
   "Painting",
   "Internal walls plastered smooth with two coats of putty, filler coat and two coats of emulsion paint. External walls plastered rough or semi-rough with a five-coat paint system and 10 years warranty. Balcony soffits with weather shield paint"
  ],
  [
   "Pantry",
   "Fully equipped pantry unit with granite or quartz work top, kitchen cabinets, hob, hood, electric oven, dishwasher and kitchen sink with tap"
  ],
  [
   "Electrical",
   "230V supply with separate electric meter, 13 amp sockets, ceiling fans in all bedrooms, air conditioning in the living area and all bedrooms except the servant room, TV, telephone and data outlets, separate gas meters, fire detection and protection system, standby generator power, 24/7 CCTV monitoring of common areas"
  ],
  [
   "Lighting",
   "Point wiring only for the unit; common area lighting supplied and fixed"
  ],
  [
   "Water Supply & Drainage",
   "PVC cold water pipe network for each bathroom from rooftop tanks filled from an underground sump, separate water meter for each unit, sewer and waste water lines connected to the main sewer line"
  ],
  [
   "Plumbing & Sanitary Fittings",
   "International-standard fully fitted bathrooms, washing machine water inlet, drain and power point, hot water via geyser for the master and common bathrooms"
  ],
  [
   "Doors & Windows",
   "Fire-rated engineered front and rear doors; engineered composite bedroom and bathroom doors; powder-coated aluminium French and other windows"
  ],
  [
   "Waterproofing",
   "Bathroom floors, shower walls, balconies and terraces waterproofed by a reputed company with a 10-year warranty"
  ],
  [
   "Termite Treatment",
   "Ground floor treated by a reputed company with a 10-year warranty"
  ]
 ],
 "general": [
  [
   "Parking",
   "One dedicated parking slot per apartment, fixed and not changeable; secure car parking"
  ],
  [
   "Security",
   "24/7 security; smart vehicle gate system; tower access control system"
  ],
  [
   "Power",
   "Standby generators"
  ],
  [
   "Lifts",
   "One passenger lift"
  ],
  [
   "Connectivity",
   "Fibre optic internet"
  ],
  [
   "Hot Water",
   "Heated water in every bathroom"
  ],
  [
   "Air Conditioning",
   "Fully air conditioned"
  ],
  [
   "Waste",
   "A separate garbage collection area on the ground floor"
  ]
 ],
 "parking": "One dedicated parking slot per apartment, fixed and not changeable",
 "visitorParking": null,
 "nearby": [
  [
   "Transport",
   "Katunayake Highway Interchange (10 min)"
  ],
  [
   "Transport",
   "Bandaranaike International Airport (10 min)"
  ],
  [
   "Hospital",
   "District General Hospital Negombo"
  ],
  [
   "Hospital",
   "Nawaloka Hospital"
  ],
  [
   "School",
   "Maris Stella College"
  ],
  [
   "School",
   "Ave Maria Convent"
  ],
  [
   "School",
   "Newstead Girls' College"
  ],
  [
   "School",
   "St Mary's College"
  ],
  [
   "School",
   "Gateway College"
  ],
  [
   "School",
   "St. Nicholas College"
  ],
  [
   "School",
   "Loyola College"
  ],
  [
   "School",
   "St. Thomas' College"
  ],
  [
   "Restaurant",
   "KFC"
  ],
  [
   "Restaurant",
   "Dinemore"
  ],
  [
   "Restaurant",
   "Pizza Hut"
  ],
  [
   "Restaurant",
   "Domino's"
  ],
  [
   "Restaurant",
   "Burger King"
  ],
  [
   "Landmark",
   "Heritance Negombo"
  ],
  [
   "Landmark",
   "Jetwing Blue"
  ],
  [
   "Landmark",
   "Jetwing Sea"
  ],
  [
   "Landmark",
   "Jetwing Lagoon"
  ],
  [
   "Landmark",
   "Negombo Fish Market"
  ],
  [
   "Landmark",
   "St. Mary's Church"
  ],
  [
   "Landmark",
   "Angurukaramulla Temple"
  ],
  [
   "Landmark",
   "Negombo Beach"
  ],
  [
   "Landmark",
   "Our Lady of Good Voyage Church"
  ],
  [
   "Landmark",
   "Colombo city limits (20 min)"
  ]
 ],
 "coords": [
  7.19863,
  79.85078649839477
 ],
 "videos": [
  [
   "Bayfonte Walkthrough",
   "https://www.youtube.com/watch?v=u_0F0hYZfpA"
  ],
  [
   "Bayfonte Marina Resort Apartments",
   "https://www.youtube.com/watch?v=jeQQJwaYp0o"
  ]
 ],
 "wa": "https://wa.me/94710299444",
 "contractor": "Heyraa Construction (Pvt) Ltd.",
 "todos": [
  [
   "Completion / handover date",
   "Page says \"Under Construction - Piling Completed, Structural Work Ongoing\". No completion year published; left blank."
  ],
  [
   "Unit count: site vs brochure",
   "Site specification says 288 apartment units (entered). The \"Ongoing Projects\" page of the Canterbury Crest brochure appears to list Bayfonte Marina with 202 units. Confirm the real count."
  ],
  [
   "Floors",
   "Site says \"Ground + 11\"; entered as 12 floors."
  ],
  [
   "Per-plan prices",
   "Only \"from Rs. 54M\" is published (entered). Per-plan prices not published; plans show \"Contact for pricing\". The site marks all 8 unit cards \"available\"."
  ],
  [
   "Payment plan",
   "No payment plan is published on the page or in the brochure."
  ],
  [
   "Bathrooms",
   "Bathrooms taken from the brochure plan captions: 2BR 900 sq ft has 1, other plans 2. The site shows \"2 Bathrooms\" generally."
  ],
  [
   "Villas",
   "The brochure and map embed are titled \"Apartments & Villas\"; the page lists apartments only. No villas were imported."
  ],
  [
   "Investment claims not entered",
   "The site banner claims \"Minimum daily rental income $125\", \"highest ROI guaranteed\" and \"100% capital appreciation in just 3 years\". These are marketing guarantees, not facts, so they were left out. Decide whether to show them with attribution."
  ],
  [
   "Amenities with no match in the site vocabulary",
   "Not mapped: Tennis Court, Private Lagoon Access, Jet Ski Access, Kayaking & Boating Access, Private Boat Parking Pier, Tranquil Fishing Pier, Relaxing Waterfront Lounge Deck, Community Hall, Banquet Hall (mapped to Function Room), VIP Dining Rooms, Private Party Room, Toddlers' Area, Kids Art & Craft, Standby Generators, Smart Vehicle Gate System, Super Markets. Most appear in the description."
  ],
  [
   "Sports court image",
   "One gallery image shows a basketball court, which the brochure amenity list does not mention (it lists tennis and pickleball). Used as \"Sports court\"; confirm."
  ],
  [
   "Images not used",
   "Two near-duplicate renders (dusk towers and the entrance gate close-up) were left out; the site's card image is the hero."
  ],
  [
   "Map pin",
   "Coordinates from the developer's Google Maps embed (\"Bayfonte Marina Resort Apartments & Villas by Home Lands Skyline\")."
  ],
  [
   "Neighbourhood",
   "Linked to the existing Negombo page."
  ],
  [
   "Restaurant at the site",
   "The brochure mentions Bayfonte Restaurant, a Negombo landmark now operated by Home Lands; not stated whether it is part of the apartment complex."
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
