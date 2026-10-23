/* eslint-disable @typescript-eslint/no-explicit-any -- one-off rebuild */
// ICON V Talpe and Lakefront Residencies lost lists in Payload (found 2026-10-23; mirror empty too). Rebuilt from what survives:
//  - ICON V Talpe: gallery / plan / road-map images in R2; plan sizes and room counts READ FROM THE PLAN IMAGES themselves (each plan states its
//    area and numbers its rooms); amenities from the developer's page; Galle Fort distance from the page.
//  - Lakefront: plan table from docs/listings/lakefront-residencies.md (+ R2 plan images), amenities and the six brochure places from the same report.
// Only fills lists that are EMPTY in Payload. Key Features / Ownership groups of these two are not recoverable from these sources.
import path from 'node:path'
import { config as loadEnv } from 'dotenv'
import { ListObjectsV2Command, S3Client } from '@aws-sdk/client-s3'
loadEnv({ path: path.join(process.cwd(), '.env.local') })
const cfg = ((await import('../payload.config')) as any).default
const { getPayload } = await import('payload')
const SO: any = await import('../src/collections/shared-fields')
const payload = await getPayload({ config: cfg })
const PUB = (process.env.R2_PUBLIC_URL ?? '').replace(/\/+$/, '')
const s3 = new S3Client({ region: 'auto', endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`, credentials: { accessKeyId: process.env.R2_ACCESS_KEY_ID!, secretAccessKey: process.env.R2_SECRET_ACCESS_KEY! }, forcePathStyle: true })
const listDir = async (slug: string, dir: string) => {
  const out: string[] = []; let token: string | undefined
  do { const r: any = await s3.send(new ListObjectsV2Command({ Bucket: process.env.R2_BUCKET!, Prefix: `projects/${slug}/${dir}/`, ContinuationToken: token })); for (const o of r.Contents ?? []) out.push(o.Key!); token = r.IsTruncated ? r.NextContinuationToken : undefined } while (token)
  return out.sort()
}
const url = (k: string) => `${PUB}/${k}`
const label = (slug: string, key: string) => { const b = key.split('/').pop()!.replace(/\.[a-z0-9]+$/i, '').replace(new RegExp(`^${slug}_`), '').replace(/[-_]+/g, ' ').trim(); return b.charAt(0).toUpperCase() + b.slice(1) }
const vocab = (names: string[]) => names.filter((n) => (SO.AMENITY_NAME_OPTIONS as string[]).includes(n)).map((name) => ({ name }))
const fp = (slug: string, f: string) => url(`projects/${slug}/floor-plans/${slug}_${f}`)
const find = async (slug: string) => (await payload.find({ collection: 'projects', where: { slug: { equals: slug } }, limit: 1, depth: 0, overrideAccess: true, draft: true })).docs[0] as any

async function apply(slug: string, want: Record<string, any>) {
  const doc = await find(slug)
  const data: any = {}
  for (const [k, v] of Object.entries(want)) if (!(doc[k]?.length) && v?.length) data[k] = v
  if (!Object.keys(data).length) { console.log('nothing to do', slug); return }
  await payload.update({ collection: 'projects', id: doc.id, overrideAccess: true, data } as never)
  const a = await find(slug)
  console.log(slug, JSON.stringify(Object.fromEntries(Object.keys(want).map((k) => [k, `${doc[k]?.length ?? 0}->${a[k]?.length ?? 0}`]))))
}

// ---------------- ICON V Talpe
{
  const slug = 'luxury-apartments-icon-v-talpe'
  const gal = [...(await listDir(slug, 'gallery')), ...(await listDir(slug, 'amenities'))].filter((k) => /\.(jpe?g|png|webp)$/i.test(k))
  const plan = (name: string, f: string, beds: number, baths: number, sqft: number) => ({ planName: name, startingPriceLkr: 0, bedrooms: beds, bathrooms: baths, floorAreaSqFt: sqft, image: fp(slug, `${f}-plan.jpg`), image3d: fp(slug, `${f}.jpg`), availability: 'Available' })
  await apply(slug, {
    gallery: gal.map((k) => ({ label: label(slug, k), image: url(k) })),
    floorPlans: [
      plan('Coast Deluxe', 'coast-deluxe', 1, 1, 397), plan('Coast Executive', 'coast-executive', 1, 1, 666),
      plan('Ocean Prestige', 'ocean-prestige', 2, 1, 806), plan('Ocean Premium', 'ocean-premium', 2, 1, 936),
      plan('Ocean Elite', 'ocean-elite', 2, 1, 1231), plan('Horizon Suite', 'horizon-suite', 3, 0, 1547),
    ],
    roadMapImages: [{ label: 'Location map', image: url(`projects/${slug}/road-map/${slug}_location-map.jpg`) }, { label: 'Experience map', image: url(`projects/${slug}/road-map/${slug}_experience-map.jpg`) }],
    amenities: vocab(['Infinity Pool', 'Gym', 'Restaurant', 'Security', 'Rooftop', 'Wellness Center', 'Spa']),
    nearby: [{ category: 'Landmark', name: 'Galle Fort (about 15 min)' }],
  })
}
// ---------------- Lakefront Residencies
{
  const slug = 'lakefront-residencies'
  const P = (name: string, f: string, beds: number, baths: number, sqft: number, floors: string[] = []) => ({
    planName: name, startingPriceLkr: 0, bedrooms: beds, bathrooms: baths, floorAreaSqFt: sqft, image: fp(slug, `${f}.svg`),
    ...(floors.length ? { floorAvailability: floors.map((floor) => ({ floor, available: true })) } : {}),
  })
  await apply(slug, {
    floorPlans: [
      P('Studio (Type A)', 'studio-type-a', 1, 1, 472), P('One Bedroom (Type B)', 'one-bedroom-type-b', 1, 1, 721), P('Two Bedroom (Type C)', 'two-bedroom-type-c', 2, 2, 815),
      P('Two Bedroom (Type D)', 'two-bedroom-type-d', 2, 1, 903, ['First Floor', 'Second Floor']), P('Two Bedroom (Type E)', 'two-bedroom-type-e', 2, 2, 936, ['First Floor']),
      P('Two Bedroom (Type F)', 'two-bedroom-type-f', 2, 2, 953), P('Two Bedroom Duplex (Type G)', 'two-bedroom-duplex-type-g', 2, 2, 968, ['Third Floor']),
      P('Three Bedroom (Type H)', 'three-bedroom-type-h', 3, 2, 1081), P('Three Bedroom Duplex (Type J)', 'three-bedroom-duplex-type-j', 3, 2, 1184), P('Four Bedroom Duplex (Type K)', 'four-bedroom-duplex-type-k', 4, 4, 1600),
    ],
    amenities: vocab(['Pool', 'Gym', 'Parking', 'Security', 'Garden', 'Lake View', 'Hotel', 'Games Room']),
    nearby: [
      { category: 'Landmark', name: 'Lake Gregory (150 m)', distanceKm: 0.15 }, { category: 'Landmark', name: 'Pedro Tea Estate (400 m)', distanceKm: 0.4 },
      { category: 'Landmark', name: 'Race Course (800 m)', distanceKm: 0.8 }, { category: 'Landmark', name: 'Galway National Park (800 m)', distanceKm: 0.8 },
      { category: 'Landmark', name: 'Victoria Park (1.8 km)', distanceKm: 1.8 }, { category: 'Landmark', name: 'Golf Club (2 km)', distanceKm: 2 },
    ],
  })
}
process.exit(0)
