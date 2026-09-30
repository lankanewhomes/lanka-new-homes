// One-time fix: 3 Rush Lanka Group projects had a `city` value that was
// either too generic or missing, even though each already links to a real,
// specific neighborhood page — owner, 2026-09-30 (rush-court-5-colombo-14:
// "this should be Rush Court 5 By Rush Lanka Group | Colombo 14" — was
// just "Colombo") + "can you also check other rush lankan group listings
// also". Both "Colombo 14" and "Dematagoda" already exist in
// CITY_OPTIONS (src/data/cities.json), so this is a value fix, not a new
// option.
//
// Run with: npx tsx scripts/fix-rush-city-values.ts
import path from 'node:path'
import { config as loadEnv } from 'dotenv'
import type payloadConfigType from '../payload.config'

loadEnv({ path: path.join(process.cwd(), '.env.local') })

const payloadConfig = ((await import('../payload.config')) as { default: typeof payloadConfigType }).default
const { getPayload } = await import('payload')
const payload = await getPayload({ config: payloadConfig })

const FIXES: { slug: string; city: string }[] = [
  { slug: 'rush-court-5-colombo-14', city: 'Colombo 14' },
  { slug: 'rush-city-dematagoda', city: 'Dematagoda' },
  { slug: 'rush-court-6-mount-lavinia', city: 'Mount Lavinia' },
]

for (const fix of FIXES) {
  const { docs } = await payload.find({ collection: 'projects', where: { slug: { equals: fix.slug } }, limit: 1, overrideAccess: true })
  const project = docs[0]
  if (!project) {
    console.log(`Not found: ${fix.slug}`)
    continue
  }
  const before = project.city ?? '(empty)'
  // `city` is a select field with a huge generated union type (every
  // Sri Lankan city/ward) — `as never` here matches the same pattern
  // response-badge.ts already uses for an equally-strict Payload type.
  await payload.update({ collection: 'projects', id: project.id, data: { city: fix.city } as never, overrideAccess: true })
  console.log(`${fix.slug}: city "${before}" -> "${fix.city}"`)
}

console.log('\nDone.')
process.exit(0)
