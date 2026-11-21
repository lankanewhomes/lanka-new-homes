/* eslint-disable @typescript-eslint/no-explicit-any */
// Marina Square Key Features (owner, 2026-11-09). Only what the developer states: the compare-apartments / condo-type pages (features list), the FAQ
// (car parks, smart home) and the project-progress page (brand partners). Nothing invented.
//   NODE_ENV=production npx tsx scripts/add-marina-square-key-features.ts
import path from 'node:path'
import { config as loadEnv } from 'dotenv'
loadEnv({ path: path.join(process.cwd(), '.env.local') })
const cfg = ((await import('../payload.config')) as any).default
const { getPayload } = await import('payload')
const SO = (await import('../src/collections/shared-fields')) as any
const payload = await getPayload({ config: cfg })
const SLUG = process.env.MS_SLUG ?? 'marina-square-uptown-colombo'
const p: any = (await payload.find({ collection: 'projects' as never, where: { slug: { equals: SLUG } }, limit: 1, overrideAccess: true, depth: 0 })).docs[0]
const G: [string, [string, string][]][] = [
  ['indoor', [
    ['Kitchen', 'Pantry cupboard with hob, hood, oven, microwave and washing machine'],
    ['Kitchen', 'Häcker kitchens'],
    ['Bathroom', 'European-standard bathroom fittings (Kohler sanitary fittings)'],
    ['Heating, Cooling & Systems', 'Air conditioning and ceiling fans in the living and dining area and bedrooms (Panasonic air conditioning)'],
    ['Smart Home & Security', 'FTTH / smart-home enabled'],
    ['Smart Home & Security', 'IPTV system'],
    ['Smart Home & Security', 'Yale digital door locks'],
    ['Storage & Utility', 'LP gas on tap'],
    ['Additional Spaces', "Maid's room (selected units, including the 4-bedroom penthouses)"],
  ]],
  ['building-services', [
    ['Additional Spaces', 'TKE elevators'],
    ['Parking', 'One car park per unit; two car parks for 4-bedroom units'],
  ]],
  ['outdoor', [
    ['Garden', 'Private gardens (2, 2.5 and 3 bedroom terrace duplexes on levels 6 and 7)'],
    ['Landscaping', 'Over two acres of landscaped gardens and sky decks'],
  ]],
]
const fieldOpts: string[] = SO.KEY_FEATURE_FIELD_OPTIONS, valueOpts: string[] = SO.KEY_FEATURE_VALUE_OPTIONS
const unitFeatures = G.map(([key, items]) => ({
  key,
  items: items.map(([field, value]) => {
    const it: any = {}
    if (fieldOpts.includes(field)) it.field = field; else it.field_other = field
    if (valueOpts.includes(value)) it.value = value; else it.value_other = value
    return it
  }),
}))
const r: any = await payload.update({ collection: 'projects' as never, id: p.id, overrideAccess: true, data: { unitFeatures } as never })
console.log('groups', r.unitFeatures?.length, 'items', r.unitFeatures?.reduce((n: number, g: any) => n + (g.items?.length ?? 0), 0), '| plans', r.floorPlans?.length, 'gallery', r.gallery?.length)
process.exit(0)
