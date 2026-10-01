// Fills each Gangani land's "nearby" places (the Neighborhood section's School /
// Hospital / Transport / Landmark groups) from the distances, routes and places
// its Gangani page states in its Details list and Bus Route row — parsed into
// gangani_nearby.json. Also Kings Court from its homepage card.
//
//   GANGANI_JSON=<gangani.json> GANGANI_NEARBY=<gangani_nearby.json> NODE_ENV=production npx tsx scripts/set-gangani-nearby.ts
import fs from 'node:fs'
import path from 'node:path'
import { config as loadEnv } from 'dotenv'
import type payloadConfigType from '../payload.config'

loadEnv({ path: path.join(process.cwd(), '.env.local') })
const jsonPath = process.env.GANGANI_JSON ?? ''
const nearbyPath = process.env.GANGANI_NEARBY ?? ''
if (!jsonPath || !nearbyPath) throw new Error('Set GANGANI_JSON and GANGANI_NEARBY')

type Place = { category: string; name: string; distanceKm: number | null }
const payloadConfig = ((await import('../payload.config')) as { default: typeof payloadConfigType }).default
const { getPayload } = await import('payload')
const payload = await getPayload({ config: payloadConfig })

const titleCase = (t: string) => t.split(' ').map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w)).join(' ')
const tidy = (t: string) => t.replace(/\s+,/g, ',').replace(/\s+/g, ' ').replace(/[.\s]+$/, '').trim()
const sites = JSON.parse(fs.readFileSync(jsonPath, 'utf8')) as { slug: string; name: string }[]
const nearby = JSON.parse(fs.readFileSync(nearbyPath, 'utf8')) as Record<string, Place[]>
const bySite = new Map(sites.map((s) => [titleCase(tidy(s.name)), s.slug]))

// Kings Court has no detail page — only its homepage card's facts.
const KINGS_COURT: Place[] = [
  { category: 'Transport', name: '280/129 bus route at Beruketiya', distanceKm: 1 },
  { category: 'Landmark', name: 'Moragahahena', distanceKm: 2.5 },
  { category: 'Landmark', name: 'Meepe (15-minute drive)', distanceKm: null },
  { category: 'Landmark', name: 'Padukka (15 minutes)', distanceKm: null },
]

const lands = await payload.find({ collection: 'lands', where: { sellerName: { equals: 'Gangani Land Sales' } }, limit: 200, depth: 0, overrideAccess: true })
let n = 0
for (const land of lands.docs as unknown as { id: number; slug: string; title: string }[]) {
  const places = land.slug === 'kings-court-homagama' ? KINGS_COURT : nearby[bySite.get(land.title) ?? '']
  if (!places?.length) { console.log('NO PLACES', land.slug); continue }
  await payload.update({ collection: 'lands', id: land.id, data: { nearby: places.map((p) => ({ category: p.category, name: p.name, distanceKm: p.distanceKm ?? undefined })) } as never, overrideAccess: true })
  n++
}
console.log('DONE', n, 'of', lands.docs.length)
process.exit(0)
