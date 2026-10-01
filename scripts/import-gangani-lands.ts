// Imports Gangani Land Sales' land projects (https://www.ganganilandsales.com/lands/)
// from a pre-scraped JSON (see GANGANI_JSON) into the `lands` collection.
//
//   NODE_ENV=production npx tsx scripts/import-gangani-lands.ts --only abhimanpura,big-city
//   NODE_ENV=production npx tsx scripts/import-gangani-lands.ts --all
//
// Conventions follow the existing per-perch lands (e.g. Prime Lands): priceLkr 0,
// landSizePerches = smallest stated extent, pricePerPerchLkrMin/Max from the stated
// per-perch price. Images are mirrored into R2 under projects/<slug>/… (never
// hot-linked). Skips any land whose slug already exists.
import fs from 'node:fs'
import path from 'node:path'
import { config as loadEnv } from 'dotenv'
import type payloadConfigType from '../payload.config'

loadEnv({ path: path.join(process.cwd(), '.env.local') })

const GANGANI_JSON = process.env.GANGANI_JSON ?? ''
if (!GANGANI_JSON) throw new Error('Set GANGANI_JSON to the scraped gangani.json path')

type Scraped = {
  url: string; slug: string; name: string; location: string; price: string; extent: string; bus: string
  desc: string[]; details: string[]; pay: string[]; hero: string | null; gallery: string[]; roadmap: string | null
}

const args = process.argv.slice(2)
const only = args.includes('--only') ? args[args.indexOf('--only') + 1].split(',') : null
if (!only && !args.includes('--all')) throw new Error('Pass --only a,b or --all')

const payloadConfig = ((await import('../payload.config')) as { default: typeof payloadConfigType }).default
const { getPayload } = await import('payload')
const { mirrorRemoteFiles, mirrorToR2, fetchWithLimit, isMirrorConfigured } = await import('../src/lib/listing-import/mirror')
const { CITY_OPTIONS } = await import('../src/collections/shared-fields')
if (!isMirrorConfigured()) throw new Error('R2 env not configured')
const payload = await getPayload({ config: payloadConfig })

// area -> [district, province]. The site's own region label is used as the
// city (first token of its "Region, Area" location).
const AREAS: Record<string, [string, string]> = {
  Aluthgama: ['Kalutara', 'Western'], Kaduwela: ['Colombo', 'Western'], Homagama: ['Colombo', 'Western'],
  Athurugiriya: ['Colombo', 'Western'], Piliyandala: ['Colombo', 'Western'], Kahathuduwa: ['Colombo', 'Western'],
  Meegoda: ['Colombo', 'Western'], Malabe: ['Colombo', 'Western'], Gampaha: ['Gampaha', 'Western'],
  Hanwella: ['Colombo', 'Western'], Wattala: ['Gampaha', 'Western'], Meepe: ['Colombo', 'Western'], Horana: ['Kalutara', 'Western'], Bandaragama: ['Kalutara', 'Western'],
}
const cityOf = (location: string): string => {
  const first = location.split(/[,-]/)[0].replace(/[.]/g, '').trim()
  if (first === 'Colombo') return 'Malabe' // "Colombo, Malabe" (Grand City)
  if (first === 'Godagama' || first === 'Moragahahena') return 'Homagama'
  return first
}
const tidy = (s: string) => s.replace(/\s+,/g, ',').replace(/\s+/g, ' ').replace(/[.\s]+$/, '').trim()
const titleCase = (s: string) => s.split(' ').map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w)).join(' ')
const nums = (s: string) => (s.match(/\d[\d,]*(?:\.\d+)?/g) ?? []).map((n) => Number(n.replace(/,/g, ''))).filter((n) => Number.isFinite(n))

const all: Scraped[] = JSON.parse(fs.readFileSync(GANGANI_JSON, 'utf8'))
const todo = only ? all.filter((l) => only.includes(l.slug)) : all

