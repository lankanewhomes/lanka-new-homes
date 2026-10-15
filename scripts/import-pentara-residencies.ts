/* eslint-disable @typescript-eslint/no-explicit-any -- one-off import script */
// Pentara Residencies (Home Lands Skyline), Thummulla Handiya, Colombo: UNPUBLISHED draft + developer + to-dos.
//   PENTARA_DIR=<folder with web/, plans/, brochure.pdf, logo.png> NODE_ENV=production npx tsx scripts/import-pentara-residencies.ts
// Sources: homelandsskyline.lk/apartment-project/pentara-residencies-thummulla-handiya (page data) and its brochure PDF.
import fs from 'node:fs'
import path from 'node:path'
import { config as loadEnv } from 'dotenv'

loadEnv({ path: path.join(process.cwd(), '.env.local') })
const base = process.env.PENTARA_DIR ?? ''
if (!base) throw new Error('Set PENTARA_DIR')
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
const R2 = (sub: string, name: string) => `projects/${SLUG}/${sub}/${SLUG}_${name}`
const up = (sub: string, file: string, name: string, dir = 'web', type = 'image/jpeg') => mirrorToR2(R2(sub, name), fs.readFileSync(path.join(base, dir, file)), type)

const SLUG = 'pentara-residencies'
const SOURCE = 'https://www.homelandsskyline.lk/apartment-project/pentara-residencies-thummulla-handiya'
if (await find('projects', SLUG)) { console.log('exists', SLUG); process.exit(0) }

// ---- developer
let dev = await find('developers', 'home-lands-skyline')
if (!dev) {
  const logo = await mirrorToR2('logos/developers/home-lands-skyline-logo.png', fs.readFileSync(path.join(base, 'logo.png')), 'image/png')
  dev = await payload.create({
    collection: 'developers',
    overrideAccess: true,
    data: {
      slug: 'home-lands-skyline', name: 'Home Lands Skyline', logo, location: 'Colombo', website: 'https://www.homelandsskyline.lk',
      description: "Home Lands Skyline (Pvt) Ltd is a Sri Lankan property developer building luxury apartments, houses and land projects in prime locations. The company states it has delivered more than 3,750 homes across 20+ developments and serves over 5,000 clients, with ongoing and completed apartment projects in Colombo, Malabe, Athurugiriya, Negombo, Wadduwa and Piliyandala.",
      contact_email: 'info@homelandsskyline.lk', contact_phone: '+94 702 444 111',
    } as never,
  })
  console.log('developer', dev.id)
}
const nb = await find('neighborhoods', 'colombo-05')
const architect = ((await payload.find({ collection: 'architects' as never, where: { name: { like: 'Weeraratne' } } as never, limit: 1, overrideAccess: true, depth: 0 })).docs[0] as any) ?? null

// ---- images
const gal: [string, string, string, string][] = [
  ['Transform_this_3d_rendered_image_into_an_ultrareal_delpmaspu-scaled.jpg', 'exterior-dusk', 'Pentara Residencies twin towers at dusk', 'gallery'],
  ['Pentara-5.jpg', 'exterior-sky-bridge', 'The twin towers joined by the Sky Bridge', 'gallery'],
  ['UB-1.jpg', 'interior-living-dining', 'Apartment living and dining area', 'gallery'],
  ['UB-2-scaled.jpg', 'interior-lounge', 'Apartment lounge', 'gallery'],
  ['UB-22.jpg', 'interior-living-tv-wall', 'Apartment living room with feature wall', 'gallery'],
  ['UB-3.jpg', 'interior-living-marble', 'Living area with marble detailing', 'gallery'],
  ['UB-5.jpg', 'interior-dining', 'Apartment dining area', 'gallery'],
  ['UB-12.jpg', 'interior-bedroom', 'Apartment bedroom', 'gallery'],
  ['UB-14-scaled.jpg', 'interior-master-bedroom', 'Apartment master bedroom', 'gallery'],
]
const gallery: any[] = []
for (const [f, k, label, sub] of gal) gallery.push({ label, image: await up(sub, f, `${k}.jpg`) })
const brochureUrl = await up('brochure', 'brochure.pdf', 'brochure.pdf', '.', 'application/pdf')

