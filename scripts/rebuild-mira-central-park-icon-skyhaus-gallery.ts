/* eslint-disable @typescript-eslint/no-explicit-any -- one-off rebuild */
// Restores lists that vanished from Payload on MIRA Weligama, Central Park Boulevard, ICON V Talpe and the Skyhaus gallery (found 2026-11-05; the
// same problem as scripts/rebuild-skyhaus.ts and scripts/rebuild-icon-lakefront.ts on 2026-10-23). Every value is the one the original import wrote
// (scripts/import-cpg-batch-1.ts for MIRA and Skyhaus, scripts/import-hl-central-park-boulevard.ts for Central Park) or, for ICON V, the file names in R2.
// Nothing is invented. Images go to the section they belong to: photos -> gallery, maps -> road map, block plan -> block plan.
// Lists are only filled when EMPTY. The galleries are replaced because earlier on 2026-11-05 a stopgap gallery was written from file names.
import path from 'node:path'
import { config as loadEnv } from 'dotenv'
loadEnv({ path: path.join(process.cwd(), '.env.local') })
const cfg = ((await import('../payload.config')) as any).default
const { getPayload } = await import('payload')
const SO: any = await import('../src/collections/shared-fields')
const payload = await getPayload({ config: cfg })
const PUB = (process.env.R2_PUBLIC_URL ?? '').replace(/\/+$/, '')
const U = (slug: string, sub: string, name: string) => `${PUB}/projects/${slug}/${sub}/${slug}_${name}`
const lkr = (usd: number) => Math.round((usd * 330.716) / 100000) * 100000
const feat = (field_other: string, value_other: string) => ({ field_other, value_other })
const human = (f: string) => { const t = f.replace(/-/g, ' '); return t.charAt(0).toUpperCase() + t.slice(1) }
const so = (o: Record<string, any>, name: string, opts: string[]) => {
  const n1 = (v: string) => v.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
  const v = o[name]; if (typeof v !== 'string' || !v) return
  const hit = opts.find((x) => n1(x) === n1(v)); if (hit) { o[name] = hit; return }
  o[`${name}_other`] = v; delete o[name]
}
const find = async (slug: string) => (await payload.find({ collection: 'projects', where: { slug: { equals: slug } }, limit: 1, depth: 0, overrideAccess: true, draft: true })).docs[0] as any
async function apply(slug: string, gallery: any[] | null, want: Record<string, any>) {
  const doc = await find(slug); const data: any = {}
  if (gallery?.length) data.gallery = gallery
  for (const [k, v] of Object.entries(want)) if (!(doc[k]?.length) && v?.length) data[k] = v
  if (!Object.keys(data).length) { console.log('nothing to do', slug); return }
  await payload.update({ collection: 'projects', id: doc.id, overrideAccess: true, data } as never)
  const a = await find(slug)
  console.log(slug.padEnd(40), Object.keys(data).map((k) => `${k} ${doc[k]?.length ?? 0}->${a[k]?.length ?? 0}`).join(' | '))
}

// ---------------- Skyhaus Colombo 07 (gallery only; the other lists were filled by rebuild-skyhaus.ts)
{
  const SS = 'skyhaus-colombo-07'
  const gal: [string, string][] = [
    ['exterior-tower-park', 'Skyhaus tower beside Viharamahadevi Park'], ['facade-terraces', 'Planted terraces on the Skyhaus facade'], ['living-bar-terrace', 'Living area, bar and terrace'],
    ['living-room', 'Residence living room'], ['living-room-feature-wall', 'Living room with feature wall'], ['bedroom-garden', 'Bedroom with garden windows'],
    ['bedroom-city-view', 'Bedroom with city view'], ['bathroom', 'Residence bathroom'], ['residence-entrance', 'Residence entrance and terrace'], ['terrace-city-view', 'Terrace with city view'],
    ['terrace-lounge', 'Terrace lounge among greenery'], ['courtyard-water-feature', 'Courtyard with water feature'], ['rooftop-pool-aerial', 'Rooftop pool from above'], ['gym-treadmills', 'Gymnasium cardio area'],
  ]
  await apply(SS, [...gal.map(([k, label]) => ({ label, image: U(SS, 'gallery', k + '.jpg') })), { label: 'Rooftop Infinity Pool', image: U(SS, 'amenities', 'rooftop-infinity-pool.jpg') }, { label: 'Gym', image: U(SS, 'amenities', 'gym.jpg') }], {})
}

