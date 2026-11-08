/* eslint-disable @typescript-eslint/no-explicit-any -- one-off import script */
// Marina Square – Uptown Colombo, Colombo 15 (https://marinasquare.lk/en), added at the owner's request 2026-11-08.
//   MS_DIR=<folder with g/ (gallery jpegs) and pdf/ (plans + typical.pdf)> NODE_ENV=production npx tsx scripts/import-marina-square.ts
// Everything below is from the project's own site: condo-types, penthouses, compare-apartments, project-progress, gallery, indulgence, faq, about-us
// and the "Typical Floor Plans" PDF. Only two unit types (both 4-bedroom penthouses) are shown with prices, so only those are rows; prices are
// the site's "Price from" figures. No handover date, unit count, floor count or payment-plan terms are published.
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { config as loadEnv } from 'dotenv'
loadEnv({ path: path.join(process.cwd(), '.env.local') })
const dir = process.env.MS_DIR ?? ''
if (!dir) throw new Error('Set MS_DIR')
const cfg = ((await import('../payload.config')) as any).default
const { getPayload } = await import('payload')
const { mirrorToR2 } = await import('../src/lib/listing-import/mirror')
const SO = (await import('../src/collections/shared-fields')) as any
const payload = await getPayload({ config: cfg })
const pool = (payload.db as any).pool

const SLUG = 'marina-square-colombo-15'
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
const R = (sub: string, name: string) => `projects/${SLUG}/${sub}/${SLUG}_${name}`
const up = (file: string, key: string, type = 'image/jpeg') => mirrorToR2(key, fs.readFileSync(path.join(dir, file)), type)

let dev = await find('developers', 'access-engineering-plc')
if (!dev) {
  dev = await createRetry('developers', {
    slug: 'access-engineering-plc', name: 'Access Engineering PLC', location: 'Colombo',
    description: 'Access Engineering PLC is a civil engineering company listed on the Colombo Stock Exchange. It develops Marina Square – Uptown Colombo in Colombo 15 through its subsidiary Harbour Village (Pvt) Ltd.',
    contact_phone: '+94763050000',
  })
  console.log('developer created', dev.id)
}

// [file in g/, slug, label]
const G: [string, string, string][] = [
  ['5f9005c1913fe', 'five-towers-aerial', 'Five towers of Marina Square, Uptown Colombo'],
  ['5f9005c176484', 'towers-elevated-highway-dusk', 'Towers beside the elevated highway at dusk'],
  ['5f9005c159226', 'tower-entrance-signage', 'Tower entrance and Marina Square signage'],
  ['5f9005c1ac0f1', 'birds-eye-aerial', "Bird's-eye view of the towers and podium"],
  ['5f9005c1cb4de', 'towers-harbour-view', 'Towers with the harbour and city beyond'],
  ['5f9005d950594', 'towers-from-highway', 'Towers rising above the elevated highway'],
  ['5f9005d98a244', 'five-towers-podium', 'Five towers and landscaped podium'],
  ['5f9005d9a5100', 'entrance-garden', 'Landscaped entrance garden'],
  ['5f9005d9ccb9d', 'drop-off-entrance', 'Covered drop-off entrance'],
  ['5f9005d9ed376', 'entrance-gateway', 'Entrance gateway at dusk'],
  ['5ee3180837e96', 'living-room', 'Living room'],
  ['5ee318089ad0b', 'dining-area', 'Dining area'],
  ['5ee31808b793f', 'kitchen', 'Kitchen with built-in oven and hob'],
  ['5ee31808d859b', 'bathroom', 'Bathroom with European-standard fittings'],
  ['5ee31809093b3', 'master-bedroom', 'Master bedroom'],
  ['5ee319c31acbb', 'living-dining', 'Open living and dining space'],
  ['5ee319c4613a5', 'bathroom-shower', 'Bathroom with walk-in shower'],
  ['5ee319c40b84f', 'living-room-view', 'Living room with city view'],
  ['5f9006266d6d5', 'tower-pool-deck', 'Pool deck below the towers'],
  ['5f90062652094', 'pool-garden', 'Landscaped pool garden'],
  ['5f900626a5408', 'infinity-pool-sea', 'Pool deck overlooking the sea'],
  ['5f900626883b3', 'pool-pergola', 'Pool and pergola'],
  ['5f90063b7073f', 'sports-play-aerial', 'Sports court and play area from above'],
  ['5f90063b91946', 'kids-play-area', 'Kids play area'],
  ['5f90063bd111d', 'jogging-track', 'Landscaped jogging track'],
  ['5f90063c001d1', 'basketball-court', 'Basketball court'],
  ['5f90063c1e0a9', 'gym', 'Fully equipped gymnasium'],
  ['5f900658d6154', 'gym-weights', 'Gym weights and cardio zone'],
  ['5f90065916868', 'kids-indoor-play', 'Indoor kids play room'],
  ['5f900612cec77', 'yoga-room', 'Yoga and wellness room'],
  ['5f9006133fb40', 'games-room-table-tennis', 'Games room with table tennis'],
  ['5f90062634c85', 'billiards-room', 'Billiards room'],
  ['5f90066de5749', 'podium-aerial', 'Podium gardens from above'],
  ['5f9006883eb73', 'garden-pergolas-aerial', 'Garden pergolas and pool from above'],
  ['5f9006ea4ef92', 'sky-deck', 'Themed sky deck'],
  ['5f9006fedaeac', 'sky-deck-lounge', 'Sky deck lounge seating'],
  ['5f9006ff0bf49', 'sky-deck-dining', 'Sky deck dining area'],
  ['5f9007122e8c9', 'sky-deck-garden', 'Sky deck garden with water feature'],
]
const gallery: { label: string; image: string }[] = []
for (const [f, slug, label] of G) gallery.push({ label, image: await up(`g/${f}.jpeg`, R('gallery', `${slug}.jpg`)) })