type P = { key: string; name: string; beds: number; baths: number; sqft: number }
const PLANS: P[] = [
  { key: 'a-2br-900', name: 'Tower A Deluxe 2BR, 900 sq ft', beds: 2, baths: 2, sqft: 900 },
  { key: 'a-2br-1100', name: 'Tower A Deluxe 2BR, 1,100 sq ft', beds: 2, baths: 2, sqft: 1100 },
  { key: 'a-3br-1275', name: 'Tower A Deluxe 3BR, 1,275 sq ft', beds: 3, baths: 3, sqft: 1275 },
  { key: 'a-3br-1350', name: 'Tower A Deluxe 3BR, 1,350 sq ft', beds: 3, baths: 3, sqft: 1350 },
  { key: 'b-2br-900', name: 'Tower B Deluxe 2BR, 900 sq ft', beds: 2, baths: 2, sqft: 900 },
  { key: 'b-2br-1225', name: 'Tower B Deluxe 2BR, 1,225 sq ft', beds: 2, baths: 2, sqft: 1225 },
  { key: 'b-3br-1350', name: 'Tower B Deluxe 3BR, 1,350 sq ft', beds: 3, baths: 3, sqft: 1350 },
  { key: 'b-3br-1450', name: 'Tower B Deluxe 3BR, 1,450 sq ft', beds: 3, baths: 3, sqft: 1450 },
  { key: 'b-3br-1500', name: 'Tower B Deluxe 3BR, 1,500 sq ft', beds: 3, baths: 3, sqft: 1500 },
  { key: 'b-3br-1600', name: 'Tower B Deluxe 3BR, 1,600 sq ft', beds: 3, baths: 3, sqft: 1600 },
  { key: 'b-3br-1650', name: 'Tower B Deluxe 3BR, 1,650 sq ft', beds: 3, baths: 3, sqft: 1650 },
  { key: 'b-3br-1700', name: 'Tower B Deluxe 3BR, 1,700 sq ft', beds: 3, baths: 3, sqft: 1700 },
  { key: 'sv-3br-2000', name: 'Tower B Sky Villa 3BR, 2,000 sq ft', beds: 3, baths: 3, sqft: 2000 },
  { key: 'sv-4br-2400', name: 'Tower B Sky Villa 4BR, 2,400 sq ft', beds: 4, baths: 4, sqft: 2400 },
  { key: 'sv-4br-2800', name: 'Tower B Sky Villa 4BR, 2,800 sq ft', beds: 4, baths: 4, sqft: 2800 },
  { key: 'sv-4br-3000', name: 'Tower B Sky Villa 4BR, 3,000 sq ft', beds: 4, baths: 4, sqft: 3000 },
  { key: 'ph-3550', name: 'Penthouse 4BR, 3,550 sq ft', beds: 4, baths: 4, sqft: 3550 },
  { key: 'ph-3400-a', name: 'Penthouse 4BR, 3,400 sq ft (plan 1)', beds: 4, baths: 4, sqft: 3400 },
  { key: 'ph-3400-b', name: 'Penthouse 4BR, 3,400 sq ft (plan 2)', beds: 4, baths: 4, sqft: 3400 },
  { key: 'ph-3400-c', name: 'Penthouse 4BR, 3,400 sq ft (plan 3)', beds: 4, baths: 4, sqft: 3400 },
  { key: 'sm-6000-a', name: 'Sky Mansion 4BR, 6,000 sq ft (plan 1)', beds: 4, baths: 4, sqft: 6000 },
  { key: 'sm-6000-b', name: 'Sky Mansion 4BR, 6,000 sq ft (plan 2)', beds: 4, baths: 4, sqft: 6000 },
]
const floorPlans: any[] = []
for (const p of PLANS) {
  floorPlans.push({
    planName: p.name, bedrooms: p.beds, bathrooms: p.baths, floorAreaSqFt: p.sqft, startingPriceLkr: 0, availability: 'Available',
    image: await up('floor-plans', `${p.key}.jpg`, `${p.key}.jpg`, 'plans'),
  })
}

