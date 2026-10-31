/* eslint-disable @typescript-eslint/no-explicit-any -- one-off import script */
// Serendib Condos (https://www.serendibcondos.com/), added at the owner's request 2026-10-31: "You can add those listings."
//   NODE_ENV=production npx tsx scripts/import-serendib-condos.ts
// IMPORTANT: the site's own bundle flags all 9 projects `demo: true` (descriptions say "demonstration listing" / "concept"; photos are labelled
// "illustrative stock photo"; no developer names). So every project is created UNPUBLISHED (isPublished: false) under a placeholder developer
// "Serendib Condos". Only figures the site publishes are used: stage, area, coordinates, bedroom range, unit count, amenities, expected completion.
// No prices, plans, sizes or brochures are published, so none are entered. Data: scripts/data-serendib-condos.json (extracted from the JS bundle).
import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { config as loadEnv } from 'dotenv'
loadEnv({ path: path.join(process.cwd(), '.env.local') })
const cfg = ((await import('../payload.config')) as any).default
const { getPayload } = await import('payload')
const { mirrorToR2 } = await import('../src/lib/listing-import/mirror')
const SO = (await import('../src/collections/shared-fields')) as any
const payload = await getPayload({ config: cfg })
const pool = (payload.db as any).pool
const SITE = 'https://www.serendibcondos.com'

const items: any[] = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'scripts/data-serendib-condos.json'), 'utf8'))
const find = async (collection: string, slug: string) =>
  ((await payload.find({ collection: collection as never, where: { slug: { equals: slug } }, limit: 1, overrideAccess: true, depth: 0 })).docs[0] as any) ?? null
async function createRetry(collection: string, data: any) {
  for (let attempt = 0; attempt < 6; attempt++) {
    try { return (await payload.create({ collection: collection as never, data, overrideAccess: true } as never)) as any } catch (e: any) {
      const bad = [...new Set((e?.data?.errors ?? []).map((x: any) => String(x.path ?? '').split('.')[0]).filter(Boolean))] as string[]
      if (!bad.length) throw e
      console.log('  VALIDATION dropping', bad.join(','), JSON.stringify(e.data.errors).slice(0, 250)); for (const f of bad) delete data[f]
    }
  }
  throw new Error('create failed ' + collection)
}
const kebab = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
const n1 = (v: string) => v.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
const so = (o: Record<string, any>, name: string, opts: string[]) => {
  const v = o[name]; if (typeof v !== 'string' || !v) return
  const hit = opts.find((x) => n1(x) === n1(v)); if (hit) { o[name] = hit; return }
  o[`${name}_other`] = v; delete o[name]
}

let dev = await find('developers', 'serendib-condos')
if (!dev) {
  dev = await createRetry('developers', {
    slug: 'serendib-condos', name: 'Serendib Condos', website: SITE, location: 'Sri Lanka',
    description: 'Serendib Condos is an online portal that introduces overseas buyers to condominium opportunities across Sri Lanka. It names no developers for its listed projects.',
    contact_email: 'hello@serendibcondos.com',
  })
  console.log('developer created', dev.id)
}

const AMENITY_MAP: Record<string, string> = {
  Gym: 'Gym', 'Swimming Pool': 'Pool', Laundry: 'Laundry Service', 'Security Camera': 'CCTV', Garage: 'Parking', Rooftop: 'Rooftop',
  'Resturant area': 'Restaurant', '24/7 Security': 'Security',
}
const NB_SLUGS: Record<string, string[]> = {
  trend: ['nuwara-eliya'], twin: ['dehiwala'], fairline: ['dehiwala'], aurora: ['rajagiriya'], coastline: ['negombo'],
  skyline: ['colombo-05', 'colombo-5'], garden: ['kandy'], harbour: ['colombo-03', 'colombo-3'], lake: ['battaramulla'],
}
const DISTRICT: Record<string, string> = { 'Nuwara Eliya': 'Nuwara Eliya', Colombo: 'Colombo', Negombo: 'Gampaha', Kandy: 'Kandy' }
const PROVINCE: Record<string, string> = { 'Nuwara Eliya': 'Central', Colombo: 'Western', Negombo: 'Western', Kandy: 'Central' }
const STAGE: Record<string, [string, string]> = { ongoing: ['Under Construction', 'Under Construction'], upcoming: ['Coming Soon', 'Not Started'], completed: ['Now Selling', 'Completed'] }