// ---- developer ------------------------------------------------------------
const devSlug = 'gangani-land-sales'
const found = await payload.find({ collection: 'developers', where: { slug: { equals: devSlug } }, limit: 1, overrideAccess: true })
type Dev = { id: number | string }
let developer: Dev | undefined = found.docs[0] as unknown as Dev | undefined
if (!developer) {
  const logoSrc = 'https://www.ganganilandsales.com/wp-content/uploads/2024/10/GL-Logo-1-02.png'
  const { body, contentType } = await fetchWithLimit(logoSrc, { timeoutMs: 15000, maxBytes: 4 * 1024 * 1024 })
  const logo = await mirrorToR2('logos/developers/gangani-land-sales-logo.png', body, contentType || 'image/png')
  developer = (await payload.create({
    collection: 'developers',
    data: {
      slug: devSlug,
      name: 'Gangani Land Sales',
      logo,
      description:
        "Gangani Land Sales was founded in 1982 by chairman K.A.S. Premachandra, growing from a single land development into one of Sri Lanka's established land subdivision sellers. The company has delivered serviced residential plots to more than 11,000 families over more than 40 years, operating across major districts in the Western Province with structured, affordable payment plans.",
      website: 'https://www.ganganilandsales.com',
      location: 'Colombo',
      establishedYear: 1982,
      yearsInBusiness: 43,
      contact_phone: '+94112677822',
      socialLinks: { whatsapp: '+94772614429' },
    } as never,
    overrideAccess: true,
  })) as unknown as Dev
  console.log('Developer created', developer.id)
} else console.log('Developer exists', developer.id)

// ---- lands ----------------------------------------------------------------
const usedSlugs = new Set<string>()
for (const l of todo) {
  const name = titleCase(tidy(l.name))
  const city = cityOf(tidy(l.location))
  const area = AREAS[city]
  if (!area) { console.log('SKIP (unmapped area)', l.slug, city); continue }
  const [district, province] = area
  const slug = `${l.slug.replace(/-\d+$/, '')}-${city.toLowerCase()}`.replace(/--+/g, '-')
  let finalSlug = slug
  for (let n = 2; usedSlugs.has(finalSlug); n++) finalSlug = `${slug}-${n}`
  usedSlugs.add(finalSlug)
  const exists = await payload.find({ collection: 'lands', where: { slug: { equals: finalSlug } }, limit: 1, overrideAccess: true })
  if (exists.docs[0]) { console.log('exists', finalSlug); continue }

  const photos = await mirrorRemoteFiles(l.gallery, { keyPrefix: `projects/${finalSlug}/gallery`, namePrefix: finalSlug, label: 'photo', max: 8 })
  const road = l.roadmap ? await mirrorRemoteFiles([l.roadmap], { keyPrefix: `projects/${finalSlug}/road-map`, namePrefix: finalSlug, label: 'road-map', max: 1 }) : { mirrored: [], failed: [] }
  if (photos.failed.length || road.failed.length) console.log('  image failures', finalSlug, JSON.stringify([...photos.failed, ...road.failed]).slice(0, 300))
  const gallery = photos.mirrored.map((m) => ({ image: m.url }))
  if (gallery.length === 0) { console.log('SKIP (no images mirrored)', finalSlug); continue }

  const paragraphs = l.desc.slice(1) // [0] is the section heading
  const priceNums = nums(l.price)
  const extentNums = nums(l.extent)
  const pay = [...l.pay]
  const ri = pay.indexOf('The remaining amount')
  const payItems = ri >= 0 ? [...pay.slice(0, ri), `The remaining amount ${pay.slice(ri + 1).join(' ').replace(/\s+/g, ' ')}`] : pay
  const facilities = [...l.details, ...(l.bus ? [`Bus route: ${l.bus}`] : [])]
  const first = paragraphs[0] ?? ''
  const water = l.details.find((d) => /tap water|well water/i.test(d))

  const created = await payload.create({
    collection: 'lands',
    data: {
      slug: finalSlug,
      title: name,
      sellerType: 'developer',
      seller: { relationTo: 'developers', value: developer.id },
      sellerName: 'Gangani Land Sales',
      location: tidy(l.location),
      district,
      ...((CITY_OPTIONS as string[]).includes(city) ? { city } : { city_other: city }),
      province,
      status: 'Available',
      landUse: ['Residential'],
      landType: 'Residential Plots',
      landSizePerches: extentNums.length ? Math.min(...extentNums) : 0,
      priceLkr: 0,
      ...(priceNums[0] ? { pricePerPerchLkrMin: priceNums[0] } : {}),
      ...(priceNums.length > 1 ? { pricePerPerchLkrMax: priceNums[priceNums.length - 1] } : {}),
      ...(payItems.length ? { paymentPlanItems: payItems } : {}),
      ...(water ? { water: water.replace(/\s+/g, ' ') } : {}),
      summary: first.length > 240 ? `${first.slice(0, first.lastIndexOf(' ', 237))}…` : first,
      description: paragraphs.join('\n\n'),
      heroImage: gallery[0].image,
      gallery,
      ...(road.mirrored[0] ? { roadMapImages: [{ image: road.mirrored[0].url }] } : {}),
      facilities,
    } as never,
    overrideAccess: true,
  })
  console.log('created', created.slug, `${gallery.length} photos`, road.mirrored.length ? '+roadmap' : '')
}
process.exit(0)
