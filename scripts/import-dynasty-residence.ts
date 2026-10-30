/* eslint-disable @typescript-eslint/no-explicit-any -- one-off import script */
// Dynasty Residence, Kandy (GVR Lanka, https://www.dynastyresidence.com/), added at the owner's request 2026-10-29.
//   DYN_DIR=<folder with img/, plans/, brochure.pdf> NODE_ENV=production npx tsx scripts/import-dynasty-residence.ts
// Everything below is from the developer's site (home, pricing, location, common-facilities, unique-features, contact-us) and the unit plan
// drawings (bedrooms / baths / total area / units per type read off the plans). The site publishes NO prices (on request), so prices stay 0.
import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { config as loadEnv } from 'dotenv'
loadEnv({ path: path.join(process.cwd(), '.env.local') })
const dir = process.env.DYN_DIR ?? ''
if (!dir) throw new Error('Set DYN_DIR')
const cfg = ((await import('../payload.config')) as any).default
const { getPayload } = await import('payload')
const { mirrorToR2 } = await import('../src/lib/listing-import/mirror')
const SO = (await import('../src/collections/shared-fields')) as any
const payload = await getPayload({ config: cfg })
const pool = (payload.db as any).pool

const SLUG = 'dynasty-residence-kandy'
const find = async (collection: string, slug: string) =>
  ((await payload.find({ collection: collection as never, where: { slug: { equals: slug } }, limit: 1, overrideAccess: true, depth: 0 })).docs[0] as any) ?? null
async function createRetry(collection: string, data: any) {
  for (let attempt = 0; attempt < 6; attempt++) {
    try { return (await payload.create({ collection: collection as never, data, overrideAccess: true } as never)) as any } catch (e: any) {
      const bad = [...new Set((e?.data?.errors ?? []).map((x: any) => String(x.path ?? '').split('.')[0]).filter(Boolean))] as string[]
      if (!bad.length) throw e
      console.log('VALIDATION dropping', bad.join(','), JSON.stringify(e.data.errors).slice(0, 300)); for (const f of bad) delete data[f]
    }
  }
  throw new Error('create failed ' + collection)
}
if (await find('projects', SLUG)) { console.log('exists', SLUG); process.exit(0) }
const nb = await find('neighborhoods', 'kandy')
if (!nb) throw new Error('neighbourhood kandy missing')
const R = (sub: string, name: string) => `projects/${SLUG}/${sub}/${SLUG}_${name}`
const up = (file: string, key: string, type = 'image/jpeg') => mirrorToR2(key, fs.readFileSync(path.join(dir, file)), type)

let dev = await find('developers', 'gvr-lanka')
if (!dev) {
  dev = await createRetry('developers', {
    slug: 'gvr-lanka', name: 'GVR Lanka (Pvt) Ltd', website: 'https://www.dynastyresidence.com/', location: 'Kandy',
    description: 'GVR Lanka Pvt Ltd is the developer of Dynasty Residence, a completed riverside apartment complex on Lady McCallum Drive, Kandy. It offers short-term financing to buyers.',
    contact_email: 'sales@dynastyresidence.com', contact_phone: '+94777884066',
  })
  console.log('developer created', dev.id)
}

const gallery: { label: string; image: string }[] = []
const g = async (file: string, label: string, slug: string) => gallery.push({ label, image: await up(file, R('gallery', `${slug}.jpg`)) })
await g('img/slider1.jpg', 'Dynasty Residence beside the Mahaweli river', 'aerial-mahaweli-river')
await g('img/slider6.jpg', 'Penthouse private rooftop garden', 'penthouse-rooftop-garden')
await g('img/slider4.jpg', 'Sky villa double-height living room', 'sky-villa-living-room')
await g('img/slider3.jpg', 'Master bedroom with mountain view', 'master-bedroom')
await g('img/slider5.jpg', 'Dining and kitchen', 'dining-kitchen')
await g('img/img1.jpg', 'Infinity pool overlooking the river', 'infinity-pool')
await g('img/img2.jpg', 'Sky villa upper-level study', 'sky-villa-study')
await g('img/img4.jpg', 'Dining area with mountain view', 'dining-mountain-view')
await g('img/design1.jpg', 'Fully furnished serviced apartments', 'furnished-serviced-apartments')
await g('img/slider2.jpg', 'Sunset on the river', 'sunset-river')
await g('plans/PH1-2.jpg', 'Penthouse PH1 rooftop garden plan', 'penthouse-ph1-rooftop-plan')

const brochure = await up('brochure.pdf', R('brochure', 'dynasty-residence-e-brochure.pdf'), 'application/pdf')
const planImgs = new Map<string, string>()
const plan = async (name: string) => { if (!planImgs.has(name)) planImgs.set(name, await up(`plans/${name}.jpg`, R('floor-plans', `${name}.jpg`))); return planImgs.get(name)! }

