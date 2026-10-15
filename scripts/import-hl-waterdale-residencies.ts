/* eslint-disable @typescript-eslint/no-explicit-any -- one-off import script */
// Waterdale Residencies, Tickell Road bordering Colombo 07 (Home Lands Skyline): UNPUBLISHED draft + to-dos.
//   HL_DIR=<hl scratch dir> NODE_ENV=production npx tsx scripts/import-hl-waterdale-residencies.ts
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
const SLUG = 'waterdale-residencies-colombo-07'
const R2 = (sub: string, name: string) => `projects/${SLUG}/${sub}/${SLUG}_${name}`
const up = (sub: string, file: string, name: string, dir: string, type = 'image/jpeg') => mirrorToR2(R2(sub, name), fs.readFileSync(path.join(base, dir, file)), type)
const SOURCE = 'https://www.homelandsskyline.lk/apartment-project/waterdale-residencies-for-sale-in-colombo-7-border'
if (await find('projects', SLUG)) { console.log('exists', SLUG); process.exit(0) }

const dev = await find('developers', 'home-lands-skyline')
if (!dev) throw new Error('developer missing')
const nb = await find('neighborhoods', 'colombo-07')
const architect = ((await payload.find({ collection: 'architects' as never, where: { name: { like: 'Weeraratne' } } as never, limit: 1, overrideAccess: true, depth: 0 })).docs[0] as any) ?? null

const gal: [string, string, string][] = [
  ['g4.jpg', 'exterior-dusk', 'Waterdale Residencies tower at dusk'],
  ['g1.jpg', 'exterior-aerial', 'Waterdale Residencies in the Colombo cityscape'],
  ['g5-1.jpg', 'interior-living-terrace', 'Apartment living room opening to the terrace'],
  ['g5.jpg', 'interior-living-feature-wall', 'Apartment living room with feature wall'],
  ['g7.jpg', 'interior-living-tv-wall', 'Living area with media wall'],
  ['g6.jpg', 'interior-dining-chandelier', 'Dining area with chandelier'],
  ['g7-1.jpg', 'interior-dining', 'Apartment dining area'],
  ['g6-1.jpg', 'interior-bedroom', 'Apartment bedroom'],
  ['g8.jpg', 'interior-master-bedroom-jacuzzi', 'Bedroom with jacuzzi and city view'],
]
const gallery: any[] = []
for (const [f, k, label] of gal) gallery.push({ label, image: await up('gallery', f, `${k}.jpg`, 'wd/g') })
const brochureUrl = await mirrorToR2(R2('brochure', 'brochure.pdf'), fs.readFileSync(path.join(base, 'wd.pdf')), 'application/pdf')

