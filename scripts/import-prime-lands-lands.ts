// Imports the Prime Lands land projects listed at https://www.primelands.lk/land/en that aren't in the CMS yet.
// Source: a pre-scraped JSON (PL_RAW — page text lines, image URLs, map embed, per page).
//
//   PL_RAW=<scratchpad/pl/raw.json> NODE_ENV=production npx tsx scripts/import-prime-lands-lands.ts [--only slug,slug]
//
// Only what the page states: per-perch starting price, payment plan (site wording), facilities, location
// highlights (km/minutes distances become `nearby` rows), block plan, road map, photos (mirrored to R2, never
// hot-linked), map pin from the page's own Google embed. No land size / plot prices are invented.
import fs from 'node:fs'
import path from 'node:path'
import { config as loadEnv } from 'dotenv'
import type payloadConfigType from '../payload.config'

loadEnv({ path: path.join(process.cwd(), '.env.local') })
const raw = process.env.PL_RAW ?? ''
if (!raw) throw new Error('Set PL_RAW')
const args = process.argv.slice(2)
const only = args.includes('--only') ? args[args.indexOf('--only') + 1].split(',') : null

type Raw = { slug: string; url: string; district: string | null; lines: string[]; gallery: string[]; block: string[]; roadmap: string[]; youtube: string[]; lat: number | null; lng: number | null; thumb: string[] }

// Hand-checked placements for the first 11 imports (kept so a re-run stays identical); everything else is derived
// from the page's own location line + the district page it was listed under.
const PLACE: Record<string, { slug: string; location: string; city: string; district: string; province: string }> = {
  'GRACE-FIELD-GARDEN-KADANA': { slug: 'grace-field-garden-kandana', location: 'Rilaulla, Kandana', city: 'Kandana', district: 'Gampaha', province: 'Western' },
  'PLATINUM-GROVE-BERUKETIYA': { slug: 'platinum-grove-beruketiya', location: 'Beruketiya, Homagama', city: 'Homagama', district: 'Colombo', province: 'Western' },
  'SIXORA-WEBADA': { slug: 'sixora-webada', location: 'Webada, Kadawatha', city: 'Kadawatha', district: 'Gampaha', province: 'Western' },
  'SOLARA-MEEPE': { slug: 'solara-meepe', location: 'Meepe, Habaraduwa', city: 'Habaraduwa', district: 'Galle', province: 'Southern' },
  'VIONA-ATTIDIYA': { slug: 'viona-attidiya', location: 'Attidiya, Rathmalana', city: 'Ratmalana', district: 'Colombo', province: 'Western' },
  'GREEN-RADIANT-ALAWWA': { slug: 'green-radiant-alawwa', location: 'Dodamkumbura Estate, Alawwa', city: 'Alawwa', district: 'Kurunegala', province: 'North Western' },
}
const PROVINCE_OF: Record<string, string> = {
  Colombo: 'Western', Gampaha: 'Western', Kalutara: 'Western', Galle: 'Southern', Matara: 'Southern', Hambantota: 'Southern',
  Kandy: 'Central', Matale: 'Central', 'Nuwara Eliya': 'Central', Kurunegala: 'North Western', Puttalam: 'North Western',
  Anuradhapura: 'North Central', Polonnaruwa: 'North Central', Kegalle: 'Sabaragamuwa', Ratnapura: 'Sabaragamuwa',
}

const payloadConfig = ((await import('../payload.config')) as { default: typeof payloadConfigType }).default
const { getPayload } = await import('payload')
const { mirrorRemoteFiles, isMirrorConfigured } = await import('../src/lib/listing-import/mirror')
const { CITY_OPTIONS, DISTRICT_OPTIONS, PROVINCE_OPTIONS } = await import('../src/collections/shared-fields')
if (!isMirrorConfigured()) throw new Error('R2 env not configured')
const payload = await getPayload({ config: payloadConfig })

const dev = await payload.find({ collection: 'developers', where: { slug: { equals: 'prime-lands' } }, limit: 1, overrideAccess: true })
if (!dev.docs[0]) throw new Error('Developer prime-lands not found')
const devId = (dev.docs[0] as unknown as { id: number }).id

const titleCase = (s: string) => s.toLowerCase().replace(/\b[a-z]/g, (c) => c.toUpperCase())
const category = (name: string): string => {
  const n = name.toLowerCase()
  if (/hospital|medical|pharmac/.test(n)) return 'Hospital'
  if (/school|college|university|kdu|institute/.test(n)) return 'School'
  if (/supermarket|mall|city centre|keells|arpico|market/.test(n)) return 'Shopping'
  if (/railway|station|junction|bus|highway|expressway|interchange|road/.test(n)) return 'Transport'
  return 'Landmark'
}
const sel = (opts: string[], value: string, key: 'city' | 'district' | 'province') =>
  opts.includes(value) ? { [key]: value } : { [`${key}_other`]: value }