for (const it of items) {
  const slug = `${kebab(it.name)}-${kebab(it.area.split(',')[0].replace(/^.*Mw$/i, it.city))}`.replace(/-+$/, '')
  if (await find('projects', slug)) { console.log('exists', slug); continue }
  let nb: any = null
  for (const s of NB_SLUGS[it.id] ?? []) { nb = await find('neighborhoods', s); if (nb) break }
  const file = decodeURIComponent(it.image.split('/').pop())
  const buf = Buffer.from(await (await fetch(`${SITE}${it.image.split('/').map(encodeURIComponent).join('/').replace('%2F', '/')}`.replace(/%2F/g, '/'))).arrayBuffer())
  const ext = path.extname(file).toLowerCase()
  const img = await mirrorToR2(`projects/${slug}/gallery/${slug}_illustrative-photo${ext}`, buf, ext === '.png' ? 'image/png' : 'image/jpeg')
  const amen: string[] = (it.amenities ?? []).map((a: string) => AMENITY_MAP[a]).filter(Boolean)
  const other: string[] = (it.amenities ?? []).filter((a: string) => !AMENITY_MAP[a]).map((a: string) => (a === 'Resturant area' ? 'Restaurant area' : a))
  for (const a of amen) if (!(SO.AMENITY_NAME_OPTIONS as string[]).includes(a)) throw new Error('amenity not in vocabulary ' + a)
  const beds = it.bedsMin === it.bedsMax ? `${it.bedsMin}-bedroom` : `${it.bedsMin}- to ${it.bedsMax}-bedroom`
  const [status, constructionStatus] = STAGE[it.stage]
  const facts = `${beds} apartments, ${it.units} units${it.expectedCompletion ? `, expected completion ${it.expectedCompletion}` : ''}`
  const data: Record<string, any> = {
    slug, name: it.name, developer: dev.id, isPublished: false, status, constructionStatus, type: 'Apartments',
    location: it.area, city: it.city, district: DISTRICT[it.city], province: PROVINCE[it.city], startingPriceLkr: 0, units: it.units,
    summary: `${it.name}: ${facts}, ${it.area}.`,
    description: `${it.name} is listed on the Serendib Condos portal in ${it.area}: ${facts}.${other.length ? ` Other facilities listed: ${other.join(', ')}.` : ''} Pricing is on request. The portal publishes no developer name, unit sizes, floor plans or prices for this project.`,
    heroImage: img, gallery: [{ label: 'Illustrative photo (stock image from the Serendib Condos portal)', image: img }],
    amenities: amen.map((name) => ({ name })),
    coordinates: { lat: it.lat, lng: it.lng },
    contact: { name: 'Serendib Condos', email: 'hello@serendibcondos.com' },
    sourceUrl: SITE + '/',
  }
  if (nb) data.neighborhood = nb.id
  if (it.expectedCompletion) data.completionNote = it.expectedCompletion
  so(data, 'district', SO.DISTRICT_OPTIONS); so(data, 'city', SO.CITY_OPTIONS); so(data, 'province', SO.PROVINCE_OPTIONS)
  const created = await createRetry('projects', data)
  console.log('created', created.id, slug, 'published:', created.isPublished, 'neighbourhood:', nb?.slug ?? 'NONE')
  try {
    await pool.query('insert into payload.projects_reference_links (_order,_parent_id,id,label,url,note) values ($1,$2,$3,$4,$5,$6)',
      [1, created.id, crypto.randomBytes(12).toString('hex'), 'Serendib Condos portal', SITE + '/', 'owner-requested 2026-10-31; the portal flags this project demo:true (stock photo, no developer named); kept unpublished'])
  } catch (e: any) { console.log('  reference link skipped:', e.message) }
}
process.exit(0)
