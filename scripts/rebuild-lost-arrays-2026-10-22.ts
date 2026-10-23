/* eslint-disable @typescript-eslint/no-explicit-any -- one-off rebuild */
// Rebuild (2026-10-22/23): six listings lost their gallery / floor plans in Payload and the Supabase mirror was empty too. Rebuilt from
// what survives: the R2 images (every file is still there), the listing reports in docs/listings/<slug>.md (plan names, beds, baths,
// sizes, available floors) and the developers' sites. Only facts from those sources; fields the report does not hold stay empty.
//   SLUGS=a,b NODE_ENV=production npx tsx scripts/rebuild-lost-arrays-2026-10-22.ts   (only fills arrays that are EMPTY in Payload)
import path from 'node:path'
import { config as loadEnv } from 'dotenv'
import { ListObjectsV2Command, S3Client } from '@aws-sdk/client-s3'
loadEnv({ path: path.join(process.cwd(), '.env.local') })
const cfg = ((await import('../payload.config')) as any).default
const { getPayload } = await import('payload')
const payload = await getPayload({ config: cfg })
const PUB = (process.env.R2_PUBLIC_URL ?? '').replace(/\/+$/, '')
const s3 = new S3Client({ region: 'auto', endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`, credentials: { accessKeyId: process.env.R2_ACCESS_KEY_ID!, secretAccessKey: process.env.R2_SECRET_ACCESS_KEY! }, forcePathStyle: true })
const listDir = async (slug: string, dir: string): Promise<string[]> => {
  const keys: string[] = []
  let token: string | undefined
  do {
    const r: any = await s3.send(new ListObjectsV2Command({ Bucket: process.env.R2_BUCKET!, Prefix: `projects/${slug}/${dir}/`, ContinuationToken: token }))
    for (const o of r.Contents ?? []) keys.push(o.Key!)
    token = r.IsTruncated ? r.NextContinuationToken : undefined
  } while (token)
  return keys.sort()
}
const url = (key: string) => `${PUB}/${key}`
const label = (slug: string, key: string) => {
  const base = key.split('/').pop()!.replace(/\.[a-z0-9]+$/i, '').replace(new RegExp(`^${slug}_`), '').replace(/[-_]+/g, ' ').trim()
  return base.charAt(0).toUpperCase() + base.slice(1)
}
const floors = (list: string[]) => list.map((floor) => ({ floor, available: true }))

type Plan = { name: string; beds: number; baths: number; sqft: number; img?: string; img3d?: string; floorRange?: string; floors?: string[]; availability?: string; outdoor?: string; terraces?: number; terraceType?: string; unitsInPlan?: number; unitsAvailable?: number }
const P = (slug: string, plans: Plan[]) => plans.map((p) => ({
  planName: p.name, startingPriceLkr: 0, bedrooms: p.beds, bathrooms: p.baths, floorAreaSqFt: p.sqft,
  ...(p.img ? { image: url(`projects/${slug}/floor-plans/${slug}_${p.img}`) } : {}),
  ...(p.img3d ? { image3d: url(`projects/${slug}/floor-plans/${slug}_${p.img3d}`) } : {}),
  ...(p.floorRange ? { floorRange: p.floorRange } : {}), ...(p.floors?.length ? { floorAvailability: floors(p.floors) } : {}),
  ...(p.availability ? { availability: p.availability } : {}), ...(p.outdoor ? { outdoorSpace: p.outdoor } : {}),
  ...(p.terraces ? { terraces: p.terraces } : {}), ...(p.terraceType ? { terraceType: p.terraceType } : {}),
  ...(p.unitsInPlan ? { unitsInPlan: p.unitsInPlan } : {}), ...(p.unitsAvailable !== undefined ? { unitsAvailable: p.unitsAvailable } : {}),
}))

const NEG = 'ocean-breeze-negombo-phase-two'
const HIK = 'ocean-breeze-residencies-hikkaduwa'
const PLANS: Record<string, any[]> = {
  'fairway-latitude': P('fairway-latitude', [
    { name: '2BR-B1', beds: 2, baths: 2, sqft: 902, img: '2br-b1.jpg', terraces: 1, terraceType: 'Open', outdoor: 'Terraces', unitsInPlan: 22, unitsAvailable: 8, availability: 'Available' },
    { name: '2BR-B2', beds: 2, baths: 2, sqft: 902, img: '2br-b2.jpg', terraces: 1, terraceType: 'Open', outdoor: 'Terraces', unitsInPlan: 22, unitsAvailable: 0, availability: 'Sold Out' },
    { name: '3BR-A1', beds: 3, baths: 2, sqft: 1523, img: '3br-a1.jpg', terraces: 3, terraceType: 'Open', outdoor: 'Terraces', unitsInPlan: 22, unitsAvailable: 15, availability: 'Available' },
    { name: '3BR-A2', beds: 3, baths: 2, sqft: 1523, img: '3br-a2.jpg', terraces: 3, terraceType: 'Open', outdoor: 'Terraces', unitsInPlan: 22, unitsAvailable: 9, availability: 'Available' },
    { name: '3BR-C1', beds: 3, baths: 2, sqft: 1533, img: '3br-c1.jpg', terraces: 3, terraceType: 'Open', outdoor: 'Terraces', unitsInPlan: 22, unitsAvailable: 11, availability: 'Available' },
    { name: '3BR-D1', beds: 3, baths: 2, sqft: 1392, img: '3br-d1.jpg', terraces: 3, terraceType: 'Open', outdoor: 'Terraces', unitsInPlan: 22, unitsAvailable: 13, availability: 'Available' },
    { name: '3BR-E1', beds: 3, baths: 2, sqft: 1441, img: '3br-e1.jpg', terraces: 2, terraceType: 'Covered', outdoor: 'Terraces', unitsInPlan: 21, unitsAvailable: 12, availability: 'Available' },
    { name: '3BR-E2', beds: 3, baths: 2, sqft: 1441, img: '3br-e2.jpg', terraces: 2, terraceType: 'Covered', outdoor: 'Terraces', unitsInPlan: 21, unitsAvailable: 12, availability: 'Available' },
    { name: '4BR-E1E2', beds: 4, baths: 3, sqft: 2881, img: '4br-e1e2.jpg', terraces: 4, terraceType: 'Covered', outdoor: 'Terraces' },
    { name: 'Penthouse', beds: 4, baths: 0, sqft: 4200, unitsInPlan: 2, unitsAvailable: 2, availability: 'Available' },
  ]),
  [NEG]: P(NEG, [
    { name: '3 Bedroom Suite - Type A', beds: 3, baths: 2, sqft: 702, img: '3br-a.svg' },
    { name: '3 Bedroom Suite - Type B', beds: 3, baths: 2, sqft: 662, img: '3br-b.svg', floors: ['Floor 17 (R15)', 'Floor 20 (R18)'] },
    { name: '3 Bedroom Suite - Type C', beds: 3, baths: 2, sqft: 652, img: '3br-c.svg', floors: ['Floor 18 (R16)', 'Floor 21 (R19)'] },
    { name: '3 Bedroom Suite - Type N', beds: 3, baths: 2, sqft: 932, img: '3br-n.svg', floors: ['Floor 15 (R12)', 'Floor 17 (R15)', 'Floor 18 (R16)', 'Floor 20 (R18)', 'Floor 21 (R19)', 'Floor 23 (R21)'] },
    { name: '3 Bedroom Suite - Type O', beds: 3, baths: 2, sqft: 916, img: '3br-o.svg', floors: ['Floor 16 (R14)', 'Floor 18 (R16)', 'Floor 19 (R17)', 'Floor 22 (R20)'] },
    { name: '3 Bedroom Suite - Type P', beds: 3, baths: 2, sqft: 940, img: '3br-p.svg', floors: ['Floor 16 (R14)', 'Floor 17 (R15)', 'Floor 19 (R17)', 'Floor 20 (R18)', 'Floor 22 (R20)', 'Floor 23 (R21)'] },
    { name: '3 Bedroom Suite - Type S', beds: 3, baths: 3, sqft: 1049, img: '3br-s.svg' },
    { name: '2 Bedroom Suite - Type A1', beds: 2, baths: 1, sqft: 503, img: '2br-a1.svg' },
    { name: '2 Bedroom Suite - Type B1', beds: 2, baths: 1, sqft: 492, img: '2br-b1.svg', floors: ['Floor 05 (R2)'] },
    { name: '2 Bedroom Suite - Type C1', beds: 2, baths: 1, sqft: 470, img: '2br-c1.svg' },
    { name: '2 Bedroom Suite - Type D', beds: 2, baths: 2, sqft: 607, img: '2br-d.svg' },
    { name: '2 Bedroom Suite - Type E', beds: 2, baths: 2, sqft: 593, img: '2br-e.svg' },
    { name: '2 Bedroom Suite - Type F', beds: 2, baths: 2, sqft: 579, img: '2br-f.svg' },
    { name: '1 Bedroom Suite - Type G', beds: 1, baths: 1, sqft: 410, img: '1br-g.svg' },
    { name: '1 Bedroom Suite - Type H', beds: 1, baths: 1, sqft: 441, img: '1br-h.svg', floors: ['Floor 20 (R18)'] },
    { name: '1 Bedroom Suite - Type J', beds: 1, baths: 1, sqft: 536, img: '1br-j.svg' },
    { name: 'Deluxe Studio - Type A2', beds: 0, baths: 1, sqft: 247, img: 'studio-a2.svg' },
    { name: 'Deluxe Studio - Type B2', beds: 0, baths: 1, sqft: 241, img: 'studio-b2.svg' },
    { name: 'Deluxe Studio - Type C2', beds: 0, baths: 1, sqft: 233, img: 'studio-c2.svg' },
    { name: 'Deluxe Studio - Type K', beds: 0, baths: 1, sqft: 293, img: 'studio-k.svg' },
    { name: 'Deluxe Studio - Type L', beds: 0, baths: 1, sqft: 263, img: 'studio-l.svg' },
    { name: 'Deluxe Studio - Type M', beds: 0, baths: 1, sqft: 231, img: 'studio-m.svg' },
  ]),
  [HIK]: P(HIK, [
    { name: 'Studio', beds: 1, baths: 1, sqft: 448, img: 'studio.svg' },
    { name: 'One Bedroom', beds: 1, baths: 1, sqft: 523, img: 'one-bedroom.svg' },
    { name: 'Two Bedroom', beds: 2, baths: 1, sqft: 1031, img: 'two-bedroom.svg' },
    { name: 'Two Bedroom Dual Key', beds: 2, baths: 2, sqft: 1022, img: 'two-bedroom-dk.svg' },
    { name: 'One Bedroom Duplex', beds: 1, baths: 1, sqft: 587, img: 'one-bedroom-d.svg' },
    { name: 'Two Bedroom Duplex Dual Key', beds: 2, baths: 2, sqft: 1500, img: 'two-bedroom-d.svg' },
    { name: 'Three Bedroom Duplex Dual Key', beds: 3, baths: 3, sqft: 1721, img: 'three-bedroom-ddk.svg' },
    { name: 'Three Bedroom Duplex', beds: 3, baths: 2, sqft: 1574, img: 'three-bedroom-d.svg' },
  ]),
  'aathavan-apartments-dehiwala': P('aathavan-apartments-dehiwala', [
    { name: 'Type 1', beds: 3, baths: 0, sqft: 1185, floorRange: '2, 3, 4, 5 of 6', availability: 'Available' },
    { name: 'Type 2', beds: 3, baths: 0, sqft: 1390, floorRange: '2, 3, 4 of 6', availability: 'Available' },
    { name: 'Type 3', beds: 2, baths: 0, sqft: 1065, floorRange: '2, 3, 5 of 6', availability: 'Available' },
    { name: 'Type 4', beds: 2, baths: 0, sqft: 1045, floorRange: '2, 3, 4, 5 of 6', availability: 'Available' },
    { name: 'Type 5', beds: 3, baths: 0, sqft: 1370, floorRange: '2, 3, 4 of 6', availability: 'Available' },
    { name: 'Type 6', beds: 3, baths: 0, sqft: 1260, floorRange: '1, 2, 3, 4, 5 of 7', availability: 'Available' },
    { name: 'Type 7', beds: 3, baths: 0, sqft: 1210, floorRange: '2, 3, 4, 5 of 6', availability: 'Available' },
    { name: 'Type 8', beds: 3, baths: 0, sqft: 1589, floorRange: '1 of 1', availability: 'Available' },
  ]),
  'rush-court-4-mount-lavinia': P('rush-court-4-mount-lavinia', [
    { name: 'Unit A', beds: 3, baths: 2, sqft: 1010, img: 'unit-a.jpg', img3d: 'unit-a-3d.png', availability: 'Sold Out' },
    { name: 'Unit B', beds: 2, baths: 1, sqft: 820, img: 'unit-b.jpg', img3d: 'unit-b-3d.png', availability: 'Sold Out' },
    { name: 'Unit C', beds: 2, baths: 1, sqft: 800, img: 'unit-c.jpg', img3d: 'unit-c-3d.png', availability: 'Sold Out' },
    { name: 'Unit D', beds: 3, baths: 2, sqft: 1010, img: 'unit-d.jpg', img3d: 'unit-d-3d.png', availability: 'Sold Out' },
  ]),
}

for (const slug of (process.env.SLUGS ?? '').split(',').filter(Boolean)) {
  const doc: any = (await payload.find({ collection: 'projects', where: { slug: { equals: slug } }, limit: 1, depth: 0, overrideAccess: true, draft: true })).docs[0]
  if (!doc) { console.log('missing', slug); continue }
  const data: any = {}
  if (!(doc.gallery?.length)) {
    const keys = [...(await listDir(slug, 'gallery')), ...(await listDir(slug, 'amenities'))].filter((k) => /\.(jpe?g|png|webp)$/i.test(k) && !/video-thumbnail/.test(k))
    if (keys.length) data.gallery = keys.map((k) => ({ label: label(slug, k), image: url(k) }))
  }
  if (!(doc.floorPlans?.length) && PLANS[slug]) data.floorPlans = JSON.parse(JSON.stringify(PLANS[slug]))
  if (!Object.keys(data).length) { console.log('nothing to rebuild', slug); continue }
  const norm = (target: any, key: string) => { if (target[key] !== undefined) { target[`${key}_other`] = target[key]; delete target[key] } }
  let saved = false
  for (let attempt = 0; attempt < 8 && !saved; attempt++) {
    try { await payload.update({ collection: 'projects', id: doc.id, overrideAccess: true, data } as never); saved = true } catch (e: any) {
      const errs = e?.data?.errors ?? []
      if (!errs.length) throw e
      let fixed = false
      for (const x of errs) {
        if (!/invalid selection/i.test(String(x.message ?? ''))) { console.log('  other validation error:', x.path, x.message); continue }
        const m = String(x.path ?? '').match(/^(\w+)\.(\d+)\.(\w+)(?:\.(\d+)\.(\w+))?/)
        if (!m || !Array.isArray(data[m[1]])) continue
        const item = data[m[1]][Number(m[2])]
        if (m[4] !== undefined && Array.isArray(item[m[3]])) { norm(item[m[3]][Number(m[4])], m[5]); fixed = true } else { norm(item, m[3]); fixed = true }
        console.log('  select moved to *_other:', x.path)
      }
      if (!fixed) throw e
    }
  }
  if (!saved) { console.log('FAILED to save', slug); continue }
  const after: any = (await payload.find({ collection: 'projects', where: { slug: { equals: slug } }, limit: 1, depth: 0, overrideAccess: true, draft: true })).docs[0]
  console.log('rebuilt', slug, 'gallery', doc.gallery?.length ?? 0, '->', after.gallery?.length ?? 0, '| floorPlans', doc.floorPlans?.length ?? 0, '->', after.floorPlans?.length ?? 0)
}
process.exit(0)