// [planName, image, beds, baths, powder, sqft, units in building, floorRange, availability note]
const rows: [string, string, number, number, number | null, number, number | null, string | null, string][] = [
  ['A1 & A2 - 1 Bedroom', 'A1A2', 1, 1, null, 757, 16, 'L5-L16', 'Available'],
  ['B1 & B2 - 2 Bedroom (river front)', 'B1-and-B2', 2, 2, null, 1167, 1, 'L13-L16', 'Available'],
  ['B3 & B4 - 2 Bedroom (long river view)', 'B3-and-B4', 2, 2, null, 1291, 11, 'L6-L16', 'Available'],
  ['C1 - 3 Bedroom Panoramic 180° Villa', 'C1', 3, 2, 1, 1908, 5, 'L6-L16', 'Available'],
  ['C2 - 3 Bedroom Panoramic 180° Villa', 'C2', 3, 2, 1, 2029, 5, 'L7-L15', 'Available'],
  ['C4 & C5 - 3 Bedroom River Front', 'C4-and-C5', 3, 2, null, 1665, 1, 'L5', 'Available'],
  ['C6 - 3 Bedroom Panoramic 180° Villa', 'C6', 3, 2, null, 1690, 3, 'L6-L11', 'Available'],
  ['C7 - 3 Bedroom Panoramic 180° Villa', 'C7', 3, 3, null, 1916, 3, 'L7-L13', 'Available'],
  ['C8 - 3 Bedroom Panoramic 180° Villa', 'C8', 3, 3, null, 2027, 6, 'L6-L16', 'Available'],
  ['SKY 1-4 - 4 Bedroom Duplex Sky Villa', 'SKY1', 4, 3, 1, 3067, 4, 'L9-L14', 'Available'],
]
const floorPlans: any[] = []
for (const [planName, img, bedrooms, bathrooms, powder, sqft, units, floorRange, availability] of rows) {
  const fp: any = { planName, bedrooms, bathrooms, floorAreaSqFt: sqft, startingPriceLkr: 0, availability, image: await plan(img), planDocuments: [{ label: 'E-brochure', url: brochure }], unitsAvailable: units, parkingType: 'Covered', parkingSpaces: /^SKY/.test(planName) ? 2 : 1 }
  if (powder) fp.powderRooms = powder
  if (floorRange) fp.floorRange = floorRange
  floorPlans.push(fp)
}

const AM = [
  'Reception & Lobby', 'Concierge', 'Parking', 'Function Room', 'BBQ Area', "Children's Area", 'Kids Pool', 'Infinity Pool', 'Gym', 'Jogging Track',
  'Meditation Garden', 'Library', 'Outdoor Gym', 'Mini Mart', 'Restaurant', 'CCTV',
]
const amenities = AM.map((name) => { if (!(SO.AMENITY_NAME_OPTIONS as string[]).includes(name)) throw new Error('amenity not in vocabulary ' + name); return { name } })
Object.assign(amenities.find((a) => a.name === 'Reception & Lobby')!, { description: 'Covered drop-off area, grand entrance lobby and reception with guest check-in.' })
Object.assign(amenities.find((a) => a.name === 'Function Room')!, { description: 'Function room overlooking the river on the 2nd floor.' })
Object.assign(amenities.find((a) => a.name === 'Gym')!, { description: 'Large gymnasium overlooking the river on the 4th floor.' })
Object.assign(amenities.find((a) => a.name === 'Jogging Track')!, { description: '170-metre rooftop jogging track with viewing decks.' })
Object.assign(amenities.find((a) => a.name === 'Meditation Garden')!, { description: 'Rooftop meditation garden.' })
Object.assign(amenities.find((a) => a.name === 'Library')!, { description: 'Rooftop reading garden.' })
Object.assign(amenities.find((a) => a.name === 'Outdoor Gym')!, { description: 'Rooftop open gymnasium.' })
Object.assign(amenities.find((a) => a.name === 'Mini Mart')!, { description: 'Mini market and restaurant in the building.' })
Object.assign(amenities.find((a) => a.name === 'BBQ Area')!, { description: 'BBQ pavilion with water feature.' })

