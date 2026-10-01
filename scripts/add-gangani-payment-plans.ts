// Appends Gangani Land Sales' published payment packages
// (https://www.ganganilandsales.com/payment-plan/, English text) to every
// Gangani land's paymentPlanItems, which render in the land page's Pricing
// section. Idempotent: skips lands that already have "Package …" lines.
//
//   NODE_ENV=production npx tsx scripts/add-gangani-payment-plans.ts
import path from 'node:path'
import { config as loadEnv } from 'dotenv'
import type payloadConfigType from '../payload.config'

loadEnv({ path: path.join(process.cwd(), '.env.local') })
const payloadConfig = ((await import('../payload.config')) as { default: typeof payloadConfigType }).default
const { getPayload } = await import('payload')
const payload = await getPayload({ config: payloadConfig })

const PACKAGES = [
  'Package A — 6 or 12 months interest-free: reserve your land with Rs. 25,000, pay 30% of the total land value within one month, and pay the remaining balance in equal monthly instalments over 6 or 12 months (conditions apply; this scheme applies to selected lands only).',
  'Package B — 5-year payment plan with late payment charges: reserve your land with Rs. 25,000, pay 30% of the total land value within one month, and pay the remaining balance over 5 years at a fixed 16% a year, with late payment charges (conditions apply).',
  'Package C — pay in full and save: reserve your land with Rs. 25,000. Pay the full amount within one week of reservation for a 5% discount, or within one month for a 3% discount.',
  'Package A1 — pay off with a bank loan: while paying instalments under Package A, you can apply for a bank loan to settle the remaining balance. Gangani Land Sales staff assist through every step of the process.',
  'Package B1 — pay off with a bank loan: while paying instalments under Package B, you can apply for a bank loan to settle the remaining balance. A three-month grace period applies, with no late payments during the approval process.',
]

const lands = await payload.find({ collection: 'lands', where: { sellerName: { equals: 'Gangani Land Sales' } }, limit: 200, depth: 0, overrideAccess: true })
let n = 0
for (const land of lands.docs as unknown as { id: number; slug: string; paymentPlanItems?: (string | { value?: string })[] | null }[]) {
  const existing = (land.paymentPlanItems ?? []).map((i) => (typeof i === 'string' ? i : i.value ?? ''))
  if (existing.some((i) => i.startsWith('Package '))) { console.log('has packages', land.slug); continue }
  await payload.update({ collection: 'lands', id: land.id, data: { paymentPlanItems: [...existing, ...PACKAGES] } as never, overrideAccess: true })
  n++
}
console.log('DONE', n, 'of', lands.docs.length)
process.exit(0)
