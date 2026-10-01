// Adds the 10 Vauxhall DSTRCT penthouse units (P1–P10) as floor plans, with the sizes and views given by the
// owner (2026-10-01). Bedroom and bathroom counts are NOT published/known, so they are stored as 0 = "not
// provided" (the site hides zero beds/baths); nothing is guessed. Each unit points at the penthouse floor layout.
//   NODE_ENV=production npx tsx scripts/add-vauxhall-penthouse-units.ts
import path from 'node:path'
import { config as loadEnv } from 'dotenv'
import type payloadConfigType from '../payload.config'

loadEnv({ path: path.join(process.cwd(), '.env.local') })
const payloadConfig = ((await import('../payload.config')) as { default: typeof payloadConfigType }).default
const { getPayload } = await import('payload')
const payload = await getPayload({ config: payloadConfig })

const LAYOUT = 'https://media.lankanewhomes.com/projects/vauxhall-dstrct/block-plan/vauxhall-dstrct_penthouse-floor-layout.jpg'
const UNITS: [string, number, string][] = [
  ['P1', 1501, 'Vauxhall Street View'],
  ['P2', 1047, 'City View'],
  ['P3', 1047, 'City View'],
  ['P4', 1501, 'Colombo Business District View'],
  ['P5', 500, 'Colombo Business District View'],
  ['P6', 1531, 'Beira Lake | Lotus Tower View'],
  ['P7', 1092, 'Beira Lake | Lotus Tower View'],
  ['P8', 1092, 'Beira Lake | Lotus Tower View'],
  ['P9', 1531, 'Beira Lake | Lotus Tower View'],
  ['P10', 500, 'Vauxhall Street View'],
]

const r = await payload.find({ collection: 'projects', where: { slug: { equals: 'vauxhall-dstrct' } }, limit: 1, depth: 0, overrideAccess: true })
const doc = r.docs[0] as unknown as { id: number; floorPlans?: Record<string, unknown>[] }
const have = doc.floorPlans ?? []
if (have.some((f) => String(f.planName ?? '').startsWith('Penthouse'))) { console.log('penthouse units already present'); process.exit(0) }

const add = UNITS.map(([unit, sqft, view]) => ({
  planName: `Penthouse - Unit ${unit}`,
  bedrooms: 0,
  bathrooms: 0,
  floorAreaSqFt: sqft,
  startingPriceLkr: 0,
  view_other: view,
  availability: 'Available',
  parkingType_other: 'Allocated by unit type',
  image: LAYOUT,
  planDocuments: [{ label: 'Penthouse floor - all units (main layout)', url: LAYOUT }],
}))
const strip = (f: Record<string, unknown>) => {
  const { id: _id, slug: _slug, ...rest } = f
  void _id; void _slug
  return rest
}
await payload.update({ collection: 'projects', id: doc.id, data: { floorPlans: [...have.map(strip), ...add] } as never, overrideAccess: true })
console.log('added', add.length, 'penthouse units; total plans', have.length + add.length)
process.exit(0)