// ---------------- Central Park Boulevard
{
  const SLUG = 'central-park-boulevard-port-city-colombo'
  const n1 = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '')
  const soCp = (o: any, name: string, opts: string[]) => { const v = o[name]; if (v == null || v === '') return; const hit = opts.find((x) => n1(x) === n1(String(v))); if (hit) { o[name] = hit; return } o[`${name}_other`] = v; delete o[name] }
  const gal: [string, string][] = [
    ['exterior-towers-waterfront', 'Central Park Boulevard towers above the landscaped waterfront'], ['exterior-skybridge-park', 'Twin towers joined by a skybridge, set in the park'],
    ['aerial-dusk', 'Aerial view of the towers, canal and parks at dusk'], ['aerial-courtyard', 'Aerial view of the courtyard, pools and tennis court'],
    ['aerial-courtyard-pool', 'Courtyard between the two towers with pool and court'], ['entrance-drop-off', 'Residence entrance and drop-off'], ['park-lakeside', 'Park with water features and fountain jets'],
    ['sky-garden', 'Garden with a central fire feature and glass pavilion'], ['planters-walkway', 'Walkway with large planters at dusk'], ['sky-pool-level-31', 'Sky pool on Level 31'],
    ['rooftop-lounge', 'Rooftop lounge at sunset'], ['vip-lounge', 'VIP lounge'], ['gym', 'Gymnasium'], ['spa', 'Spa lounge'], ['yoga-room', 'Yoga room'], ['court', 'Tennis court in the courtyard'],
    ['chess-courtyard', 'Courtyard with oversized chess set'], ['golf-simulator-lounge', 'Golf simulation lounge'], ['kids-playroom', "Children's playroom"], ['meeting-room', 'Meeting room'],
    ['salon', 'Salon and nail bar'], ['supermarket', 'Supermarket'],
  ]
  const unitFeatures: any[] = [
    { key: 'specifications', items: [
      feat('Substructure', 'Pile foundation'),
      feat('Superstructure', 'RCC columns, walls, beams and slabs, with bricks or cement blocks on walls and aluminium framing and glazing'),
      feat('Flooring', 'High-quality floor tiles in Deluxe apartments; wooden flooring in the living and dining areas of Sky Villas and Penthouses, and throughout Emerald Mansions; non-slip tiles in verandas, balconies, terraces and bathrooms'),
      feat('Bathroom Walls', 'Wall tiles up to the ceiling level'),
      feat('Painting', 'Internal walls plastered smooth with emulsion paint. External walls: rough or semi-rough finish with a five-coat paint system and 10 years warranty'),
      feat('Pantry', 'Fully equipped international-standard pantry with kitchen cabinets, hob, hood, electric oven, microwave oven, refrigerator, dishwasher, washing machine and sink with mixer tap'),
      feat('Electrical', "230V supply with separate electric meter, 13 amp sockets, ceiling fans in all bedrooms, air conditioning in the living area and all bedrooms except the maid's room, TV, telephone and data outlets, separate gas meters, BMS billing facility, fire detection and protection system, video door phone, visitor access control, standby generator power"),
      feat('Lighting', 'LED panel light fittings; decorative light fittings in living and dining areas of Penthouses and Emerald Mansions'),
      feat('Water Supply & Drainage', 'PVC cold water pipe network for each bathroom, separate water meter for each unit, sewer and waste water discharge as per the MEP engineer'),
      feat('Plumbing & Sanitary Fittings', 'International-standard fully fitted bathrooms, hot water via geyser for the master bathroom and common bathrooms; a bathtub in specific Penthouse and Emerald Mansion units'),
      feat('Doors & Windows', 'Fire-rated engineering timber main door with smart door lock; engineering composite doors for bedrooms, bathrooms and servant room; powder-coated aluminium French and other windows'),
      feat('Storage', 'Wardrobe units in all bedrooms; a completed linen room in Sky Villas, Penthouses and Emerald Mansions'),
      feat('Waterproofing', 'Bathroom floors, shower walls, balconies and terraces waterproofed by a reputed company with a 10-year warranty'),
      feat('Termite Treatment', 'Ground floor termite treatment by a reputed company with a 10-year warranty'),
    ] },
    { key_other: 'General Features', items: [
      feat('Security', '24/7 CCTV monitoring of common areas'),
      feat('EV Charging', 'Common EV charging facility (Deluxe); EV charging provision for the parking slot (Penthouses and Emerald Mansions)'),
      feat('Parking', 'A dedicated parking slot with each apartment'),
    ] },
  ]
  for (const g of unitFeatures) for (const it of g.items as any[]) { soCp(it, 'field', SO.KEY_FEATURE_FIELD_OPTIONS); soCp(it, 'value', SO.KEY_FEATURE_VALUE_OPTIONS) }
  const amenityNames = ['Boutique Shops', 'Mini Mart', 'Reception & Lobby', 'Games Room', 'Meeting Room', 'Restaurant', 'Gym', 'Spa', 'Lounge', 'Garden', 'Infinity Pool', "Children's Area", 'Rooftop', 'Parking', 'EV Charging', 'CCTV']
  const videos = [
    { label: 'Teaser Video', embedUrl: 'https://www.youtube.com/watch?v=oEC6t6uAUOM' }, { label: 'Press Conference', embedUrl: 'https://www.youtube.com/watch?v=nmfp50B0kc4' },
    { label: 'Launch Event', embedUrl: 'https://www.youtube.com/watch?v=lb71Ru3Mh3A' }, { label: 'Launch Event 2', embedUrl: 'https://www.youtube.com/watch?v=yjgm3eoZsMM' },
    { label: 'Sales Gallery Opening Event', embedUrl: 'https://www.youtube.com/watch?v=DphV882-HSc' },
  ]
  await apply(SLUG, gal.map(([k, label]) => ({ label, image: U(SLUG, 'gallery', k + '.jpg') })), {
    amenities: amenityNames.filter((n) => (SO.AMENITY_NAME_OPTIONS as string[]).includes(n)).map((name) => ({ name })), unitFeatures, videos,
  })
}

