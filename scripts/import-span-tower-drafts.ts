/* eslint-disable @typescript-eslint/no-explicit-any -- one-off import script */
// Span Tower (Span Engineering, https://spantower.com/), owner request 2026-11-02 ("Add these"): UNPUBLISHED drafts of the current projects.
//   SPAN_DIR=<folder with images> NODE_ENV=production npx tsx scripts/import-span-tower-drafts.ts
// Span Tower 31 (Colombo 06) and Span Tower 28 (Negombo). Span Tower 20 (Nuwara Eliya) is NOT added: its renders and brochure 404 on the live site and its
// status conflicts (homepage "ongoing", in-progress page "completed"). The ~23 completed Span Towers are not added. No prices, unit sizes, bathrooms or
// floor plans are published (brochure links are dead), so none are entered.
import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { config as loadEnv } from 'dotenv'
loadEnv({ path: path.join(process.cwd(), '.env.local') })
const dir = process.env.SPAN_DIR ?? ''
if (!dir) throw new Error('Set SPAN_DIR')
const cfg = ((await import('../payload.config')) as any).default
const { getPayload } = await import('payload')
const { mirrorToR2 } = await import('../src/lib/listing-import/mirror')
const SO = (await import('../src/collections/shared-fields')) as any
const payload = await getPayload({ config: cfg })
const pool = (payload.db as any).pool
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
const n1 = (v: string) => v.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
const so = (o: Record<string, any>, name: string, opts: string[]) => {
  const v = o[name]; if (typeof v !== 'string' || !v) return
  const hit = opts.find((x) => n1(x) === n1(v)); if (hit) { o[name] = hit; return }
  o[`${name}_other`] = v; delete o[name]
}
const MIME: Record<string, string> = { '.jpg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp' }
const amen = (names: string[]) => names.map((name) => { if (!(SO.AMENITY_NAME_OPTIONS as string[]).includes(name)) throw new Error('amenity not in vocabulary ' + name); return { name } })

let dev = await find('developers', 'span-engineering')
if (!dev) {
  dev = await createRetry('developers', {
    slug: 'span-engineering', name: 'Span Engineering (Pvt) Ltd', website: 'https://spantower.com/', location: 'Dharmarama Road, Colombo 06',
    description: 'Span Engineering (Pvt) Ltd builds apartments under the Span Tower name. Its site lists 31 numbered Span Tower projects, mostly in Colombo 04, 05 and 06 and Dehiwala, with 23 completed and a few ongoing.',
    contact_email: 'info@spantower.com', contact_phone: '+94112507997',
  })
  console.log('developer created', dev.id)
}
const contact = { name: 'Span Tower Sales', email: 'Sales@spantower.com', phone: '+94773686000', address: 'No. 48/3A & 3B, Dharmarama Road, Colombo 06' }
const socialLinks = { facebook: 'http://facebook.com/Spantower/', instagram: 'http://instagram.com/span_tower', linkedin: 'http://lk.linkedin.com/company/span-tower', twitter: 'http://x.com/span_tower', tiktok: 'http://tiktok.com/@span_tower' }

type Spec = { slug: string; name: string; nb: string; gallery: [string, string][]; hero: string; updates?: [string, string, string][]; data: Record<string, any>; links: [string, string, string][] }
const results: any[] = []
async function make(s: Spec) {
  if (await find('projects', s.slug)) { console.log('exists', s.slug); return }
  const up = (file: string, sub: string, label: string) => { const ext = path.extname(file).toLowerCase(); return mirrorToR2(`projects/${s.slug}/${sub}/${s.slug}_${label}${ext}`, fs.readFileSync(path.join(dir, file)), MIME[ext]) }
  const kebab = (x: string) => x.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
  const gallery: any[] = []
  for (const [file, label] of s.gallery) gallery.push({ label, image: await up(file, 'gallery', kebab(label)) })
  const constructionUpdates: any[] = []
  for (const [date, note, file] of s.updates ?? []) constructionUpdates.push({ date, note, image: await up(file, 'construction', date) })
  const nb = await find('neighborhoods', s.nb)
  const data: Record<string, any> = {
    slug: s.slug, name: s.name, developer: dev.id, isPublished: false, type: 'Apartments', startingPriceLkr: 0,
    heroImage: gallery[s.gallery.findIndex(([f]) => f === s.hero)].image, gallery, ...(constructionUpdates.length ? { constructionUpdates } : {}), contact, socialLinks, ...s.data,
  }
  if (nb) data.neighborhood = nb.id
  so(data, 'district', SO.DISTRICT_OPTIONS); so(data, 'city', SO.CITY_OPTIONS); so(data, 'province', SO.PROVINCE_OPTIONS)
  const created = await createRetry('projects', data)
  let order = 0
  for (const [label, url, note] of s.links) { order += 1; try { await pool.query('insert into payload.projects_reference_links (_order,_parent_id,id,label,url,note) values ($1,$2,$3,$4,$5,$6)', [order, created.id, crypto.randomBytes(12).toString('hex'), label, url, note]) } catch (e: any) { console.log('  reference link skipped:', e.message); break } }
  console.log('created', created.id, s.slug, 'published:', created.isPublished, 'gallery', gallery.length, 'updates', constructionUpdates.length, 'nb', nb?.slug ?? 'NONE')
  results.push({ id: created.id, slug: s.slug })
}

