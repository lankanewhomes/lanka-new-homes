/* eslint-disable @typescript-eslint/no-explicit-any -- one-off import script */
// Home Lands Skyline listing import: UNPUBLISHED draft + to-dos. Idempotent (exits if the slug exists).
//   NODE_ENV=production npx tsx scripts/<this file>.ts
import fs from 'node:fs'
import path from 'node:path'
import { config as loadEnv } from 'dotenv'

loadEnv({ path: path.join(process.cwd(), '.env.local') })
const base = '/private/tmp/claude-501/-Users-rupansinnarajah-Desktop-lankanewhomes/e4990c10-5391-4fb0-8f5a-3a7fe8004abd/scratchpad/hl-mine'
const D: any = {
 "SLUG": "canterbury-crest",
 "DIR": "crest",
 "NB": "piliyandala",
 "PAGE": "canterbury-crest-resort-apartments-piliyandala",
 "BROCHURE": "https://cms.homelandsskyline.lk/wp-content/uploads/2026/03/Canterbury-Crest-Brochure-Final_Low-2.pdf",
 "NAME": "Canterbury Crest Resort Apartments",
 "gal": [
  [
   "exterior-pool-towers",
   "Canterbury Crest towers and swimming pool"
  ],
  [
   "exterior-tower-front",
   "Tower frontage and landscaped parking"
  ],
  [
   "aerial-day",
   "Aerial view of the four apartment blocks"
  ],
  [
   "aerial-dusk",
   "Aerial view at dusk"
  ],
  [
   "aerial-site",
   "Aerial view of the blocks within Canterbury Golf City"
  ],
  [
   "aerial-photo",
   "Aerial photo of the Canterbury Golf City site"
  ],
  [
   "entrance",
   "Canterbury Crest entrance gate"
  ],
  [
   "entrance-dusk",
   "Entrance gate at dusk"
  ],
  [
   "pool-dusk",
   "Swimming pool at dusk"
  ],
  [
   "pickleball-court",
   "Pickleball court beside the blocks"
  ],
  [
   "pickleball-court-aerial",
   "Pickleball court from above"
  ],
  [
   "outdoor-gym",
   "Outdoor gym"
  ],
  [
   "outdoor-gym-towers",
   "Outdoor gym with the towers behind"
  ]
 ],
 "plans": [
  [
   "Crest-Floor-Plans_2BR-Unit-1-scaled",
   "2BR Unit 01, 950 sq ft",
   2,
   2,
   950,
   "2br-01"
  ],
  [
   "Crest-Floor-Plans_2BR-Unit-2-scaled",
   "2BR Unit 02, 950 sq ft",
   2,
   2,
   950,
   "2br-02"
  ],
  [
   "Crest-Floor-Plans_2BR-Unit-3-scaled",
   "2BR Unit 03, 950 sq ft",
   2,
   2,
   950,
   "2br-03"
  ],
  [
   "Crest-Floor-Plans_2BR-Unit-4-scaled",
   "2BR Unit 04, 950 sq ft",
   2,
   2,
   950,
   "2br-04"
  ],
  [
   "Crest-Floor-Plans_2BR-Unit-5-scaled",
   "2BR Unit 05, 950 sq ft",
   2,
   2,
   950,
   "2br-05"
  ],
  [
   "Crest-Floor-Plans_2-BR-Unit-6-scaled",
   "2BR Unit 06, 950 sq ft",
   2,
   2,
   950,
   "2br-06"
  ],
  [
   "Crest-Floor-Plans_2BR-Unit-7-scaled",
   "2BR Unit 07, 950 sq ft",
   2,
   2,
   950,
   "2br-07"
  ],
  [
   "Crest-Floor-Plans_2BR-Unit-8-scaled",
   "2BR Unit 08, 950 sq ft",
   2,
   2,
   950,
   "2br-08"
  ],
  [
   "Crest-Floor-Plans_3BR-Unit-1-scaled",
   "3BR Unit 01, 1300 sq ft",
   3,
   2,
   1300,
   "3br-01"
  ],
  [
   "Crest-Floor-Plans_3BR-Unit-2-scaled",
   "3BR Unit 02, 1100 sq ft",
   3,
   2,
   1100,
   "3br-02"
  ],
  [
   "Crest-Floor-Plans_3BR-Unit-3-scaled",
   "3BR Unit 03, 1100 sq ft",
   3,
   2,
   1100,
   "3br-03"
  ],
  [
   "Crest-Floor-Plans_3BR-Unit-4-scaled",
   "3BR Unit 04, 1200 sq ft",
   3,
   2,
   1200,
   "3br-04"
  ],
  [
   "Crest-Floor-Plans_3BR-Unit-5-scaled",
   "3BR Unit 05, 1200 sq ft",
   3,
   2,
   1200,
   "3br-05"
  ],
  [
   "Crest-Floor-Plans_3BR-Unit-6-scaled",
   "3BR Unit 06, 1100 sq ft",
   3,
   2,
   1100,
   "3br-06"
  ],
  [
   "Crest-Floor-Plans_3BR-Unit-7-scaled",
   "3BR Unit 07, 1100 sq ft",
   3,
   2,
   1100,
   "3br-07"
  ],
  [
   "Crest-Floor-Plans_3BR-Unit-8-scaled",
   "3BR Unit 08, 1300 sq ft",
   3,
   2,
   1300,
   "3br-08"
  ]
 ],
 "status": "Under Construction",
 "constructionStatus": "Under Construction",
 "typeNote": "Two- and three-bedroom apartments within Canterbury Golf City",
 "location": "Piliyandala - Kahathuduwa",
 "city": "Piliyandala",
 "district": "Colombo",
 "province": "Western",
 "units": 96,
 "floors": 6,
 "price": 37000000,
 "summary": "96 two- and three-bedroom apartments in two towers at Kahathuduwa, Piliyandala, in Canterbury Golf City: the third and final phase, with a 9-hole golf course, golf club and 50+ amenities, 20 minutes from Colombo city limits.",
 "description": "Canterbury Crest Resort Apartments is the third and final phase of Canterbury Golf City at Kahathuduwa, Piliyandala, which the developer describes as Sri Lanka's largest residential development. The brochure presents 96 apartments in two towers, in a modern Victorian-style design with a half-brick, half-paint finish and a private balcony for every home. Choose from 2-bedroom apartments of 950 sq ft and 3-bedroom apartments of 1,100 to 1,300 sq ft; the brochure shows 2 bathrooms in every plan. The developer lists more than 50 amenities, including a swimming pool and kids pool, an indoor and outdoor gym, a jogging track, a spa, tennis and pickleball courts, a daycare centre, a medical centre, a mini market and the Canterbury Golf Club with its 9-hole course, restaurant and pub. One parking slot is allocated to each apartment, with visitor parking, EV charging points and a car washing bay. The site is 5 minutes from the Kahathuduwa Interchange on the Southern Expressway and about 20 minutes from Colombo city limits via the four-lane Piliyandala-Colombo Road. Homes are built by Heyraa Construction (Pvt) Ltd.",
 "highlights": [
  "96 apartments in two towers, the final phase of Canterbury Golf City",
  "2 and 3 bedroom homes from 950 to 1,300 sq ft",
  "Signature 9-hole golf course, golf club and 50+ amenities",
  "5 minutes to the Kahathuduwa Interchange, 20 minutes to Colombo city limits"
 ],
 "amenities": [
  "Security",
  "CCTV",
  "EV Charging",
  "Children's Area",
  "Gym",
  "Outdoor Gym",
  "Jogging Track",
  "Cycling Paths",
  "BBQ Area",
  "Cafe",
  "Pool",
  "Kids Pool",
  "Spa",
  "Games Room",
  "Pickleball Court",
  "Padel Court",
  "Restaurant",
  "Bar",
  "Function Room",
  "Parking",
  "Garden",
  "Mini Mart",
  "Laundry Service"
 ],
 "specs": [
  [
   "Floor Area",
   "Living, dining, pantry, bedrooms, bathrooms, verandah, balcony and one parking slot within the complex"
  ],
  [
   "Substructure",
   "Individual footing foundation with RCC columns, plinth beam and random rubble masonry work, as suggested by the Structural Engineer"
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
   "Internal walls plastered smooth with two coats of putty, filler coat and two coats of emulsion paint. External walls plastered rough or semi-rough with a five-coat paint system and 10 years warranty"
  ],
  [
   "Pantry",
   "Fully equipped pantry unit with granite or quartz work top, kitchen cabinets, hob, hood and kitchen sink with tap"
  ],
  [
   "Electrical",
   "230V supply with separate electric meter, 13 amp sockets, ceiling fans in all bedrooms, air conditioning unit for the master bedroom, TV, telephone and data outlets, fire detection and protection system, standby generator power, 24/7 CCTV monitoring of common areas"
  ],
  [
   "Lighting",
   "Point wiring only for the unit; common area lighting supplied and fixed"
  ],
  [
   "Water Supply & Drainage",
   "PVC cold water pipe network for each bathroom from rooftop tanks, separate water meter for each unit, sewer and waste water lines connected to the main sewer line"
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
   "One parking slot per apartment, fixed and not changeable; visitor parking, car charging points and a car washing bay"
  ],
  [
   "Security",
   "24-hour security; CCTV for common areas"
  ],
  [
   "Power",
   "Standby generators; back-up power for common areas"
  ],
  [
   "Lifts",
   "One passenger lift"
  ],
  [
   "Access",
   "Separate maid access; smart key access; disabled accessibility"
  ],
  [
   "Waste",
   "A separate garbage collection area on the ground floor"
  ]
 ],
 "parking": "One parking slot allocated to each apartment, fixed and not changeable; car charging points and a car washing bay",
 "visitorParking": "Yes",
 "nearby": [
  [
   "Transport",
   "Kahathuduwa Highway Interchange (5 min)"
  ],
  [
   "Transport",
   "Southern Expressway (5 min)"
  ],
  [
   "Transport",
   "Proposed Ruwanpura Expressway (5 min)"
  ],
  [
   "Transport",
   "Kottawa-Makumbura Transport Hub (10 min)"
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
  ]
 ],
 "coords": [
  6.769299175818461,
  80.00570794593368
 ],
 "videos": [
  [
   "Canterbury Crest",
   "https://www.youtube.com/watch?v=61TuzsNAsQA"
  ],
  [
   "Canterbury Golf Club",
   "https://www.youtube.com/watch?v=IuquNeUocx8"
  ],
  [
   "Life at Canterbury",
   "https://www.youtube.com/watch?v=xLLu5rUAEM4"
  ]
 ],
 "wa": "https://wa.me/94710299444",
 "contractor": "Heyraa Construction (Pvt) Ltd.",
 "todos": [
  [
   "Completion / handover date",
   "Neither the page nor the brochure gives a completion year. Page says \"Under Construction\". Left blank."
  ],
  [
   "Per-plan prices and availability",
   "Only \"from Rs. 37M\" is published (entered). No per-unit prices; every plan shows \"Contact for pricing\". The site marks all 16 unit cards \"available\"."
  ],
  [
   "Payment plan",
   "No payment plan or deposit terms are published on the page or in the brochure."
  ],
  [
   "Floors: site vs brochure",
   "Site specification says \"6 Floors\" (entered as 6). Brochure says each tower rises five floors. Confirm (ground + 5?)."
  ],
  [
   "Bathrooms: site vs brochure",
   "Site says \"1-2 Bathrooms\". Every plan in the brochure (2BR and 3BR) shows 2 bathrooms; 2 entered."
  ],
  [
   "Air conditioning: spec vs amenity list",
   "Brochure amenity list says \"Fully Air-Conditioned\" but the specification page says an AC unit only for the master bedroom. Entered the specification wording; left \"fully air conditioned\" out."
  ],
  [
   "Unit mix per tower",
   "Plans come from the site unit cards (8 x 2BR 950 sq ft; 3BR of 1,100, 1,200 and 1,300 sq ft). The page does not say how many of each type exist across the 96 apartments."
  ],
  [
   "Amenities with no match in the site vocabulary",
   "Not mapped: Tennis Court, 9-hole Golf Course, Golf Training Centre, Pro Shop, Medical Centre, Daycare Centre, Party Lawn, Community Centre, Banquet Area, ATM, Bill Paying, Salon, Golf Cart Facility, Car Washing Bay, Drivers Rest Rooms, Reading Nooks. Mentioned in the description where relevant."
  ],
  [
   "Duplicate site entry",
   "The site also has a hidden duplicate (canterbury-crest-resort-apartment-for-sale-in-piliyandala, visible=false). The visible page was used."
  ],
  [
   "Map pin",
   "Coordinates come from the developer's Google Maps embed, which points at \"Canterbury Golf Resort Apartments and Residencies\" (the Canterbury Golf City site), not a Crest-specific pin."
  ],
  [
   "Images not used",
   "Duplicate/near-duplicate renders (entrance variants with a car and EV charger, a dusk aerial duplicate, a repeat of the card photo) were left out."
  ],
  [
   "Neighbourhood",
   "Linked to Piliyandala. A Kahathuduwa neighbourhood page also exists; the developer writes the location as \"Piliyandala - Kahathuduwa\"."
  ],
  [
   "WhatsApp number",
   "Project WhatsApp set to +94 71 029 9444 (the number the site's agent links use on other listings). The unit cards on this page have no agent link."
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
