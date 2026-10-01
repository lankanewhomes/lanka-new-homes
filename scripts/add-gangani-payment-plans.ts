// Sets Gangani Land Sales' payment lines (per-land rows + the published packages
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

// One heading per package ("Package X — title"), then one row per statement —
// the land page's Pricing section renders each as its own row (owner,
// 2026-10-01: "each of the content on each row").
const PACKAGES = [
  'Package A — 6 or 12 months interest-free',
  'Reservation: secure your chosen land with an initial payment of Rs. 25,000.',
  'Down payment: within one month, pay a down payment equal to 30% of the total land value.',
  'Instalments: the remaining balance can be paid in equal monthly instalments over 6 or 12 months.',
  'Conditions apply. This scheme applies to selected lands only.',
  'Package B — 5-year payment plan with late payment charges',
  'Reservation: secure your chosen land with an advance payment of Rs. 25,000.',
  'Down payment: within one month, pay 30% of the total land value.',
  'Instalments: the remaining balance is payable over 5 years at a fixed 16% a year, with late payment charges.',
  'Conditions apply.',
  'Package C — pay in full and enjoy special discounts',
  'Reservation: secure your chosen land with an initial payment of Rs. 25,000.',
  '5% discount: if you pay the full amount within one week of the reservation.',
  '3% discount: if you pay the full amount within one month of the reservation.',
  'Package A1 — paying off with a bank loan',
  'While paying instalments under Package A, you can apply for a bank loan to settle the remaining balance.',
  'Once you submit the application, the process begins immediately, and you can access the loan while making your initial payments.',
  'Most bank loans are handled by NSB Bank, so approval is quicker than at other banks.',
  'Gangani Land Sales staff assist you through every step of the process.',
  'Package B1 — paying off with a bank loan',
  'While making instalments under Package B, you can apply for a bank loan to settle the remaining balance.',
  'Once you submit the application, the process begins, and you can access the loan while completing your initial payments.',
  'Most bank loans are handled by NSB Bank, so approval is quicker than at other banks.',
  'Grace period: a three-month grace period is offered, with no late payments during the approval process.',
  'A dedicated staff member assists you throughout the process.',
]

// Each land's own base lines, one statement per row.
const splitBase = (items: string[]): string[] =>
  items.flatMap((item) => {
    if (/^The remaining amount/i.test(item) && /instalments/i.test(item)) {
      return [
        'The remaining amount can be paid at once and you can avail discounts.',
        'The remaining amount can be paid in instalments or through a bank loan.',
      ]
    }
    return [item.replace(/\s+/g, ' ').trim()]
  })

const lands = await payload.find({ collection: 'lands', where: { sellerName: { equals: 'Gangani Land Sales' } }, limit: 200, depth: 0, overrideAccess: true })
let n = 0
for (const land of lands.docs as unknown as { id: number; slug: string; paymentPlanItems?: (string | { value?: string })[] | null }[]) {
  const existing = (land.paymentPlanItems ?? []).map((i) => (typeof i === 'string' ? i : i.value ?? ''))
  // Base = everything before the first old/new package heading (idempotent re-run).
  const firstPkg = existing.findIndex((i) => /^Package\s/.test(i))
  const base = splitBase(firstPkg < 0 ? existing : existing.slice(0, firstPkg))
  await payload.update({ collection: 'lands', id: land.id, data: { paymentPlanItems: [...base, ...PACKAGES] } as never, overrideAccess: true })
  n++
}
console.log('DONE', n, 'of', lands.docs.length)
process.exit(0)
