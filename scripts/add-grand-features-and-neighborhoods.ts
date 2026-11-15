/* eslint-disable @typescript-eslint/no-explicit-any -- one-off script */
// Grand Apartments (owner, 2026-11-15: "you have not added Amenities and Features, neighbourhood sections").
// Adds the site's building features that have no amenity option (backup generator, elevators, firefighting system, 24/7 security, surveillance)
// to each project's Key Features ("Building & Services"), and links the neighbourhood where a record exists.
//   NODE_ENV=production npx tsx scripts/add-grand-features-and-neighborhoods.ts [--apply]
import path from 'node:path'
import { config as loadEnv } from 'dotenv'
loadEnv({ path: path.join(process.cwd(), '.env.local') })
const apply = process.argv.includes('--apply')
const cfg = ((await import('../payload.config')) as any).default
const { getPayload } = await import('payload')
const payload = await getPayload({ config: cfg })
const NB: Record<string, string> = { 'grand-oasis-colombo-13': 'colombo-13', 'grand-legacy-colombo-03': 'kollupitiya', 'grand-central-colombo-03': 'kollupitiya', 'grand-heights-colombo-04': 'bambalapitiya', 'grand-capital-colombo-09': 'dematagoda' }
const itemsFn = () => [
  mk('Heating, Cooling & Systems', 'Backup generator'),
  mk('Heating, Cooling & Systems', 'Firefighting system'),
  mk('Additional Spaces', 'Elevators'),
  mk('Smart Home & Security', '24-hour security'),
  mk('Smart Home & Security', 'Surveillance system (CCTV)'),
]
const ROOMS = ['Doors', 'Living Areas', 'Kitchen', 'Bedrooms & Closets', 'Bathroom', 'Heating, Cooling & Systems', 'Additional Spaces', 'Balcony']
// Apartment specifications read off each project's "Apartment Specifications" images on grandapartments.lk (2026-11-15).
type V = { doors: string; living: string; pantry: string; bed: string; bath: string; maid: boolean; geyser: string }
const SPEC: Record<string, V> = {
  'grand-legacy-colombo-03': { doors: 'Solid flush doors with quality ironmongery; powder-coated aluminium sliding balcony doors and windows', living: 'Elegant vitrified porcelain tile flooring', pantry: 'Modern pantry cupboards with gas hob, integrated hood and stainless steel sink; provision for electric geyser', bed: 'Elegant vitrified porcelain tile flooring; TV and telephone points in the master bedroom', bath: 'Non-slip matte tile flooring, vitrified porcelain tile walls, reputed-brand fixtures (American Standard or equivalent) with glass shower partition', maid: true, geyser: 'Electric geyser hot water supply in bathrooms' },
  'grand-central-colombo-03': { doors: 'Solid flush doors with quality ironmongery; powder-coated aluminium sliding balcony doors and windows', living: 'Elegant vitrified porcelain tile flooring', pantry: 'Modern pantry cupboards with gas hob, integrated hood and stainless steel sink; provision for electric geyser', bed: 'Elegant vitrified porcelain tile flooring; TV and telephone points in the master bedroom', bath: 'Non-slip matte tile flooring, vitrified porcelain tile walls, reputed-brand fixtures (American Standard or equivalent) with glass shower partition', maid: true, geyser: 'Electric geyser hot water supply in bathrooms' },
  'grand-heights-colombo-04': { doors: 'Wooden doors with ironmongery (main entrance and bedrooms), wood composite bathroom doors, aluminium balcony doors and windows with aluminium frames', living: 'Modern polished tile flooring', pantry: 'Modern pantry cupboards with counter top and sink', bed: 'Modern polished tile flooring', bath: 'Non-slip matte tile flooring, modern polished tile walls, modern fixtures and accessories', maid: true, geyser: 'Electric geyser in the master bathroom and provision in the common bathroom' },
  'grand-oasis-colombo-13': { doors: 'Wooden doors with ironmongery (main entrance and bedrooms), wood composite bathroom doors, powder-coated aluminium sliding balcony doors and windows', living: 'Modern polished tile flooring', pantry: 'Modern pantry cupboards with stainless steel sink', bed: 'Modern polished tile flooring; TV point in the master bedroom', bath: 'Non-slip matte tile flooring, modern polished tile walls, modern fixtures and accessories', maid: true, geyser: 'Electric geyser in the master bathroom and provision in the common bathroom' },
  'grand-peak-dehiwala': { doors: 'Wooden doors with ironmongery (main entrance and bedrooms), WPC or aluminium bathroom doors, powder-coated aluminium sliding balcony doors and windows', living: 'Modern polished tile flooring', pantry: 'Modern pantry cupboards with sink', bed: 'Modern polished tile flooring', bath: 'Non-slip matte tile flooring, modern polished tile walls, modern fixtures and accessories', maid: true, geyser: 'Electric geyser in the master bathroom and provision in the common bathroom' },
  'grand-court-colombo-14': { doors: 'Wooden doors with ironmongery (main entrance and bedrooms), WPC or aluminium bathroom doors, powder-coated aluminium sliding balcony doors and windows', living: 'Modern polished tile flooring', pantry: 'Modern pantry cupboards with sink', bed: 'Modern polished tile flooring', bath: 'Non-slip matte tile flooring, modern polished tile walls, modern fixtures and accessories', maid: true, geyser: 'Electric geyser in the master bathroom and provision in the common bathroom' },
  'grand-edge-colombo-06': { doors: 'Wooden doors with ironmongery (main entrance and bedrooms), wood composite bathroom doors, aluminium sliding balcony doors and windows with aluminium frames', living: 'Modern polished tile flooring', pantry: 'Modern pantry cupboards with granite top and sink', bed: 'Modern polished tile flooring; TV and telephone points in the master bedroom', bath: 'Non-slip matte tile flooring, modern polished tile walls, modern fixtures and accessories', maid: false, geyser: 'Electric geyser in the master bathroom and provision in the common bathroom' },
  'grand-sky-colombo-06': { doors: 'Wooden doors with ironmongery (main entrance and bedrooms), wood composite bathroom doors, aluminium sliding balcony doors and windows with aluminium frames', living: 'Modern polished tile flooring', pantry: 'Modern pantry cupboards with counter top and sink', bed: 'Modern polished tile flooring', bath: 'Non-slip matte tile flooring, modern polished tile walls, modern fixtures and accessories', maid: true, geyser: 'Electric geyser in the master bathroom and provision in the common bathroom' },
  'grand-capital-colombo-09': { doors: 'Wooden doors with ironmongery (main entrance and bedrooms), wood composite bathroom doors, aluminium sliding balcony doors and windows with aluminium frames', living: 'Modern polished tile flooring', pantry: 'Lower pantry cupboards with granite top and sink', bed: 'Modern polished tile flooring; ceiling fans and light fittings in the master bedroom', bath: 'Non-slip matte tile flooring, modern polished tile walls, modern fixtures and accessories', maid: true, geyser: 'Electric instant geyser in the master bathroom and provision in the common bathroom' },
}
const SO = (await import('../src/collections/shared-fields')) as any
const mk = (field: string, value: string) => {
  // Doors and bathrooms read better as separate bullets: split at commas outside brackets.
  const text = field === 'Doors' || field === 'Bathroom' ? value.replace(/, (?![^()]*\))/g, '; ') : value
  const it: Record<string, any> = { value_other: text }
  const f = (SO.KEY_FEATURE_FIELD_OPTIONS as string[]).find((o) => o === field)
  if (f) it.field = f; else it.field_other = field
  return it
}
// Key Features in four categories (owner, 2026-11-15: "Specifications, Finishes, Safety & Security, Building & Services"); rooms are the fields inside a category.
const pl = (t: string) => t.replace(/ tile$/, ' tiles')
const cap = (t: string) => t.charAt(0).toUpperCase() + t.slice(1)
const lines = (field: string, text: string, split = false) => {
  const t = split ? text.replace(/, (?![^()]*\))/g, '; ') : text
  return t.split(/;\s+/).map((x) => x.trim()).filter(Boolean).map((x) => mk(field, cap(x)))
}
const categories = (v: V) => {
  const tile = pl(v.living.replace(/ flooring$/i, '').toLowerCase())
  const bedParts = v.bed.split(/;\s+/); const bedExtras = bedParts.slice(1)
  const bathParts = v.bath.replace(/, (?![^()]*\))/g, '; ').split(/;\s+/)
  const hasFans = bedExtras.some((x) => /ceiling fans/i.test(x))
  return [
    { key: 'specifications', label: 'Specifications', items: [
      ...lines('Doors', v.doors, true),
      ...lines('Living Areas', 'ceiling fans and light fittings; TV and telephone points'),
      ...lines('Kitchen', v.pantry),
      ...lines('Bedrooms', [...(hasFans ? [] : ['ceiling fans and light fittings']), ...bedExtras].join('; ')),
      ...lines('Bathrooms', [bathParts[2] ?? '', v.geyser].filter(Boolean).join('; ')),
      ...lines('Air Conditioning', 'provision for air conditioning units in the living area and bedrooms'),
      ...(v.maid ? lines("Maid's Room", "maid's toilet and provision for a washing machine") : []),
    ] },
    { key: 'finishes', label: 'Finishes', items: [
      ...lines('Flooring', `living and dining: ${tile}; bedrooms: ${pl(bedParts[0].replace(/ flooring$/i, '').toLowerCase())}; bathrooms: ${pl((bathParts[0] ?? '').replace(/ flooring$/i, '').toLowerCase())}; balconies: non-slip matte finish tiles`),
      ...lines('Walls & Ceilings', `interior walls and ceilings: plaster skim coat with paint; bathroom walls: ${pl((bathParts[1] ?? '').replace(/ walls$/i, '').toLowerCase())}; balcony walls: rough surface finish with paint`),
    ] },
    { key: 'safety-security', label: 'Safety & Security', items: ['24-hour security', 'Surveillance system (CCTV)', 'Firefighting system'].map((value_other) => ({ value_other })) },
    { key: 'building-services', label: 'Building & Services', items: ['Backup generator', 'Elevators'].map((value_other) => ({ value_other })) },
  ]
}
for (const p of (await payload.find({ collection: 'projects', where: { slug: { like: 'grand-' } }, limit: 50, depth: 0, overrideAccess: true })).docs as any[]) {
  if (!SPEC[p.slug]) continue
  const uf = ((p.unitFeatures ?? []) as any[]).filter((g) => !['specifications', 'finishes', 'safety-security', 'building-services'].includes(g.key) && !ROOMS.includes(g.key_other ?? '')).map((g) => ({ key: g.key, label: g.label, items: (g.items ?? []).map((i: any) => { const { id: _id, ...rest } = i; return rest }) }))
  if (SPEC[p.slug]) uf.unshift(...categories(SPEC[p.slug]))
  const data: Record<string, any> = { unitFeatures: uf }
  let nbNote = '-'
  if (NB[p.slug]) {
    const nb: any = (await payload.find({ collection: 'neighborhoods', where: { slug: { equals: NB[p.slug] } }, limit: 1, depth: 0, overrideAccess: true })).docs[0]
    if (nb) { data.neighborhood = nb.id; data.neighborhoodSlug = nb.slug; nbNote = 'linked ' + nb.slug } else nbNote = 'NO RECORD ' + NB[p.slug]
  }
  console.log(p.slug, 'features +' + itemsFn().length, nbNote)
  if (apply) await payload.update({ collection: 'projects', id: p.id, data: data as never, overrideAccess: true })
}
console.log(apply ? 'APPLIED' : 'DRY RUN')
process.exit(0)