type P = { key: string; file: string; name: string; beds: number; baths: number; sqft: number }
const PLANS: P[] = [
  { key: 'unit-02-2br-1050', file: 'Waterdale_2BR-Unit-02-scaled.jpg', name: '2BR Unit 02, 1,050 sq ft', beds: 2, baths: 2, sqft: 1050 },
  { key: 'unit-03-2br-800', file: 'Waterdale_2BR-Unit-03-scaled.jpg', name: '2BR Unit 03, 800 sq ft', beds: 2, baths: 1, sqft: 800 },
  { key: 'unit-04-2br-1100', file: 'Waterdale_2BR-Unit-04-scaled.jpg', name: '2BR Unit 04, 1,100 sq ft', beds: 2, baths: 2, sqft: 1100 },
  { key: 'unit-05-2br-1200', file: 'Waterdale_2BR-Unit-05-scaled.jpg', name: '2BR Unit 05, 1,200 sq ft', beds: 2, baths: 2, sqft: 1200 },
  { key: 'unit-0809-2br-900', file: 'Waterdale_2BR-Unit-0809-scaled.jpg', name: '2BR Unit 08 & 09, 900 sq ft', beds: 2, baths: 2, sqft: 900 },
  { key: 'unit-10-2br-800', file: 'Waterdale_2BR-Unit-10-scaled.jpg', name: '2BR Unit 10, 800 sq ft', beds: 2, baths: 1, sqft: 800 },
  { key: 'unit-01-3br-1550', file: 'Waterdale_3BR-Unit-01-scaled.jpg', name: '3BR Unit 01, 1,550 sq ft', beds: 3, baths: 2, sqft: 1550 },
  { key: 'unit-060712-3br-1700', file: 'Waterdale_3BR-Unit-060712-scaled.jpg', name: '3BR Unit 06, 07 & 12, 1,700 sq ft', beds: 3, baths: 3, sqft: 1700 },
  { key: 'unit-11-3br-1300', file: 'Waterdale_3BR-Unit-11-scaled.jpg', name: '3BR Unit 11, 1,300 sq ft', beds: 3, baths: 2, sqft: 1300 },
  { key: 'penthouse-02-3br-1900', file: 'Waterdale_Penthouse-Unit-02-scaled.jpg', name: 'Penthouse Unit 02, 3BR, 1,900 sq ft', beds: 3, baths: 3, sqft: 1900 },
  { key: 'penthouse-03-4br-2300', file: 'Waterdale_Penthouse-Unit-03-scaled.jpg', name: 'Penthouse Unit 03, 4BR, 2,300 sq ft', beds: 4, baths: 3, sqft: 2300 },
  { key: 'penthouse-06-4br-2100', file: 'Waterdale_Penthouse-Unit-06-scaled.jpg', name: 'Penthouse Unit 06, 4BR, 2,100 sq ft', beds: 4, baths: 3, sqft: 2100 },
  { key: 'penthouse-07-3br-1800', file: 'Waterdale_Penthouse-Unit-07-scaled.jpg', name: 'Penthouse Unit 07, 3BR, 1,800 sq ft', beds: 3, baths: 3, sqft: 1800 },
  { key: 'duplex-01-l1-3300', file: 'Waterdale_Duplex-Unit-01-LVL-01-scaled.jpg', name: 'Duplex Unit 01, Level 1, 4BR, 3,300 sq ft', beds: 4, baths: 3, sqft: 3300 },
  { key: 'duplex-01-l2-3300', file: 'Waterdale_Duplex-Unit-01-LVL-02-scaled.jpg', name: 'Duplex Unit 01, Level 2, 4BR, 3,300 sq ft', beds: 4, baths: 3, sqft: 3300 },
  { key: 'duplex-0405-l1-3400', file: 'Waterdale_Duplex-Unit-0405-LVL-01-scaled.jpg', name: 'Duplex Unit 04 & 05, Level 1, 4BR, 3,400 sq ft', beds: 4, baths: 4, sqft: 3400 },
  { key: 'duplex-0405-l2-3400', file: 'Waterdale_Duplex-0405-LVL-02-scaled.jpg', name: 'Duplex Unit 04 & 05, Level 2, 4BR, 3,400 sq ft', beds: 4, baths: 4, sqft: 3400 },
  { key: 'duplex-08-l1-3600', file: 'Waterdale_Duplex-Unit-08-LVL-01-scaled.jpg', name: 'Duplex Unit 08, Level 1, 4BR, 3,600 sq ft', beds: 4, baths: 4, sqft: 3600 },
  { key: 'duplex-08-l2-3600', file: 'Waterdale_Duplex-Unit-08-LVL-02-scaled.jpg', name: 'Duplex Unit 08, Level 2, 4BR, 3,600 sq ft', beds: 4, baths: 4, sqft: 3600 },
]
const floorPlans: any[] = []
for (const p of PLANS) {
  floorPlans.push({
    planName: p.name, bedrooms: p.beds, bathrooms: p.baths, floorAreaSqFt: p.sqft, startingPriceLkr: 0, availability: 'Available',
    image: await up('floor-plans', p.file, `${p.key}.jpg`, 'wd/p'),
  })
}

const unitFeatures = [
  {
    key: 'specifications',
    items: [
      feat('Substructure', 'Pile foundation with RCC ground slab as suggested by the structural engineer'),
      feat('Superstructure', 'RCC columns, walls, beams and slabs, with bricks or cement blocks on walls and aluminium framing and glazing as directed by the architect'),
      feat('Flooring', 'High-quality floor tiles in living, dining, bedrooms and other internal areas; non-slip tiles in verandas, balconies, terraces and bathrooms'),
      feat('Bathroom Walls', 'Wall tiles up to the ceiling level'),
      feat('Pantry', 'Imported pantry from Direct Kitchen Australia, fully equipped with refrigerator, microwave oven, cooker hood, hob and oven, dishwasher and washing machine'),
    ],
  },
]
for (const g of unitFeatures) for (const it of g.items as any[]) { so(it, 'field', SO.KEY_FEATURE_FIELD_OPTIONS); so(it, 'value', SO.KEY_FEATURE_VALUE_OPTIONS) }

