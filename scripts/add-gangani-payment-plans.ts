// Sets Gangani Land Sales' payment lines (per-land rows + the published packages
// (https://www.ganganilandsales.com/payment-plan/, English text) to every
// Gangani land's paymentPlanItems, which render in the land page's Pricing
// section. Idempotent: skips lands that already have "Package …" lines.
//
//   GANGANI_JSON=<gangani.json> NODE_ENV=production npx tsx scripts/add-gangani-payment-plans.ts
import path from 'node:path'
import { config as loadEnv } from 'dotenv'
import type payloadConfigType from '../payload.config'

loadEnv({ path: path.join(process.cwd(), '.env.local') })
const payloadConfig = ((await import('../payload.config')) as { default: typeof payloadConfigType }).default
const { getPayload } = await import('payload')
const payload = await getPayload({ config: payloadConfig })

// Exact English wording from https://www.ganganilandsales.com/payment-plan/ (owner,
// 2026-10-01: "take what's from the website, apply exactly like it"). One heading per
// package ("Package X — title"), then the website's own lines, each shown as a row.
const PACKAGES = [
  'Package A — 6 or 12 Months Interest-Free',
  'Reservation: Secure your chosen land with an initial payment of Rs. 25,000.',
  'Down Payment: Within one month, pay a down payment equal to 30% of the total land value.',
  'Installments: The remaining balance can be paid in equal monthly installments over a period of 6 or 12 months.',
  '(conditions apply)',
  'Package B — 5-Year Payment Plan with Late Payment Charges',
  'Reservation: Secure your chosen land with an advance payment of Rs. 25,000.',
  'Down Payment: Within one month, pay 30% of the total land value.',
  'Installments: The remaining balance is payable over 5 years, with late payment charges.',
  '(conditions apply).',
  'Package C — Pay in Full and Enjoy Special Discounts',
  'Reservation: Secure your chosen land with an initial payment of Rs. 25,000.',
  'Discounts for Full Payment:',
  '5% Discount: If you pay the full amount within one week of the reservation.',
  '3% Discount: If you pay the full amount within one month of the reservation.',
  'This package allows you to save while completing the payment quickly, ensuring a smooth and efficient ownership transfer.',
  'Package A1 — Paying Off with a Bank Loan',
  'While paying installments under Package A, you have the option to apply for a bank loan to settle the remaining balance.',
  'Once you submit the bank loan application, the process will begin immediately, and you can access the loan while continuing to make your initial payments.',
  'Faster Loan Processing: As most bank loans are handled by NSB Bank, the approval process is quicker compared to other banks.',
  'Our staff will assist you through every step of the process, ensuring the procedure is simple and stress-free.',
  'Package B1 — Paying Off with a Bank Loan',
  'While making installments under Package B, you can apply for a bank loan to settle the remaining balance.',
  'Once you submit your bank loan application, the process will begin, and you can access the loan while completing your initial payments.',
  'Faster Loan Processing: Since most bank loans are handled by NSB Bank, you can expect faster approval compared to other banks.',
  'A dedicated staff member will assist you throughout the process, making it easier and less stressful for you.',
  'Grace Period: A three-month grace period is offered, ensuring no late payments during the approval process.',
]

// Each land's own payment lines are taken exactly as its Gangani page prints them
// (scraped JSON, "Plans" … "More payment options"), whitespace-normalised only.
import fs from 'node:fs'
const jsonPath = process.env.GANGANI_JSON ?? ''
if (!jsonPath) throw new Error('Set GANGANI_JSON to the scraped gangani.json')
const titleCase = (t: string) => t.split(' ').map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w)).join(' ')
const tidy = (t: string) => t.replace(/\s+,/g, ',').replace(/\s+/g, ' ').replace(/[.\s]+$/, '').trim()
const siteByTitle = new Map((JSON.parse(fs.readFileSync(jsonPath, 'utf8')) as { name: string; pay: string[] }[]).map((o) => [titleCase(tidy(o.name)), o]))

const lands = await payload.find({ collection: 'lands', where: { sellerName: { equals: 'Gangani Land Sales' } }, limit: 200, depth: 0, overrideAccess: true })
let n = 0
for (const land of lands.docs as unknown as { id: number; slug: string; title: string }[]) {
  const site = siteByTitle.get(land.title)
  if (!site) { console.log('NO SITE MATCH', land.slug); continue }
  // Exact site text, whitespace-normalised, with a leading capital (owner, 2026-10-01: "can be paid in instalments…" needs a capital C).
  const base = site.pay.map((l) => l.replace(/\s+/g, ' ').trim()).filter(Boolean).map((l) => l[0].toUpperCase() + l.slice(1))
  await payload.update({ collection: 'lands', id: land.id, data: { paymentPlanItems: [...base, ...PACKAGES] } as never, overrideAccess: true })
  n++
}
console.log('DONE', n, 'of', lands.docs.length)
process.exit(0)
