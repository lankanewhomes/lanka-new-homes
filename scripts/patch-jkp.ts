// Re-applies fields the first JKP import run dropped on CMS validation (city option,
// floor plans missing a required startingPriceLkr/bedrooms). Assets were already
// uploaded, so placeholders resolve straight to their public media URLs.
//
//   JKP_DIR=<scratchpad/jkp> NODE_ENV=production npx tsx scripts/patch-jkp.ts <slug>
import fs from 'node:fs'
import path from 'node:path'
import { config as loadEnv } from 'dotenv'
import type payloadConfigType from '../payload.config'

loadEnv({ path: path.join(process.cwd(), '.env.local') })
const dir = process.env.JKP_DIR ?? ''
const slug = process.argv[2]
if (!dir || !slug) throw new Error('Set JKP_DIR and pass a slug')
const base = (process.env.R2_PUBLIC_URL ?? '').replace(/\/+$/, '')

const payloadConfig = ((await import('../payload.config')) as { default: typeof payloadConfigType }).default
const { getPayload } = await import('payload')
const payload = await getPayload({ config: payloadConfig })

const rec = JSON.parse(fs.readFileSync(path.join(dir, 'out', `${slug}.json`), 'utf8')) as Record<string, any>
const swap = (v: unknown): unknown => {
  if (typeof v === 'string' && v.startsWith('R2:')) return `${base}/${v.slice(3)}`
  if (Array.isArray(v)) return v.map(swap)
  if (v && typeof v === 'object') return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, swap(x)]))
  return v
}
// Drop plans that lack a required bedroom/bathroom count (nothing is invented); default the optional price to 0.
const plans = ((swap(rec.floorPlans ?? []) as Record<string, any>[]) ?? [])
  .filter((p) => {
    const ok = p.bedrooms != null && p.bathrooms != null
    if (!ok) console.log('  skipping plan without bedrooms/bathrooms:', p.planName)
    return ok
  })
  .map((p) => {
    const { _note, ...rest } = p
    void _note
    return { ...rest, startingPriceLkr: p.startingPriceLkr ?? 0 }
  })

const r = await payload.find({ collection: 'projects', where: { slug: { equals: slug } }, limit: 1, depth: 0, overrideAccess: true })
const doc = r.docs[0] as unknown as { id: number }
if (!doc) throw new Error('project not found ' + slug)
await payload.update({ collection: 'projects', id: doc.id, data: { city: 'Colombo', floorPlans: plans } as never, overrideAccess: true })
console.log('patched', slug, `${plans.length} floor plans, city Colombo`)
process.exit(0)
