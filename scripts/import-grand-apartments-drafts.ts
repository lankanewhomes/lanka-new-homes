/* eslint-disable @typescript-eslint/no-explicit-any -- one-off import script */
// Grand Apartments Group (https://grandapartments.lk/), owner request 2026-11-02: the 9 current (ongoing / upcoming) projects as UNPUBLISHED drafts.
//   GA_DIR=<folder with the downloaded plans, covers and brochures> NODE_ENV=production npx tsx scripts/import-grand-apartments-drafts.ts
// Sold-out completed Grand projects (Avenue, Square, Tower, Homes, View, Park, Residences, Apartments) are NOT added. Sizes and bedroom counts are from the site;
// bathrooms are read off each plan's "Allocated Spaces" list (ensuite masters + common bathroom; the maid's room is flagged separately). No prices are published.
import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { config as loadEnv } from 'dotenv'
loadEnv({ path: path.join(process.cwd(), '.env.local') })
const dir = process.env.GA_DIR ?? ''
if (!dir) throw new Error('Set GA_DIR')
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
const MIME: Record<string, string> = { '.jpg': 'image/jpeg', '.webp': 'image/webp', '.pdf': 'application/pdf' }
const kebab = (x: string) => x.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
const AMEN: Record<string, string> = { 'Open Rooftop': 'Rooftop', 'Swimming Pool': 'Pool', Sauna: 'Sauna', 'Event Hall': 'Function Room', 'Visitors Lobby': 'Reception & Lobby', 'Surveillance System': 'CCTV', '24*7 Security': 'Security', GYM: 'Gym', Parking: 'Parking' }
const amen = (names: string[]) => names.map((n) => AMEN[n]).filter(Boolean).map((name) => { if (!(SO.AMENITY_NAME_OPTIONS as string[]).includes(name)) throw new Error('amenity not in vocabulary ' + name); return { name } })

let dev = await find('developers', 'grand-apartments-group')
if (!dev) {
  dev = await createRetry('developers', {
    slug: 'grand-apartments-group', name: 'Grand Apartments Group', website: 'https://grandapartments.lk/', location: '34 27th Lane, Colombo 03',
    description: 'Grand Apartments Group builds apartment towers in Colombo and Dehiwala and says it has completed over 400 homes. Its site lists 9 current projects (Legacy, Central, Heights, Oasis, Peak, Court, Edge, Sky and Capital) and 8 completed, sold-out ones.',
    contact_email: undefined, contact_phone: '+94776202088',
  })
  console.log('developer created', dev.id)
}
const contact = { name: 'Grand Apartments', phone: '+94776202088', address: '34 27th Lane, Colombo 03' }
const socialLinks = { facebook: 'https://www.facebook.com/Grandapartmentslk/', instagram: 'https://www.instagram.com/grandapartmentslk/', whatsapp: 'https://wa.link/cmxmyw' }

