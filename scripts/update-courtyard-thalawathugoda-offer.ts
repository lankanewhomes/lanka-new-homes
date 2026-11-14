/* eslint-disable @typescript-eslint/no-explicit-any -- one-off update script */
// Courtyard by Prime - Samagi Mawatha Thalawathugoda (project 25, published): ADD-ONLY update with the developer's limited-time offer,
// from the developer's own flyer and caption (owner message 2026-11-13). Nothing is removed or overwritten: the standard payment plan
// (25% down, 1% x 30 monthly, 5% in months 12 and 24, 35% at handover) stays; the offer is added beside it.
//   NODE_ENV=production npx tsx scripts/update-courtyard-thalawathugoda-offer.ts
import path from 'node:path'
import { config as loadEnv } from 'dotenv'
loadEnv({ path: path.join(process.cwd(), '.env.local') })
const cfg = ((await import('../payload.config')) as any).default
const { getPayload } = await import('payload')
const payload: any = await getPayload({ config: cfg })

const ID = 25
const SLUG = 'courtyard-by-prime-samagi-mawatha-thalawathugoda'
const p: any = await payload.findByID({ collection: 'projects', id: ID, depth: 0, overrideAccess: true })
if (p.slug !== SLUG) throw new Error('unexpected project')
if (p.hotDeal?.enabled) { console.log('already updated'); process.exit(0) }

const OFFER_LINES = [
  'Special offer (valid until 31 December 2026, first 15 units only, T&C apply):',
  'Down payment: LKR 15 million',
  'Monthly instalments: LKR 850,000',
  'Remaining balance payable at handover',
]
const upd: Record<string, any> = {
  hotDeal: {
    enabled: true,
    badge: 'Special Offer',
    title: 'Own your space, enjoy more flexibility',
    description: 'LKR 15M down payment, LKR 850K monthly instalments, balance at handover. First 15 units only. Valid until 31 December 2026. T&C apply.',
  },
  incentives: [
    ...(p.incentives ?? []),
    'Special payment plan: LKR 15 million down payment, LKR 850,000 monthly instalments, remaining balance payable at handover',
    'Limited to the first 15 units only',
  ],
  priceValidUntil: '31 December 2026',
  paymentPlanItems: [...(p.paymentPlanItems ?? []), ...OFFER_LINES],
  pricingNotes: [...(p.pricingNotes ?? []), 'Prices from LKR 85 million upwards.'],
  paymentPlanBadge: p.paymentPlanBadge || 'Flexible Payment Plan',
  availabilityBadge: p.availabilityBadge || 'Limited Units',
  marketingBadges: [...new Set([...(p.marketingBadges ?? []), 'Special Offer'])],
  locationBadges: [...new Set([...(p.locationBadges ?? []), 'Gated Community'])],
}
// 24-hour security and the private gym area are on the flyer: add the wording to the matching amenities (only where empty).
const wording: Record<string, string> = { Security: '24-hour security', Gym: 'Private gym area' }
upd.amenities = (p.amenities ?? []).map((a: any) => (wording[a.name] && !a.description ? { ...a, description: wording[a.name] } : a))

await payload.update({ collection: 'projects', id: ID, data: upd, overrideAccess: true })
const after: any = await payload.findByID({ collection: 'projects', id: ID, depth: 0, overrideAccess: true })
console.log('updated | published', after.isPublished, '| hotDeal', after.hotDeal?.enabled, '| badges', after.paymentPlanBadge, '/', after.availabilityBadge, '/', after.marketingBadges, '/', after.locationBadges, '| validUntil', after.priceValidUntil, '| price', after.startingPriceLkr)

await payload.create({
  collection: 'listing-todos',
  data: {
    title: 'Courtyard offer ends 31 December 2026: remove it',
    listingType: 'project',
    project: ID,
    notes: 'Remove the Hot Deal banner, the two offer incentives, the offer lines in the payment plan and the Special Offer / Limited Units / Flexible Payment Plan badges after 31 December 2026, unless the developer extends it. Source: the developer flyer and caption the owner shared on 2026-11-13.',
    sourceLinks: `https://www.lankanewhomes.com/projects/${SLUG}`,
  },
  overrideAccess: true,
})
process.exit(0)
