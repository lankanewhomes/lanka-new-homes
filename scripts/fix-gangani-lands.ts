// One-off fix-up for the Gangani Land Sales lands imported on 2026-09-30:
// land-size range, electricity, road, drain wording, map/street-view
// coordinates, and the (visible) developer logo.
//
//   GANGANI_JSON=<gangani.json> GANGANI_COORDS=<gangani_coords.json> \
//     NODE_ENV=production npx tsx scripts/fix-gangani-lands.ts
import fs from 'node:fs'
import path from 'node:path'
import { config as loadEnv } from 'dotenv'
import type payloadConfigType from '../payload.config'

loadEnv({ path: path.join(process.cwd(), '.env.local') })
const jsonPath = process.env.GANGANI_JSON ?? ''
const coordsPath = process.env.GANGANI_COORDS ?? ''
if (!jsonPath || !coordsPath) throw new Error('Set GANGANI_JSON and GANGANI_COORDS')

type Scraped = { slug: string; name: string; extent: string; details: string[] }
type Coords = Record<string, { loc: [number, number] | null; pano: [number, number] | null }>

const payloadConfig = ((await import('../payload.config')) as { default: typeof payloadConfigType }).default
const { getPayload } = await import('payload')
const { mirrorToR2, fetchWithLimit } = await import('../src/lib/listing-import/mirror')
const payload = await getPayload({ config: payloadConfig })

const scraped: Scraped[] = JSON.parse(fs.readFileSync(jsonPath, 'utf8'))
const coords: Coords = JSON.parse(fs.readFileSync(coordsPath, 'utf8'))
const titleCase = (s: string) => s.split(' ').map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w)).join(' ')
const tidy = (s: string) => s.replace(/\s+,/g, ',').replace(/\s+/g, ' ').replace(/[.\s]+$/, '').trim()
const nums = (s: string) => (s.match(/\d[\d,]*(?:\.\d+)?/g) ?? []).map((n) => Number(n.replace(/,/g, ''))).filter((n) => Number.isFinite(n))
const bySite = new Map(scraped.map((s) => [titleCase(tidy(s.name)), s]))

// ---- logo: the footer logo used at import is white-on-transparent (invisible on white)
const logoSrc = 'https://www.ganganilandsales.com/wp-content/uploads/2024/10/Asset-1-1-1.png'
const { body, contentType } = await fetchWithLimit(logoSrc, { timeoutMs: 15000, maxBytes: 4 * 1024 * 1024 })
const logo = await mirrorToR2('logos/developers/gangani-land-sales-logo-colour.png', body, contentType || 'image/png')
const dev = await payload.find({ collection: 'developers', where: { slug: { equals: 'gangani-land-sales' } }, limit: 1, overrideAccess: true })
if (dev.docs[0]) {
  await payload.update({ collection: 'developers', id: dev.docs[0].id, data: { logo } as never, overrideAccess: true })
  console.log('logo ->', logo)
}

// ---- lands
const lands = await payload.find({ collection: 'lands', where: { sellerName: { equals: 'Gangani Land Sales' } }, limit: 200, depth: 0, overrideAccess: true })
let updated = 0
for (const land of lands.docs as unknown as { id: number; slug: string; title: string; facilities?: string[] | null }[]) {
  const site = bySite.get(land.title)
  if (!site) { console.log('NO SITE MATCH', land.slug, land.title); continue }
  const details = site.details.map((d) => d.replace(/\s+/g, ' ').trim())
  const extent = nums(site.extent)
  const min = extent.length ? Math.min(...extent) : 0
  const max = extent.length > 1 ? Math.max(...extent) : 0
  const road = details.find((d) => /^(tar|concrete|carpet|gravel) road$/i.test(d))
  const facilities = (land.facilities ?? []).map((f) => f.replace(/concreate/gi, 'Concrete'))
  const c = coords[site.slug]
  const point = c?.loc ?? c?.pano ?? null

  const data: Record<string, unknown> = {
    landSizePerches: min,
    landSizePerchesMax: max > min ? max : null,
    electricity: details.some((d) => /three[\s-]*phase/i.test(d)) ? '3-Phase Available' : 'Available',
    facilities,
    ...(road ? { roadAccess: road.replace(/\b\w/g, (m) => m.toUpperCase()) } : {}),
    ...(point ? { coordinates: { lat: point[0], lng: point[1], streetViewAvailable: Boolean(c?.pano) } } : {}),
  }
  await payload.update({ collection: 'lands', id: land.id, data: data as never, overrideAccess: true })
  updated++
  console.log('updated', land.slug, `size ${min}${max > min ? '–' + max : ''}`, road ?? '-', point ? 'coords' : 'NO COORDS')
}
console.log('DONE', updated, 'of', lands.docs.length)
process.exit(0)
