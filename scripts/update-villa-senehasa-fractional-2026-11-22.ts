/* eslint-disable @typescript-eslint/no-explicit-any -- one-off script */
// Owner request 2026-11-22: update the site from https://www.maisonceylon.com/fractional-property-investment-sri-lanka and add a badge if needed.
// The fractional offer covers Villa Senehasa (project 44) only. Add-only and idempotent: nothing existing is changed or removed.
// Every figure is the developer's own published figure (USD, read 2026-11-22); yields are the developer's estimates and are labelled so.
//   NODE_ENV=production npx tsx scripts/update-villa-senehasa-fractional-2026-11-22.ts [--apply]
import path from 'node:path'
import { config as loadEnv } from 'dotenv'
loadEnv({ path: path.join(process.cwd(), '.env.local') })
const apply = process.argv.includes('--apply')
const cfg = ((await import('../payload.config')) as any).default
const { getPayload } = await import('payload')
const { sql } = await import('drizzle-orm')
const payload = await getPayload({ config: cfg })
const SRC = 'https://www.maisonceylon.com/fractional-property-investment-sri-lanka'
const BADGE = 'Fractional Ownership'
const PARA = 'Fractional ownership: the developer also sells this villa in 12 income shares of USD 25,000 each (1 to 4 shares per investor, paid once). Maison Ceylon builds, furnishes, lets and manages the villa for 10 years and pays the rent out every quarter in USD; it buys 2 of the 12 shares itself. Shareholders own shares in a Sri Lankan company that holds the villa and its registered land lease. These are income shares, not a timeshare: owners do not get free nights. The villa is put up for sale in year 10. The developer says capital is not guaranteed and a share may be hard to sell.'
const NOTES = [
  'Fractional shares: USD 25,000 per share (1/12 of the villa), 1 to 4 shares per investor, no entry fee and no annual fee; running costs are paid from the rent. The developer showed 10 of 12 shares left on 2026-11-22. The project starts only once all 12 shares are reserved; otherwise reservations are refunded.',
  'Fractional shares, selling: quarterly sale windows from delivery, co-investors first for 30 days, 3% seller fee; a buyer is not guaranteed. First payout about 12 to 15 months after subscribing.',
]
const HIGHLIGHTS = ['Also sold in shares: USD 25,000 for 1/12 of the villa', 'Rent paid out every quarter in USD', 'Built, let and managed by the developer for 10 years']
const RENTAL = "Developer's estimate for a fractional share: 11.7% net yield in year 1 (USD 2,920 per USD 25,000 share) at 80% occupancy and USD 240 a night; 10.2% to 13.1% at 70% to 90% occupancy. Estimates only, not guaranteed."

const db: any = (payload.db as any).drizzle
const have = await db.execute(sql`select 1 from pg_type t join pg_enum e on e.enumtypid=t.oid join pg_namespace n on n.oid=t.typnamespace where n.nspname='payload' and t.typname='enum_projects_marketing_badges' and e.enumlabel=${BADGE}`)
const enumThere = (have.rows ?? have).length > 0
console.log('badge value in database:', enumThere ? 'yes' : 'missing' + (apply ? ' -> adding' : ' (would add)'))
if (!enumThere && apply) await db.execute(sql.raw(`alter type payload.enum_projects_marketing_badges add value if not exists '${BADGE}'`))

const p: any = await payload.findByID({ collection: 'projects', id: 44, depth: 0, overrideAccess: true })
const data: Record<string, any> = {}
const log: string[] = []
if (!(p.marketingBadges ?? []).includes(BADGE)) { data.marketingBadges = [...(p.marketingBadges ?? []), BADGE]; log.push('badge') }
if (!String(p.description ?? '').includes('Fractional ownership:')) { data.description = `${String(p.description ?? '').trim()}\n\n${PARA}`; log.push('description paragraph') }
const newNotes = NOTES.filter((n) => !(p.pricingNotes ?? []).some((x: string) => x.startsWith(n.slice(0, 30))))
if (newNotes.length) { data.pricingNotes = [...(p.pricingNotes ?? []), ...newNotes]; log.push(`pricing notes +${newNotes.length}`) }
const newHi = HIGHLIGHTS.filter((h) => !(p.highlights ?? []).includes(h))
if (newHi.length) { data.highlights = [...(p.highlights ?? []), ...newHi]; log.push(`highlights +${newHi.length}`) }
if (!p.rentalIncome) { data.rentalIncome = RENTAL; log.push('rental income') }
if (!(p.referenceLinks ?? []).some((r: any) => r.url === SRC)) {
  data.referenceLinks = [...(p.referenceLinks ?? []).map((r: any) => ({ label: r.label, url: r.url, note: r.note })), { label: 'Fractional offer source', url: SRC, note: 'Read 2026-11-22: 10 of 12 shares left. Re-check the count; the page places the villa in Hiriketiya.' }]
  log.push('reference link')
}
console.log(p.id, p.name, '->', log.join(' | ') || 'nothing to add')
if (apply && Object.keys(data).length) {
  await payload.update({ collection: 'projects', id: 44, data: data as never, overrideAccess: true })
  const a: any = await payload.findByID({ collection: 'projects', id: 44, depth: 0, overrideAccess: true })
  console.log('   saved: badges', a.marketingBadges, '| notes', a.pricingNotes?.length, '| highlights', a.highlights?.length, '| gallery', a.gallery?.length, 'videos', a.videos?.length, 'amenities', a.amenities?.length, 'KF', a.unitFeatures?.length, '| price', a.startingPriceLkr)
}
console.log(apply ? 'APPLIED' : 'DRY RUN')
process.exit(0)
