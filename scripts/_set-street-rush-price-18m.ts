/* eslint-disable @typescript-eslint/no-explicit-any -- one-off script */
// Owner (2026-11-16): Street Rush Residencies (project 20) starts from Rs. 18,000,000, not 40.2M.
// Only the two price fields are written. Safe to re-run.
//   NODE_ENV=production npx tsx scripts/_set-street-rush-price-18m.ts
import path from 'node:path'
import { config as loadEnv } from 'dotenv'
loadEnv({ path: path.join(process.cwd(), '.env.local') })
const cfg = ((await import('../payload.config')) as any).default
const { getPayload } = await import('payload')
const payload = await getPayload({ config: cfg })
const before: any = (await payload.find({ collection: 'projects', where: { id: { equals: 20 } }, limit: 1, depth: 0, overrideAccess: true } as any)).docs[0]
console.log('before', before.name, before.startingPriceLkr, before.priceRange)
await payload.update({ collection: 'projects', id: 20, overrideAccess: true, data: { startingPriceLkr: 18000000, priceRange: 'Rs. 18,000,000 – 58,200,000' } } as any)
const after: any = (await payload.find({ collection: 'projects', where: { id: { equals: 20 } }, limit: 1, depth: 0, overrideAccess: true } as any)).docs[0]
console.log('after', after.startingPriceLkr, after.priceRange, 'units', after.units, 'gallery', after.gallery?.length, 'floorPlans', after.floorPlans?.length, 'amenities', after.amenities?.length)
process.exit(0)
