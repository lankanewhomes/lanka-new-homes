/* eslint-disable @typescript-eslint/no-explicit-any -- one-off import script */
// Prime Marina 2 (Port City Colombo) added as an UNPUBLISHED draft at the owner's request 2026-11-20.
// Sources: primemarina.lk, Daily FT (8 Jun + 28 Sep 2026), portcitycolombo.lk, developer Instagram ad. No invented figures.
//   PM_DIR=<folder with downloaded jpgs> NODE_ENV=production npx tsx scripts/create-prime-marina-2-draft.ts
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { config as loadEnv } from 'dotenv'
loadEnv({ path: path.join(process.cwd(), '.env.local') })
const dir = process.env.PM_DIR ?? '/tmp/pm2'
const cfg = ((await import('../payload.config')) as any).default
const { getPayload } = await import('payload')
const { mirrorToR2 } = await import('../src/lib/listing-import/mirror')
const SO = (await import('../src/collections/shared-fields')) as any
const payload = await getPayload({ config: cfg })
const pool = (payload.db as any).pool
const SLUG = 'prime-marina-2-port-city-colombo'
const ex = await payload.find({ collection: 'projects', where: { slug: { equals: SLUG } }, limit: 1, depth: 0, overrideAccess: true })
if (ex.docs[0]) { console.log('exists', (ex.docs[0] as any).id); process.exit(0) }
const R = (n: string) => `projects/${SLUG}/gallery/${SLUG}_${n}.jpg`
const G: [string, string, string][] = [
  ['building-dusk', 'marina-frontage-dusk', 'Prime Marina at dusk, marina frontage (3D render)'],
  ['building-dawn', 'marina-frontage-dawn', 'Prime Marina at dawn, marina frontage (3D render)'],
  ['building-behind-bridge-dusk', 'bridge-view-dusk', 'View from the bridge at dusk (3D render)'],
  ['building-behind-bridge-dawn', 'bridge-view-dawn', 'View from the bridge at dawn (3D render)'],
  ['from-balcony-to-east-dusk', 'balcony-dusk', 'Living above the marina, balcony view at dusk'],
  ['ocean-view', 'ocean-view', 'Ocean view'],
  ['pm-morning', 'morning', 'Mornings on the marina'],
  ['pm-day', 'day', 'Days on the water'],
  ['pm-evening', 'evening', 'Evenings by the ocean'],
  ['couples_in_pool', 'pool', 'Infinity pool'],
  ['rooftop-relaxing', 'rooftop', 'Rooftop retreat'],
  ['fully_loaded_gym', 'gym', 'Performance gym with marina views'],
  ['yacht_on_waters', 'yacht', 'Private yacht pier'],
]
const gallery: { label: string; image: string }[] = []
for (const [f, s, label] of G) gallery.push({ label, image: await mirrorToR2(R(s), fs.readFileSync(path.join(dir, f + '.jpg')), 'image/jpeg') })
const AM: [string, string?][] = [['Pool', 'Infinity pool and sky pool.'], ['Gym', 'Performance gym with marina views.'], ['Rooftop', 'Rooftop retreat and sky lounge.'], ['Concierge'], ['Spa'], ['Clubhouse', "Residents' club."], ['Business Center', 'Business lounge.'], ['Marina', 'Private yacht pier and berths.'], ['Garden', 'Oceanfront promenade.']]
const opts = SO.AMENITY_NAME_OPTIONS as string[]
const amenities: any[] = []
for (const [name, description] of AM) { if (!opts.includes(name)) { console.log('amenity not in vocabulary, skipped:', name); continue } amenities.push(description ? { name, description } : { name }) }
const videos = [
  ['The Address Above the Ocean (official film)', '4sOBaNZH3kU'], ['The Vision Behind Prime Marina', 'ZaPzb9sZXfQ'], ['3D Drone Show', '7uaxXcC3dug'],
  ['A New Benchmark for Luxury', 'rxn0LVtECEI'], ['The Prime & Melwa Partnership', 'tKY9aix4nFU'], ['Prime Marina Sales Suite', 'wF2lBgx1-RU'],
].map(([label, id]) => ({ label, embedUrl: `https://www.youtube.com/watch?v=${id}`, thumbnail: `https://img.youtube.com/vi/${id}/maxresdefault.jpg` }))
const data: Record<string, any> = {
  slug: SLUG, name: 'Prime Marina 2', developer: 6, isPublished: false, neighborhood: 134,
  status: 'Now Selling', type: 'Apartments', typeNote: '1 to 4 bedroom apartments and penthouses',
  location: 'Marina Zone, Port City Colombo', city: 'Colombo 02', district: 'Colombo', province: 'Western',
  startingPriceLkr: 59000000,
  summary: 'Marina-front apartments and penthouses at the entrance to Port City Colombo, with 1 to 4 bedroom homes, about 90% facing the ocean, from LKR 59 million. By Prime Group and Melwa.',
  description:
    'Prime Marina 2 is a marina-front development at the entrance to Port City Colombo by Prime Group and Melwa Group, marketed as "The Address Above the Ocean". It offers 1 to 4 bedroom apartments and Signature Penthouses, and the developer states about 90% of homes face the ocean. Home types are Marina Suite (1 bed), Waterfront Residence (2 bed), Oceanfront Residence (3 bed), Grand Residence (4 bed) and Signature Penthouse. Press coverage also mentions corporate suites and curated retail space.\n\nResidents share an infinity pool and sky pool, spa and hydrotherapy suites, a rooftop retreat and sky lounge, a performance gym, a residents\' club, concierge, a business lounge, a private yacht pier and an oceanfront promenade. Ownership is in US dollars under the Port City Special Economic Zone framework. The sale and purchase agreement for the land was signed with CHEC Port City Colombo on 12 May 2026 and sales have commenced.\n\nPrices start from LKR 59 million. Unit sizes, unit counts, payment plan, handover date and tenure are not published by the developer; indicative pricing is shared on private registration. Architecture is by P&T Singapore, interiors by Index Design and landscape by Grant Associates.',
  highlights: [
    'Marina-front at the entrance to Port City Colombo, about 90% of homes facing the ocean',
    '1 to 4 bedroom apartments and Signature Penthouses, from LKR 59 million',
    'Infinity pool, sky pool, spa, rooftop retreat, performance gym and private yacht pier',
    'Owned in US dollars under the Port City Special Economic Zone framework',
    'Architecture by P&T Singapore, interiors by Index Design, landscape by Grant Associates',
  ],
  heroImage: gallery[0].image, gallery, amenities, videos,
  contact: { name: 'Prime Marina Sales Suite', phone: '+94703755755', address: 'Prime Marina, Marina Zone, Port City Colombo' },
  sourceUrl: 'https://primemarina.lk/',
}
const n1 = (v: string) => v.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
const so = (o: any, name: string, o2: string[]) => { const v = o[name]; if (typeof v !== 'string' || !v) return; const hit = o2.find((x) => n1(x) === n1(v)); if (hit) { o[name] = hit; return } o[`${name}_other`] = v; delete o[name] }
so(data, 'district', SO.DISTRICT_OPTIONS); so(data, 'city', SO.CITY_OPTIONS); so(data, 'province', SO.PROVINCE_OPTIONS)
let created: any
for (let i = 0; i < 6 && !created; i++) {
  try { created = await payload.create({ collection: 'projects' as never, data, overrideAccess: true } as never) } catch (e: any) {
    const bad = [...new Set((e?.data?.errors ?? []).map((x: any) => String(x.path ?? '').split('.')[0]).filter(Boolean))] as string[]
    if (!bad.length) throw e
    console.log('VALIDATION dropping', bad.join(','), JSON.stringify(e.data.errors).slice(0, 300)); for (const f of bad) delete data[f]
  }
}
console.log('created', created.id, created.slug, 'published:', created.isPublished, 'gallery', gallery.length, 'amenities', amenities.length)
let order = 0
for (const [label, url, note] of [
  ['Prime Marina website', 'https://primemarina.lk/', 'checked 2026-11-20'],
  ['Prime Lands Canada Instagram (ad: from CAD 255,000)', 'https://www.instagram.com/primelands_canada/', 'ad text 2026-11-20; WhatsApp number in ad looks like a placeholder'],
  ['Daily FT: Prime Marina 2', 'https://www.ft.lk/front-page/Prime-Marina-2-at-Port-City-a-new-category-of-marina-and-waterfront-living-in-Sri-Lanka/44-797860', 'Rs 59M onwards; residences, corporate suites, retail'],
  ['Daily FT: 550-unit Prime Marina', 'https://www.ft.lk/front-page/550-unit-Prime-Marina-in-Port-City-draws-over-300-reservations-say-promoters/44-793034', 'unit count 550 conflicts with Port City site (320-360)'],
  ['Port City Colombo: Luxury Marina Residences', 'https://www.portcitycolombo.lk/featured-developments/luxury-marina-residence/', 'up to 18 storeys, 320-360 units'],
] as string[][]) { order += 1; try { await pool.query('insert into payload.projects_reference_links (_order,_parent_id,id,label,url,note) values ($1,$2,$3,$4,$5,$6)', [order, created.id, crypto.randomBytes(12).toString('hex'), label, url, note]) } catch (e: any) { console.log('reference link skipped:', e.message); break } }
process.exit(0)
