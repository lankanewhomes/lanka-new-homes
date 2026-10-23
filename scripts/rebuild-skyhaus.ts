/* eslint-disable @typescript-eslint/no-explicit-any -- one-off rebuild */
// Skyhaus Colombo 07: gallery, floor plans, nearby, amenities, Key Features and Ownership & Services vanished from Payload (found 2026-10-23; the
// Supabase mirror was empty too). Every value below is the one scripts/import-cpg-batch-1.ts imported on 2026-10-11 from cpg.lk/projects/skyhaus/;
// the images are still in R2. Only fills lists that are EMPTY in Payload.
import path from 'node:path'
import { config as loadEnv } from 'dotenv'
loadEnv({ path: path.join(process.cwd(), '.env.local') })
const cfg = ((await import('../payload.config')) as any).default
const { getPayload } = await import('payload')
const SO: any = await import('../src/collections/shared-fields')
const payload = await getPayload({ config: cfg })
const SS = 'skyhaus-colombo-07'
const PUB = (process.env.R2_PUBLIC_URL ?? '').replace(/\/+$/, '')
const R2 = (sub: string, name: string, ext = 'jpg') => `${PUB}/projects/${SS}/${sub}/${SS}_${name}.${ext}`
const lkr = (usd: number) => Math.round((usd * 330.716) / 100000) * 100000
const feat = (field_other: string, value_other: string) => ({ field_other, value_other })

const gal: [string, string][] = [
  ['exterior-tower-park', 'Skyhaus tower beside Viharamahadevi Park'], ['facade-terraces', 'Planted terraces on the Skyhaus facade'], ['living-bar-terrace', 'Living area, bar and terrace'],
  ['living-room', 'Residence living room'], ['living-room-feature-wall', 'Living room with feature wall'], ['bedroom-garden', 'Bedroom with garden windows'],
  ['bedroom-city-view', 'Bedroom with city view'], ['bathroom', 'Residence bathroom'], ['residence-entrance', 'Residence entrance and terrace'], ['terrace-city-view', 'Terrace with city view'],
  ['terrace-lounge', 'Terrace lounge among greenery'], ['courtyard-water-feature', 'Courtyard with water feature'], ['rooftop-pool-aerial', 'Rooftop pool from above'], ['gym-treadmills', 'Gymnasium cardio area'],
]
const gallery = [...gal.map(([k, label]) => ({ label, image: R2('gallery', k) })), { label: 'Rooftop Infinity Pool', image: R2('amenities', 'rooftop-infinity-pool') }, { label: 'Gym', image: R2('amenities', 'gym') }]
const plan = (o: { name: string; file: string; sqft: number; avail: number; usd: number }) => ({ planName: o.name, bedrooms: 4, bathrooms: 4, floorAreaSqFt: o.sqft, startingPriceLkr: lkr(o.usd), unitsAvailable: o.avail, image: R2('floor-plans', o.file), availability: 'Available' })
const floorPlans = [plan({ name: 'East', file: 'east', sqft: 3300, avail: 5, usd: 965000 }), plan({ name: 'West', file: 'west', sqft: 3200, avail: 3, usd: 960000 })]
const unitFeatures = [
  { key: 'indoor', items: [
    feat('Privacy', 'Only two residences on each floor; the elevator opens directly into your residence with no shared corridors'),
    feat('Living Areas', 'Dining, living and salon space with a kitchen and bar; extra-height ceilings'),
    feat('Flooring & Finishes', 'Wood flooring through the living spaces and marble counters in the kitchens and bathrooms'),
    feat('Heating, Cooling & Systems', 'Low thermal density cooling materials'),
    feat('Additional Spaces', 'Four bedrooms, a courtyard and a powder room in each residence'),
  ] },
  { key: 'outdoor', items: [
    feat('Balcony', 'Expansive private terraces overlooking Viharamahadevi Park'),
    feat('Landscaping', 'Green terraces and a vertical forest facade watered by a central drip irrigation system'),
    feat('Wellness', 'Cold plunge'), feat('Bar', 'Private in-house bar'), feat('Valet', 'Doorman, valet and porter services'),
  ] },
]
const ownershipServices = [{ key: 'After-Sales & Services', items: [
  { field: 'Property Management', value: 'Serviced and staffed by The One Group of Hotels, with a dedicated residence management team' },
  { field: 'Resident Services', value: '24-hour concierge, doorman and valet, pool lifeguard, 24-hour maintenance support, common area cleaning, post and package services' },
  { field_other: 'Services On Request', value: 'Private chef, housekeeping, maintenance, in-home personal training, child care, landscaping, away-from-home repairs, porter services, vendor coordination, event planning and catering, dry cleaning and laundry' },
  { field_other: 'Owner Privileges', value: 'Home Around The Pearl: discounted stays, dining and spa across The One Group of Hotels resorts, and complimentary use of their pools, lounges and gymnasiums' },
] }]
const amenities = ['Rooftop Infinity Pool', 'Pickleball Court', 'Gym', 'Steam Room', 'Sauna', 'Concierge', 'Parking', 'Private Elevator', 'Security'].filter((n) => (SO.AMENITY_NAME_OPTIONS as string[]).includes(n)).map((name) => ({ name }))
const nearby = [
  { category: 'Hospital', name: 'Nawaloka Hospital (5 min)' }, { category: 'Shopping', name: 'Keells Supermarket (5 min)' }, { category: 'School', name: "Bishop's College (3 min)" },
  { category: 'School', name: 'Colombo International School (5 min)' }, { category: 'Landmark', name: 'Town Hall (5 min)' }, { category: 'Landmark', name: 'Port City Colombo (4 min)' },
  { category: 'Shopping', name: 'Park Street Mews (3 min)' }, { category: 'Shopping', name: 'Colombo City Centre (3 min)' }, { category: 'Landmark', name: 'Galle Face Green (10 min)' },
  { category: 'Transport', name: 'Peliyagoda Highway Exit (20 min)' }, { category: 'Transport', name: 'Colombo International Airport (37 min)' },
]
const so = (o: Record<string, any>, name: string, opts: string[]) => {
  const n1 = (v: string) => v.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
  const v = o[name]; if (typeof v !== 'string' || !v) return
  const hit = opts.find((x) => n1(x) === n1(v)); if (hit) { o[name] = hit; return }
  o[`${name}_other`] = v; delete o[name]
}
for (const g of unitFeatures) for (const it of g.items as any[]) { so(it, 'field', SO.KEY_FEATURE_FIELD_OPTIONS); so(it, 'value', SO.KEY_FEATURE_VALUE_OPTIONS) }
for (const g of ownershipServices) for (const it of g.items as any[]) so(it, 'field', SO.OWNERSHIP_FIELD_OPTIONS)

const doc: any = (await payload.find({ collection: 'projects', where: { slug: { equals: SS } }, limit: 1, depth: 0, overrideAccess: true, draft: true })).docs[0]
const data: any = {}
const want: Record<string, any> = { gallery, floorPlans, nearby, amenities, unitFeatures, ownershipServices }
for (const [k, v] of Object.entries(want)) if (!(doc[k]?.length)) data[k] = v
if (!doc.heroImage) data.heroImage = gallery[0].image
await payload.update({ collection: 'projects', id: doc.id, overrideAccess: true, data } as never)
const after: any = (await payload.find({ collection: 'projects', where: { slug: { equals: SS } }, limit: 1, depth: 0, overrideAccess: true, draft: true })).docs[0]
console.log('skyhaus', JSON.stringify(Object.fromEntries(Object.keys(want).map((k) => [k, after[k]?.length ?? 0]))))
process.exit(0)
