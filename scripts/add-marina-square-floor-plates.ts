/* eslint-disable @typescript-eslint/no-explicit-any */
// Marina Square: the six typical floor-plate pages of the developer's "Typical Floor Plans" PDF, added as Block Plan images (no sizes/baths/prices are published per unit).
import fs from 'node:fs'
import path from 'node:path'
import { config as loadEnv } from 'dotenv'
loadEnv({ path: path.join(process.cwd(), '.env.local') })
const cfg = ((await import('../payload.config')) as any).default
const { getPayload } = await import('payload')
const { mirrorToR2 } = await import('../src/lib/listing-import/mirror')
const payload = await getPayload({ config: cfg })
const SLUG = 'marina-square-colombo-15'
const p: any = (await payload.find({ collection: 'projects' as never, where: { slug: { equals: SLUG } }, limit: 1, overrideAccess: true, depth: 0 })).docs[0]
const pages: [string, string, string][] = [
  ['tp-1.jpg', 'tower-bc-levels-5-31', 'Typical floor, Towers B and C, levels 5-31 (excluding 10 and 21)'],
  ['tp-2.jpg', 'tower-bc-levels-10-21', 'Typical floor, Towers B and C, levels 10 and 21'],
  ['tp-3.jpg', 'tower-djp-levels-7-10', 'Typical floor, Towers D, J and P, levels 7-10'],
  ['tp-4.jpg', 'tower-djp-levels-11-34', 'Typical floor, Towers D, J and P, levels 11-34'],
  ['tp-5.jpg', 'tower-j-levels-29-31', 'Typical floor, Tower J, levels 29-31'],
  ['tp-6.jpg', 'tower-djp-levels-35-36', 'Typical floor, Towers D, J and P, levels 35-36 (penthouses)'],
]
const existing = (p.blockPlanImages ?? []).map((x: any) => ({ label: x.label, image: x.image }))
const added: any[] = []
for (const [f, slug, label] of pages) {
  const image = await mirrorToR2(`projects/${SLUG}/block-plan/${SLUG}_typical-floor-${slug}.jpg`, fs.readFileSync(path.join(process.env.MS_DIR!, 'pdf', f)), 'image/jpeg')
  if (!existing.some((x: any) => x.image === image)) added.push({ label, image })
}
const r: any = await payload.update({ collection: 'projects' as never, id: p.id, overrideAccess: true, data: { blockPlanImages: [...existing, ...added] } as never })
console.log('block plan images', existing.length, '->', r.blockPlanImages.length, 'plans', r.floorPlans?.length, 'gallery', r.gallery?.length)
process.exit(0)
