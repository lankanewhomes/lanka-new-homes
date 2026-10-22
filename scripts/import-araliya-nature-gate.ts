/* eslint-disable @typescript-eslint/no-explicit-any -- one-off import */
// Araliya Lands: Nature Gate - Yakkala (https://araliyalands.com/land/nature-gate-yakkala), found by the 2026-10-21 new-listings sweep.
// Same shape as scripts/import-araliya-lands.ts. The page publishes 114 blocks (18 available), no per-plot sizes in text, so only the plot
// count is stored; the block plan image is attached. Payment wording is translated from the page's Sinhala text.
import crypto from 'node:crypto'
import path from 'node:path'
import { config as loadEnv } from 'dotenv'
loadEnv({ path: path.join(process.cwd(), '.env.local') })
const cfg = ((await import('../payload.config')) as any).default
const { getPayload } = await import('payload')
const { mirrorRemoteFiles } = await import('../src/lib/listing-import/mirror')
const payload = await getPayload({ config: cfg })

const SLUG = 'nature-gate-yakkala'
const BASE = 'https://araliyalands.com/storage/app/public'
const HQ = 'No. 381/B, Kandy Road, Mahara, Kadawatha, Sri Lanka'
if ((await payload.find({ collection: 'lands', where: { slug: { equals: SLUG } }, limit: 1, depth: 0, overrideAccess: true })).docs[0]) { console.log('exists', SLUG); process.exit(0) }
const dev: any = (await payload.find({ collection: 'developers', where: { slug: { equals: 'araliya-lands' } }, limit: 1, depth: 0, overrideAccess: true })).docs[0]
if (!dev) throw new Error('developer araliya-lands missing')

const photos = await mirrorRemoteFiles([`${BASE}/landGallery/202508261201402.jpg`, `${BASE}/landGallery/202508261202003.jpg`, `${BASE}/landGallery/202508261202431.jpg`], { keyPrefix: `lands/${SLUG}/gallery`, namePrefix: SLUG, label: 'photo', max: 3 })
const block = await mirrorRemoteFiles([`${BASE}/landDetails/block-plan-nature-gate.jpg`], { keyPrefix: `lands/${SLUG}/block-plan`, namePrefix: SLUG, label: 'block-plan', max: 1 })
const road = await mirrorRemoteFiles([`${BASE}/landDetails/nature-gate-road-map.jpg`], { keyPrefix: `lands/${SLUG}/road-map`, namePrefix: SLUG, label: 'road-map', max: 1 })
console.log('images', photos.mirrored.length, block.mirrored.length, road.mirrored.length, JSON.stringify([...photos.failed, ...block.failed, ...road.failed]).slice(0, 200))
const gallery = photos.mirrored.map((m: any) => ({ label: 'Photo', image: m.url }))
if (!gallery.length) throw new Error('no photos')

const data: any = {
  slug: SLUG, title: 'Nature Gate - Yakkala', sellerType: 'developer', seller: { relationTo: 'developers', value: dev.id }, sellerName: 'Araliya Lands',
  location: 'Radawana, Yakkala', district: 'Gampaha', city_other: 'Yakkala', province: 'Western', status: 'Available',
  landSizePerches: 0, landUse: ['Residential'], landType: 'Bare Land (subdivided plots)',
  priceLkr: 0, pricePerPerchLkrMin: 200000,
  paymentPlanItems: [
    'Reserve your plot by paying Rs. 50,000 at the land or at the office',
    'Pay 30% of the initial payment within 14 days',
    'Pay the balance within a month for a special discount',
    'Or pay the balance interest free within 6 months',
  ],
  summary: 'Nature Gate is a residential land project in Radawana, Yakkala, close to the Gampaha–Kirindiwela 231 bus route: 114 plots (18 available) from LKR 200,000 per perch.',
  description: 'Nature Gate is a residential land project by Araliya Lands and Homes in Radawana, Yakkala, an easy reach from the Gampaha–Kirindiwela 231 bus route and a calm place to leave the strain of everyday life behind.\n\nThe project has 114 plots in total, 18 of them still available, with prices from LKR 200,000 per perch. The developer publishes a block plan and road map for the project.',
  heroImage: gallery[0].image, gallery,
  blockPlanImages: block.mirrored[0] ? [{ label: 'Block Plan', image: block.mirrored[0].url }] : [],
  roadMapImages: road.mirrored[0] ? [{ label: 'Road Map', image: road.mirrored[0].url }] : [],
  badges: ['Easy Payment Plan'], plotCount: 114,
  coordinates: { lat: 7.066327352656161, lng: 80.08543997085803, streetViewAvailable: true },
  view360Url: 'https://www.google.com/maps/embed?pb=!4v1747735352359!6m8!1m7!1sCAoSLEFGMVFpcFBhUnZaS0ZZek81MUxDRHp5dzFGNjFsd1k4WTBIc2ZSUW1yb2NX!2m2!1d7.065909842433823!2d80.08532369399832!3f202.12!4f-5.1500000000000',
  contact: { name: 'Araliya Lands', email: 'info@araliyalands.com', phone: '0777400505', address: HQ },
}
let created: any
for (let attempt = 0; attempt < 5 && !created; attempt++) {
  try { created = await payload.create({ collection: 'lands', overrideAccess: true, data } as never) } catch (e: any) {
    const bad = [...new Set((e?.data?.errors ?? []).map((x: any) => String(x.path ?? '').split('.')[0]).filter(Boolean))] as string[]
    if (!bad.length) throw e
    console.log('VALIDATION dropping', bad.join(','), JSON.stringify(e.data.errors).slice(0, 300)); for (const f of bad) delete data[f]
  }
}
const pool = (payload.db as any).pool
let order = 0
for (const [label, url] of [['Nature Gate page', 'https://araliyalands.com/land/nature-gate-yakkala'], ['Payment plans page', 'https://araliyalands.com/payment-plans'], ['Block plan image', `${BASE}/landDetails/block-plan-nature-gate.jpg`], ['Road map image', `${BASE}/landDetails/nature-gate-road-map.jpg`]]) {
  order += 1
  await pool.query('insert into payload.lands_reference_links (_order,_parent_id,id,label,url,note) values ($1,$2,$3,$4,$5,$6)', [order, created.id, crypto.randomBytes(12).toString('hex'), label, url, 'araliyalands.com, new-listings sweep 2026-10-21'])
}
console.log('created', created.slug, created.id)
process.exit(0)
