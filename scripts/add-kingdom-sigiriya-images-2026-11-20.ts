/* eslint-disable @typescript-eslint/no-explicit-any -- one-off script */
// Owner request 2026-11-20: add new images to The Kingdom Residencies, Sigiriya (project 73). Add-only, idempotent.
// 4 developer renders not yet in our gallery, taken from the PropertyGuide listing copy (aerial, banquet hall, cafe, dining area).
//   KG_DIR=<folder with the 4 jpgs> NODE_ENV=production npx tsx scripts/add-kingdom-sigiriya-images-2026-11-20.ts
import fs from 'node:fs'
import path from 'node:path'
import { config as loadEnv } from 'dotenv'
loadEnv({ path: path.join(process.cwd(), '.env.local') })
const dir = process.env.KG_DIR ?? '/tmp/kg2'
const cfg = ((await import('../payload.config')) as any).default
const { getPayload } = await import('payload')
const { mirrorToR2 } = await import('../src/lib/listing-import/mirror')
const payload = await getPayload({ config: cfg })
const p: any = await payload.findByID({ collection: 'projects', id: 73, depth: 0, overrideAccess: true })
const N: [string, string, string][] = [
  ['The_Kingdom_Sigiriya_1ea9343c87', 'aerial-view', 'Aerial view of the building and car park'],
  ['The_Kingdom_Sigiriya_Dining_Area_cba872efab', 'dining-area-rock-view', 'Dining area with Sigiriya Rock view'],
  ['The_Kingdom_Sigiriya_Cafe_3bc8e6b414', 'cafe', 'Cafe'],
  ['The_Kingdom_Sigiriya_Banquet_Hall_8b05fb194f', 'banquet-hall', 'Banquet hall'],
]
const gallery = (p.gallery ?? []).map((g: any) => ({ label: g.label, image: g.image }))
const before = gallery.length
for (const [f, slug, label] of N) {
  const key = `projects/the-kingdom-sigiriya/gallery/the-kingdom-sigiriya_${slug}.jpg`
  if (gallery.some((g: any) => String(g.image).endsWith(`_${slug}.jpg`))) continue
  gallery.push({ label, image: await mirrorToR2(key, fs.readFileSync(path.join(dir, f + '.jpg')), 'image/jpeg') })
}
if (gallery.length === before) { console.log('nothing to add'); process.exit(0) }
await payload.update({ collection: 'projects', id: 73, data: { gallery } as never, overrideAccess: true })
const a: any = await payload.findByID({ collection: 'projects', id: 73, depth: 0, overrideAccess: true })
console.log('gallery', before, '->', a.gallery.length, 'plans', a.floorPlans?.length, 'amenities', a.amenities?.length)
process.exit(0)