const all = JSON.parse(fs.readFileSync(raw, 'utf8')) as Raw[]
for (const r of all) {
  const L0 = r.lines
  const head0 = L0.findIndex((v) => v.startsWith('Sorry, there was an issue'))
  const locRaw = titleCase(L0[head0 + 2] ?? '')
  const districtName = (r.district ?? '').replace('-', ' ')
  const lastWord = locRaw.split(/\s+/).slice(-1)[0]
  const derivedCity = (CITY_OPTIONS as string[]).includes(locRaw) ? locRaw : (CITY_OPTIONS as string[]).includes(lastWord) ? lastWord : locRaw
  const place = PLACE[r.slug] ?? { slug: r.slug.toLowerCase(), location: locRaw, city: derivedCity, district: districtName, province: PROVINCE_OF[districtName] ?? '' }
  if (!place.province || !locRaw) { console.log('SKIP (no place)', r.slug); continue }
  if (only && !only.includes(place.slug)) continue
  const exists = await payload.find({ collection: 'lands', where: { slug: { equals: place.slug } }, limit: 1, overrideAccess: true })
  if (exists.docs[0]) { console.log('exists', place.slug); continue }

  const L = r.lines
  const at = (label: string, from = 0) => L.findIndex((v, i) => i >= from && v === label)
  const head = L.findIndex((v) => v.startsWith('Sorry, there was an issue'))
  const title = titleCase(L[head + 1]).replace(/\bKadana\b/, 'Kandana')
  const perch = Number((L.find((v) => /^[\d,]+ LKR$/.test(v)) ?? '').replace(/[^\d]/g, '')) || 0
  const hotline = L[at('Hotline Numbers') + 1] ?? ''
  const aboutI = at('About This Property'), payI = at('Payment Plan'), brI = at('Brochure'), facI = at('Facilities')
  const blkFound = L.findIndex((v, i) => i > facI && ['Block Plan', 'Road Map', 'Videos', 'Location'].includes(v))
  const blkI = blkFound >= 0 ? blkFound : L.length
  if (aboutI < 0 || payI < 0 || facI < 0) { console.log('SKIP (layout)', r.slug); continue }
  const headingI = L.findIndex((v, i) => i > aboutI && i < payI && v.length < 45 && /^(Location|Key|Why choose|Highlights)/i.test(v))
  const about = L.slice(aboutI + 1, headingI > 0 ? headingI : payI)
  const highlights = headingI > 0 ? L.slice(headingI + 1, payI) : []
  const payLines = L.slice(payI + 1, brI > 0 ? brI : facI)
  const facilities = L.slice(facI + 1, blkI)

  // Payment plan, site wording. "Option 0N" groups become one item each.
  const payItems: string[] = []
  for (const line of payLines) {
    if (/^Option\s*\d+/i.test(line)) payItems.push(`${line}:`)
    else if (payItems.length && payItems[payItems.length - 1].endsWith(':')) payItems[payItems.length - 1] += ` ${line.replace(/[.\s]+$/, '')}`
    else if (payItems.length && /^Option/i.test(payItems[payItems.length - 1]) && !/^(Option)/i.test(line)) payItems[payItems.length - 1] += `; ${line.replace(/[.\s]+$/, '')}`
    else payItems.push(line)
  }
  const fixedPay = payItems.map((p) => p.replace(/:\s*$/, ''))

  // Nearby: "1.8km to X", "2 minutes to X", "Walking distance to X".
  const nearby: { category: string; name: string; distanceKm?: number }[] = []
  const notes: string[] = []
  for (const h of highlights) {
    let m = h.match(/^([\d.]+)\s*km\s+to\s+(?:the\s+)?(.+)$/i)
    if (m) { nearby.push({ category: category(m[2]), name: m[2].replace(/[.\s]+$/, ''), distanceKm: Number(m[1]) }); continue }
    m = h.match(/^(\d+)\s*(?:minutes?|mins?)\s+to\s+(?:the\s+)?(.+)$/i)
    if (m) { nearby.push({ category: category(m[2]), name: `${m[2].replace(/[.\s]+$/, '')} (${m[1]} min)` }); continue }
    m = h.match(/^Walking distance to\s+(.+)$/i)
    if (m) { nearby.push({ category: category(m[1]), name: `${m[1].replace(/[.\s]+$/, '')} (walking distance)` }); continue }
    notes.push(h.replace(/[.\s]+$/, ''))
  }

  const roadFt = Number((facilities.join(' ').match(/(\d+)\s*ft\s+WIDE ROAD/i) ?? [])[1] ?? (about.join(' ').match(/(\d+)\s*ft\.?\s+wide/i) ?? [])[1]) || undefined
  const plotCount = Number((about.join(' ').match(/(\d+)\s+(?:well[- ]planned\s+)?(?:land\s+)?(?:lots|plots|blocks)/i) ?? [])[1]) || undefined
  const has = (re: RegExp) => facilities.some((f) => re.test(f)) || re.test(about.join(' '))

  // Images
  const gallerySrc = r.gallery
  const blockSrc = r.block[0]
  const roadSrc = r.roadmap[0]
  const prefix = `lands/${place.slug}`
  const photos = gallerySrc.length ? await mirrorRemoteFiles(gallerySrc, { keyPrefix: `${prefix}/gallery`, namePrefix: place.slug, label: 'photo', max: 14 }) : { mirrored: [], failed: [] }
  const promo = !photos.mirrored.length && r.thumb[0] ? await mirrorRemoteFiles([r.thumb[0]], { keyPrefix: `${prefix}/gallery`, namePrefix: place.slug, label: 'promo', max: 1 }) : { mirrored: [], failed: [] }
  const block = blockSrc ? await mirrorRemoteFiles([blockSrc], { keyPrefix: `${prefix}/block-plan`, namePrefix: place.slug, label: 'block-plan', max: 1 }) : { mirrored: [], failed: [] }
  const road = roadSrc ? await mirrorRemoteFiles([roadSrc], { keyPrefix: `${prefix}/road-map`, namePrefix: place.slug, label: 'road-map', max: 1 }) : { mirrored: [], failed: [] }
  // Lands whose page has no photo or promo artwork at all (owner, 2026-10-01: "add them") lead with the page's own
  // block plan / road map image, labelled as such — never a made-up picture.
  const planFallback = !photos.mirrored.length && !promo.mirrored.length ? (block.mirrored[0] ?? road.mirrored[0]) : undefined
  const gallery = [...photos.mirrored, ...promo.mirrored, ...(planFallback ? [planFallback] : [])].map((m) => ({ image: m.url, label: planFallback ? (block.mirrored[0] ? 'Block Plan' : 'Road Map') : promo.mirrored.length ? 'Project artwork' : 'Photo' }))
  if (!gallery.length) { console.log('SKIP (no hero image)', place.slug); continue }
  const failures = [...photos.failed, ...promo.failed, ...block.failed, ...road.failed]
  if (failures.length) console.log('  image failures', place.slug, JSON.stringify(failures).slice(0, 300))

  const summary = about.join(' ')
  const created = await payload.create({
    collection: 'lands',
    data: {
      slug: place.slug,
      title,
      sellerType: 'developer',
      seller: { relationTo: 'developers', value: devId },
      sellerName: 'Prime Lands',
      location: place.location,
      ...sel(DISTRICT_OPTIONS as string[], place.district, 'district'),
      ...sel(CITY_OPTIONS as string[], place.city, 'city'),
      ...sel(PROVINCE_OPTIONS as string[], place.province, 'province'),
      status: 'Available',
      landUse: ['Residential'],
      landType: 'Bare Land (subdivided plots)',
      landSizePerches: 0,
      priceLkr: 0,
      ...(perch ? { pricePerPerchLkrMin: perch } : {}),
      ...(plotCount ? { plotCount } : {}),
      ...(roadFt ? { roadWidthFt: roadFt } : {}),
      ...(has(/electricity/i) ? { electricity: 'Available' } : {}),
      ...(has(/tap water/i) ? { water: 'Available' } : {}),
      ...(fixedPay.length ? { paymentPlanItems: fixedPay } : {}),
      summary: summary.length > 260 ? `${summary.slice(0, summary.lastIndexOf(' ', 257))}…` : summary,
      description: [...about, ...(notes.length ? [`Location highlights: ${notes.join('; ')}.`] : [])].join('\n\n'),
      heroImage: gallery[0].image,
      gallery,
      ...(block.mirrored[0] ? { blockPlanImages: [{ image: block.mirrored[0].url, label: 'Block Plan' }] } : {}),
      ...(road.mirrored[0] ? { roadMapImages: [{ image: road.mirrored[0].url, label: 'Road Map' }] } : {}),
      ...(r.lat != null && r.lng != null ? { coordinates: { lat: r.lat, lng: r.lng } } : {}),
      ...(nearby.length ? { nearby } : {}),
      ...(r.youtube.length ? { videos: r.youtube.slice(0, 3).map((id, n) => ({ url: `https://www.youtube.com/embed/${id}`, label: `${title} ${n === 0 ? 'Overview' : `Video ${n + 1}`}` })) } : {}),
      facilities: [...facilities.map((f) => titleCase(f)), ...notes],
      badges: has(/wide road/i) ? ['Wide Road Access'] : [],
      contact: { name: 'Prime Lands', phone: hotline },
    } as never,
    overrideAccess: true,
  })
  console.log('created', created.slug, `${gallery.length} photos`, block.mirrored.length ? '+block plan' : '', road.mirrored.length ? '+road map' : '', `nearby ${nearby.length}`, `pay ${fixedPay.length}`)
}
process.exit(0)
