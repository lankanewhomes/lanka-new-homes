/* eslint-disable @typescript-eslint/no-explicit-any -- one-off import */
// Home Lands Holdings (homelands.lk) land listings, owner request 2026-10-15: the 32 projects the site's API (api.homelands.lk/api/land)
// does not mark SOLDOUT. Sold-out projects (27) are skipped per the "only active listings" rule. UNPUBLISHED drafts.
//   HL_LANDS=<dir with land.json> NODE_ENV=production npx tsx scripts/import-home-lands-lands.ts
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { config as loadEnv } from 'dotenv'
loadEnv({ path: path.join(process.cwd(), '.env.local') })
const dir = process.env.HL_LANDS ?? ''
if (!dir) throw new Error('Set HL_LANDS')
const cfg = ((await import('../payload.config')) as any).default
const { getPayload } = await import('payload')
const { mirrorToR2 } = await import('../src/lib/listing-import/mirror')
const SO = (await import('../src/collections/shared-fields')) as any
const payload = await getPayload({ config: cfg })
const n1 = (v: string) => v.toLowerCase().replace(/[^a-z0-9]/g, '')
const rows: any[] = JSON.parse(fs.readFileSync(path.join(dir, 'land.json'), 'utf8')).filter((x: any) => x.status !== 'SOLDOUT')
const DEV = 16
const PHONE = '+94 702 444 111'
const EMAIL = 'info@homelands.lk'

