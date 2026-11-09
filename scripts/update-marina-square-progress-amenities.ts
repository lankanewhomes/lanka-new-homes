/* eslint-disable @typescript-eslint/no-explicit-any -- one-off script */
// Marina Square 2026-11-09, from the developer's site: project-progress (100% milestones, monthly photos, status text),
// indulgence + social/active/wellness pages (amenities), and the "Interest free payment plans" banner / FAQ (badge + pricing).
//   MS_DIR=<folder with prog/list.tsv + prog/<yyyy-mm>.<ext>> NODE_ENV=production npx tsx scripts/update-marina-square-progress-amenities.ts
import fs from 'node:fs'
import path from 'node:path'
import { config as loadEnv } from 'dotenv'
loadEnv({ path: path.join(process.cwd(), '.env.local') })
const dir = process.env.MS_DIR ?? ''
if (!dir) throw new Error('Set MS_DIR')
const cfg = ((await import('../payload.config')) as any).default
const { getPayload } = await import('payload')
const { mirrorToR2 } = await import('../src/lib/listing-import/mirror')
const SO = (await import('../src/collections/shared-fields')) as any
const payload = await getPayload({ config: cfg })
const SLUG = 'marina-square-colombo-15'
const proj = (await payload.find({ collection: 'projects' as never, where: { slug: { equals: SLUG } }, limit: 1, overrideAccess: true, depth: 0 })).docs[0] as any
const before = { plans: proj.floorPlans?.length, gallery: proj.gallery?.length }

const constructionUpdates: any[] = []
for (const line of fs.readFileSync(path.join(dir, 'prog/list.tsv'), 'utf8').trim().split('\n').reverse()) {
  const [ym, label] = line.split('\t')
  const file = fs.readdirSync(path.join(dir, 'prog')).find((f) => f.startsWith(ym + '.'))!
  const ext = path.extname(file).slice(1)
  const image = await mirrorToR2(`projects/${SLUG}/construction/${SLUG}_${ym}.${ext === 'jpeg' ? 'jpg' : ext}`, fs.readFileSync(path.join(dir, 'prog', file)), ext === 'png' ? 'image/png' : 'image/jpeg')
  constructionUpdates.push({ date: `${ym}-01T00:00:00.000Z`, image, note: `${label} site progress` })
}

const AM: [string, string?][] = [
  ['Clubhouse', 'Club house with a common bar and lounge for residents.'], ['Function Room', 'Function halls for entertaining guests.'], ['Bar'], ['Lounge'],
  ['Games Room', 'Indoor games rooms with snooker, table tennis and darts.'], ['Leisure Deck', 'Outdoor play deck and themed sky decks.'],
  ['Poolside Lounge', 'Sun and pool deck.'], ['BBQ Area', 'Barbecue coves.'], ['Roof Terrace', 'Rooftop dining and seating area.'],
  ['Gym', 'Indoor gym.'], ['Outdoor Gym'], ['Outdoor Multipurpose Court', 'Multi-purpose court.'],
  ['Walking Track'], ['Cycling Paths', 'Walking and cycling tracks.'], ['Jogging Track', 'Landscaped walking and jogging tracks.'],
  ['Infinity Pool', 'Infinity pool set against the Colombo harbour backdrop.'], ['Kids Pool'],
  ["Children's Area", 'Large children\'s play area, described by the developer as one of the largest in a luxury urban development.'],
  ['Picnic Area', 'Picnic and camping area.'], ['Camping Area', 'Picnic and camping area.'],
  ['Spa', 'Spa, with a medical center and childcare center in the wellness zone.'], ['Yoga & Meditation Area', 'Meditation and yoga room and deck.'],
  ['Meditation Garden', 'Zen garden.'], ['Garden', 'Over two acres of landscaped gardens.'], ['Parking', 'One car park per unit; two for 4-bedroom units.'],
]
const amenities = AM.map(([name, description]) => { if (!(SO.AMENITY_NAME_OPTIONS as string[]).includes(name)) throw new Error('not in vocabulary ' + name); return description ? { name, description } : { name } })

const updated: any = await payload.update({
  collection: 'projects' as never, id: proj.id, overrideAccess: true,
  data: {
    constructionStagePercent: '100%', constructionUpdates, amenities,
    statusNote: 'Internal finishing under way across all five towers; finished show apartments ready to view',
    paymentPlanBadge_other: 'Interest-Free Payment Plans',
    paymentPlan: 'Interest-free payment plans, customised to suit your financial needs.',
    paymentPlanItems: ['Interest-free payment plans', 'Payment plan customised to your financial needs', 'Bank loans through tripartite agreements with leading banks in Sri Lanka'],
    financingOptions: 'Tripartite agreements signed with leading Sri Lankan banks; DFCC, Commercial Bank and Sampath Bank are named as banking partners on the developer\'s site.',
  } as never,
})
console.log('before', JSON.stringify(before), 'after plans', updated.floorPlans?.length, 'gallery', updated.gallery?.length, 'amenities', updated.amenities?.length, 'updates', updated.constructionUpdates?.length, 'badge', updated.paymentPlanBadge, updated.paymentPlanBadge_other)
process.exit(0)