const amenityNames = ['Gym', 'Cafe', "Children's Area", 'EV Charging', 'BBQ Area', 'Security', 'Jogging Track', 'Parking', 'Infinity Pool', 'Kids Pool', 'Spa', 'Sauna', 'Steam Room', 'Function Room', 'Lounge', 'Bar', 'Reception & Lobby', 'CCTV', 'Laundry Service']
for (const a of amenityNames) if (!(SO.AMENITY_NAME_OPTIONS as string[]).includes(a)) throw new Error('amenity not in vocabulary ' + a)

const near = (category: string, names: string[]) => names.map((name) => ({ category, name }))
const nearby = [
  ...near('School', ['Royal College', 'Visakha Vidyalaya', 'Ananda College', 'Nalanda College', 'Wesley College', 'Musaeus College', 'Devi Balika Vidyalaya', 'D. S. Senanayake College', 'The British School in Colombo', 'Gateway College']),
  ...near('Hospital', ['Lanka Hospitals', 'National Hospital', 'Castle Street Hospital', 'Ninewells Hospital', 'Asiri Central Hospital', 'Asiri Medical Hospital', 'Asiri Surgical Hospital', 'Lady Ridgeway Hospital']),
  ...near('Shopping', ['Arcade Independence Square']),
  ...near('Landmark', ['Viharamahadevi Park', 'Nelum Pokuna Theatre', 'Royal Colombo Golf Club', 'BMICH', 'Lotus Tower']),
]

const data: Record<string, any> = {
  slug: SLUG, name: 'Waterdale Residencies', developer: dev.id, isPublished: false,
  status: 'Under Construction', constructionStatus: 'Under Construction',
  type: 'Apartments', typeNote: 'Luxury high-rise of 2 to 4 bedroom apartments, penthouses and duplexes',
  location: 'Tickell Road, bordering Colombo 07', city: 'Colombo 07', district: 'Colombo', province: 'Western',
  neighborhood: nb?.id, architect: architect?.id,
  contractor: 'Heyraa Construction (Pvt) Ltd.',
  units: 202, floors: 26,
  startingPriceLkr: 80000000, priceRange: 'From Rs. 80,000,000',
  summary: 'A 26-storey luxury high-rise on Tickell Road, bordering Colombo 07: 202 units of 2 and 3 bedroom apartments, penthouses and duplexes with floor-to-ceiling windows, from 800 to 3,600 sq ft.',
  description:
    'Waterdale Residencies is a luxury high-rise by Home Lands Skyline on Tickell Road, bordering Colombo 07. The 26-storey tower holds 202 units: 2 and 3 bedroom apartments, penthouses and duplexes, from 800 to 3,600 sq ft, each designed with floor-to-ceiling windows and panoramic views over Colombo. It is the vision of Sri Lankan architect Philip Weeraratne. The developer lists amenities including an infinity pool and kids pool, gym, spa, sauna and steam room, jogging track, a children\'s play area and kids club, a coffee shop, private dining area, sports lounge, bar and function hall, a party lawn and BBQ area, EV charging, and 24-hour security with CCTV in common areas. Apartments come with an imported fully equipped pantry, and parking is 1 to 2 slots depending on the unit. The page lists the site as under construction with piling completed and structural work ongoing, and the homes are built by Heyraa Construction (Pvt) Ltd.',
  highlights: [
    '26-storey tower on Tickell Road, bordering Colombo 07',
    '202 units: 2 and 3 bedroom apartments, penthouses and duplexes',
    'Floor-to-ceiling windows with panoramic Colombo views',
    'Infinity pool, spa, gym and jogging track, 1 to 2 parking slots per unit',
  ],
  heroImage: gallery[0].image, gallery, brochureUrl, floorPlans,
  amenities: amenityNames.map((name) => ({ name })),
  unitFeatures, nearby,
  parking: '1 to 2 parking slots depending on the unit',
  coordinates: { lat: 6.913390643057292, lng: 79.87664836091488 },
  videos: [
    { label: 'Waterdale', embedUrl: 'https://www.youtube.com/watch?v=3IsXTW42SV4' },
    { label: 'Waterdale 2', embedUrl: 'https://www.youtube.com/watch?v=DW3JcGKn3Ls' },
  ],
  sourceUrl: SOURCE,
  contact: { email: 'info@homelandsskyline.lk', phone: '+94 702 444 111' },
  socialLinks: { whatsapp: 'https://wa.me/94710299444' },
}
for (const k of ['district', 'city', 'province'] as const) so(data, k, SO[`${k.toUpperCase()}_OPTIONS`])
for (const p of data.floorPlans) { so(p, 'furnishing', SO.FURNISHING_OPTIONS) }
const created: any = await payload.create({ collection: 'projects', data: data as never, overrideAccess: true })
console.log('created', created.id, created.slug, 'published:', created.isPublished, 'plans', created.floorPlans?.length)