// ---------------- MIRA Weligama
{
  const MS = 'mira-weligama'
  const gal: [string, string][] = [
    ['exterior-sunset', 'MIRA beachfront building at sunset'], ['exterior-podium-facade', 'MIRA facade and podium above the bay'], ['exterior-beach-lagoon', 'MIRA between the lagoon and the beach'],
    ['exterior-aerial-lagoon', 'MIRA aerial view over the lagoon and bay'], ['exterior-tower-sea', 'MIRA tower facing the sea'], ['entrance', 'MIRA entrance'], ['lobby', 'MIRA lobby'],
    ['living-ocean-view', 'Suite living area with ocean view'], ['living-dining-ocean-view', 'Suite living and dining area, ocean view'], ['bedroom', 'Suite bedroom'],
    ['bedroom-lounge', 'Suite bedroom and lounge'], ['bathroom', 'Suite bathroom'], ['restaurant', 'Waterfront restaurant'], ['library-lounge', 'Library and community space'],
  ]
  const gallery = [
    ...gal.map(([k, label]) => ({ label, image: U(MS, 'gallery', k + '.jpg') })),
    { label: 'Gym', image: U(MS, 'amenities', 'gym.jpg') },
    ...['central-bar', 'hydrotherapy', 'infinity-pool', 'library', 'open-air-lounge', 'pilates-studio', 'restaurant'].map((k) => ({ label: human(k), image: U(MS, 'amenities', k + '.jpg') })),
  ]
  const plan = (o: { name: string; file: string; beds: number; baths: number; sqft: number; avail: number; usd: number; sold?: boolean }) => ({
    planName: o.name, bedrooms: o.beds, bathrooms: o.baths, floorAreaSqFt: o.sqft, startingPriceLkr: lkr(o.usd),
    unitsAvailable: o.avail, furnishing: 'Fully Furnished', image: U(MS, 'floor-plans', o.file + '.jpg'), availability: o.sold ? 'Sold Out' : 'Available',
  })
  const floorPlans: any[] = [
    plan({ name: 'Ocean Suite 1', file: 'ocean-suite-1', beds: 1, baths: 2, sqft: 1200, avail: 9, usd: 414000 }),
    plan({ name: 'Ocean Suite 2', file: 'ocean-suite-2', beds: 1, baths: 2, sqft: 1200, avail: 6, usd: 414000 }),
    plan({ name: 'Ocean Suite 3', file: 'ocean-suite-3', beds: 1, baths: 2, sqft: 1200, avail: 11, usd: 387000 }),
    plan({ name: 'Penthouse A', file: 'penthouse-a', beds: 3, baths: 3, sqft: 3780, avail: 10, usd: 1323000 }),
    plan({ name: 'Penthouse B', file: 'penthouse-b', beds: 3, baths: 3, sqft: 2785, avail: 0, usd: 974750, sold: true }),
  ]
  for (const p of floorPlans) so(p, 'furnishing', SO.FURNISHING_OPTIONS)
  const unitFeatures: any[] = [
    { key: 'indoor', items: [
      feat('Furnishing', 'Fully furnished, turnkey residences'), feat('Jacuzzi', 'Private jacuzzi on the balcony of every suite'),
      feat('Bedrooms & Closets', 'Master bedroom with study desk, closets and storage'), feat('Bathroom', 'Ensuite bathroom with his and her sinks and a rain shower'),
      feat('Kitchen', 'Bar and kitchenette with hob, oven, microwave and fridge'), feat('Living Areas', 'Living room that expands into an additional bedroom, with foldable beds'),
      feat('Balcony', 'Private terrace'),
    ] },
    { key: 'outdoor', items: [
      feat('Restaurant', "All-day dining on the water's edge"), feat('Bars', 'Central bar overlooking the Indian Ocean and a martini bar'),
      feat('Lounges', 'Open-air lounge and a vinyl lounge'), feat('Library', 'Community library and reading room'), feat('Wellness', 'Hydrotherapy recovery space and a Pilates studio'),
    ] },
  ]
  const ownershipServices: any[] = [{ key: 'After-Sales & Services', items: [
    { field: 'Property Management', value: 'Operated and managed by The One Group of Hotels: guest stays, housekeeping, maintenance and owner services, as a fully managed residence' },
    { field_other: 'Rental Returns', value: 'Projected gross rental yield of 8–10%: 8% at 50% occupancy and 10% at 65% occupancy' },
    { field: 'Resident Services', value: '24-hour concierge and dedicated staff for housekeeping, valet, maintenance and security; in-residence dining with tasting menus, curated dining and 24/7 room service' },
    { field_other: 'Owner App', value: 'View returns and book your own stays in real time through the CPG app' },
    { field_other: 'Owner Privileges', value: "Access to the hotel's restaurants, bars, pools, spas, fitness centres and wellness facilities; Home Around The Pearl loyalty programme with discounted rates across The One Group of Hotels" },
  ] }]
  for (const g of unitFeatures) for (const it of g.items as any[]) { so(it, 'field', SO.KEY_FEATURE_FIELD_OPTIONS); so(it, 'value', SO.KEY_FEATURE_VALUE_OPTIONS) }
  for (const g of ownershipServices) for (const it of g.items as any[]) so(it, 'field', SO.OWNERSHIP_FIELD_OPTIONS)
  const nearby = [
    { category: 'Landmark', name: 'Weligama Beach (2 min walk)' }, { category: 'Landmark', name: 'Mirissa Harbour (10 min)' }, { category: 'Landmark', name: 'Galle Fort (35 min)' },
    { category: 'Transport', name: 'Weligama Railway Station (6 min)' }, { category: 'Transport', name: 'E01 Expressway, Godagama exit' }, { category: 'Transport', name: 'Colombo Airport (about 2 hours via the expressway)' },
  ]
  const amenities = ['Infinity Pool', 'Gym', 'Beachfront', 'Sea View', 'Concierge', 'Security', 'Hotel'].filter((n) => (SO.AMENITY_NAME_OPTIONS as string[]).includes(n)).map((name) => ({ name }))
  await apply(MS, gallery, {
    floorPlans, amenities, unitFeatures, ownershipServices, nearby,
    blockPlanImages: [{ label: 'Block plan', image: U(MS, 'block-plan', 'block-plan.jpg') }],
    roadMapImages: [{ label: 'Road map', image: U(MS, 'road-map', 'road-map.jpg') }],
  })
}