const unitFeatures = [
  {
    key: 'specifications',
    items: [
      feat('Substructure', 'Pile foundation with RCC ground slab'),
      feat('Superstructure', 'RCC columns, walls, beams and slabs, with bricks or cement blocks on walls and aluminium framing and glazing'),
      feat('Flooring', 'High-quality floor tiles in living, dining, bedrooms and other internal areas (wooden or marble flooring in selected living, dining and bedroom areas); non-slip tiles in bathrooms, verandas, balconies and terraces'),
      feat('Bathroom Walls', 'Wall tiles up to the ceiling level'),
      feat('Painting', 'Internal walls: two coats of putty, filler coat and two coats of emulsion paint. External walls: rough or semi-rough finish with a five-coat paint system and 10 years warranty'),
      feat('Pantry', 'Fully equipped international-standard pantry with kitchen cabinets, hob, hood, electric oven, microwave oven, refrigerator, dishwasher, washing machine and sink with mixer tap'),
      feat('Electrical', '230V supply with separate electric meter, 13 amp sockets, ceiling fans in bedrooms, air conditioning in the living area and all bedrooms except the maid\'s room, TV, telephone and data outlets, separate gas meters, BMS billing facility, fire detection and protection system, video door phone, visitor access control, standby generator power'),
      feat('Lighting', 'LED panel light fittings; decorative light fittings in living and dining areas'),
      feat('Water Supply & Drainage', 'PVC cold water pipe network for each bathroom, separate water meter for each unit, sewer and waste water lines connected to the main sewer line'),
      feat('Plumbing & Sanitary Fittings', 'International-standard fully fitted bathrooms, a bathtub in specific units, cold and hot water supply for the pantry, hot water via geyser for all bathrooms except the maid\'s bathroom'),
      feat('Doors & Windows', 'Fire-rated engineering timber main door with smart door lock and rear door; engineering composite doors for bedrooms, bathrooms and servant room; powder-coated aluminium French and other windows'),
      feat('Storage', 'Wardrobe units in all bedrooms, a completed linen room and high-quality larder units'),
      feat('Waterproofing', 'Bathroom floors, shower walls, balconies and terraces waterproofed by a reputed company with a 10-year warranty'),
      feat('Termite Treatment', 'Ground floor termite treatment by a reputed company with a 10-year warranty'),
    ],
  },
  {
    key_other: 'General Features',
    items: [
      feat('Air Conditioning', 'Fully air conditioned'),
      feat('Hot Water', 'Hot water in every bathroom and for the pantry'),
      feat('Access', 'Smart key access; separate maid access'),
      feat('Security', '24/7 security; CCTV for common areas; smart vehicle recognition gate system'),
      feat('Accessibility', 'Disabled accessibility'),
      feat('Parking', '1 to 4 parking slots depending on the unit; EV charging provision for each apartment and a common EV charging facility on each parking floor'),
      feat('Connectivity', 'Fibre optic internet'),
      feat('Storage Option', 'Extra storage option'),
    ],
  },
]
for (const g of unitFeatures) for (const it of g.items as any[]) { so(it, 'field', SO.KEY_FEATURE_FIELD_OPTIONS); so(it, 'value', SO.KEY_FEATURE_VALUE_OPTIONS) }

