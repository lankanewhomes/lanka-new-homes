/* eslint-disable @typescript-eslint/no-explicit-any -- one-off script */
// Owner 2026-11-15: no floor plan image in the hero/gallery of the Grand projects. Moves each master plan out of the gallery into Block Plan Images
// and drops the duplicate "Project image 2" (the same Coming Soon map as the first) on Edge and Capital.
//   NODE_ENV=production npx tsx scripts/fix-grand-gallery-master-plans.ts [--apply]
import path from 'node:path'
import { config as loadEnv } from 'dotenv'
loadEnv({ path: path.join(process.cwd(), '.env.local') })
const apply = process.argv.includes('--apply')
const cfg = ((await import('../payload.config')) as any).default
const { getPayload } = await import('payload')
const payload = await getPayload({ config: cfg })
const clean = (arr: any[]) => arr.map((g) => { const { id: _id, ...rest } = g; return rest })
for (const p of (await payload.find({ collection: 'projects', where: { developer: { equals: 75 } }, limit: 50, depth: 0, overrideAccess: true })).docs as any[]) {
  const gal: any[] = p.gallery ?? []
  const plans = gal.filter((g) => /master-plan/.test(g.image ?? ''))
  const keep = gal.filter((g) => !/master-plan/.test(g.image ?? '') && !/project-image-2/.test(g.image ?? ''))
  const block = [...clean(p.blockPlanImages ?? [])]
  for (const m of clean(plans)) if (!block.some((b) => b.image === m.image)) block.push(m)
  console.log(p.slug, 'gallery', gal.length, '->', keep.length, '| block plans', block.length)
  if (apply) await payload.update({ collection: 'projects', id: p.id, data: { gallery: clean(keep), blockPlanImages: block } as never, overrideAccess: true })
}
console.log(apply ? 'APPLIED' : 'DRY RUN')
process.exit(0)
