/* eslint-disable @typescript-eslint/no-explicit-any -- one-off data script */
// 2026-10-16 (owner): counts and areas belong in Facts, shared facilities in Amenities, never in Key Features.
//   - Rush Villa Dehiwala / Palm Grove / Park Colombo 5: toilets, living rooms, area -> Facts (Baths, Living rooms, Area)
//   - bedroom/bathroom counts repeated in Key Features (Rush Broadway, Rush Tower, Springfield) removed (already in Facts)
//   - Vyan / Rudra "Site" -> Facts "Area"
//   - Recreation & Wellness rows that match an amenity move to Amenities (Oceana, Ocean Breeze Hikkaduwa, Villa Samagi/Sahana,
//     Street Rush, Springfield); unmatched rows (Rudra "Community") stay.
import path from 'node:path'
import { config } from 'dotenv'
config({ path: path.join(process.cwd(), '.env.local') })
const cfg = ((await import('../payload.config')) as any).default
const { getPayload } = await import('payload')
const p = await getPayload({ config: cfg })
const o = { overrideAccess: true, depth: 0 } as any
const fld = (it: any) => String(it.field || it.field_other || '').trim().toLowerCase()
const clean = (groups: any[]) => groups.map(({ id, ...g }: any) => ({ ...g, items: (g.items || []).map(({ id: _i, ...i }: any) => i) }))
const doc = async (slug: string) => (await p.find({ collection: 'projects', where: { slug: { equals: slug } } as never, limit: 1, ...o })).docs[0] as any
const LABEL = 'Building & Services'
async function run(slug: string, opts: { drop?: (it: any, g: any) => boolean; dropTab?: RegExp; facts?: Record<string, any>; amenities?: [string, string][]; addKF?: [string, string, string][] }) {
  const x = await doc(slug); if (!x) { console.log('missing', slug); return }
  let groups = clean(x.unitFeatures || [])
  const removed: string[] = []
  groups = groups.map((g: any) => {
    const lab = String(g.key_other || g.label || g.key || '')
    if (opts.dropTab && opts.dropTab.test(lab)) { removed.push(`tab ${lab}`); return { ...g, items: [] } }
    return { ...g, items: g.items.filter((it: any) => { if (opts.drop?.(it, g)) { removed.push(`${it.field || it.field_other}: ${String(it.value || it.value_other).slice(0, 40)}`); return false } return true }) }
  }).filter((g: any) => g.items.length)
  for (const [tabKey, field, value] of opts.addKF || []) {
    const t = groups.find((g: any) => g.key === tabKey)
    const item = { field_other: field, value_other: value }
    if (t) t.items.push(item); else groups.push({ key: tabKey, label: LABEL, items: [item] })
  }
  const amenities = (x.amenities || []).map(({ id, ...a }: any) => a)
  for (const [name, description] of opts.amenities || []) {
    const ex = amenities.find((a: any) => a.name === name)
    if (ex) { if (!ex.description) ex.description = description } else amenities.push({ name, description })
  }
  await p.update({ collection: 'projects', id: x.id, data: { unitFeatures: groups, amenities, ...(opts.facts || {}) } as never, ...o })
  console.log(slug, '| removed:', removed.join(' ; ') || '-', '| amenities+:', (opts.amenities || []).map((a) => a[0]).join(',') || '-', '| facts:', JSON.stringify(opts.facts || {}))
}
const isF = (...names: string[]) => (it: any) => names.includes(fld(it))
for (const slug of ['rush-villa-dehiwala', 'rush-palm-grove-colombo-3']) await run(slug, { drop: isF('area', 'toilets', 'living & dining'), facts: { area: 'Approx 3,600 sq ft on 6.5 perches', bathrooms: '6 (including servants)', livingRooms: '2' } })
await run('rush-park-colombo-5', { drop: (it) => ['toilets', 'living & dining'].includes(fld(it)) || (fld(it) === 'bedrooms' && /^4 master/i.test(String(it.value || it.value_other))), facts: { bathrooms: '5 (including servants)', livingRooms: '2' } })
for (const slug of ['rush-broadway-grandpass', 'rush-tower-dehiwala']) await run(slug, { drop: (it) => fld(it) === 'general features' && /^3 bedrooms$/i.test(String(it.value || it.value_other).trim()) })
await run('springfield-residencies', { drop: (it) => (fld(it) === 'bedrooms & closets' && /^3 bedrooms/i.test(String(it.value || it.value_other))) || (fld(it) === 'bathroom' && /^2\.5 bathrooms/i.test(String(it.value || it.value_other))) || fld(it) === 'community', addKF: [['building-services', 'Power backup', 'Standby generator']] })
await run('vyan-villas-ella', { drop: isF('site'), facts: { area: '5 acres of forest land' } })
await run('rudra-wellness-retreat-kalkudah', { drop: isF('site') })
// Recreation & Wellness rows that match an amenity
await run('ocean-breeze-residencies-hikkaduwa', { drop: isF('jacuzzi', 'dining & leisure'), amenities: [['Jacuzzi', 'Private jacuzzi in the three-bedroom duplex plans'], ['Restaurant', 'Restaurant'], ['Bar', 'Bar lounge'], ['Lounge', 'Spa lounge'], ['Spa', 'Spa lounge'], ['Cafe', 'Coffee shop'], ['Function Room', 'Banquet hall']] })
await run('villa-samagi', { drop: (it, g) => /recreation/i.test(g.label || g.key || '') && fld(it) === 'pool', amenities: [['Pool', 'Private pool (3.5 x 10 m lap) with a timber deck']] })
await run('villa-sahana', { drop: (it, g) => /recreation/i.test(g.label || g.key || '') && fld(it) === 'pool', amenities: [['Pool', 'Private pool (3 x 8 m) with a timber deck']] })
await run('street-rush-residencies-mount-lavinia', { drop: isF('common amenities'), amenities: [['Rooftop', 'Roof garden with expansive panoramic views']] })
await run('oceana-wadduwa', { dropTab: /recreation/i, amenities: [
  ['Beach Club', 'Beach club, beach bar, bonfire area, beach beds, hammocks and gazebo, beach volleyball and beach ball, sand pit and sun bath area'],
  ['Water Sports', 'Water slides, water polo, snorkeling gear and water jet'],
  ['Salon', 'Salon'], ['Games Room', 'Carrom, darts and table tennis'], ['Pickleball Court', 'Pickle ball'],
  ['Cafe', 'Coffee shops'], ['Restaurant', 'Al fresco dining'], ['Bar', 'Tavern'], ['Multifunctional Room', 'Multipurpose hall'],
] })
process.exit(0)
