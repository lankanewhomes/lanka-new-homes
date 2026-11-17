/* eslint-disable @typescript-eslint/no-explicit-any -- one-off update script */
// Owner 2026-11-17 (Dynasty Residence): the "Parking" fact chip showed a whole paragraph. Shorten the Parking note on every listing whose note is over 60 characters
// and move the full original wording into the Parking amenity's description (created if missing), so no detail is lost. Nothing else changes.
//   NODE_ENV=production npx tsx scripts/shorten-parking-notes-2026-11-17.ts [--apply]
import path from 'node:path'
import { config as loadEnv } from 'dotenv'
loadEnv({ path: path.join(process.cwd(), '.env.local') })
const apply = process.argv.includes('--apply')
const cfg = ((await import('../payload.config')) as any).default
const { getPayload } = await import('payload')
const payload: any = await getPayload({ config: cfg })
const SHORT: Record<string, string> = {
  'pentara-residencies': '1 to 4 slots per unit',
  'ocean-breeze-negombo-phase-two': 'Indoor, ground and 2 parking floors',
  'dynasty-residence-kandy': 'Covered, 1 to 2 per unit',
  'canterbury-crest': '1 fixed slot per apartment',
  'fairway-latitude': 'Covered, secure car ports',
  'canterbury-lexus': '1 slot per apartment (2 for penthouses)',
  'park-road-colombo05': 'Indoor, ground and first floors',
  'bayfonte-marina': '1 fixed slot per apartment',
  'the-kingdom-sigiriya': 'Surface car parking',
  'edmonton-bliss-residencies': 'Indoor, ground and 2 parking floors',
  'tri-zen-apartments': 'By unit type; common area on 10th floor',
  'serene-heights': '1 or 2 slots per unit',
  'cinnamon-life-apartments': 'Dedicated, monitored access',
  'rush-court-5-colombo-14': 'Dedicated slots; car lift',
  'prime-urban-art-kottawa': '2-car parking per home',
  'viman-ja-ela-apartments': '1 per apartment, plus visitor',
  'barrington-towers': '1 per apartment; car lifts',
}
const clean = (a: any[]) => (a ?? []).map((x: any) => { const { id: _i, ...r } = x; return r })
for (const [slug, short] of Object.entries(SHORT)) {
  const p: any = (await payload.find({ collection: 'projects', where: { slug: { equals: slug } }, limit: 1, depth: 0, overrideAccess: true })).docs[0]
  if (!p) { console.log('MISSING', slug); continue }
  const original = String(p.parking ?? '').trim()
  if (original === short || original.length <= 60) { console.log('skip (already short)', slug); continue }
  const amen = clean(p.amenities)
  const i = amen.findIndex((a: any) => a.name === 'Parking')
  let note = ''
  if (i >= 0) {
    if (!amen[i].description) { amen[i] = { ...amen[i], description: original }; note = 'description filled' }
    else if (!String(amen[i].description).includes(original)) { amen[i] = { ...amen[i], description: `${amen[i].description} ${original}` }; note = 'appended to description' }
    else note = 'description already has it'
  } else { amen.push({ name: 'Parking', description: original }); note = 'amenity added' }
  console.log(slug, '|', original.length, '->', short.length, '|', note)
  if (apply) await payload.update({ collection: 'projects', id: p.id, data: { parking: short, amenities: amen } as never, overrideAccess: true })
}
console.log(apply ? 'APPLIED' : 'DRY RUN')
process.exit(0)
