// Applies researched parking facts (out*.json from the research pass) to projects that had none.
// Only entries the research marked confidence "stated" are written, and an existing value is never overwritten.
//   PARKING_DIR=<dir with out*.json> NODE_ENV=production npx tsx scripts/apply-parking.ts
import fs from 'node:fs'
import path from 'node:path'
import { config as loadEnv } from 'dotenv'
import type payloadConfigType from '../payload.config'

loadEnv({ path: path.join(process.cwd(), '.env.local') })
const dir = process.env.PARKING_DIR ?? ''
if (!dir) throw new Error('Set PARKING_DIR')
const payloadConfig = ((await import('../payload.config')) as { default: typeof payloadConfigType }).default
const { getPayload } = await import('payload')
const { PARKING_TYPE_OPTIONS } = await import('../src/collections/shared-fields')
const payload = await getPayload({ config: payloadConfig })

type Found = { parking?: string | null; parkingCount?: number | null; parkingType?: string | null; source?: string; confidence?: string }
const all: Record<string, Found> = {}
for (const f of fs.readdirSync(dir).filter((x) => /^out\d+\.json$/.test(x))) Object.assign(all, JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')))

let applied = 0
for (const [slug, f] of Object.entries(all)) {
  if (f.confidence !== 'stated') { console.log('skip', slug, f.confidence ?? 'no confidence'); continue }
  const r = await payload.find({ collection: 'projects', where: { slug: { equals: slug } }, limit: 1, depth: 0, overrideAccess: true })
  const d = r.docs[0] as unknown as { id: number; parking?: string | null; parkingCount?: number | null; parkingType?: string | null; parkingType_other?: string | null }
  if (!d) { console.log('MISSING', slug); continue }
  const data: Record<string, unknown> = {}
  if (f.parking && !d.parking) data.parking = f.parking
  if (typeof f.parkingCount === 'number' && f.parkingCount > 0 && d.parkingCount == null) data.parkingCount = f.parkingCount
  if (f.parkingType && !d.parkingType && !d.parkingType_other && (PARKING_TYPE_OPTIONS as string[]).includes(f.parkingType)) data.parkingType = f.parkingType
  if (!Object.keys(data).length) { console.log('nothing new', slug); continue }
  await payload.update({ collection: 'projects', id: d.id, data: data as never, overrideAccess: true })
  applied++
  console.log('applied', slug, JSON.stringify(data).slice(0, 160))
}
console.log('DONE', applied)
process.exit(0)