const slugify = (s: string) => s.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
const title = (s: string) => s.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())
const item = (field_other: string, value_other: string) => ({ field: null, field_other, value: null, value_other })
const DISTRICT_BY_TOWN: Record<string, string> = {
  Ella: 'Badulla', 'Nuwara Eliya': 'Nuwara Eliya', Gampaha: 'Gampaha', Udugampola: 'Gampaha', Piliyandala: 'Colombo', Padukka: 'Colombo', Panagoda: 'Colombo', Malabe: 'Colombo', Kosgama: 'Colombo', Malwana: 'Colombo', Meepe: 'Colombo',
  Dodangoda: 'Kalutara', Bandaragama: 'Kalutara', Wadduwa: 'Kalutara', Hapugala: 'Galle', Hikkaduwa: 'Galle', Karapitiya: 'Galle', Galle: 'Galle', Pinnaduwa: 'Galle', Meetiyagoda: 'Galle',
  Kuliyapitiya: 'Kurunegala', Bathalagoda: 'Kurunegala', Sandalankawa: 'Kurunegala', Uhumiya: 'Kurunegala', Pothuhera: 'Kurunegala', Narammala: 'Kurunegala', Dambulla: 'Matale', Mahawela: 'Matale', 'Madawala Ulpotha': 'Matale',
}
const USE: Record<string, string> = { Residential: 'Residential', Commercial: 'Commercial', Agricultural: 'Agricultural', Tourism: 'Mixed Use' }
const toJpg = (src: string, dst: string, max = 2000) => execFileSync('python3', ['-c', `from PIL import Image\nim=Image.open(${JSON.stringify(src)}).convert('RGB')\nim.thumbnail((${max},${max}))\nim.save(${JSON.stringify(dst)},quality=86)`])
const tmp = path.join(dir, 'out'); fs.mkdirSync(tmp, { recursive: true })
const dl = async (u: string): Promise<Buffer | null> => {
  const url = encodeURI(decodeURI(u.trim().replace(/^http:/, 'https:')))
  try { const r = await fetch(url, { headers: { 'user-agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(60_000) }); if (!r.ok) return null; return Buffer.from(await r.arrayBuffer()) } catch { return null }
}

const dev: any = await payload.findByID({ collection: 'developers', id: DEV, depth: 0, overrideAccess: true })
const todos: { slug: string; title: string; notes?: string; links: string[] }[] = []
const report: any[] = []
for (const L of rows) {
  const proj = L.name.split(/\s[-–]\s/)[0].trim()
  const town = L.town.trim()
  const slug = slugify(`${proj}-${town}`)
  if ((await payload.find({ collection: 'lands', where: { slug: { equals: slug } }, limit: 1, depth: 0, overrideAccess: true })).docs[0]) { console.log('exists', slug); continue }
  const page = `https://www.homelands.lk/${L.project_url}`
  const links = [page, 'https://api.homelands.lk/api/land']
  // images
  const urls = [...new Set([L.featured_image, L.slider_image_1, L.slider_image_2, L.slider_image_3, L.slider_image_4].map((u: string) => (u || '').trim()).filter(Boolean))]
  if (!urls.length && L.card_image) urls.push(L.card_image.trim())
  const gallery: any[] = []
  for (const u of urls) {
    const buf = await dl(u); if (!buf) continue
    const src = path.join(tmp, `${slug}-src-${gallery.length}`); fs.writeFileSync(src, buf)
    const dst = path.join(tmp, `${slug}-${gallery.length}.jpg`)
    try { toJpg(src, dst) } catch { continue }
    const n = String(gallery.length + 1).padStart(2, '0')
    gallery.push({ label: 'Photo', image: await mirrorToR2(`lands/${slug}/gallery/${slug}_photo-${n}.jpg`, fs.readFileSync(dst), 'image/jpeg') })
  }
  const blockPlanImages: any[] = []
  const plan = (L.project_plan || '').trim()
  if (plan && !/\.pdf($|\?)/i.test(plan)) {
    const buf = await dl(plan)
    if (buf) { const src = path.join(tmp, `${slug}-plan-src`); fs.writeFileSync(src, buf); const dst = path.join(tmp, `${slug}-plan.jpg`); try { toJpg(src, dst, 2600); blockPlanImages.push({ label: 'Block Plan', image: await mirrorToR2(`lands/${slug}/block-plan/${slug}_block-plan-01.jpg`, fs.readFileSync(dst), 'image/jpeg') }) } catch { /* skip */ } }
  }
  let brochureUrl: string | undefined
  const br = (L.brochure_url || '').trim()
  if (/^https?:/.test(br)) { const buf = await dl(br); if (buf && buf.length < 60e6) brochureUrl = await mirrorToR2(`lands/${slug}/brochure/${slug}_brochure.pdf`, buf, 'application/pdf') }
  // map
  const gm = (L.location_google_map || '').match(/!2d(-?[\d.]+)!3d(-?[\d.]+)/)
  const lat = gm ? Number(gm[2]) : null; const lng = gm ? Number(gm[1]) : null
  const sv = (L.location_google_map || '').match(/maps\/embed\?pb=(![^"\s]+)/)
  const video = (L.video_url || '').trim().split('"')[0]
  // sizes: "X to Y perches" in the text, else extent
  const text = `${L.short_description || ''} ${L.location_short_discription || ''}`
  const rg = text.match(/(\d+(?:\.\d+)?)\s*(?:to|–|-)\s*(\d+(?:\.\d+)?)\s*perch/i)
  const minP = rg ? Number(rg[1]) : Number(L.extent) || 0
  const maxP = rg ? Number(rg[2]) : undefined
  const sane = L.total_blocks >= L.available_blocks && L.total_blocks > 1
  const feats = [L.feature_1, L.feature_2, L.feature_3, L.feature_4].map((f: string) => (f || '').trim()).filter(Boolean)
  const lc = feats.map((f) => f.toLowerCase())
  const uses = [...new Set(String(L.property_usage).split('/').map((s: string) => USE[s.trim()]).filter(Boolean))]
  const desc = [L.short_description, L.location_short_discription].map((s: string) => (s || '').trim()).filter(Boolean).filter((s, i, a) => i === 0 || !a[0].includes(s.slice(0, 60)))
  if (sane) desc.push(`As listed on the developer's site, ${L.available_blocks} of ${L.total_blocks} plots were available on 15 October 2026.`)
  const data: any = {
    slug, title: `${proj} - ${town}`, sellerType: 'developer', seller: { relationTo: 'developers', value: DEV }, sellerName: dev.name,
    location: `${town}, ${L.province} Province`, district: DISTRICT_BY_TOWN[town] ?? undefined, city: town, province: L.province, status: 'Available',
    landSizePerches: minP, ...(maxP ? { landSizePerchesMax: maxP } : {}), landUse: uses.length ? uses : undefined, landType: 'Bare Land (subdivided plots)',
    ...(lc.some((f) => f.includes('carpet')) ? { roadAccess: 'Carpet Road' } : {}), ...(lc.some((f) => f.includes('electric')) ? { electricity: 'Available' } : {}), ...(lc.some((f) => f.includes('water')) ? { water: 'Available' } : {}),
    priceLkr: 0, pricePerPerchLkrMin: Number(L.price) || undefined,
    summary: (L.short_description || '').trim().slice(0, 300), description: desc.join('\n\n'),
    heroImage: gallery[0]?.image, gallery, blockPlanImages,
    ...(sv ? { view360Url: `https://www.google.com/maps/embed?pb=${sv[1]}` } : {}),
    badges: [], unitFeatures: feats.length ? [{ key: null, key_other: 'Features', label: 'Features', items: feats.map((f) => item(title(f), 'Available')) }] : [],
    ...(sane ? { plotCount: L.total_blocks } : {}),
    ...(lat ? { coordinates: { lat, lng, streetViewAvailable: Boolean(sv) } } : {}),
    contact: { name: dev.name, email: EMAIL, phone: PHONE },
    socialLinks: { whatsapp: 'https://wa.me/94705031031' },
    ...(brochureUrl ? { brochureUrl } : {}), ...(video ? { videos: [{ label: `${proj} video`, url: video }] } : {}),
  }
  { const hit = (SO.CITY_OPTIONS as string[]).find((x) => n1(x) === n1(town)); if (hit) data.city = hit; else { delete data.city; data.city_other = town } }
  for (const k of Object.keys(data)) if (data[k] === undefined) delete data[k]
  let doc: any
  try { doc = await payload.create({ collection: 'lands', overrideAccess: true, data } as never) } catch (e: any) { console.log('FAILED', slug, e?.message, JSON.stringify(e?.data?.errors ?? e?.data ?? '').slice(0, 400)); continue }
  const pool = (payload.db as any).pool
  let order = 0
  for (const [label, url] of [['Project page', page], ['Site data (API)', 'https://api.homelands.lk/api/land'], ['Lands for sale', 'https://www.homelands.lk/lands-for-sale']] as const) { order += 1; await pool.query('insert into payload.lands_reference_links (_order,_parent_id,id,label,url,note) values ($1,$2,$3,$4,$5,$6)', [order, doc.id, crypto.randomBytes(12).toString('hex'), label, url, 'homelands.lk, shared by the owner 2026-10-15']) }
  const T = (t: string, notes?: string) => todos.push({ slug, title: t, notes, links })
  T('Plot sizes, prices and availability per plot', 'Only project-level data is published (price per perch, plot sizes, total and available plots). No individual plot numbers, sizes, prices or status, so the plots table is empty.')
  if (!sane) T('Plot counts look inconsistent', `Site data says total ${L.total_blocks}, available ${L.available_blocks}. Plot count left blank; check the real numbers.`)
  if (!minP) T('Plot size not published', 'No perch size on the site (extent 0), land size shown as 0.')
  if (!lat) T('Map coordinates', 'The site gives no map embed with coordinates for this project.')
  if (!blockPlanImages.length) T('Block plan', 'No block plan image on the site.')
  if (!DISTRICT_BY_TOWN[town]) T('District', 'District not set; check.')
  T('District and province inferred', `District taken from the town name (${town}), the site only gives a district code and province.`)
  T('Payment plan and title', 'No payment plan, deed or title information is published on the project page.')
  T('Publish?')
  report.push([doc.id, slug, town, L.price, minP, maxP ?? '', L.total_blocks, L.available_blocks, gallery.length, blockPlanImages.length, brochureUrl ? 'brochure' : '', lat ? 'map' : 'NO MAP'].join(' | '))
  console.log('created', doc.id, slug, 'gallery', gallery.length, 'plan', blockPlanImages.length)
}
for (const t of todos) {
  const l: any = (await payload.find({ collection: 'lands', where: { slug: { equals: t.slug } }, limit: 1, depth: 0, overrideAccess: true })).docs[0]
  if (!l) continue
  await payload.create({ collection: 'listing-todos' as never, data: { title: t.title, listingType: 'land', land: l.id, notes: t.notes, sourceLinks: t.links.join('\n') } as never, overrideAccess: true })
}
console.log('todos', todos.length)
console.log(report.join('\n'))
process.exit(0)
