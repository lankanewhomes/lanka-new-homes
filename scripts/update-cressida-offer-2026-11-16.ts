/* eslint-disable @typescript-eslint/no-explicit-any -- one-off update script */
// Cressida Resort Apartments (project 140, published): ADD-ONLY update from the developer's own advert (owner message 2026-11-16):
// "Ready to move in", from LKR 38M upwards, no down payment (pay monthly), buy an apartment to win a Mercedes-Benz C-Class.
// Not added on purpose: the "up to 100% capital appreciation within 4 years" claim (an unverified investment promise) and the advert's phone number (differs from the listing's).
//   NODE_ENV=production npx tsx scripts/update-cressida-offer-2026-11-16.ts
import path from 'node:path'
import { config as loadEnv } from 'dotenv'
loadEnv({ path: path.join(process.cwd(), '.env.local') })
const cfg = ((await import('../payload.config')) as any).default
const { getPayload } = await import('payload')
const payload: any = await getPayload({ config: cfg })
const ID = 140
const p: any = await payload.findByID({ collection: 'projects', id: ID, depth: 0, overrideAccess: true })
if (p.slug !== 'cressida-resort-apartments') throw new Error('unexpected project')
if (p.hotDeal?.enabled) { console.log('already updated'); process.exit(0) }
const upd: Record<string, any> = {
  isMoveInNow: true,
  statusNote: 'Ready to move in',
  downPayment: 'No down payment, just pay monthly',
  paymentPlanItems: [...(p.paymentPlanItems ?? []), 'No down payment: just pay monthly (developer advert, November 2026)'],
  pricingNotes: [...(p.pricingNotes ?? []), 'Apartments from LKR 38 million upwards (developer advert, November 2026).'],
  hotDeal: {
    enabled: true,
    badge: 'Special Offer',
    title: 'Buy an apartment and win a Mercedes-Benz C-Class',
    description: 'Buy an apartment to win a brand new Mercedes-Benz C-Class. No down payment, just pay monthly. Terms and closing date are not stated in the developer advert.',
  },
  incentives: [...(p.incentives ?? []), 'Buy an apartment to win a brand new Mercedes-Benz C-Class', 'No down payment, just pay monthly'],
  paymentPlanBadge: p.paymentPlanBadge || '0% Down Payment',
  marketingBadges: [...new Set([...(p.marketingBadges ?? []), 'Special Offer'])],
}
await payload.update({ collection: 'projects', id: ID, data: upd, overrideAccess: true })
const a: any = await payload.findByID({ collection: 'projects', id: ID, depth: 0, overrideAccess: true })
console.log('updated | published', a.isPublished, '| moveInNow', a.isMoveInNow, '| hotDeal', a.hotDeal?.enabled, '| badge', a.paymentPlanBadge, a.marketingBadges, '| price', a.startingPriceLkr)
await payload.create({
  collection: 'listing-todos',
  data: {
    title: 'Cressida: check the Mercedes-Benz offer terms and end date',
    listingType: 'project',
    project: ID,
    notes: 'The developer advert (November 2026) offers a Mercedes-Benz C-Class win with an apartment purchase and no down payment, but gives no terms or end date. Confirm with the developer, add the end date (priceValidUntil), and remove the Hot Deal banner, the two incentives and the Special Offer badge when it ends. Also decide whether to add the advert phone 0706 049 049 (the listing shows a different number) and whether the "up to 100% capital appreciation within 4 years" claim may be published (left out).',
    sourceLinks: 'https://www.lankanewhomes.com/projects/cressida-resort-apartments',
  },
  overrideAccess: true,
})
process.exit(0)