await make({
  slug: 'span-tower-31-colombo-06', name: 'Span Tower 31', nb: 'colombo-06',
  gallery: [['st31-c3.jpg', 'Top-floor slab works with the Colombo skyline'], ['st31-c4.webp', 'Swimming pool slab with sea view']], hero: 'st31-c3.jpg',
  updates: [['2026-10-26', 'Floor chipping work', 'st31-c1.png'], ['2026-07-30', 'Unit door frames installation, painting and skim coat', 'st31-c2.jpg'], ['2026-06-16', 'Water tank and lift machine room slab concrete work', 'st31-c3.jpg'], ['2026-05-15', 'Swimming pool concrete work', 'st31-c4.webp']],
  links: [['Project page', 'https://spantower.com/span-tower-31-colombo-6/', 'owner-shared 2026-11-02; construction log with dated photos'], ['Project portfolio', 'https://spantower.com/project-portfolio/', 'lists every Span Tower']],
  data: {
    status: 'Under Construction', constructionStatus: 'Under Construction', typeNote: 'Luxury apartments',
    location: 'No. 37, Lily Avenue, Colombo 06', city: 'Colombo 6', district: 'Colombo', province: 'Western',
    summary: 'Span Tower 31, a luxury apartment building under construction at No. 37, Lily Avenue, Colombo 06, with a swimming pool; the latest site update is dated 26 October 2026.',
    description: 'Span Tower 31 is Span Engineering\'s new luxury apartment building at No. 37, Lily Avenue, Colombo 06 ("Experience Urban Luxury at Span Tower 31 - Your New Home in Colombo 06"). Work began with the land in January 2024 and the foundation stone laying in June 2024, and the structure has since risen floor by floor. The latest site update (26 October 2026) is floor chipping work, following door-frame installation and skim-coat painting in July, the water tank and lift machine room slab in June, and the swimming pool concrete in May.\n\nUnit types, sizes, bedroom and bathroom counts, prices, handover date and floor plans are not published yet; contact Span Tower sales on +94 773 686 000.',
    highlights: ['Luxury apartment building at Lily Avenue, Colombo 06', 'Swimming pool', 'Structure complete; finishing works under way (October 2026)'],
    amenities: amen(['Pool']), sourceUrl: 'https://spantower.com/span-tower-31-colombo-6/',
  },
})
await make({
  slug: 'span-tower-28-negombo', name: 'Span Tower 28', nb: 'negombo',
  gallery: [['st28-side.png', 'Elevation, side view'], ['st28-night.png', 'Elevation, night view']], hero: 'st28-side.png',
  links: [['Project page', 'https://spantower.com/span-tower-28-negombo/', 'owner-shared 2026-11-02; the brochure link on the page returns 404'], ['Project portfolio', 'https://spantower.com/project-portfolio/', 'listed as upcoming']],
  data: {
    status: 'Coming Soon', typeNote: 'Apartments with commercial space, 49 apartments and 28 offices', units: 49,
    location: 'No. 571, Chilaw Road, Kattuwa, Negombo', city: 'Negombo', district: 'Gampaha', province: 'Western',
    summary: 'Span Tower 28, a basement + ground + 7-floor building on Chilaw Road, Kattuwa, Negombo, with 49 two- and three-bedroom apartments and 28 office spaces.',
    description: 'Span Tower 28 ("A new chapter of exclusive living") is a residential and commercial building at No. 571, Chilaw Road, Kattuwa, Negombo: basement, ground floor and 7 floors with 49 apartments and 28 office spaces, and separate entrances for the apartments and the commercial areas. Apartments are 2- and 3-bedroom units with spacious living areas and bedrooms; the office spaces are 840, 1,245, 1,325 and 1,395 sq ft.\n\nThe building has a spacious roof terrace, ample parking for apartment and commercial owners and a gated setting, with views of greenery and the sea. It is within walking distance of the Negombo–Chilaw main road and close to the Colombo–Katunayake Expressway and Bandaranaike International Airport. Span Tower lists it as upcoming. Prices, apartment sizes, bathrooms, floor plans and the handover date are not published.',
    highlights: ['49 apartments (2 and 3 bedrooms) and 28 offices', 'Basement, ground and 7 floors with a roof terrace', 'Close to the Colombo–Katunayake Expressway and the airport'],
    amenities: amen(['Roof Terrace', 'Parking', 'Gated Community']), sourceUrl: 'https://spantower.com/span-tower-28-negombo/',
    nearby: [{ category: 'Transport', name: 'Negombo–Chilaw Main Road (walking distance)' }, { category: 'Transport', name: 'Colombo–Katunayake Expressway' }, { category: 'Transport', name: 'Bandaranaike International Airport' }],
  },
})
console.log(JSON.stringify(results))
process.exit(0)