const amenityNames = ['Gym', "Children's Area", 'Lounge', 'Infinity Pool', 'Kids Pool', 'Spa', 'Sauna', 'Steam Room', 'Jogging Track', 'Yoga Deck', 'Garden', 'BBQ Area', 'Padel Court', 'Badminton Court', 'Rooftop', 'Restaurant', 'Cafe', 'Bar', 'Function Room', 'Meeting Room', 'Library', 'Laundry Service', 'Parking', 'EV Charging', 'Security', 'CCTV', 'Concierge']
for (const a of amenityNames) if (!(SO.AMENITY_NAME_OPTIONS as string[]).includes(a)) throw new Error('amenity not in vocabulary ' + a)

const near = (category: string, names: string[]) => names.map((name) => ({ category, name }))
const nearby = [
  ...near('Hospital', ['Lanka Hospitals', 'Durdans Hospital', 'Kings Hospital', 'Asiri Hospital', 'Joseph Frazer Hospital', 'Ninewells Hospital']),
  ...near('School', ['Royal College', "Ladies' College", 'Visakha Vidyalaya', 'Sirimavo Bandaranaike Vidyalaya', 'Thurstan College', 'Isipathana College', "Bishop's College", "St. Bridget's Convent", 'Holy Family Convent', "St. Peter's College", 'Colombo International School', 'Stafford International School', 'University of Colombo', 'IIT', 'NIBM']),
  ...near('Shopping', ['One Galle Face Mall', 'Colombo City Centre', 'Majestic City', 'Liberty Plaza', 'Havelock City Mall', 'Arcade Independence Square']),
  ...near('Landmark', ['Havelock Sports Club', 'Sri Lanka Cricket Club (SSC)', 'Nondescripts Cricket Club (NCC)', 'Royal Colombo Golf Club', 'Colombo Racecourse', 'CR & FC', 'CH & FC', 'BRC']),
]

const data: Record<string, any> = {
  slug: SLUG, name: 'Pentara Residencies', developer: dev.id, isPublished: false,
  status: 'Under Construction', constructionStatus: 'Under Construction',
  type: 'Apartments', typeNote: 'Twin towers of deluxe apartments, sky villas, penthouses and sky mansions',
  location: 'Thummulla Handiya, Colombo 05', city: 'Colombo 05', district: 'Colombo', province: 'Western',
  neighborhood: nb?.id, architect: architect?.id,
  contractor: 'Heyraa Construction (Pvt) Ltd.',
  units: 362, floors: 40,
  startingPriceLkr: 102000000, priceRange: 'From Rs. 102,000,000',
  summary: 'Twin towers rising over 40 levels at Thummulla Handiya, where Colombo 3, 4, 5 and 7 meet: 362 apartments from 2 to 4 bedrooms, joined by a Sky Bridge on Level 30, with 45+ star-class amenities.',
  description:
    'Pentara Residencies is a twin-tower development rising over 40 levels at Thummulla Handiya, at the point where Colombo 3, 4, 5 and the established Colombo 7 meet. Designed by architect Philip Weeraratne, it offers 362 homes: 115 two-bedroom and 200 three-bedroom deluxe apartments, 29 sky villas (10 three-bedroom and 19 four-bedroom), 16 four-bedroom penthouses and 2 four-bedroom sky mansions, from 900 to 6,000 sq ft. A Sky Bridge on Level 30 joins the two towers, with a sky restaurant on Level 31 and a cantilevered sky pool on Level 32, as the developer describes it. The developer lists more than 45 amenities, including a gymnasium, spa, sauna and steam room, a jogging track and yoga deck, a party lawn and BBQ area, padel and badminton courts, a kids play area and activity club, and a lounge, coffee shop and bar. Parking is 1 to 4 slots depending on the unit. Construction update from the developer\'s page: piling is 60% complete. The homes are built by Heyraa Construction (Pvt) Ltd.',
  highlights: [
    'Twin towers over 40 levels, joined by a Sky Bridge on Level 30',
    '362 homes: deluxe apartments, sky villas, penthouses and sky mansions',
    '45+ star-class amenities including a sky pool, spa and padel court',
    'Where Colombo 3, 4, 5 and 7 meet, near leading schools and hospitals',
  ],
  heroImage: gallery[0].image, gallery, brochureUrl, floorPlans,
  amenities: amenityNames.map((name) => ({ name })),
  unitFeatures, nearby,
  coordinates: { lat: 6.895666, lng: 79.858172 },
  videos: [
    { label: 'Pentara Residencies Walkthrough', embedUrl: 'https://www.youtube.com/watch?v=W0YNF39U8jE' },
    { label: 'Pentara Residencies', embedUrl: 'https://www.youtube.com/watch?v=zRDiLhaDLu4' },
  ],
  sourceUrl: SOURCE,
  contact: { email: 'info@homelandsskyline.lk', phone: '+94 702 444 111' },
  socialLinks: { whatsapp: 'https://wa.me/94710299444' },
}
for (const k of ['district', 'city', 'province'] as const) so(data, k, SO[`${k.toUpperCase()}_OPTIONS`])
for (const p of data.floorPlans) { so(p, 'furnishing', SO.FURNISHING_OPTIONS) }
const created: any = await payload.create({ collection: 'projects', data: data as never, overrideAccess: true })
console.log('created', created.id, created.slug, 'published:', created.isPublished, 'plans', created.floorPlans?.length)