// plan: [name, file, beds, baths, sqft, maid]
type P = [string, string, number, number, number, boolean]
type Spec = {
  slug: string; name: string; prefix: string; nb: string[]; hero: string; extra: [string, string][]; master: string; brochure: string; pdf: string
  plans: P[]; data: Record<string, any>; url: string
}
const results: any[] = []
async function make(s: Spec) {
  if (await find('projects', s.slug)) { console.log('exists', s.slug); return }
  const up = (file: string, sub: string, label: string) => { const ext = path.extname(file).toLowerCase(); return mirrorToR2(`projects/${s.slug}/${sub}/${s.slug}_${label}${ext}`, fs.readFileSync(path.join(dir, file)), MIME[ext]) }
  const gallery: any[] = [{ label: 'Project image', image: await up(s.hero, 'gallery', 'project-image') }]
  for (const [file, label] of s.extra) gallery.push({ label, image: await up(file, 'gallery', kebab(label)) })
  gallery.push({ label: 'Master plan', image: await up(s.master, 'gallery', 'master-plan') })
  const brochure = await up(s.pdf, 'brochure', 'brochure')
  const floorPlans: any[] = []
  for (const [name, file, bedrooms, bathrooms, sqft, maid] of s.plans) {
    floorPlans.push({ planName: name, bedrooms, bathrooms, floorAreaSqFt: sqft, startingPriceLkr: 0, availability: 'Available', image: await up(file, 'floor-plans', kebab(name)), planDocuments: [{ label: 'Brochure', url: brochure }], ...(maid ? { maidsRoom: 'Yes' } : {}) })
  }
  const nb = await (async () => { for (const x of s.nb) { const n = await find('neighborhoods', x); if (n) return n } return null })()
  const data: Record<string, any> = {
    slug: s.slug, name: s.name, developer: dev.id, isPublished: false, type: 'Apartments', startingPriceLkr: 0,
    heroImage: gallery[0].image, gallery, floorPlans, brochureUrl: brochure, contact, socialLinks, sourceUrl: s.url, ...s.data,
  }
  if (nb) data.neighborhood = nb.id
  so(data, 'district', SO.DISTRICT_OPTIONS); so(data, 'city', SO.CITY_OPTIONS); so(data, 'province', SO.PROVINCE_OPTIONS)
  const created = await createRetry('projects', data)
  try { await pool.query('insert into payload.projects_reference_links (_order,_parent_id,id,label,url,note) values ($1,$2,$3,$4,$5,$6)', [1, created.id, crypto.randomBytes(12).toString('hex'), 'Project page', s.url, 'owner-shared grandapartments.lk, 2026-11-02; bathrooms read off the plan drawings']) } catch (e: any) { console.log('  reference link skipped:', e.message) }
  console.log('created', created.id, s.slug, 'published:', created.isPublished, 'plans', floorPlans.length, 'gallery', gallery.length, 'nb', nb?.slug ?? 'NONE')
  results.push({ id: created.id, slug: s.slug })
}
const base = { district: 'Colombo', province: 'Western' }
const AM9 = ['Open Rooftop', 'Backup Generator', 'Surveillance System', 'Elevators', 'Firefighting System', '24*7 Security']
const km = (m: number) => Math.round(m) / 1000
const desc = (line: string, tail: string) => `${line}\n\n${tail} Prices and handover dates are not published; contact Grand Apartments on +94 77 620 2088.`
const maidLine = 'Every apartment includes a maid\'s room with its own bathroom, a balcony area and a common bathroom where the plan shows one.'