// ---------------- ICON V Talpe: gallery from the file names (as rebuild-icon-lakefront.ts did) but with the map images moved to Road Map
{
  const slug = 'luxury-apartments-icon-v-talpe'
  const photos = ['aerial-view', 'balconies-ocean', 'balconies-sea-view', 'beachfront-exterior', 'bedroom', 'dining-area', 'garden-steps', 'interior-dining', 'interior-living', 'interior-pantry', 'living-area', 'lounge', 'pool-deck', 'pool-garden', 'rooftop-deck', 'rooftop-pool-sunset']
  const gallery = [
    ...photos.map((k) => ({ label: human(k), image: U(slug, 'gallery', k + '.jpg') })),
    { label: 'Amenities by floor', image: U(slug, 'amenities', 'amenities-by-floor.jpg') },
  ]
  await apply(slug, gallery, {
    roadMapImages: [
      { label: 'Location map', image: U(slug, 'road-map', 'location-map.jpg') }, { label: 'Experience map', image: U(slug, 'road-map', 'experience-map.jpg') },
      { label: 'Experience and location map', image: U(slug, 'gallery', 'experience-location-map.jpg') }, { label: 'Services map', image: U(slug, 'gallery', 'services-map.jpg') },
    ],
  })
}
process.exit(0)
