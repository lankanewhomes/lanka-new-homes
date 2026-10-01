// Key Features that only repeat an amenity already listed under Amenities are removed
// (owner, 2026-10-01: "if you have these in amenities, remove from key features").
// Items whose amenity doesn't exist in our list are kept so nothing is lost.
//   NODE_ENV=production npx tsx scripts/dedupe-jkp-key-features.ts
import path from 'node:path'
import { config as loadEnv } from 'dotenv'
import type payloadConfigType from '../payload.config'

loadEnv({ path: path.join(process.cwd(), '.env.local') })
const payloadConfig = ((await import('../payload.config')) as { default: typeof payloadConfigType }).default
const { getPayload } = await import('payload')
const payload = await getPayload({ config: payloadConfig })

// slug -> key-feature values (value_other for "Amenities: …" items, field_other for named ones) to drop
const DROP: Record<string, string[]> = {
  'vauxhall-dstrct': ['11th Floor Landscaped Walking Track', 'Viewing Lookout Point', 'Pavilions', 'Leisure Deck', 'Pebble Walk', 'Function Room', 'Karaoke Room Hangout Area', 'Flexi Cinema', 'Pickle Ball Court'],
  'cinnamon-life-apartments': ['Swimming Pool', 'Rooftop Terrace', 'Barbeque Area', 'Wellness'],
  'viman-ja-ela-apartments': ['Meditation Court', 'Outdoor Court', 'Social Spaces', 'Walking Paths'],
}
type Item = { id?: string; field?: string | null; field_other?: string | null; value?: string | null; value_other?: string | null }
for (const [slug, drop] of Object.entries(DROP)) {
  const r = await payload.find({ collection: 'projects', where: { slug: { equals: slug } }, limit: 1, depth: 0, overrideAccess: true })
  const d = r.docs[0] as unknown as { id: number; unitFeatures?: { id?: string; key?: string | null; key_other?: string | null; label?: string | null; items?: Item[] }[] }
  if (!d) { console.log('MISSING', slug); continue }
  const dropSet = new Set(drop.map((x) => x.toLowerCase()))
  let removed = 0
  const groups = (d.unitFeatures ?? [])
    .map(({ id, ...g }) => {
      void id
      const items = (g.items ?? []).filter((it) => {
        const hit = dropSet.has((it.value_other ?? '').toLowerCase()) || dropSet.has((it.field_other ?? it.field ?? '').toLowerCase())
        if (hit) removed++
        return !hit
      }).map(({ id: _id, ...it }) => { void _id; return it })
      return { ...g, items }
    })
    .filter((g) => g.items.length > 0)
  await payload.update({ collection: 'projects', id: d.id, data: { unitFeatures: groups } as never, overrideAccess: true })
  console.log('updated', slug, `removed ${removed} items, ${groups.length} groups left`)
}
process.exit(0)
