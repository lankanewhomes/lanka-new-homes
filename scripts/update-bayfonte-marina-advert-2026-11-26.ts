/* eslint-disable @typescript-eslint/no-explicit-any -- one-off script */
// Owner request 2026-11-26: the owner pasted the developer's advert for Bayfonte Marina Resort Apartments (project 149, published)
// and said "if you need to update the info please do and if you need to add a badge please also do".
// Add-only and idempotent: nothing existing is changed or removed.
// Added: the new "Waterfront" location badge (the project is on the Negombo Lagoon), a Water Sports amenity (jet ski, kayaking, boating:
// on the developer's own page), one highlight, one description sentence and a status note, each marked as the developer's advert.
// Not added on purpose: "up to 100% capital appreciation within 4 years" (the developer's page says 3 years; an unverified promise),
// the "$125 minimum daily rental income" and "highest ROI guaranteed" claims (an earlier to-do already asks the owner), the infinity pool
// and "ocean vistas" (not on the developer's page; the project faces the lagoon), and the advert's phone number (differs from the listing's).
//   NODE_ENV=production npx tsx scripts/update-bayfonte-marina-advert-2026-11-26.ts [--apply]
import path from 'node:path'
import { config as loadEnv } from 'dotenv'
loadEnv({ path: path.join(process.cwd(), '.env.local') })
const apply = process.argv.includes('--apply')
const cfg = ((await import('../payload.config')) as any).default
const { getPayload } = await import('payload')
const { sql } = await import('drizzle-orm')
const payload = await getPayload({ config: cfg })
const ID = 149
const BADGE = 'Waterfront'
const HIGHLIGHT = "Marketed by the developer as Sri Lanka's first tourist resort apartments"
const SENTENCE = "The developer's November 2026 advert markets the project as Sri Lanka's first tourist resort apartments, with international cuisine restaurants, jet ski access and an exclusive pier for residents, and says limited units are available."
const STATUS_NOTE = 'Limited units available, per the developer advert (November 2026)'
const WATER_SPORTS = { name: 'Water Sports', description: 'Jet ski access, kayaking and boating from the private lagoon frontage, with a private boat parking pier, as the developer lists.' }
const TODO_TITLE = 'Bayfonte Marina: advert phone number and investment claims'

const db: any = (payload.db as any).drizzle
const have = await db.execute(sql`select 1 from pg_type t join pg_enum e on e.enumtypid=t.oid join pg_namespace n on n.oid=t.typnamespace where n.nspname='payload' and t.typname='enum_projects_location_badges' and e.enumlabel=${BADGE}`)
const enumThere = (have.rows ?? have).length > 0
console.log('badge value in database:', enumThere ? 'yes' : 'missing' + (apply ? ' -> adding' : ' (would add)'))
if (!enumThere && apply) await db.execute(sql.raw(`alter type payload.enum_projects_location_badges add value if not exists '${BADGE}'`))

const p: any = await payload.findByID({ collection: 'projects', id: ID, depth: 0, overrideAccess: true })
if (p.slug !== 'bayfonte-marina') throw new Error('unexpected project')
const data: Record<string, any> = {}
const log: string[] = []
if (!(p.locationBadges ?? []).includes(BADGE)) { data.locationBadges = [...(p.locationBadges ?? []), BADGE]; log.push('location badge') }
if (!(p.amenities ?? []).some((a: any) => a.name === WATER_SPORTS.name)) {
  data.amenities = [...(p.amenities ?? []).map((a: any) => ({ name: a.name, description: a.description })), WATER_SPORTS]
  log.push('amenity Water Sports')
}
if (!(p.highlights ?? []).includes(HIGHLIGHT)) { data.highlights = [...(p.highlights ?? []), HIGHLIGHT]; log.push('highlight') }
if (!String(p.description ?? '').includes('first tourist resort apartments')) { data.description = `${String(p.description ?? '').trim()} ${SENTENCE}`; log.push('description sentence') }
if (!p.statusNote) { data.statusNote = STATUS_NOTE; log.push('status note') }
console.log(p.id, p.name, '->', log.join(' | ') || 'nothing to add')
console.log('   before: amenities', p.amenities?.length, '| highlights', p.highlights?.length, '| gallery', p.gallery?.length, '| floor plans', p.floorPlans?.length, '| KF', p.unitFeatures?.length, '| price', p.startingPriceLkr, '| phone unchanged')

const todos: any = await payload.find({ collection: 'listing-todos', where: { and: [{ project: { equals: ID } }, { title: { equals: TODO_TITLE } }] }, limit: 1, overrideAccess: true })
console.log('to-do:', todos.docs.length ? 'already there' : apply ? 'adding' : 'would add')

if (apply) {
  if (Object.keys(data).length) await payload.update({ collection: 'projects', id: ID, data: data as never, overrideAccess: true })
  if (!todos.docs.length) {
    await payload.create({
      collection: 'listing-todos',
      data: {
        title: TODO_TITLE,
        listingType: 'project',
        project: ID,
        notes: 'The developer advert the owner shared on 2026-11-26 shows the phone number 0711 395 395; the listing shows a different number and was left as it is. The advert claims "up to 100% capital appreciation within just 4 years" while the developer page says 3 years; left out, with the "$125 minimum daily rental income" and "highest ROI guaranteed" claims. The advert text says 30+ facilities and its image says 40+ (the brochure lists 41; kept). The infinity pool and "ocean vistas" are in the advert only, not on the developer page; left out. "Limited units available" was added as a status note: remove it when it is no longer true.',
        sourceLinks: 'https://www.homelandsskyline.lk/apartment-project/bayfonte-marina-resort-apartment-for-sale-in-negombo',
      } as never,
      overrideAccess: true,
    })
  }
  const a: any = await payload.findByID({ collection: 'projects', id: ID, depth: 0, overrideAccess: true })
  console.log('   saved: location badges', a.locationBadges, '| amenities', a.amenities?.length, '| highlights', a.highlights?.length, '| status note', a.statusNote, '| gallery', a.gallery?.length, '| floor plans', a.floorPlans?.length, '| KF', a.unitFeatures?.length, '| price', a.startingPriceLkr, '| published', a.isPublished)
}
console.log(apply ? 'APPLIED' : 'DRY RUN')
process.exit(0)