const links = [SOURCE, 'https://cms.homelandsskyline.lk/wp-content/uploads/2025/09/Waterdale-Brochure.pdf', `https://www.lankanewhomes.com/listing-preview/${SLUG}`]
const todos: [string, string?][] = [
  ['Completion / handover date', 'Not published. Page says "Under Construction - Piling Completed, Structural Work Ongoing". Left blank.'],
  ['Price per unit and availability', 'Only "80M Upwards" is published (entered). No per-plan prices, so each plan shows "Contact for pricing". Every plan is marked "available" on the site, which is the developer\'s default flag, not a stock count.'],
  ['Payment plan', 'No payment plan or deposit terms published on the page or in the brochure.'],
  ['Unit mix', 'Page: 2BR, 3BR, 4BR, Penthouses & Duplexes, 202 units. The marketing text says "2 and 3-bedroom apartments along with penthouses and duplexes" while the plans include 4-bedroom penthouses and duplexes. No count per type is given.'],
  ['Unit 05 vs Unit 04 naming', 'The page names the 1,200 sq ft plan "Unit 04" (a second Unit 04); the brochure labels it Unit 05. Entered as Unit 05. Also duplex Unit 04 & 05 are one plan.'],
  ['Per-unit bathrooms', 'Bathrooms taken from the brochure captions (e.g. 2BR 800 sq ft = 1, 3BR 1,550 = 2, 1,700 = 3). Penthouses and duplexes also have a powder room, not counted. The Unit 10 caption reads "1 Bathrooms". The Penthouse 06 caption is cut off at "3 Bathroom".'],
  ['Floors', 'Specification says "Ground + 26"; the description says 26 storeys. Entered 26.'],
  ['Sizes', 'The brochure text shows 3,330 sq ft next to Duplex Unit 01 while the plan caption says 3,300 sq ft; the site also says 3,300. Entered 3,300.'],
  ['Duplex levels', 'Each duplex has two level drawings, entered as two plans (Level 1 and Level 2) with the same size.'],
  ['Specifications only partly published', 'The page lists only substructure, superstructure, floor finish and bathroom wall tiles. The brochure gives no fuller specification beyond the pantry.'],
  ['Amenities not in the vocabulary', 'Private dining area, sports lounge, kids club, aerobics area, party lawn, small gathering pods, newspaper reading area, car washing bay, changing rooms, smart key, access-controlled lifts, disabled accessibility, visitors parking, double parking. Mapped: Gym, Cafe, Children\'s Area, EV Charging, BBQ Area, Security, Jogging Track, Parking, Infinity Pool, Kids Pool, Spa, Sauna, Steam Room, Function Room, Lounge, Bar, Reception & Lobby, CCTV, Laundry Service.'],
  ['Gallery images not used', 'Two lifestyle photos with models (woman in an infinity pool, woman reading on a lawn) were left out as stock-style marketing. Area-guide landmark photos on the page (Royal College, Port City and others) are about the area, not this project.'],
  ['Exact site address', 'Only "Tickell Road, bordering Colombo 07" is published; map pin from the developer\'s Google Maps embed.'],
  ['WhatsApp number', 'Project WhatsApp set to +94 71 029 9444 (site default); the page itself shows no number.'],
  ['Publish?'],
]
for (const [title, notes] of todos) {
  await payload.create({ collection: 'listing-todos' as never, data: { title, listingType: 'project', project: created.id, notes, sourceLinks: links.join('\n') } as never, overrideAccess: true })
}
console.log('todos', todos.length)
process.exit(0)
