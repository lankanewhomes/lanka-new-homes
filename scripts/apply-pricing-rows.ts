/* eslint-disable @typescript-eslint/no-explicit-any -- one-off script over researched JSON + arbitrary CMS docs */
// Fills the Payment & deposit / fee rows from researched, developer-published figures. Only project-specific terms:
// skips group-wide FAQ lines (Rush), conflicting figures (Residence Samagi, Park Road/Edmonton starting prices),
// the unconfirmed Prime Life page and Rush Court 6's hidden calculator feed. Never overwrites a value already set.
//   RESEARCH_DIR=<scratchpad/research> NODE_ENV=production npx tsx scripts/apply-pricing-rows.ts [--apply]
import fs from 'node:fs'
import path from 'node:path'
import { config as loadEnv } from 'dotenv'
loadEnv({ path: path.join(process.cwd(), '.env.local') })
const dir = process.env.RESEARCH_DIR ?? ''
if (!dir) throw new Error('Set RESEARCH_DIR')
const apply = process.argv.includes('--apply')
const cfg = ((await import('../payload.config')) as any).default
const { getPayload } = await import('payload')
const payload = await getPayload({ config: cfg })

const research: Record<string, any> = {}
for (const f of fs.readdirSync(dir)) if (f.startsWith('price_') && f.endsWith('.json')) Object.assign(research, JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')))
const lines = (v: any): string | null => (Array.isArray(v) ? v.join('\n') : typeof v === 'string' ? v : null)
// slug -> researched keys to copy (research key -> CMS field)
const MAP: Record<string, Record<string, string>> = {
  'aathavan-apartments-dehiwala': { unitPriceRange: 'availablePlanPrices', pricePerSqft: 'averagePricePerSqft', reservationDeposit: 'reservationDeposit', downPayment: 'downPayment', installmentSchedule: 'installmentSchedule' },
  'oceana-wadduwa': { reservationDeposit: 'reservationDeposit', paymentPlan: 'paymentPlan', financing: 'financingOptions' },
  'capitol-twinpeaks': { reservationRequest: 'reservationDeposit', financing: 'financingOptions', legalFees: 'legalFees', taxes: 'propertyTax' },
  'prime-villas-dalugama': { reservationDeposit: 'reservationDeposit', downPayment: 'downPayment', financing: 'financingOptions' },
  'kaloora-kalutara': { downPayment: 'downPayment', installmentSchedule: 'installmentSchedule' },
  'courtyard-by-prime-samagi-mawatha-thalawathugoda': { downPayment: 'downPayment', installmentSchedule: 'installmentSchedule' },
  'viva-la-vida': { downPayment: 'downPayment', installmentSchedule: 'installmentSchedule' },
  'cest-la-vie': { downPayment: 'downPayment', installmentSchedule: 'installmentSchedule' },
  'elemint-suites-gampaha': { downPayment: 'downPayment', financing: 'financingOptions' },
  '88-residence-kahathuduwa': { downPayment: 'downPayment', financing: 'financingOptions' },
  'prime-evoke-kadawatha': { financing: 'financingOptions' },
}
const VILLAS = ['villa-samagi', 'villa-senehasa', 'villa-sahana']
for (const v of VILLAS) MAP[v] = { reservationRequest: 'reservationFee', reservationDeposit: 'reservationDeposit', downPayment: 'downPayment', paymentPlan: 'paymentPlan', installmentSchedule: 'installmentSchedule', legalFees: 'legalFees' }

// Maison Ceylon's optional extras are add-ons, not fees: "Pool: Infinity 3.5 x 13 m +$7,900; Master suite … +$19,900 each; …"
function addOnsFrom(text: string): { label: string; value: string }[] {
  return text.split(';').map((part) => part.trim()).filter(Boolean).map((part) => {
    const m = part.match(/^(.*?)\s*(\+?\$[\d,]+(?:\s+each)?)$/)
    return m ? { label: m[1].replace(/^Pool:\s*/i, 'Pool — ').trim(), value: m[2].trim() } : null
  }).filter(Boolean) as any
}

let touched = 0
for (const [slug, fields] of Object.entries(MAP)) {
  const r = research[slug]
  if (!r) { console.log(`${slug}: no research`); continue }
  const d: any = (await payload.find({ collection: 'projects', where: { slug: { equals: slug } }, limit: 1, depth: 0, overrideAccess: true })).docs[0]
  if (!d) continue
  const data: any = {}
  for (const [rk, field] of Object.entries(fields)) {
    let v = lines(r[rk])
    if (!v || d[field]) continue
    if (slug === 'capitol-twinpeaks' && rk === 'reservationRequest') v = 'Booking fee Rs. 1,000,000, non-refundable'
    if (slug === 'capitol-twinpeaks' && rk === 'legalFees') v = "Notary fee for the deed (purchaser's notary)"
    data[field] = v
  }
  if (VILLAS.includes(slug) && r.otherFees && !(d.pricingAddOns ?? []).length) {
    const ao = addOnsFrom(String(r.otherFees))
    if (ao.length) data.pricingAddOns = ao
  }
  if (Object.keys(data).length) {
    touched++
    console.log(`${slug}: ${Object.keys(data).join(', ')}`)
    if (apply) await payload.update({ collection: 'projects', id: d.id, data, overrideAccess: true })
  }
}
console.log(apply ? 'APPLIED' : 'DRY RUN', touched, 'listings')
process.exit(0)
