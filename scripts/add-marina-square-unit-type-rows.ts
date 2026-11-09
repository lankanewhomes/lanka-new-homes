/* eslint-disable @typescript-eslint/no-explicit-any */
// Marina Square: one floor-plan row per unit label on the developer's "Typical Floor Plans" PDF (owner choice 2026-11-09).
// Bedrooms come from the label prefix (1, 1.5, 2, 3); the PDF and site publish NO sizes, bathrooms or prices for these, so those stay 0 and are not shown.
// Availability is set to "Limited" because the developer's own search lists no 1-3 bedroom units (likely sold out) and the field has no "enquire" value.
//   NODE_ENV=production npx tsx scripts/add-marina-square-unit-type-rows.ts
import path from 'node:path'
import { config as loadEnv } from 'dotenv'
loadEnv({ path: path.join(process.cwd(), '.env.local') })
const cfg = ((await import('../payload.config')) as any).default
const { getPayload } = await import('payload')
const payload = await getPayload({ config: cfg })
const SLUG = process.env.MS_SLUG ?? 'marina-square-uptown-colombo'
const p: any = (await payload.find({ collection: 'projects' as never, where: { slug: { equals: SLUG } }, limit: 1, overrideAccess: true, depth: 0 })).docs[0]
const plate = (needle: string) => (p.blockPlanImages ?? []).find((x: any) => x.image.includes(needle))?.image as string
const P = {
  bc: plate('tower-bc-levels-5-31'), bc2: plate('tower-bc-levels-10-21'), d7: plate('tower-djp-levels-7-10'), d11: plate('tower-djp-levels-11-34'), j: plate('tower-j-levels-29-31'),
}
for (const [k, v] of Object.entries(P)) if (!v) throw new Error('missing plate ' + k)
const pdf = p.brochureUrl as string
// [label, plate, floors, view]
const U: [string, string, string, string | null][] = [
  ['3A', P.bc, '5-31 (Towers B, C)', 'Sea View'], ['3B', P.bc, '5-31 (Towers B, C)', 'Sea View'], ['3C', P.bc, '5-31 excluding 10 and 21 (Towers B, C)', 'Sea View'],
  ['3F', P.d11, '11-34 (Towers D, J, P)', 'Sea View'], ['3G', P.d11, '11-34 (Towers D, J, P)', 'Sea View'], ['3H', P.d11, '11-34 (Towers D, J, P)', 'City View'],
  ['3J', P.d11, '11-34 (Towers D, J, P)', 'City View'], ['3R', P.bc, '5-31 (Towers B, C)', null],
  ['2A', P.d7, '7-10 (Towers D, J, P)', 'Sea View'], ['2B', P.d7, '7-10 (Towers D, J, P)', 'Sea View'], ['2C', P.d7, '7-10 (Towers D, J, P)', 'City View'], ['2D', P.d7, '7-10 (Towers D, J, P)', 'City View'],
  ['2F', P.d11, '11-34 (Towers D, J, P)', 'Sea View'], ['2G', P.d11, '11-34 (Towers D, J, P)', 'Sea View'], ['2H', P.d11, '11-34 (Towers D, J, P)', 'City View'], ['2J', P.d11, '11-34 (Towers D, J, P)', 'City View'],
  ['2L', P.j, '29-31 (Tower J)', 'Sea View'], ['2M', P.j, '29-31 (Tower J)', 'City View'], ['2S', P.bc, '5-31 (Towers B, C)', null], ['2T', P.bc, '5-31 (Towers B, C)', null],
  ['1.5A', P.d7, '7-10 (Towers D, J, P)', 'Sea View'], ['1.5B', P.d7, '7-10 (Towers D, J, P)', 'Sea View'], ['1.5C', P.d7, '7-10 (Towers D, J, P)', 'City View'], ['1.5D', P.d7, '7-10 (Towers D, J, P)', 'City View'],
  ['1A', P.d7, '7-10 (Towers D, J, P)', 'Sea View'], ['1B', P.d7, '7-10 (Towers D, J, P)', 'Sea View'], ['1C', P.d7, '7-10 (Towers D, J, P)', 'City View'], ['1D', P.d7, '7-10 (Towers D, J, P)', 'City View'],
  ['1E', P.bc2, '10 and 21 (Towers B, C)', 'Sea View'],
]
const existing = p.floorPlans ?? []
const have = new Set(existing.map((x: any) => String(x.planName).split(' ')[0]))
const rows = U.filter(([l]) => !have.has(l)).map(([label, image, floors, view]) => {
  const beds = parseFloat(label)
  const row: any = {
    planName: `${label} - ${beds === 1 ? '1 Bedroom' : `${beds} Bedroom`}`, bedrooms: beds, bathrooms: 0, floorAreaSqFt: 0, startingPriceLkr: 0,
    availability: 'Limited', image, floorRange: floors, parkingSpaces: 1, planDocuments: [{ label: 'Typical floor plans (PDF)', url: pdf }],
  }
  if (view) row.view = view
  return row
})
const r: any = await payload.update({ collection: 'projects' as never, id: p.id, overrideAccess: true, data: { floorPlans: [...existing, ...rows] } as never })
console.log('floor plans', existing.length, '+', rows.length, '=>', r.floorPlans.length, '| first', r.floorPlans[0].planName, r.floorPlans[0].image3d ? '3d ok' : '3d MISSING', '| gallery', r.gallery?.length, 'amenities', r.amenities?.length)
process.exit(0)