const typicalPdf = await up('pdf/typical.pdf', R('brochure', 'typical-floor-plans.pdf'), 'application/pdf')
const p2d = { DE: await up('pdf/1646635255.jpeg', R('floor-plans', '4-de.jpg')), FG: await up('pdf/1646635271.jpeg', R('floor-plans', '4-fg.jpg')) }
const p3d = { DE: await up('pdf/1585131563.jpeg', R('floor-plans', '4-de_3d.jpg')), FG: await up('pdf/1660795707.jpeg', R('floor-plans', '4-fg_3d.jpg')) }

const base = { bedrooms: 4, bathrooms: 4, maidsRoom: 'Yes', pantry: 'Yes', parkingSpaces: 2, floorRange: '35-36', availability: 'Available', planDocuments: [{ label: 'Typical floor plans (PDF)', url: typicalPdf }] }
const floorPlans: any[] = [
  { ...base, planName: '4 D/E - 4 Bedroom Penthouse', floorAreaSqFt: 2104, startingPriceLkr: 192209929, view: 'Sea View', image: p2d.DE, image3d: p3d.DE },
  { ...base, planName: '4 F/G - 4 Bedroom Penthouse', floorAreaSqFt: 2047, startingPriceLkr: 172222237, view: 'City View', image: p2d.FG, image3d: p3d.FG },
]

const AM: [string, string?][] = [
  ['Infinity Pool', 'Infinity pool on the landscaped podium.'], ['Clubhouse'], ['Games Room', 'Games room with table tennis and a billiards room.'],
  ["Children's Area", 'Outdoor play area and an indoor kids play room.'], ['Gym', 'Fully equipped gymnasium.'], ['Jogging Track', 'Landscaped walking and jogging tracks.'],
  ['Basketball Court'], ['Garden', 'Over two acres of landscaped gardens.'], ['Yoga & Meditation Area', 'Yoga and wellness room.'],
  ['Leisure Deck', 'Themed sky decks with lounge and dining areas.'], ['Parking', 'One car park per unit; two for 4-bedroom units.'],
]
const amenities = AM.map(([name, description]) => { if (!(SO.AMENITY_NAME_OPTIONS as string[]).includes(name)) throw new Error('amenity not in vocabulary ' + name); return description ? { name, description } : { name } })

