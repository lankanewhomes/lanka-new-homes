// Adds the JKP amenities that were missing from the vocabulary at import time
// (all stated on the developer's page/brochure), now that the options exist.
//   NODE_ENV=production npx tsx scripts/add-jkp-amenities.ts
import path from 'node:path'
import { config as loadEnv } from 'dotenv'
import type payloadConfigType from '../payload.config'

loadEnv({ path: path.join(process.cwd(), '.env.local') })
const payloadConfig = ((await import('../payload.config')) as { default: typeof payloadConfigType }).default
const { getPayload } = await import('payload')
const payload = await getPayload({ config: payloadConfig })

const ADD: Record<string, string[]> = {
  'cinnamon-life-apartments': ['Sauna', 'Steam Room', 'Jacuzzi', 'Meeting Room'],
  'vauxhall-dstrct': ['Pavilion', 'Leisure Deck', 'Pebble Walk', 'Karaoke Room', 'Mini Cinema', 'Pickleball Court', 'Function Room', 'Viewing Lookout', 'Walking Track'],
  'tri-zen-apartments': ['Mini Cinema', 'Laundry Service', 'Cafe'],
  'viman-ja-ela-apartments': ['Outdoor Multipurpose Court', 'Ambalama Gathering Space'],
}
for (const [slug, names] of Object.entries(ADD)) {
  const r = await payload.find({ collection: 'projects', where: { slug: { equals: slug } }, limit: 1, depth: 0, overrideAccess: true })
  const d = r.docs[0] as unknown as { id: number; amenities?: { name: string }[] }
  if (!d) { console.log('MISSING', slug); continue }
  const have = new Set((d.amenities ?? []).map((a) => a.name))
  const next = [...(d.amenities ?? []).map((a) => ({ name: a.name })), ...names.filter((n) => !have.has(n)).map((name) => ({ name }))]
  await payload.update({ collection: 'projects', id: d.id, data: { amenities: next } as never, overrideAccess: true })
  console.log('updated', slug, `${(d.amenities ?? []).length} -> ${next.length} amenities`)
}
process.exit(0)
