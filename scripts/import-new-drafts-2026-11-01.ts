/* eslint-disable @typescript-eslint/no-explicit-any -- one-off import script */
// Four UNPUBLISHED drafts from the 2026-11-01 developer-site sweep (owner: "add anything new ... don't publish, show me a preview link"):
//   Blue Ocean Jayasinghe Road (Colombo 05), ICC The Residencies Kotte, ICC Oceanfront Service Apartments Marine Drive (Colombo 06),
//   Provident The Loft Mirissa. Sources are each developer's site; areas/baths read off the plan drawings / brochure.
//   DRAFT_DIR=<scratch folder with jr/ kt/ md/ lm/> NODE_ENV=production npx tsx scripts/import-new-drafts-2026-11-01.ts
// No prices are published for any of them, so every price is 0.
import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { config as loadEnv } from 'dotenv'
loadEnv({ path: path.join(process.cwd(), '.env.local') })
const dir = process.env.DRAFT_DIR ?? ''
if (!dir) throw new Error('Set DRAFT_DIR')
const cfg = ((await import('../payload.config')) as any).default
const { getPayload } = await import('payload')
const { mirrorToR2 } = await import('../src/lib/listing-import/mirror')
const SO = (await import('../src/collections/shared-fields')) as any
const payload = await getPayload({ config: cfg })
const pool = (payload.db as any).pool

const find = async (collection: string, slug: string) =>
  ((await payload.find({ collection: collection as never, where: { slug: { equals: slug } }, limit: 1, overrideAccess: true, depth: 0 })).docs[0] as any) ?? null
async function createRetry(data: any) {
  for (let attempt = 0; attempt < 6; attempt++) {
    try { return (await payload.create({ collection: 'projects', data, overrideAccess: true } as never)) as any } catch (e: any) {
      const bad = [...new Set((e?.data?.errors ?? []).map((x: any) => String(x.path ?? '').split('.')[0]).filter(Boolean))] as string[]
      if (!bad.length) throw e
      console.log('  VALIDATION dropping', bad.join(','), JSON.stringify(e.data.errors).slice(0, 250)); for (const f of bad) delete data[f]
    }
  }
  throw new Error('create failed')
}
const n1 = (v: string) => v.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
const so = (o: Record<string, any>, name: string, opts: string[]) => {
  const v = o[name]; if (typeof v !== 'string' || !v) return
  const hit = opts.find((x) => n1(x) === n1(v)); if (hit) { o[name] = hit; return }
  o[`${name}_other`] = v; delete o[name]
}
const MIME: Record<string, string> = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.pdf': 'application/pdf' }
const nb = async (...slugs: string[]) => { for (const s of slugs) { const n = await find('neighborhoods', s); if (n) return n } return null }
const amen = (names: string[]) => names.map((name) => { if (!(SO.AMENITY_NAME_OPTIONS as string[]).includes(name)) throw new Error('amenity not in vocabulary ' + name); return { name } })