const data: Record<string, any> = {
  slug: SLUG, name: 'Dynasty Residence', developer: dev.id, isPublished: true,
  status: 'Now Selling', constructionStatus: 'Completed', type: 'Apartments', typeNote: 'Luxury riverside apartments, sky villas and penthouses',
  location: '51/2 & 51/3 Lady McCallum Drive, Kandy', city: 'Kandy', district: 'Kandy', province: 'Central', neighborhood: nb.id, startingPriceLkr: 0,
  summary: 'A completed riverside tower on the Mahaweli river in Kandy with 1 to 5 bedroom apartments, sky villas and penthouses, 30 metres from the water and ready for occupancy.',
  description:
    'Dynasty Residence is a completed luxury apartment tower at 51/2 & 51/3 Lady McCallum Drive, Kandy, built within 30 metres of the Mahaweli river. The developer, GVR Lanka, markets it as the first and last residential apartment complex allowed that close to the river and as the first residential building built under the US Green Building LEED rating system. The apartments are ready for occupancy and the project holds a COC certificate, so home loans are available from any bank in Sri Lanka.\n\nHomes range from 757 sq ft one-bedroom apartments to 4-bedroom duplex sky villas of 3,067 sq ft and 3 to 5 bedroom penthouses with a private rooftop sky garden and golf putting area. Views take in the river and the Hunnasgiriya and Knuckles mountain ranges.\n\nResidents share an infinity pool overlooking the river, kids pool, large gymnasium, 170-metre rooftop jogging track, meditation and reading gardens, function room, BBQ pavilion, mini market and restaurant, concierge, an in-house doctor with nurse station, a covered car park for each unit and standby generator. The design and build team is Sanken Construction, with RDC Architects Singapore, KWA Architects and PWA interior designers, and AECOM Lanka as QS and project manager.\n\nPrices are given on request. The payment plan is 25% on reservation (non-refundable) and the balance within 30 days, and GVR Lanka offers short-term financing.',
  highlights: [
    'Completed and ready for occupancy, with COC certificate',
    'Within 30 metres of the Mahaweli river, with river and mountain views from every apartment',
    'Built under the US Green Building LEED rating system',
    '1 to 5 bedroom apartments, sky villas and penthouses from 757 sq ft',
    'Infinity pool, gym, 170 m rooftop jogging track, mini market and restaurant',
    'Home loans from any bank in Sri Lanka; 25% on reservation, balance in 30 days',
  ],
  heroImage: gallery[0].image, gallery, floorPlans, amenities, brochureUrl: brochure,
  parkingType: 'Covered', visitorParking: 'Yes',
  parking: 'Covered car park for each unit; 2 car parks each for penthouses and sky villas; visitor and bicycle parking; handicap parking',
  contact: { name: 'Dynasty Residence Sales', email: 'sales@dynastyresidence.com', phone: '+94777884066', address: '51/2 & 51/3 Lady McCallum Drive, Kandy' },
  socialLinks: { facebook: 'https://www.facebook.com/DynastyResidence', whatsapp: 'https://wa.me/94777884066' },
  sourceUrl: 'https://www.dynastyresidence.com/',
  nearby: [
    { category: 'Landmark', name: 'Temple of the Tooth (Sri Dalada Maligawa)', distanceKm: 2.9 },
    { category: 'Landmark', name: 'Royal Botanical Gardens, Peradeniya', distanceKm: 8.5 },
    { category: 'Landmark', name: 'Pallekele International Cricket Stadium', distanceKm: 13.8 },
    { category: 'Landmark', name: 'Gadaladeniya Temple', distanceKm: 15.4 },
    { category: 'Landmark', name: 'Victoria Golf Club', distanceKm: 16.3 },
    { category: 'Landmark', name: 'Hunnasgiriya Waterfall', distanceKm: 19.3 },
    { category: 'Landmark', name: 'Embekka Temple', distanceKm: 19.5 },
    { category: 'Landmark', name: 'Dambulla', distanceKm: 80 },
    { category: 'Landmark', name: 'Sigiriya', distanceKm: 89.9 },
  ],
}
const n1 = (v: string) => v.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
const so = (o: Record<string, any>, name: string, opts: string[]) => {
  const v = o[name]; if (typeof v !== 'string' || !v) return
  const hit = opts.find((x) => n1(x) === n1(v)); if (hit) { o[name] = hit; return }
  o[`${name}_other`] = v; delete o[name]
}
so(data, 'district', SO.DISTRICT_OPTIONS); so(data, 'city', SO.CITY_OPTIONS); so(data, 'province', SO.PROVINCE_OPTIONS)
const created = await createRetry('projects', data)
console.log('created', created.id, created.slug, 'published:', created.isPublished, 'plans', floorPlans.length, 'gallery', gallery.length)

let order = 0
for (const [label, url, note] of [
  ['Dynasty Residence website', 'https://www.dynastyresidence.com/', 'owner-shared 2026-10-29'],
  ['Pricing & availability', 'https://www.dynastyresidence.com/pricing.php', 'unit types, areas, availability, payment plan'],
  ['E-brochure (PDF)', 'https://www.dynastyresidence.com/pdf/dynasty-residence-e-brochure.pdf', 'mirrored to R2'],
] as [string, string, string][]) {
  order += 1
  try { await pool.query('insert into payload.projects_reference_links (_order,_parent_id,id,label,url,note) values ($1,$2,$3,$4,$5,$6)', [order, created.id, crypto.randomBytes(12).toString('hex'), label, url, note]) } catch (e: any) { console.log('reference link skipped:', e.message); break }
}
process.exit(0)