await make({
  slug: 'grand-legacy-colombo-03', name: 'Grand Legacy', prefix: 'legacy', nb: ['colombo-03'], hero: 'legacy-cover.webp', extra: [], master: 'legacy-master.webp', pdf: 'legacy.pdf', brochure: '',
  url: 'https://grandapartments.lk/listing/grand-legacy/',
  plans: [['Unit A - 4 Bedroom', 'legacy-A.webp', 4, 4, 2214, true], ['Unit B - 2 Bedroom', 'legacy-B.webp', 2, 2, 914, false], ['Unit C - 4 Bedroom', 'legacy-C.webp', 4, 3, 2046, true], ['Unit D - 3 Bedroom', 'legacy-D.webp', 3, 2, 1599, true]],
  data: { ...base, status: 'Now Selling', typeNote: '24-storey landmark tower', units: 72, floors: 24, location: 'No. 4, Deal Place & No. 3, Deanston Place, Colombo 03', city: 'Colombo 3',
    summary: 'A 24-storey tower with 72 two-, three- and four-bedroom apartments of 914 to 2,214 sq ft at Deal Place, Colombo 03, with a rooftop, swimming pool, sauna and event hall.',
    description: desc('Grand Legacy is a 24-storey landmark development by Grand Apartments Group at No. 4, Deal Place and No. 3, Deanston Place, Colombo 03, with 72 apartments: a 914 sq ft two-bedroom (Unit B), a 1,599 sq ft three-bedroom (Unit D) and four-bedroom units of 2,046 and 2,214 sq ft (Units C and A). Bathroom counts are read off the unit plans.', 'Shared facilities are an open rooftop, swimming pool, sauna, event hall and visitors lobby, with a backup generator, elevators, firefighting system, surveillance and 24-hour security.'),
    highlights: ['72 apartments on 24 floors', '2, 3 and 4 bedrooms from 914 to 2,214 sq ft', 'Rooftop, pool, sauna and event hall', 'Durdans Hospital 800 m, Galle Road 20 m'],
    amenities: amen(['Open Rooftop', 'Swimming Pool', 'Sauna', 'Event Hall', 'Visitors Lobby', 'Surveillance System', '24*7 Security']),
    nearby: [{ category: 'Transport', name: 'Galle Road', distanceKm: km(20) }, { category: 'Hospital', name: 'Durdans Hospital', distanceKm: km(800) }, { category: 'Landmark', name: 'Bank of Ceylon', distanceKm: km(500) }, { category: 'School', name: 'ANC Education', distanceKm: km(220) }, { category: 'Shopping', name: 'Cargills Food City', distanceKm: 1 }, { category: 'Restaurant', name: 'Manhattan Fish Market', distanceKm: km(180) }, { category: 'Shopping', name: 'Marino Mall', distanceKm: 1.5 }, { category: 'Landmark', name: 'High Commission of Canada', distanceKm: km(500) }] },
})
await make({
  slug: 'grand-central-colombo-03', name: 'Grand Central', prefix: 'central', nb: ['colombo-03'], hero: 'central-cover.webp', extra: [], master: 'central-master.webp', pdf: 'central.pdf', brochure: '',
  url: 'https://grandapartments.lk/listing/grand-central/',
  plans: [['Unit A - 4 Bedroom', 'central-A.webp', 4, 3, 2136, true], ['Unit B - 4 Bedroom', 'central-B.webp', 4, 3, 2119, true], ['Unit C - 3 Bedroom', 'central-C.webp', 3, 3, 1600, true], ['Unit D - 3 Bedroom', 'central-D.webp', 3, 2, 1776, true], ['Unit E - 3 Bedroom', 'central-E.webp', 3, 2, 1666, true]],
  data: { ...base, status: 'Now Selling', typeNote: '15-storey residential tower', units: 65, floors: 15, location: 'No. 52, 5th Lane, Colombo 03', city: 'Colombo 3',
    summary: 'A 15-storey tower at 5th Lane, Colombo 03 with 65 three- and four-bedroom apartments of 1,600 to 2,136 sq ft, a rooftop, pool and event hall.',
    description: desc('Grand Central is a 15-storey residential building at No. 52, 5th Lane, Colombo 03, with 65 apartments: three-bedroom units of 1,600, 1,666 and 1,776 sq ft and four-bedroom units of 2,119 and 2,136 sq ft. Each apartment has a maid\'s room with its own bathroom; bathroom counts are read off the unit plans.', 'Shared facilities are an open rooftop, swimming pool, event hall and visitors lobby, with a backup generator, elevators, firefighting system, surveillance and 24-hour security.'),
    highlights: ['65 apartments on 15 floors', '3 and 4 bedrooms from 1,600 to 2,136 sq ft', 'Rooftop, pool and event hall', 'Duplication Road 50 m, Galle Road 300 m'],
    amenities: amen(['Open Rooftop', 'Swimming Pool', 'Event Hall', 'Visitors Lobby', 'Surveillance System', '24*7 Security']),
    nearby: [{ category: 'Transport', name: 'Duplication Road', distanceKm: km(50) }, { category: 'Shopping', name: 'Cargills Food City', distanceKm: km(350) }, { category: 'Landmark', name: 'Commercial Bank', distanceKm: 1.2 }, { category: 'School', name: 'Mahanama College', distanceKm: km(150) }, { category: 'Shopping', name: 'Liberty Plaza', distanceKm: 1.9 }, { category: 'Transport', name: 'Galle Road', distanceKm: km(300) }, { category: 'Hospital', name: 'Durdans Hospital', distanceKm: km(400) }] },
})
await make({
  slug: 'grand-heights-colombo-04', name: 'Grand Heights', prefix: 'heights', nb: ['colombo-04'], hero: 'heights-cover.webp', extra: [], master: 'heights-master.webp', pdf: 'heights.pdf', brochure: '',
  url: 'https://grandapartments.lk/listing/grand-heights/',
  plans: [['Unit A - 4 Bedroom', 'heights-A.webp', 4, 3, 1835, true], ['Unit B - 3 Bedroom', 'heights-B.webp', 3, 2, 1560, true], ['Unit C - 3 Bedroom', 'heights-C.webp', 3, 2, 1463, true], ['Unit D - 4 Bedroom', 'heights-D.webp', 4, 3, 1826, true]],
  data: { ...base, status: 'Now Selling', typeNote: '13-storey residential tower', units: 44, floors: 13, location: 'No. 19, Frankfort Place, Colombo 04', city: 'Colombo 4',
    summary: 'A 13-storey tower at Frankfort Place, Colombo 04 with 44 three- and four-bedroom apartments of 1,463 to 1,835 sq ft, 100 m from Galle Road.',
    description: desc('Grand Heights is a 13-storey development at No. 19, Frankfort Place, Colombo 04, with 44 apartments from the 3rd to 13th floors: three-bedroom units of 1,463 and 1,560 sq ft and four-bedroom units of 1,826 and 1,835 sq ft, with sea or city views. Each has a maid\'s room with a bathroom; bathroom counts are read off the unit plans.', 'Shared facilities are an open rooftop, swimming pool, event hall and visitors lobby, with a backup generator, elevators, firefighting system, surveillance and 24-hour security.'),
    highlights: ['44 apartments on 13 floors', '3 and 4 bedrooms from 1,463 to 1,835 sq ft', 'Rooftop, pool and event hall', 'Galle Road 100 m, Marine Drive 150 m'],
    amenities: amen(['Open Rooftop', 'Swimming Pool', 'Event Hall', 'Visitors Lobby', 'Surveillance System', '24*7 Security']),
    nearby: [{ category: 'Landmark', name: 'Commercial Bank', distanceKm: km(350) }, { category: 'Landmark', name: "St. Paul's Church", distanceKm: km(300) }, { category: 'Transport', name: 'Galle Road', distanceKm: km(100) }, { category: 'Shopping', name: 'Cargills Food City', distanceKm: 1 }, { category: 'School', name: "St. Paul's Girls School", distanceKm: km(350) }, { category: 'Landmark', name: 'Sri Manika Vinayagar Kovil', distanceKm: km(500) }, { category: 'Landmark', name: 'Marine Drive', distanceKm: km(150) }, { category: 'School', name: 'ICBT Campus', distanceKm: 1 }] },
})
await make({
  slug: 'grand-oasis-colombo-13', name: 'Grand Oasis', prefix: 'oasis', nb: ['colombo-13'], hero: 'oasis-cover.webp', extra: [], master: 'oasis-master.webp', pdf: 'oasis.pdf', brochure: '',
  url: 'https://grandapartments.lk/listing/grand-oasis/',
  plans: [['Unit Amethyst - 3 Bedroom', 'oasis-amethyst.webp', 3, 2, 1255, true], ['Unit Emerald - 3 Bedroom', 'oasis-emerald.webp', 3, 2, 1316, true], ['Unit Pearl - 3 Bedroom', 'oasis-pearl.webp', 3, 2, 1243, true], ['Unit Sapphire - 3 Bedroom', 'oasis-sapphire.webp', 3, 2, 1264, true], ['Unit Topaz - 3 Bedroom', 'oasis-topaz.webp', 3, 2, 1477, true]],
  data: { ...base, status: 'Now Selling', typeNote: '14-storey residential tower', units: 60, floors: 14, location: "No. 27, St Lucia's Street, Colombo 13 (Kotahena)", city: 'Colombo 13',
    summary: "A 14-storey tower with 60 three-bedroom apartments of 1,243 to 1,477 sq ft on St Lucia's Street, Kotahena, Colombo 13.",
    description: desc("Grand Oasis rises 14 floors in Kotahena at No. 27, St Lucia's Street, Colombo 13, with 60 three-bedroom apartments of 1,243 to 1,477 sq ft (Pearl 1,243, Amethyst 1,255, Sapphire 1,264, Emerald 1,316 and Topaz 1,477). Each has a maid's room with a bathroom; bathroom counts are read off the unit plans.", 'Facilities include an open rooftop, a backup generator, elevators, firefighting system, surveillance and 24-hour security.'),
    highlights: ['60 three-bedroom apartments on 14 floors', '1,243 to 1,477 sq ft', "St. Lucia's College 350 m, Keells 300 m, Cargills 300 m"],
    amenities: amen(['Open Rooftop', 'Surveillance System', '24*7 Security']),
    nearby: [{ category: 'School', name: "St. Lucia's College", distanceKm: km(350) }, { category: 'Landmark', name: "People's Bank", distanceKm: km(450) }, { category: 'Shopping', name: 'Keells', distanceKm: km(300) }, { category: 'Shopping', name: 'Cargills Food City', distanceKm: km(300) }, { category: 'Landmark', name: 'Sugathadasa Stadium', distanceKm: km(850) }, { category: 'Landmark', name: 'Commercial Bank', distanceKm: km(250) }, { category: 'Landmark', name: "Cathedral of St. Lucia's", distanceKm: km(600) }] },
})
await make({
  slug: 'grand-peak-dehiwala', name: 'Grand Peak', prefix: 'peak', nb: ['dehiwala'], hero: 'peak-hero.webp', extra: [], master: 'peak-master.webp', pdf: 'peak.pdf', brochure: '',
  url: 'https://grandapartments.lk/listing/grand-peak/',
  plans: [['Unit A - 4 Bedroom', 'peak-A.webp', 4, 3, 1625, true], ['Unit B - 3 Bedroom', 'peak-B.webp', 3, 3, 1586, true], ['Unit C - 3 Bedroom', 'peak-C.webp', 3, 2, 1400, true]],
  data: { ...base, status: 'Now Selling', typeNote: '10-storey residential tower', units: 30, floors: 10, location: 'No. 11, Julian Place, off Saranankara Road, Dehiwala', city: 'Dehiwala',
    summary: 'A 10-storey tower with 30 three- and four-bedroom apartments of 1,400 to 1,625 sq ft at Julian Place, off Saranankara Road, Dehiwala.',
    description: desc('Grand Peak is a 10-storey building at No. 11, Julian Place, off Saranankara Road, bordering Wellawatte, with 30 apartments: three-bedroom Units B (1,586 sq ft) and C (1,400 sq ft) and four-bedroom Unit A (1,625 sq ft). Each has a maid\'s room with a bathroom; bathroom counts are read off the unit plans.', 'Facilities include an open rooftop, a backup generator, elevators, firefighting system, surveillance and 24-hour security.'),
    highlights: ['30 apartments on 10 floors', '3 and 4 bedrooms from 1,400 to 1,625 sq ft', 'Off Saranankara Road, bordering Wellawatte'],
    amenities: amen(['Open Rooftop', 'Surveillance System', '24*7 Security']),
    nearby: [{ category: 'Landmark', name: 'Union Bank' }, { category: 'Shopping', name: 'Cargills Food City' }, { category: 'Landmark', name: 'Commercial Bank' }, { category: 'Shopping', name: 'Keells' }, { category: 'Hospital', name: 'Neosys Healthcare Medical Center' }] },
})
await make({
  slug: 'grand-court-colombo-14', name: 'Grand Court', prefix: 'court', nb: ['colombo-14'], hero: 'court-thumb.webp', extra: [], master: 'court-master.webp', pdf: 'court.pdf', brochure: '',
  url: 'https://grandapartments.lk/listing/grand-court/',
  plans: [['Unit A - 4 Bedroom', 'court-A.webp', 4, 3, 1799, true], ['Unit B - 4 Bedroom', 'court-B.webp', 4, 3, 1977, true]],
  data: { ...base, status: 'Coming Soon', constructionStatus: 'Not Started', typeNote: '11-storey residential tower', units: 22, floors: 11, location: 'No. 94, Stace Road, Colombo 14', city: 'Colombo 14',
    summary: 'An 11-storey tower on Stace Road, Colombo 14 with 22 four-bedroom apartments of 1,799 and 1,977 sq ft, at the planning stage.',
    description: desc('Grand Court is an 11-storey development at No. 94, Stace Road, Colombo 14, with 22 four-bedroom apartments of 1,799 sq ft (Unit A) and 1,977 sq ft (Unit B), each with a maid\'s room and bathroom. The site lists it as ongoing with a project status of "In Planning Stage" and its highlights mention three-bedroom apartments; the unit plans show four bedrooms. Bathroom counts are read off the unit plans.', 'The building has a ground level and basement for parking, an open rooftop terrace, a backup generator, elevators, firefighting system, surveillance and 24-hour security.'),
    highlights: ['22 four-bedroom apartments on 11 floors', '1,799 and 1,977 sq ft', 'Rooftop terrace, ground and basement parking', 'Stace Road, Colombo 14'],
    amenities: amen(['Open Rooftop', 'Parking', 'Surveillance System', '24*7 Security']),
    nearby: [{ category: 'Hospital', name: 'Apollo Hospital' }, { category: 'Landmark', name: 'Muhiyaddeen Jumma Masjid' }, { category: 'Hospital', name: 'Divisional Government Hospital' }, { category: 'Landmark', name: 'Commercial Bank' }, { category: 'Restaurant', name: 'Pizza Hut' }, { category: 'Shopping', name: 'Laugfs Super Market' }, { category: 'School', name: "St. Joseph's Balika Maha Vidyalaya" }] },
})
await make({
  slug: 'grand-edge-colombo-06', name: 'Grand Edge', prefix: 'edge', nb: ['colombo-06'], hero: 'edge-1.jpg', extra: [['edge-2.webp', 'Project image 2']], master: 'edge-master.webp', pdf: 'edge.pdf', brochure: '',
  url: 'https://grandapartments.lk/listing/grand-edge/',
  plans: [['Unit A - 3 Bedroom', 'edge-A.webp', 3, 2, 1522, true], ['Unit B - 3 Bedroom', 'edge-B.webp', 3, 2, 1532, true], ['Unit C - 3 Bedroom', 'edge-C.webp', 3, 2, 1570, true], ['Unit D - 3 Bedroom', 'edge-D.webp', 3, 2, 1167, false], ['Unit E - 3 Bedroom', 'edge-E.webp', 3, 2, 1165, false]],
  data: { ...base, status: 'Coming Soon', constructionStatus: 'Not Started', typeNote: '22-storey residential tower', units: 95, floors: 22, location: 'No. 6, 47th Lane, Wellawatte, Colombo 06', city: 'Colombo 6',
    summary: 'A 22-storey tower of 95 three-bedroom apartments (1,165 to 1,570 sq ft) on 47th Lane, Wellawatte, 100 m off Galle Road, at the planning stage.',
    description: desc('Grand Edge is a planned 22-storey tower at No. 6, 47th Lane, Wellawatte, Colombo 06, just 100 metres off Galle Road, with 95 three-bedroom apartments: Units E (1,165 sq ft), D (1,167 sq ft), A (1,522 sq ft), B (1,532 sq ft) and C (1,570 sq ft). Units A to C include a maid\'s room with a bathroom. The site lists the project status as "In Planning Stage"; bathroom counts are read off the unit plans.', 'The building has a ground level and basement for parking, a rooftop, swimming pool, backup generator, elevators, firefighting system, surveillance and 24-hour security.'),
    highlights: ['95 three-bedroom apartments on 22 floors', '1,165 to 1,570 sq ft', 'Rooftop and swimming pool', '100 m off Galle Road, Wellawatte'],
    amenities: amen(['Open Rooftop', 'Swimming Pool', 'Parking', 'Surveillance System', '24*7 Security']),
    nearby: [{ category: 'Hospital', name: 'New Delmon Hospital' }, { category: 'Landmark', name: 'Union Bank' }, { category: 'School', name: 'Hejaaz International School' }, { category: 'Landmark', name: 'Dehiwala Muhiyadeen Grand Jummah Masjid' }, { category: 'Landmark', name: 'Sri Aanjaneyar Temple' }, { category: 'Landmark', name: 'Dharma Shanthi Viharaya' }] },
})
await make({
  slug: 'grand-sky-colombo-06', name: 'Grand Sky', prefix: 'sky', nb: ['colombo-06'], hero: 'sky-thumb.webp', extra: [], master: 'sky-master.webp', pdf: 'sky.pdf', brochure: '',
  url: 'https://grandapartments.lk/listing/grand-sky/',
  plans: [['Unit A1 - 4 Bedroom', 'sky-A1.webp', 4, 3, 1859, true], ['Unit A2 - 4 Bedroom', 'sky-A2.webp', 4, 3, 1874, true], ['Unit A3 - 3 Bedroom', 'sky-A3.webp', 3, 2, 1580, true], ['Unit A4 - 3 Bedroom', 'sky-A4.webp', 3, 2, 1700, true], ['Unit B1 - 4 Bedroom', 'sky-B1.webp', 4, 3, 1843, true], ['Unit B2 - 3 Bedroom', 'sky-B2.webp', 3, 2, 1522, true], ['Unit B3 - 3 Bedroom', 'sky-B3.webp', 3, 2, 1421, true]],
  data: { ...base, status: 'Coming Soon', constructionStatus: 'Not Started', typeNote: '22-storey residential tower', units: 154, floors: 22, location: 'No. 173, W. A. Silva Mawatha, Wellawatte, Colombo 06', city: 'Colombo 6',
    summary: 'A 22-storey tower with 154 three- and four-bedroom apartments of 1,421 to 1,874 sq ft on W. A. Silva Mawatha, Wellawatte, at the planning stage.',
    description: desc('Grand Sky is a planned 22-storey tower at No. 173, W. A. Silva Mawatha, Colombo 06 (Wellawatte), with 154 apartments in seven unit types: four-bedroom Units A1 (1,859), A2 (1,874) and B1 (1,843 sq ft), and three-bedroom Units A3 (1,580), A4 (1,700), B2 (1,522) and B3 (1,421 sq ft). Each has a maid\'s room with a bathroom. The site lists the project status as "In Planning Stage"; bathroom counts are read off the unit plans.', 'The building has a ground level and basement for parking, an open rooftop, swimming pool, gym, backup generator, elevators, firefighting system, surveillance and 24-hour security.'),
    highlights: ['154 apartments on 22 floors', '3 and 4 bedrooms from 1,421 to 1,874 sq ft', 'Rooftop, pool and gym', 'W. A. Silva Mawatha, Wellawatte'],
    amenities: amen(['Open Rooftop', 'Swimming Pool', 'GYM', 'Parking', 'Surveillance System', '24*7 Security']),
    nearby: [{ category: 'Hospital', name: 'Royal Hospital' }, { category: 'Landmark', name: 'Commercial Bank' }, { category: 'Hospital', name: 'New Delmon Hospital' }, { category: 'School', name: "St. Clare's College" }, { category: 'Landmark', name: 'Masjid Al Maqbool' }, { category: 'Landmark', name: "St Anthony's Church, Mayura Place" }, { category: 'Shopping', name: 'Laugfs Super Market, Wellawatte' }] },
})
await make({
  slug: 'grand-capital-colombo-09', name: 'Grand Capital', prefix: 'capital', nb: ['colombo-09'], hero: 'capital-1.jpg', extra: [['capital-2.webp', 'Project image 2']], master: 'capital-master.webp', pdf: 'capital.pdf', brochure: '',
  url: 'https://grandapartments.lk/listing/grand-capital/',
  plans: [['Unit A1 - 3 Bedroom', 'capital-A1.webp', 3, 2, 1589, true], ['Unit A2 - 3 Bedroom', 'capital-A2.webp', 3, 2, 1530, true], ['Unit A3 - 3 Bedroom', 'capital-A3.webp', 3, 2, 1446, true], ['Unit A4 - 4 Bedroom', 'capital-A4.webp', 4, 3, 1857, true], ['Unit A5 - 3 Bedroom', 'capital-A5.webp', 3, 2, 1573, true], ['Unit A6 - 3 Bedroom', 'capital-A6.webp', 3, 2, 1590, true], ['Unit A7 - 4 Bedroom', 'capital-A7.webp', 4, 3, 1788, true], ['Unit A8 - 3 Bedroom', 'capital-A8.webp', 3, 2, 1483, true]],
  data: { ...base, status: 'Coming Soon', constructionStatus: 'Not Started', typeNote: '11-storey residential tower', units: 60, floors: 11, carparkLevels: 3, location: 'No. 97, Sri Dharmarama Mawatha, Colombo 09 (Dematagoda)', city: 'Colombo 9',
    summary: 'An 11-storey tower with 60 three- and four-bedroom apartments of 1,446 to 1,857 sq ft at Sri Dharmarama Mawatha, Dematagoda, 300 m off Baseline Road, at the planning stage.',
    description: desc('Grand Capital is a planned 11-storey tower at No. 97, Sri Dharmarama Mawatha, Colombo 09, about 300 metres off Baseline Road in Dematagoda, with 60 apartments in eight unit types of 1,446 to 1,857 sq ft: three-bedroom Units A1, A2, A3, A5, A6 and A8, and four-bedroom Units A4 and A7. Each has a maid\'s room with a bathroom. The site lists the project status as "In Planning Stage"; bathroom counts are read off the unit plans.', 'The building has a ground level plus three levels of parking, an open rooftop, backup generator, elevators, firefighting system, surveillance and 24-hour security.'),
    highlights: ['60 apartments on 11 floors', '3 and 4 bedrooms from 1,446 to 1,857 sq ft', 'Ground level plus three parking levels', '300 m off Baseline Road, Dematagoda'],
    amenities: amen(['Open Rooftop', 'Parking', 'Surveillance System', '24*7 Security']),
    nearby: [{ category: 'School', name: 'Zahira College' }, { category: 'School', name: 'Wesley College' }, { category: 'Shopping', name: 'Cargills Square Dematagoda' }, { category: 'Hospital', name: 'Lady Ridgeway Hospital for Children' }, { category: 'Landmark', name: 'Kuppiyawatte Jummah Mosque' }, { category: 'Landmark', name: 'All Saints Church' }, { category: 'Landmark', name: 'Visuddharama Maha Pirivena' }] },
})
console.log(JSON.stringify(results))
process.exit(0)