type Spec = {
  slug: string; name: string; developerId: number; neighbourhood: string[]; data: Record<string, any>
  gallery: [string, string][]; hero: string; plans: { plan: any; image?: string }[]; brochure?: string; brochureLabel?: string; links: [string, string, string][]
}
const results: any[] = []
async function make(s: Spec) {
  if (await find('projects', s.slug)) { console.log('exists', s.slug); return }
  const R = (sub: string, f: string) => `projects/${s.slug}/${sub}/${s.slug}_${f}`
  const up = (file: string, sub: string, label: string) => {
    const ext = path.extname(file).toLowerCase()
    return mirrorToR2(R(sub, `${label}${ext}`), fs.readFileSync(path.join(dir, file)), MIME[ext] ?? 'application/octet-stream')
  }
  const gallery: any[] = []
  for (const [file, label] of s.gallery) gallery.push({ label, image: await up(file, 'gallery', label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')) })
  const brochure = s.brochure ? await up(s.brochure, 'brochure', 'brochure') : undefined
  const floorPlans: any[] = []
  for (const p of s.plans) {
    const fp = { ...p.plan, startingPriceLkr: 0, availability: 'Available' }
    if (p.image) fp.image = await up(p.image, 'floor-plans', String(p.plan.planName).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''))
    if (brochure && s.brochureLabel) fp.planDocuments = [{ label: s.brochureLabel, url: brochure }]
    floorPlans.push(fp)
  }
  const dev = await payload.findByID({ collection: 'developers', id: s.developerId, depth: 0, overrideAccess: true } as never) as any
  const n = await nb(...s.neighbourhood)
  const data: Record<string, any> = {
    slug: s.slug, name: s.name, developer: dev.id, isPublished: false, type: 'Apartments', startingPriceLkr: 0,
    heroImage: gallery[s.gallery.findIndex(([f]) => f === s.hero)].image, gallery, floorPlans, ...(brochure ? { brochureUrl: brochure } : {}), ...s.data,
  }
  if (n) data.neighborhood = n.id
  so(data, 'district', SO.DISTRICT_OPTIONS); so(data, 'city', SO.CITY_OPTIONS); so(data, 'province', SO.PROVINCE_OPTIONS)
  const created = await createRetry(data)
  let order = 0
  for (const [label, url, note] of s.links) {
    order += 1
    try { await pool.query('insert into payload.projects_reference_links (_order,_parent_id,id,label,url,note) values ($1,$2,$3,$4,$5,$6)', [order, created.id, crypto.randomBytes(12).toString('hex'), label, url, note]) } catch (e: any) { console.log('  reference link skipped:', e.message); break }
  }
  console.log('created', created.id, s.slug, 'published:', created.isPublished, 'plans', floorPlans.length, 'gallery', gallery.length, 'neighbourhood:', n?.slug ?? 'NONE')
  results.push({ id: created.id, slug: s.slug })
}

// ---- 1. Blue Ocean, No. 08 Jayasinghe Road, Colombo 05 (data from the site's JS bundle; plan labels read off the typical floor plan) ----
const sibling: any = await payload.findByID({ collection: 'projects', id: 160, depth: 0, overrideAccess: true } as never)
await make({
  slug: 'jayasinghe-road-colombo-05', name: 'Jayasinghe Road Apartments', developerId: 70, neighbourhood: ['colombo-05'],
  gallery: [['jr/jayasinghe-COC.jpg', 'Completed building'], ['jr/j12.jpeg', 'Apartment interior 1'], ['jr/j13.jpeg', 'Apartment interior 2'], ['jr/j7.jpeg', 'Apartment view 1'], ['jr/j8.jpeg', 'Apartment view 2'], ['jr/j11.jpeg', 'Apartment interior 3']], hero: 'jr/jayasinghe-COC.jpg',
  plans: [
    { plan: { planName: 'Unit A & B', bedrooms: 3, bathrooms: 3, floorAreaSqFt: 1540, maidsRoom: 'Yes', floorRange: '1-8' }, image: 'jr/jayasif-1024x794.jpg' },
    { plan: { planName: 'Unit D', bedrooms: 3, bathrooms: 2, floorAreaSqFt: 1420, floorRange: '1-8' }, image: 'jr/jayasif-1024x794.jpg' },
    { plan: { planName: 'Unit C & E', bedrooms: 3, bathrooms: 2, floorAreaSqFt: 1315, floorRange: '1-8' }, image: 'jr/jayasif-1024x794.jpg' },
  ],
  links: [['Project page', 'https://blueoceangroup.lk/apartment-for-sale-in-colombo-05-jayasinghe-road', 'new on the Blue Ocean site, found 2026-11-01'], ['Video', 'https://www.youtube.com/watch?v=eE2f6lT3Ia4', 'YouTube']],
  data: {
    status: 'Now Selling', constructionStatus: 'Completed', typeNote: 'Business class luxury apartments, freehold', units: 40, floors: 8, carparkLevels: 3,
    location: 'No. 08, Jayasinghe Road, Colombo 05', city: 'Colombo 5', district: 'Colombo', province: 'Western',
    summary: 'A completed business-class apartment building at No. 08, Jayasinghe Road, Colombo 05, between Kirulapone and Nugegoda: 40 three-bedroom apartments of 1,315 to 1,540 sq ft on 8 floors.',
    description: 'Blue Ocean Group\'s completed residential development at No. 08, Jayasinghe Road, Colombo 05 sits between the established neighbourhoods of Kirulapone and Nugegoda. It has 8 residential floors with 40 apartments, 3 levels of car parking and freehold ownership. Every apartment has three bedrooms: Units A and B are 1,540 sq ft with 3 bathrooms and a maid\'s room; Unit D is 1,420 sq ft and Units C and E are 1,315 sq ft, each with 2 bathrooms.\n\nResidents share a rooftop swimming pool, fitness centre, function hall and barbecue pavilion, with two elevators, 24-hour standby power, intercom and CCTV, and individually reserved parking. Apartments have porcelain tile or timber flooring, split A/C provisions, stone kitchen counters with pantry cupboards and hot water in the master and common bathrooms. Prices are not published.',
    highlights: ['Completed, with 40 apartments on 8 floors', 'Freehold; 3 levels of car parking', 'Rooftop pool, gym, function hall and barbecue pavilion', 'Kalubowila Hospital 1 km, Odel 250 m, Nugegoda schools nearby'],
    amenities: amen(['Pool', 'Gym', 'Function Room', 'BBQ Area', 'CCTV', 'Parking', 'Rooftop']),
    videos: [{ label: 'Jayasinghe Road', url: 'https://www.youtube.com/watch?v=eE2f6lT3Ia4' }],
    coordinates: { lat: 6.8730697, lng: 79.8801603 }, contact: sibling.contact, socialLinks: sibling.socialLinks, sourceUrl: 'https://blueoceangroup.lk/apartment-for-sale-in-colombo-05-jayasinghe-road',
    nearby: [{ category: 'Hospital', name: 'Kalubowila Hospital', distanceKm: 1 }, { category: 'Shopping', name: 'Odel', distanceKm: 0.25 }, { category: 'School', name: 'Anula Vidyalaya', distanceKm: 0.65 }, { category: 'School', name: "St. John's College, Nugegoda", distanceKm: 1.2 }, { category: 'School', name: "St. John's Girls School", distanceKm: 0.8 }],
  },
})

// ---- 2. ICC, The Residencies Kotte (areas from the brochure; beds/baths from the plan drawings) ----
await make({
  slug: 'the-residencies-kotte', name: 'The Residencies Kotte', developerId: 37, neighbourhood: ['kotte', 'sri-jayawardenepura-kotte', 'sri-jayawardenapura-kotte'],
  gallery: [['kt/hero.webp', 'Building overview'], ['kt/g1.webp', 'Building overview 2']], hero: 'kt/hero.webp', brochure: 'kt/brochure.pdf', brochureLabel: 'Brochure',
  plans: [
    { plan: { planName: 'Type A', bedrooms: 3, bathrooms: 2, floorAreaSqFt: 1240, maidsRoom: 'Yes' }, image: 'kt/TYPE-A.webp' },
    { plan: { planName: 'Type B', bedrooms: 3, bathrooms: 2, floorAreaSqFt: 1212, maidsRoom: 'Yes' }, image: 'kt/TYPE-B.webp' },
    { plan: { planName: 'Type C', bedrooms: 3, bathrooms: 2, floorAreaSqFt: 1239, maidsRoom: 'Yes' }, image: 'kt/TYPE-C.webp' },
    { plan: { planName: 'Type D', bedrooms: 3, bathrooms: 2, floorAreaSqFt: 1246, maidsRoom: 'Yes' }, image: 'kt/TYPE-D.webp' },
    { plan: { planName: 'Type E', bedrooms: 2, bathrooms: 2, floorAreaSqFt: 823 }, image: 'kt/TYPE-E.webp' },
    { plan: { planName: 'Type F', bedrooms: 2, bathrooms: 2, floorAreaSqFt: 776 }, image: 'kt/TYPE-F.webp' },
  ],
  links: [['Project page', 'https://icc-construct.com/the-residencies-kotte', 'new on the ICC site, found 2026-11-01; page says 232 units, brochure says 238'], ['Brochure (PDF)', 'https://icc-construct.com/storage/documents/2023/11/Brochure-Kotte-New.pdf', 'mirrored to R2']],
  data: {
    status: 'Now Selling', typeNote: 'Twin towers, apartments with commercial space', units: 238,
    location: 'Kotte', city: 'Sri Jayawardenepura Kotte', district: 'Colombo', province: 'Western',
    summary: 'Twin G+21 towers in Kotte with 238 two- and three-bedroom apartments of 776 to 1,246 sq ft, commercial space on two floors and an infinity pool.',
    description: 'The Residencies by ICC is a pair of G+21 towers on two acres in Kotte, combining apartments with commercial space on two road-facing floors and a podium level. The brochure lists 238 apartments (the project page says 232): three-bedroom Types A to D of 1,212 to 1,246 sq ft and two-bedroom Types E and F of 823 and 776 sq ft. Each apartment has a kitchen and pantry and en-suite bedrooms, and the larger types include a maid\'s room.\n\nFacilities include an infinity swimming pool, gymnasium, recreation hall, jogging track, podium level, commercial spaces, car parking and 24-hour security. Prices and handover dates are not published.',
    highlights: ['Twin G+21 towers on two acres', '238 apartments: 2 and 3 bedrooms, 776 to 1,246 sq ft', 'Infinity pool, gym, recreation hall and jogging track', 'Commercial space on two floors facing the main road'],
    amenities: amen(['Infinity Pool', 'Gym', 'Jogging Track', 'Security', 'Parking']),
    contact: { name: 'ICC', phone: '0777714715' }, sourceUrl: 'https://icc-construct.com/the-residencies-kotte',
    nearby: [{ category: 'Shopping', name: 'Capitol Mall' }],
  },
})

// ---- 3. ICC, Oceanfront Service Apartments Marine Drive (areas/baths from the plan drawings) ----
await make({
  slug: 'oceanfront-marine-drive-colombo-06', name: 'Oceanfront Service Apartments Marine Drive', developerId: 37, neighbourhood: ['colombo-06'],
  gallery: [['md/RESTAURANT-AND-BAR_01-1-scaled.jpg', 'Restaurant and bar'], ['md/POOL-FULL-WIDE001.effectsResult-scaled.jpg', 'Infinity pool'], ['md/GYM-002.effectsResult-scaled.jpg', 'Gym'], ['md/LAUNGH.effectsResult-scaled.jpg', 'Lounge'], ['md/BAR-002.effectsResult-1-scaled.jpg', 'Bar'], ['md/Cam-007.effectsResult-scaled.jpg', 'Apartment living area'], ['md/LIVING-01.effectsResult-scaled.jpg', 'Living room'], ['md/LIVING-WIDE.effectsResult-scaled.jpg', 'Living room wide'], ['md/LIVING-DINNING-03.effectsResult-scaled.jpg', 'Living and dining'], ['md/TV-AREA.effectsResult-scaled.jpg', 'TV area']],
  hero: 'md/POOL-FULL-WIDE001.effectsResult-scaled.jpg', brochure: 'md/Broucher.pdf', brochureLabel: 'Brochure',
  plans: [
    { plan: { planName: 'Type A - 3 Bedroom', bedrooms: 3, bathrooms: 3, floorAreaSqFt: 1569, parkingSpaces: 1 }, image: 'md/Type-A-3BR.png' },
    { plan: { planName: 'Type B - 2 Bedroom', bedrooms: 2, bathrooms: 2, floorAreaSqFt: 1032, parkingSpaces: 1 }, image: 'md/Type-B-2BR.png' },
    { plan: { planName: 'Type C - 2 Bedroom', bedrooms: 2, bathrooms: 2, floorAreaSqFt: 1069, parkingSpaces: 1 }, image: 'md/Type-C-2BR.png' },
    { plan: { planName: 'Type D - 2 Bedroom', bedrooms: 2, bathrooms: 2, floorAreaSqFt: 912, parkingSpaces: 1 }, image: 'md/Type-D-2BR.png' },
  ],
  links: [['Project site', 'https://oceanfrontmarinedrive.com/', 'ICC; found 2026-11-01; the site\'s text table differs from the plan drawings, drawings used'], ['Apartments', 'https://oceanfrontmarinedrive.com/apartments/', 'unit types'], ['Brochure (PDF)', 'https://oceanfrontmarinedrive.com/wp-content/uploads/2025/11/Broucher.pdf', 'mirrored to R2']],
  data: {
    status: 'Now Selling', typeNote: 'Serviced apartments, 22 floors', units: 118, floors: 22,
    location: 'Marine Drive, Colombo 06', city: 'Colombo 6', district: 'Colombo', province: 'Western',
    summary: 'A 22-floor serviced-apartment tower on Marine Drive, Colombo 06, with 118 two- and three-bedroom apartments of 912 to 1,569 sq ft, sea and city views, an infinity pool, gym, restaurant and bar.',
    description: 'Oceanfront Service Apartments by ICC is a 22-floor tower on Marine Drive, Colombo 06, with 118 serviced apartments developed, built and managed by ICC. Apartments have sea or city views and one car park each: a 3-bedroom, 3-bathroom type of 1,569 sq ft (Type A) and 2-bedroom, 2-bathroom types of 1,069 sq ft (Type C), 1,032 sq ft (Type B) and 912 sq ft (Type D). Mirrored (M) versions of Types A to C share the same areas.\n\nFacilities include an infinity pool, gym and lounge, and a restaurant and bar. Galle Face Green and Port City Colombo are nearby. ICC markets the building as a guaranteed, high-rental-demand investment. Prices and handover dates are not published.',
    highlights: ['22 floors, 118 serviced apartments, sea and city views', '2-bedroom (912 to 1,069 sq ft) and 3-bedroom (1,569 sq ft) apartments', 'Infinity pool, gym and lounge, restaurant and bar', 'Near Galle Face Green and Port City Colombo'],
    amenities: amen(['Infinity Pool', 'Gym', 'Lounge', 'Restaurant', 'Bar']),
    coordinates: { lat: 6.8784851, lng: 79.8570505 }, contact: { name: 'ICC', phone: '+94777119755' },
    socialLinks: { facebook: 'https://www.facebook.com/oceanfrontcondominiums', instagram: 'https://www.instagram.com/oceanfrontcondoslk/' },
    sourceUrl: 'https://oceanfrontmarinedrive.com/',
    nearby: [{ category: 'Landmark', name: 'Galle Face Green' }, { category: 'Landmark', name: 'Port City Colombo' }],
  },
})

// ---- 4. Provident Capital, The Loft Mirissa (the page publishes no address, sizes, prices or plans) ----
await make({
  slug: 'the-loft-mirissa', name: 'The Loft Mirissa', developerId: 34, neighbourhood: ['mirissa'],
  gallery: [['lm/01-scaled-1.jpg', 'Building at night'], ['lm/Frame-1.png', 'Aerial view with the coast'], ['lm/Frame-8.png', 'Aerial view'], ['lm/Frame-2.png', 'Building at dusk'], ['lm/03-1.jpg', 'Balconies'], ['lm/WhatsApp-Image-2025-06-12-at-14.26.46_8aa8d90a.jpg', 'Building at twilight'], ['lm/WhatsApp-Image-2025-06-12-at-14.26.46_81c05936.jpg', 'Tower from the air'], ['lm/WhatsApp-Image-2025-06-12-at-14.26.45_37da2d1b.jpg', 'Unit interior with terrace']],
  hero: 'lm/Frame-1.png', plans: [],
  links: [['Project page', 'https://www.providentcapital.lk/portfolio/the-loft-mirissa/', 'new on the Provident Capital site, found 2026-11-01'], ['Project website', 'https://loftmirissa.com/', 'linked from the page']],
  data: {
    status: 'Now Selling', constructionStatus: 'Under Construction', typeNote: 'Serviced apartment lofts, 1 and 2 bedrooms',
    location: 'Mirissa', city: 'Mirissa', district: 'Matara', province: 'Southern',
    summary: 'Fully furnished one- and two-bedroom serviced apartment lofts in Mirissa on the southern coast, with an infinity pool, rooftop bistro and gardens.',
    description: 'The Loft Mirissa by Provident Capital offers sophisticated one- and two-bedroom lofts as fully furnished serviced apartments on Sri Lanka\'s southern coast, described as sustainable, resort-style living with sea views. Amenities include an infinity pool, a rooftop bistro and tranquil gardens. The page says units were to be furnished and move-in ready by October 2025 and lists the project under "Units Available / Under Construction". The street address, unit sizes, bathroom counts, prices and floor plans are not published.',
    highlights: ['1- and 2-bedroom lofts, fully furnished', 'Infinity pool, rooftop bistro and gardens', 'Serviced apartment on the southern coast, Mirissa'],
    amenities: amen(['Infinity Pool', 'Rooftop Restaurant', 'Garden']),
    contact: { name: 'Provident Capital', email: 'info@providentcapital.lk', phone: '0777917123' }, sourceUrl: 'https://www.providentcapital.lk/portfolio/the-loft-mirissa/',
  },
})
console.log(JSON.stringify(results))
process.exit(0)
