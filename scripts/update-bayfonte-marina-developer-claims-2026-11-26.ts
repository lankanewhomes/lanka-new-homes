/* eslint-disable @typescript-eslint/no-explicit-any -- one-off script */
// Owner, 2026-11-26, on the Bayfonte Marina capital appreciation and rental income lines: "if the website says do it"
// (shown as "the developer says"). Read on the developer's page the same day:
//   "$125 Dollars / Minimum Daily Rental Income", "ROI / Highest ROI guaranteed", "100% Capital Appreciation in Just 3 Years!".
// The developer's November 2026 advert says "up to 100% capital appreciation within just 4 years".
// Project 149 (published). Add-only and idempotent: nothing existing is changed or removed.
//   NODE_ENV=production npx tsx scripts/update-bayfonte-marina-developer-claims-2026-11-26.ts [--apply]
import path from 'node:path'
import { config as loadEnv } from 'dotenv'
loadEnv({ path: path.join(process.cwd(), '.env.local') })
const apply = process.argv.includes('--apply')
const cfg = ((await import('../payload.config')) as any).default
const { getPayload } = await import('payload')
const payload = await getPayload({ config: cfg })
const ID = 149
const RENTAL = "The developer says: minimum daily rental income of USD 125. This is the developer's own figure from its website; it is not guaranteed and no occupancy or running-cost figures are published."
const NOTE = 'The developer says: 100% capital appreciation in just 3 years and "highest ROI guaranteed" (its website); its November 2026 advert says up to 100% within 4 years. These are the developer\'s own claims and are not verified; property values can fall as well as rise.'

const p: any = await payload.findByID({ collection: 'projects', id: ID, depth: 0, overrideAccess: true })
if (p.slug !== 'bayfonte-marina') throw new Error('unexpected project')
const data: Record<string, any> = {}
const log: string[] = []
if (!p.rentalIncome) { data.rentalIncome = RENTAL; log.push('rental income') }
if (!(p.pricingNotes ?? []).some((n: string) => n.includes('capital appreciation'))) { data.pricingNotes = [...(p.pricingNotes ?? []), NOTE]; log.push('pricing note') }
console.log(p.id, p.name, '->', log.join(' | ') || 'nothing to add', '| pricing notes now', (p.pricingNotes ?? []).length)
const hrp: any = await payload.find({ collection: 'projects', where: { marketingBadges: { in: ['High Rental Potential', 'Investor Friendly'] } }, limit: 200, depth: 0, overrideAccess: true })
console.log('listings holding the hidden investor badges:', hrp.docs.map((d: any) => `${d.name} [${(d.marketingBadges ?? []).filter((b: string) => /Rental|Investor/.test(b)).join(', ')}]`).join('; ') || 'none')
if (apply && Object.keys(data).length) {
  await payload.update({ collection: 'projects', id: ID, data: data as never, overrideAccess: true })
  const a: any = await payload.findByID({ collection: 'projects', id: ID, depth: 0, overrideAccess: true })
  console.log('   saved: rental income', a.rentalIncome ? 'set' : 'empty', '| pricing notes', a.pricingNotes?.length, '| gallery', a.gallery?.length, '| videos', a.videos?.length, '| amenities', a.amenities?.length, '| price', a.startingPriceLkr, '| phone', a.contactPhone === p.contactPhone ? 'unchanged' : 'CHANGED')
}
console.log(apply ? 'APPLIED' : 'DRY RUN')
process.exit(0)