const data: Record<string, any> = {
  slug: SLUG, name: 'Marina Square - Uptown Colombo', developer: dev.id, isPublished: true,
  status: 'Nearly Complete', constructionStatus: 'Finishing', type: 'Apartments', typeNote: 'Five-tower condominium with 1 to 4 bedroom homes and penthouses',
  location: 'Srimath Ramanathan Mawatha, Colombo 15', city: 'Colombo 15', district: 'Colombo', province: 'Western', neighborhood_other: 'Colombo 15 (Mutwal)',
  startingPriceLkr: 172222237,
  summary: 'A five-tower condominium on five acres in Colombo 15, with over two acres of landscaped gardens and sky decks, close to Port City and the elevated expressway. Construction milestones are shown at 100% with internal finishing under way.',
  description:
    'Marina Square - Uptown Colombo is a multi-tower condominium on five acres in Colombo 15 (Colombo North), developed by Access Engineering PLC through its subsidiary Harbour Village (Pvt) Ltd. The five towers are named The Pier, The Jetty, The Docks, The Cove and The Bay. The developer markets 21 designs, from 1 to 3 bedroom condos with or without private gardens, maids rooms and harbour, sea, city or mountain views, up to 4 bedroom penthouses on floors 35 and 36.\n\nThe site is about 2 km from Port City, with a multi-modal hub planned in Fort about 4 km away and an entry/exit point of the Port Access Elevated Highway 400 m from the project. The project progress page shows every milestone at 100%, including the fire system and COC received, with internal finishing continuing across all five towers and finished show apartments ready to view at Level 8 of Access Tower 2.\n\nResidents share over two acres of landscaped gardens and podium, an infinity pool, club house, games room, indoor and outdoor kids play areas, a fully equipped gymnasium, walking and jogging tracks, a basketball court and themed sky decks. Commercial elements include a food court, retail outlets, wellness services and selected office spaces. Apartments come smart-home enabled (FTTH, IPTV), with a pantry cupboard, hob, hood, oven, microwave and washing machine, Panasonic air conditioning, Kohler sanitary fittings, Hacker kitchens, Yale digital door locks and TKE elevators.\n\nThe two 4-bedroom penthouse types currently shown with prices are 4 D/E (2,104 sq ft, from LKR 192,209,929, harbour and sea view) and 4 F/G (2,047 sq ft, from LKR 172,222,237, city and mountain view), each with 4 bathrooms, a maids room and 2 dedicated car parks. The developer offers customised, interest-free payment plans and tripartite agreements with leading banks for home loans. Architectural consultant is DG5 (The Design Group Five International).',
  highlights: [
    'Five towers on five acres with over two acres of landscaped gardens and sky decks',
    'About 2 km from Port City; elevated highway entry/exit 400 m away',
    'Construction milestones shown at 100% including COC received; finished show apartments on view',
    '4-bedroom penthouses on floors 35-36 from LKR 172,222,237, with maids room and 2 car parks',
    'Smart-home enabled apartments with Hacker kitchens, Kohler fittings and Panasonic air conditioning',
    'Customised interest-free payment plans; bank loans via tripartite agreements',
  ],
  heroImage: gallery[0].image, gallery, floorPlans, amenities, brochureUrl: typicalPdf,
  structuralEngineer: 'Access Engineering PLC',
  parkingType: 'Covered', parking: 'One car park per unit; two car parks for 4-bedroom units (developer FAQ)',
  contact: { name: 'Marina Square Sales Gallery', email: 'inquiries@01awards.lk', phone: '+94763050000', address: 'No. 250, Srimath Ramanathan Mawatha, Colombo 15' },
  socialLinks: { facebook: 'https://www.facebook.com/MarinaSquareColombo', instagram: 'https://www.instagram.com/marina.square.colombo' },
  sourceUrl: 'https://marinasquare.lk/en',
  nearby: [
    { category: 'Landmark', name: 'Port City Colombo', distanceKm: 2 },
    { category: 'Landmark', name: 'Fort / Pettah multi-modal hub (planned)', distanceKm: 4 },
    { category: 'Landmark', name: 'Port Access Elevated Highway entry/exit', distanceKm: 0.4 },
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
  ['Marina Square website', 'https://marinasquare.lk/en', 'owner-shared 2026-11-08'],
  ['Condo types & prices', 'https://marinasquare.lk/en/condo-units/condo-types', 'unit types, areas, "price from"'],
  ['Project progress', 'https://marinasquare.lk/en/location-living/project-progress', 'milestones, COC received'],
  ['FAQ', 'https://marinasquare.lk/en/faq', 'parking, payment plans, show apartment'],
  ['Typical floor plans (PDF)', 'https://marinasquare.lk/pdf-view?q=uploads/download_files/5eeb3952ce5c6.pdf', 'mirrored to R2'],
] as [string, string, string][]) {
  order += 1
  try { await pool.query('insert into payload.projects_reference_links (_order,_parent_id,id,label,url,note) values ($1,$2,$3,$4,$5,$6)', [order, created.id, crypto.randomBytes(12).toString('hex'), label, url, note]) } catch (e: any) { console.log('reference link skipped:', e.message); break }
}
process.exit(0)