const links = [SOURCE, 'https://cms.homelandsskyline.lk/wp-content/uploads/2025/08/1753778416980-Pentara-Brochure-New-Low.pdf', `https://www.lankanewhomes.com/listing-preview/${SLUG}`]
const todos: [string, string?][] = [
  ['Completion / handover date', 'Neither the page nor the brochure gives a completion year. The page says "Under Construction - Piling 60% Completed". Left blank.'],
  ['Price per unit and units available', 'Only "from Rs. 102M" is published (entered). No per-plan prices and no per-plan availability, so each plan shows "Contact for pricing". Brochure counts: 2BR 115, 3BR 200, 3BR sky villas 10, 4BR sky villas 19, penthouses 16, sky mansions 2 (= 362).'],
  ['Payment plan', 'No payment plan or deposit terms are published on the page or in the brochure.'],
  ['Floor plans: Tower A and Tower B plans only partly mapped', 'Drawings were cropped from the brochure (pages 38-45). Sky villas and penthouses are shown for Tower B only; Tower A sky villas are not in the brochure. The three 3,400 sq ft penthouses and the two 6,000 sq ft sky mansions have no unit label on the plan, so they are named plan 1, 2, 3.'],
  ['Per-unit bathrooms', 'Bathrooms come from the brochure captions (2BR = 2, 3BR = 3, 4BR = 4).'],
  ['Exact site address', 'Only "Thummulla Handiya" is published; map pin taken from the developer\'s own Google Maps embed.'],
  ['Sky restaurant, sky pool and Sky Bridge are in the brochure only', 'Level 30 Sky Bridge, Level 31 sky restaurant and Level 32 sky pool come from the brochure stack diagram. The website lists the Sky Bridge too.'],
  ['Amenity photos', 'The site shows amenity icons, not photos. A night photo of an infinity pool (ag2.jpg) is on the site gallery but is not clearly of this project, so it was not used.'],
  ['Area guide photos', 'The page uses landmark photos (Town Hall, Seema Malakaya, Royal College, Visakha Vidyalaya, Lanka Hospitals, One Galle Face, WTC and others). They are about the area, so they were not put in this listing\'s gallery.'],
  ['WhatsApp number', 'Project WhatsApp set to +94 71 029 9444 (owner, 2026-10-15). The developer profile has no WhatsApp number yet.'],
  ['Publish?'],
]
for (const [title, notes] of todos) {
  await payload.create({ collection: 'listing-todos' as never, data: { title, listingType: 'project', project: created.id, notes, sourceLinks: links.join('\n') } as never, overrideAccess: true })
}
console.log('todos', todos.length)
process.exit(0)
