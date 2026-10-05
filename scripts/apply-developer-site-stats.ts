/* eslint-disable @typescript-eslint/no-explicit-any */
// Applies company counters exactly as each builder prints them on its own website (siteStats on the Developers
// collection). Only values read from the raw page HTML, 2026-10-05; conflicting or split figures are left out on purpose.
//   NODE_ENV=production npx tsx scripts/apply-developer-site-stats.ts [--apply]
import path from 'node:path'
import { config as loadEnv } from 'dotenv'
loadEnv({ path: path.join(process.cwd(), '.env.local') })
const apply = process.argv.includes('--apply')
const STATS: Record<string, { completed?: string; ongoing?: string; soldOut?: string; years?: string }> = {
  'odiliya-homes': { completed: '100+', ongoing: '20+', soldOut: '100+', years: '14+' }, // odiliyahomes.lk/about "Years Of Trust"
  'fairway-properties': { years: '20+' }, // /about "Years of excellence"
  'jaysons-realty': { years: '30+' }, // /about "Years of Experience"
  'gangani-land-sales': { years: '40+' }, // /about-us "Years of excellence"
  'devi-constructions': { completed: '100+', years: '22+' }, // homepage "Projects delivered", "Years on site"
  'rush-lanka-group': { completed: '20+', years: '34' }, // /about-us (homepage shows different numbers: left for review)
  'global-housing-and-real-estate': { completed: '12', ongoing: '10', years: '20+' }, // homepage + footer "12 completed / 10 ongoing", "More than 20 years" (the /about page shows other numbers: not used)
  'nemra': { years: '15' }, // /about-us "15 years" (homepage says "over a decade"; owner asked to use the about page, 2026-10-05)
  'prime-lands': { years: '30' }, // /about-us "Years of Trust" (completed counts are split houses/apartments: not summed)
}
const cfg = ((await import('../payload.config')) as any).default
const { getPayload } = await import('payload')
const payload = await getPayload({ config: cfg })
for (const [slug, siteStats] of Object.entries(STATS)) {
  const d: any = (await payload.find({ collection: 'developers', where: { slug: { equals: slug } }, limit: 1, depth: 0, overrideAccess: true })).docs[0]
  if (!d) { console.log(slug, 'NOT FOUND'); continue }
  const merged = { ...siteStats }
  for (const k of Object.keys(d.siteStats ?? {})) if (d.siteStats[k] && k !== 'id') (merged as any)[k] = d.siteStats[k] // never overwrite existing
  console.log(slug, JSON.stringify(merged))
  if (apply) await payload.update({ collection: 'developers', id: d.id, data: { siteStats: merged } as any, overrideAccess: true })
}
console.log(apply ? 'APPLIED' : 'DRY RUN')
process.exit(0)
