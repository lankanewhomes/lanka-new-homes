// The Vauxhall DSTRCT site gives the penthouse floor only as a master layout
// (units P1–P10 with sizes, no bedroom/bathroom counts), so it can't be a
// floor-plan entry without inventing counts. It is attached as a layout plan instead.
//   JKP_DIR=<scratchpad/jkp> NODE_ENV=production npx tsx scripts/add-vauxhall-penthouse-layout.ts
import fs from 'node:fs'
import path from 'node:path'
import { config as loadEnv } from 'dotenv'
import type payloadConfigType from '../payload.config'

loadEnv({ path: path.join(process.cwd(), '.env.local') })
const dir = process.env.JKP_DIR ?? ''
const payloadConfig = ((await import('../payload.config')) as { default: typeof payloadConfigType }).default
const { getPayload } = await import('payload')
const { mirrorToR2 } = await import('../src/lib/listing-import/mirror')
const payload = await getPayload({ config: payloadConfig })

const url = await mirrorToR2(
  'projects/vauxhall-dstrct/block-plan/vauxhall-dstrct_penthouse-floor-layout.jpg',
  fs.readFileSync(path.join(dir, 'vauxhall-dstrct', 'assets', 'fp_penthouse-main-layout.jpg')),
  'image/jpeg',
)
const r = await payload.find({ collection: 'projects', where: { slug: { equals: 'vauxhall-dstrct' } }, limit: 1, depth: 0, overrideAccess: true })
const d = r.docs[0] as unknown as { id: number; blockPlanImages?: { label?: string; image: string }[] }
const have = d.blockPlanImages ?? []
await payload.update({
  collection: 'projects',
  id: d.id,
  data: { blockPlanImages: [...have.map((b) => ({ label: b.label, image: b.image })), { label: 'Penthouse floor layout (units P1–P10, 500–1,531 sq ft)', image: url }] } as never,
  overrideAccess: true,
})
console.log('LAYOUT ADDED', url)
process.exit(0)
