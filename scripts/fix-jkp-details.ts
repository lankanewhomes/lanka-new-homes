// Detail fixes on the John Keells Properties projects (owner, 2026-10-01):
//  - city shown as "Colombo 02" (not just "Colombo") for the Colombo 02 projects
//  - parking on every floor plan's detail facts, from each developer FAQ answer
//    (wording kept to what the developer states; no invented counts)
//   NODE_ENV=production npx tsx scripts/fix-jkp-details.ts
import path from 'node:path'
import { config as loadEnv } from 'dotenv'
import type payloadConfigType from '../payload.config'

loadEnv({ path: path.join(process.cwd(), '.env.local') })
const payloadConfig = ((await import('../payload.config')) as { default: typeof payloadConfigType }).default
const { getPayload } = await import('payload')
const payload = await getPayload({ config: payloadConfig })

type Fix = { colombo02?: boolean; parkingSpaces?: number; parkingType?: string; parkingOther?: string; parkingNote?: string }
const FIXES: Record<string, Fix> = {
  'vauxhall-dstrct': { colombo02: true, parkingOther: 'Allocated by unit type' },
  'cinnamon-life-apartments': { colombo02: true, parkingOther: 'Dedicated parking spaces', parkingNote: 'Dedicated parking spaces with monitored access, controlled entry points and organised vehicle movement' },
  'tri-zen-apartments': { colombo02: true, parkingOther: 'Allocated by unit type; common parking on the 10th floor (first come, first served)' },
  'viman-ja-ela-apartments': { parkingSpaces: 1, parkingType: 'Assigned' },
}
for (const [slug, f] of Object.entries(FIXES)) {
  const r = await payload.find({ collection: 'projects', where: { slug: { equals: slug } }, limit: 1, depth: 0, overrideAccess: true })
  const d = r.docs[0] as unknown as { id: number; floorPlans?: Record<string, unknown>[] }
  if (!d) { console.log('MISSING', slug); continue }
  const plans = (d.floorPlans ?? []).map(({ id, ...p }) => {
    void id
    return {
      ...p,
      ...(f.parkingSpaces != null ? { parkingSpaces: f.parkingSpaces } : {}),
      ...(f.parkingType ? { parkingType: f.parkingType, parkingType_other: null } : {}),
      ...(f.parkingOther ? { parkingType: null, parkingType_other: f.parkingOther } : {}),
    }
  })
  const data: Record<string, unknown> = { floorPlans: plans }
  if (f.colombo02) { data.city = null; data.city_other = 'Colombo 02' }
  if (f.parkingNote) data.parking = f.parkingNote
  try {
    await payload.update({ collection: 'projects', id: d.id, data: data as never, overrideAccess: true })
    console.log('fixed', slug, `${plans.length} plans`)
  } catch (e) {
    const errs = ((e as { data?: { errors?: { path?: string; message?: string }[] } }).data?.errors) ?? []
    console.log('ERROR', slug, errs.map((x) => `${x.path}: ${x.message}`).join(' | ').slice(0, 400) || String(e))
  }
}
process.exit(0)
