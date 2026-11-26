/* eslint-disable @typescript-eslint/no-explicit-any -- one-off script */
// Owner, 2026-11-26: no "High Rental Potential" badge for Bayfonte Marina; use a new badge worded as a fact, "Resort Apartments".
// Adds the value to the marketing badge list in Postgres and puts it on project 149 (published). Add-only and idempotent.
//   NODE_ENV=production npx tsx scripts/add-bayfonte-marina-resort-badge-2026-11-26.ts [--apply]
import path from 'node:path'
import { config as loadEnv } from 'dotenv'
loadEnv({ path: path.join(process.cwd(), '.env.local') })
const apply = process.argv.includes('--apply')
const cfg = ((await import('../payload.config')) as any).default
const { getPayload } = await import('payload')
const { sql } = await import('drizzle-orm')
const payload = await getPayload({ config: cfg })
const ID = 149
const BADGE = 'Resort Apartments'

const db: any = (payload.db as any).drizzle
const have = await db.execute(sql`select 1 from pg_type t join pg_enum e on e.enumtypid=t.oid join pg_namespace n on n.oid=t.typnamespace where n.nspname='payload' and t.typname='enum_projects_marketing_badges' and e.enumlabel=${BADGE}`)
const enumThere = (have.rows ?? have).length > 0
console.log('badge value in database:', enumThere ? 'yes' : 'missing' + (apply ? ' -> adding' : ' (would add)'))
if (!enumThere && apply) await db.execute(sql.raw(`alter type payload.enum_projects_marketing_badges add value if not exists '${BADGE}'`))

const p: any = await payload.findByID({ collection: 'projects', id: ID, depth: 0, overrideAccess: true })
if (p.slug !== 'bayfonte-marina') throw new Error('unexpected project')
const has = (p.marketingBadges ?? []).includes(BADGE)
// Owner, same day: "put 4 years for 100 percent". The note added earlier today quoted the website's 3 years; it now carries the advert's
// "up to 100% capital appreciation within just 4 years" only. Only that one note (added by update-bayfonte-marina-developer-claims) is reworded.
const NOTE_4Y = 'The developer says: up to 100% capital appreciation within 4 years (developer advert, November 2026) and "highest ROI guaranteed" (its website). These are the developer\'s own claims and are not verified; property values can fall as well as rise.'
const notes: string[] = p.pricingNotes ?? []
const idx = notes.findIndex((n) => n.includes('capital appreciation in just 3 years'))
const data: Record<string, any> = {}
if (!has) data.marketingBadges = [...(p.marketingBadges ?? []), BADGE]
if (idx >= 0) data.pricingNotes = notes.map((n, i) => (i === idx ? NOTE_4Y : n))
console.log(p.id, p.name, '->', has ? 'badge already set' : 'add badge', '|', idx >= 0 ? 'reword the capital appreciation note to 4 years' : 'note already 4 years or absent', '| marketing badges now', p.marketingBadges ?? [], '| location badges', p.locationBadges ?? [])
if (apply && Object.keys(data).length) {
  await payload.update({ collection: 'projects', id: ID, data: data as never, overrideAccess: true })
  const a: any = await payload.findByID({ collection: 'projects', id: ID, depth: 0, overrideAccess: true })
  console.log('   saved: note', a.pricingNotes, '| marketing badges', a.marketingBadges, '| location badges', a.locationBadges, '| gallery', a.gallery?.length, '| videos', a.videos?.length, '| amenities', a.amenities?.length, '| pricing notes', a.pricingNotes?.length, '| price', a.startingPriceLkr, '| phone', a.contactPhone === p.contactPhone ? 'unchanged' : 'CHANGED')
}
console.log(apply ? 'APPLIED' : 'DRY RUN')
process.exit(0)
