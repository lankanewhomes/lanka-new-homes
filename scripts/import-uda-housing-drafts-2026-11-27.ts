/* eslint-disable @typescript-eslint/no-explicit-any -- one-off import script */
// Owner request 2026-11-27: "add this property. https://housing.uda.lk/". The site (Urban Development Authority, brand "Lotus - Homes For You")
// lists 5 apartment projects; none was on our site. They are added as UNPUBLISHED drafts (listing rule), with a new developer record.
// Every figure is from the UDA pages or from text inside their images (price panels, the Harbour View flyer, plan drawings), read 2026-11-27.
// The UDA site reuses some pictures across pages: Viyathpura's interiors and plans appear on the Green Arcade, Crescendo and Transhub pages,
// Green Arcade's price panels appear on Crescendo and Transhub, and Green Arcade's map on Transhub. Those borrowed items are NOT used.
// Idempotent: a project whose slug exists is skipped. Dry run by default.
//   UDA_DIR=<folder with the downloaded images> NODE_ENV=production npx tsx scripts/import-uda-housing-drafts-2026-11-27.ts [--apply]
import fs from 'node:fs'
import path from 'node:path'
import { config as loadEnv } from 'dotenv'
loadEnv({ path: path.join(process.cwd(), '.env.local') })
const apply = process.argv.includes('--apply')
const dir = process.env.UDA_DIR ?? ''
if (!dir) throw new Error('Set UDA_DIR')
const cfg = ((await import('../payload.config')) as any).default
const { getPayload } = await import('payload')
const sharp = (await import('sharp')).default
const { mirrorToR2 } = await import('../src/lib/listing-import/mirror')
const SO = (await import('../src/collections/shared-fields')) as any
const payload = await getPayload({ config: cfg })
const find = async (collection: string, slug: string) =>
  ((await payload.find({ collection: collection as never, where: { slug: { equals: slug } }, limit: 1, overrideAccess: true, depth: 0 })).docs[0] as any) ?? null
const n1 = (v: string) => v.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
const so = (o: Record<string, any>, name: string, opts: string[]) => {
  const v = o[name]; if (typeof v !== 'string' || !v) return
  const hit = opts.find((x) => n1(x) === n1(v)); if (hit) { o[name] = hit; return }
  o[`${name}_other`] = v; delete o[name]
}
const kebab = (x: string) => x.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
// Photos on the UDA site are up to 5760 px wide; store them at 2400 px at most.
const jpg = async (file: string) => { const full = path.join(dir, file); if (!fs.existsSync(full)) throw new Error('missing ' + full); return sharp(full).resize({ width: 2400, withoutEnlargement: true }).jpeg({ quality: 86 }).toBuffer() }
const amen = (list: (string | [string, string])[]) => list.map((a) => { const [name, description] = Array.isArray(a) ? a : [a, undefined]; if (!(SO.AMENITY_NAME_OPTIONS as string[]).includes(name)) throw new Error('amenity not in vocabulary ' + name); return description ? { name, description } : { name } })
const plain = (key: string, label: string, values: string[]) => ({ key, label, items: values.map((value_other) => ({ value_other })) })

const SITE = 'https://housing.uda.lk/'
const NOTE = 'Read 2026-11-27. Re-check prices and availability.'
const CONTACT = { name: 'UDA Housing (Director, Housing)', email: 'marketing@uda.gov.lk', phone: '+94117794111', address: 'Urban Development Authority, 6th Floor, Sethsiripaya, Battaramulla' }

let dev = await find('developers', 'urban-development-authority')
console.log('developer:', dev ? `exists ${dev.id}` : apply ? 'creating' : 'would create')
if (!dev && apply) {
  const logo = await mirrorToR2('logos/developers/urban-development-authority-logo.png', fs.readFileSync(path.join(dir, 'logouda.png')), 'image/png')
  dev = await payload.create({ collection: 'developers', overrideAccess: true, data: {
    slug: 'urban-development-authority', name: 'Urban Development Authority (UDA)', logo, website: SITE,
    location: '6th Floor, Sethsiripaya, Battaramulla', contact_email: 'marketing@uda.gov.lk', contact_phone: '+94117794111',
    description: 'The Urban Development Authority (UDA) is the Sri Lankan government body for urban planning and development, under the Ministry of Urban Development and Housing. Its housing division sells apartments to the public under the "Lotus - Homes For You" name and describes them as affordable housing, with bank loans of up to 25 years. Its housing site lists five apartment projects: Viyathpura in Pannipitiya, Green Arcade Residencies in Kottawa, Crescendo Apartments in Malabe, Transhub Residencies in Makumbura and Harbour View Residencies in Colombo 13. Sales are handled by the Director (Housing) at Sethsiripaya, Battaramulla.',
    referenceLinks: [
      { label: 'UDA housing site (home)', url: SITE, note: NOTE },
      { label: 'All housing projects', url: 'https://housing.uda.lk/Clients/Property_Sale.aspx', note: NOTE },
      { label: 'Unit reservation page (shows Available / Reserved per unit)', url: 'https://housing.uda.lk/Clients/housing_projects.aspx', note: 'Read 2026-11-27: three unit lists with 1 of 94, 196 of 234 and 18 of 196 units available. The page does not clearly say which list belongs to which project.' },
    ],
  } as never })
  console.log('developer created', (dev as any).id)
}

type Img = [string, string] // [file, label]
type Plan = { name: string; file?: string; beds: number; baths: number; sqft: number; price: number; maid?: boolean }
type Spec = { slug: string; name: string; page: string; nb: string; images: Img[]; plans: Plan[]; video?: string; data: Record<string, any>; todo: string }
const results: string[] = []
async function make(s: Spec) {
  if (await find('projects', s.slug)) { console.log('exists, skipped:', s.slug); return }
  for (const [f] of s.images) if (!fs.existsSync(path.join(dir, f))) throw new Error('missing ' + f)
  for (const p of s.plans) if (p.file && !fs.existsSync(path.join(dir, p.file))) throw new Error('missing ' + p.file)
  const nb = await find('neighborhoods', s.nb)
  console.log(`${s.slug}: ${s.images.length} images, ${s.plans.length} plans, video ${s.video ? 'yes' : 'no'}, price ${s.data.startingPriceLkr}, neighbourhood ${nb?.slug ?? 'NONE'}`)
  if (!apply) return
  const gallery: any[] = []
  for (const [file, label] of s.images) gallery.push({ label, image: await mirrorToR2(`projects/${s.slug}/gallery/${s.slug}_${kebab(label)}.jpg`, await jpg(file), 'image/jpeg') })
  const floorPlans: any[] = []
  for (const p of s.plans) floorPlans.push({ planName: p.name, bedrooms: p.beds, bathrooms: p.baths, floorAreaSqFt: p.sqft, startingPriceLkr: p.price, availability: 'Available', ...(p.maid ? { maidsRoom: 'Yes' } : {}), ...(p.file ? { image: await mirrorToR2(`projects/${s.slug}/floor-plans/${s.slug}_${kebab(p.name)}.jpg`, await jpg(p.file), 'image/jpeg') } : {}) })
  const data: Record<string, any> = {
    slug: s.slug, name: s.name, developer: (dev as any).id, isPublished: false, type: 'Apartments', status: 'Now Selling', district: 'Colombo', province: 'Western',
    heroImage: gallery[0].image, gallery, floorPlans, contact: CONTACT, sourceUrl: s.page,
    ...(s.video ? { videos: [{ label: `${s.name} video`, embedUrl: `https://www.youtube.com/watch?v=${s.video}` }] } : {}),
    referenceLinks: [{ label: 'UDA project page', url: s.page, note: NOTE }, { label: 'UDA housing site (home, with the price list)', url: SITE, note: NOTE }],
    ...s.data,
  }
  if (nb) { data.neighborhood = nb.id; data.neighborhoodSlug = nb.slug }
  so(data, 'city', SO.CITY_OPTIONS)
  const created: any = await payload.create({ collection: 'projects', data: data as never, overrideAccess: true })
  await payload.create({ collection: 'listing-todos', overrideAccess: true, data: { title: `${s.name}: check before publishing`, listingType: 'project', project: created.id, notes: s.todo, sourceLinks: s.page } as never })
  console.log('  created', created.id, 'published:', created.isPublished, '| gallery', created.gallery?.length, '| plans', created.floorPlans?.length, '| amenities', created.amenities?.length)
  results.push(`${created.id} ${s.slug}`)
}
const M = 1_000_000
const loans = 'Bank loans are available through a choice of banks with a repayment period of up to 25 years, as the UDA states.'
const common = 'Not published on the UDA page: number of units and floors, completion date, payment plan details and ownership terms. The UDA reservation page lists units as Available or Reserved but does not clearly say which list belongs to which project; confirm availability with the UDA before publishing.'

await make({
  slug: 'viyathpura-pannipitiya', name: 'Viyathpura Apartment Complex', page: 'https://housing.uda.lk/Clients/viyathpura.aspx', nb: 'pannipitiya', video: 'jz9QjYmJ3Gk',
  images: [['viyathpura_v2.jpg', 'Entrance and towers'], ['viyathpura_v1.jpg', 'Swimming pool'], ['viyathpura_v5.jpg', 'Aerial view'], ['viyathpura_v4.jpg', 'Living room'], ['viyathpura_v3.jpg', 'Bedroom'], ['viyathpura_v6.jpg', 'Kitchen']],
  plans: [
    { name: 'Type A - 3 Bedroom', file: 'viyathpura_Unit_01_01_Plan.jpg', beds: 3, baths: 3, sqft: 0, price: 0 },
    { name: 'Type B - 3 Bedroom', file: 'viyathpura_Unit_02_01_Plan.jpg', beds: 3, baths: 2, sqft: 0, price: 0 },
    { name: 'Type C - 2 Bedroom', file: 'viyathpura_Unit_03_01_Plan.jpg', beds: 2, baths: 2, sqft: 750, price: 15.7 * M },
  ],
  data: {
    city: 'Pannipitiya', location: 'Pannipitiya, less than 2.8 km from Thalawathugoda junction', startingPriceLkr: 15.7 * M, priceRange: 'From Rs. 15,700,000', coordinates: { lat: 6.8654143, lng: 79.9491077 },
    typeNote: 'Government-built apartment complex (UDA)',
    summary: 'Two- and three-bedroom apartments by the Urban Development Authority in Pannipitiya, from Rs 15.7 million, with a swimming pool, gym, playground and shopping mall.',
    description: 'Viyathpura is an apartment complex by the Urban Development Authority (UDA), sold under its "Lotus - Homes For You" name, in Pannipitiya, less than 2.8 km from Thalawathugoda junction. Two-bedroom apartments of 750 sq ft with two bathrooms start from Rs 15.7 million, and three-bedroom apartments of 950 to 1,270 sq ft start from Rs 20 million. The UDA shows three layouts, Types A and B (three bedrooms) and Type C (two bedrooms); bathroom counts for each type are read off the plan drawings.\n\nShared facilities listed by the UDA are a dedicated parking area, gymnasium, swimming pool, playground, shopping mall, cafeterias and a laundry, with a 24-hour security system, CCTV, a central gas system, daily waste management, solar lighting and an emergency generator for common areas, and individual water and electricity meters.',
    highlights: ['2 bedrooms, 750 sq ft, from Rs 15.7 million', '3 bedrooms, 950 to 1,270 sq ft, from Rs 20 million', 'Swimming pool, gym, playground and shopping mall', 'Less than 2.8 km from Thalawathugoda junction'],
    pricingNotes: ['2-bedroom apartments (750 sq ft, 2 bathrooms) from Rs 15.7 million upwards; 3-bedroom apartments (950 to 1,270 sq ft, 2 bathrooms) from Rs 20 million upwards, as shown on the UDA page on 2026-11-27. Prices for each layout are not published.'],
    amenities: amen(['Parking', 'Gym', 'Pool', "Children's Area", 'Retail Mall', 'Cafe', 'Laundry Service', 'Security', 'CCTV']),
    unitFeatures: [plain('utilities', 'Utilities & Services', ['Central gas system', 'Individual meters for water and electricity', 'Daily waste management']), plain('building-services', 'Building Services', ['Emergency generator for common areas']), plain('safety-security', 'Safety & Security', ['24-hour security system', 'CCTV coverage', 'Fire detection and firefighting system']), plain('sustainability', 'Sustainability', ['Solar system for common area lighting'])],
  },
  todo: `${common} The price panel says 3-bedroom units have 2 bathrooms, but the Type A plan drawing shows 3; entered as drawn. Sizes for Types A and B are not published (range 950 to 1,270 sq ft). Map pin taken from the page's Google Maps embed.`,
})

await make({
  slug: 'green-arcade-residencies-kottawa', name: 'Green Arcade Residencies', page: 'https://housing.uda.lk/Clients/greenArcade.aspx', nb: 'kottawa', video: '_Tgqs11uB9s',
  images: [['green_arcade_01_Photo_-_4.jpg', 'Swimming pool and towers'], ['green_arcade_01_Photo_-_1.jpg', 'Aerial view'], ['green_arcade_01_Photo_-_5.jpg', 'Pool deck'], ['green_arcade_01_Photo_-_3.jpg', 'Lawn and towers'], ['green_arcade_01_Photo_-_2.jpg', 'Entrance and gatehouse'], ['green_arcade_01_Photo_-_6.jpg', 'Access road']],
  plans: [
    { name: '2 Bedroom Apartment', beds: 2, baths: 2, sqft: 750, price: 17.77 * M },
    { name: '3 Bedroom Apartment', beds: 3, baths: 2, sqft: 950, price: 22.5 * M },
  ],
  data: {
    city: 'Kottawa', location: 'Kottawa, less than a kilometre from Kottawa junction', startingPriceLkr: 17.77 * M, priceRange: 'From Rs. 17,770,000', coordinates: { lat: 6.8474739, lng: 79.9683391 },
    typeNote: 'Government-built apartment complex (UDA)',
    summary: 'Two- and three-bedroom apartments by the Urban Development Authority, less than a kilometre from Kottawa junction, from Rs 17.77 million, with a swimming pool, gym and playground.',
    description: 'Green Arcade Residencies is an apartment complex by the Urban Development Authority (UDA), sold under its "Lotus - Homes For You" name, less than a kilometre from Kottawa junction. Two-bedroom apartments of 750 sq ft with two bathrooms start from Rs 17.77 million, and three-bedroom apartments of 950 to 1,050 sq ft with two bathrooms start from Rs 22.5 million.\n\nShared facilities listed by the UDA are a dedicated parking area, gymnasium, swimming pool, playground, cafeterias, a laundry, and supermarkets and grocery shops, with a 24-hour security system, a central gas system, daily waste management, solar lighting and an emergency generator for common areas, individual water and electricity meters, and sewerage lines connected to a sewer treatment plant.',
    highlights: ['2 bedrooms, 750 sq ft, from Rs 17.77 million', '3 bedrooms, 950 to 1,050 sq ft, from Rs 22.5 million', 'Swimming pool, gym and playground', 'Less than a kilometre from Kottawa junction'],
    pricingNotes: ['2-bedroom apartments (750 sq ft, 2 bathrooms) from Rs 17.77 million upwards; 3-bedroom apartments (950 to 1,050 sq ft, 2 bathrooms) from Rs 22.5 million upwards, as shown on the UDA page on 2026-11-27.'],
    amenities: amen(['Parking', 'Gym', 'Pool', "Children's Area", 'Cafe', 'Laundry Service', ['Mini Mart', 'Supermarkets and grocery shops'], 'Security']),
    unitFeatures: [plain('utilities', 'Utilities & Services', ['Central gas system', 'Individual meters for water and electricity', 'Daily waste management', 'Sewerage lines connected to the sewer treatment plant']), plain('building-services', 'Building Services', ['Emergency generator for common areas']), plain('safety-security', 'Safety & Security', ['24-hour security system', 'Fire detection and firefighting system']), plain('sustainability', 'Sustainability', ['Solar system for common area lighting'])],
  },
  todo: `${common} No floor plan drawings: the UDA page shows Viyathpura's plans and interiors on this page, so they were not used. The two plan rows carry only the published bedroom, size and price figures (3-bedroom entered at 950 sq ft, the low end of 950 to 1,050). Ask the UDA for the real Green Arcade plans. Map pin taken from the page's Google Maps embed.`,
})

await make({
  slug: 'crescendo-apartments-malabe', name: 'Crescendo Apartments', page: 'https://housing.uda.lk/Clients/crescendo.aspx', nb: 'malabe', video: 'wH9nso5zZsw',
  images: [['cresendo_J1.jpg', 'Tower and entrance'], ['cresendo_J2.jpg', 'Street view'], ['cresendo_J5.jpg', 'Entrance canopy'], ['cresendo_J4.jpg', 'Aerial view'], ['cresendo_J3.jpg', 'Looking up the towers']],
  plans: [
    { name: 'A1 Unit - 2 Bedroom', file: 'cresendo_Malabe_A1.jpg', beds: 2, baths: 2, sqft: 0, price: 0 },
    { name: 'A2 Unit - 2 Bedroom', file: 'cresendo_Malabe_A2.jpg', beds: 2, baths: 2, sqft: 0, price: 0 },
    { name: 'B1 Unit - 3 Bedroom', file: 'cresendo_Malabe_B1.jpg', beds: 3, baths: 3, sqft: 0, price: 0 },
    { name: 'B2 Unit - 3 Bedroom', file: 'cresendo_Malabe_B2.jpg', beds: 3, baths: 3, sqft: 0, price: 0 },
    { name: 'B3 Unit - 3 Bedroom', file: 'cresendo_Malabe_C1.jpg', beds: 3, baths: 3, sqft: 0, price: 0 },
    { name: 'B4 Unit - 3 Bedroom', file: 'cresendo_Malabe_C2.jpg', beds: 3, baths: 3, sqft: 0, price: 0 },
  ],
  data: {
    city: 'Malabe', location: 'Malabe', startingPriceLkr: 19 * M, priceRange: 'From Rs. 19,000,000', coordinates: { lat: 6.9188517, lng: 79.9537966 },
    typeNote: 'Government affordable housing tower (UDA)',
    summary: 'Two- and three-bedroom apartments by the Urban Development Authority in Malabe, from Rs 19 million, with a gym, community hall, mini supermarkets and EV charging.',
    description: `Crescendo Apartments is a residential tower by the Urban Development Authority (UDA) in Malabe, part of what the UDA calls its affordable housing project, priced from Rs 19 million upwards. The plan drawings show six layouts: A1 and A2 units with two bedrooms and two toilets, and B1 to B4 units with three bedrooms and three toilets, each with a living and dining area and kitchen. ${loans}\n\nFacilities listed by the UDA are a dedicated parking area, gymnasium, mini supermarkets, a community hall and electric vehicle charging, with a high speed elevator system, central gas, a sewer treatment plant, rainwater harvesting, standby generators and a solar PV system for common area lighting, 24-hour security with CCTV, and a waste management facility with a separate service lift.`,
    highlights: ['From Rs 19 million upwards', '2-bedroom (A1, A2) and 3-bedroom (B1 to B4) layouts', 'Gym, community hall, mini supermarkets and EV charging', 'Bank loans of up to 25 years, as the UDA states'],
    pricingNotes: ['From Rs 19 million upwards, as shown on the UDA housing site on 2026-11-27. Prices and sizes for each layout are not published.'],
    paymentPlanItems: [loans],
    amenities: amen(['Parking', 'Gym', 'Mini Mart', ['Multifunctional Room', 'Community hall'], 'EV Charging', 'Security', 'CCTV']),
    unitFeatures: [plain('utilities', 'Utilities & Services', ['Central gas system', 'Individual meters for water and electricity', 'Uninterrupted water supply for all apartments and common amenities', 'Public sewer line and sewer treatment plant', 'Waste management facility with a separate service lift']), plain('building-services', 'Building Services', ['High speed elevator system', 'Standby generators']), plain('safety-security', 'Safety & Security', ['24-hour security system and CCTV coverage', 'Fire detection and firefighting system']), plain('sustainability', 'Sustainability', ['Solar PV system for common area lighting', 'Rainwater harvesting system', 'Electric vehicle charging facilities'])],
  },
  todo: `${common} Unit sizes are not published. The price panels and interior pictures on this UDA page belong to Green Arcade and Viyathpura, so they were not used; the Rs 19 million figure is from the UDA home page list. The plan image files are named A1, A2, B1, B2, C1, C2 but the drawings are titled A1, A2, B1 to B4; titles were used. Map pin taken from the page's Google Maps embed.`,
})

await make({
  slug: 'transhub-residencies-makumbura', name: 'Transhub Residencies', page: 'https://housing.uda.lk/Clients/transhub.aspx', nb: 'kottawa', video: 'GJI-B5aBpWA',
  images: [['transhub_01_Makumbura.jpg', 'Tower seen across the lake'], ['transhub_02_Makumbura.jpg', 'Tower and lake'], ['transhub_03_Makumbura.jpg', 'Tower through the trees'], ['transhub_01.jpg', 'Street view and car park'], ['transhub_02.jpg', 'Entrance road'], ['transhub_Aerial_View_1_A_small_file.jpg', 'Aerial view']],
  plans: [
    { name: 'Type 1A - 3 Bedroom', file: 'transhub_TYPE-1A.jpg', beds: 3, baths: 2, sqft: 0, price: 0, maid: true },
    { name: 'Type 1B - 3 Bedroom', file: 'transhub_TYPE-1B.jpg', beds: 3, baths: 2, sqft: 0, price: 0, maid: true },
    { name: 'Type 2A - 2 Bedroom', file: 'transhub_TYPE-2A.jpg', beds: 2, baths: 2, sqft: 0, price: 0 },
    { name: 'Type 2B - 2 Bedroom', file: 'transhub_TYPE-2B.jpg', beds: 2, baths: 2, sqft: 0, price: 0 },
  ],
  data: {
    city: 'Makumbura', location: 'Makumbura, Kottawa', startingPriceLkr: 15.7 * M, priceRange: 'From Rs. 15,700,000',
    typeNote: 'Government affordable housing tower (UDA)',
    summary: 'Two- and three-bedroom apartments by the Urban Development Authority at Makumbura, Kottawa, listed from Rs 15.7 million, with a gym, community hall, mini supermarket and EV charging.',
    description: `Transhub Residencies is a residential tower by the Urban Development Authority (UDA) at Makumbura, part of what the UDA calls its affordable housing project, listed from Rs 15.7 million upwards. The plan drawings show four layouts: Types 1A and 1B with three bedrooms, a master toilet, a common toilet, and a maid's room with its own toilet, and Types 2A and 2B with two bedrooms and two toilets. Each has a living space, dining area, pantry, balcony and yard. ${loans}\n\nFacilities listed by the UDA are a dedicated parking area, gymnasium, mini supermarket, a community hall and electric vehicle charging, with a high speed elevator system, central gas, a sewer treatment plant, rainwater harvesting, standby generators and a solar PV system for common area lighting, 24-hour security with CCTV, and a waste management facility with a separate service lift.`,
    highlights: ['Listed from Rs 15.7 million upwards', '2-bedroom and 3-bedroom layouts; 3-bedroom units include a maid\'s room', 'Gym, community hall, mini supermarket and EV charging', 'Bank loans of up to 25 years, as the UDA states'],
    pricingNotes: ['Listed at Rs 15.7 million upwards on the UDA housing site on 2026-11-27. Prices and sizes for each layout are not published; confirm the price with the UDA.'],
    paymentPlanItems: [loans],
    amenities: amen(['Parking', 'Gym', 'Mini Mart', ['Multifunctional Room', 'Community hall'], 'EV Charging', 'Security', 'CCTV']),
    unitFeatures: [plain('utilities', 'Utilities & Services', ['Central gas system', 'Individual meters for water and electricity', 'Uninterrupted water supply for all apartments and common amenities', 'Public sewer line and sewer treatment plant', 'Waste management facility with a separate service lift']), plain('building-services', 'Building Services', ['High speed elevator system', 'Standby generators']), plain('safety-security', 'Safety & Security', ['24-hour security system and CCTV coverage', 'Fire detection and firefighting system']), plain('sustainability', 'Sustainability', ['Solar PV system for common area lighting', 'Rainwater harvesting system', 'Electric vehicle charging facilities'])],
  },
  todo: `${common} PRICE DOUBT: the UDA list shows "Rs 15.7 million upwards" for Transhub, the same figure as Viyathpura, and the home page tile shows template text ("rent | $ 12.000"). Confirm the real price with the UDA before publishing. Unit sizes are not published. No map pin: the map on this UDA page is Green Arcade's. Linked to the Kottawa area page because there is no Makumbura page. Three renders carry a small "Makumbura | Tudawe Brothers (Pvt) Ltd" watermark (the contractor is not otherwise named on the page, so it was not entered).`,
})

await make({
  slug: 'harbour-view-residencies-colombo-13', name: 'Harbour View Residencies', page: 'https://housing.uda.lk/Clients/harbourView.aspx', nb: 'colombo-13',
  images: [['harbour_view_view2.jpg', 'Front of the building'], ['harbour_view_view1.jpg', 'Aerial view'], ['harbour_view_view5.jpg', 'Aerial view from the side'], ['harbour_view_view4.jpg', 'Aerial view with the neighbourhood'], ['harbour_view_view6.jpg', 'Aerial view from above'], ['harbour_view_view3.jpg', 'Inner courtyard and corridors']],
  plans: [{ name: '2 Bedroom Apartment (unit types A to D)', file: 'harbour_view_Unit_Plan_-_harbour_view.jpg', beds: 2, baths: 1, sqft: 550, price: 11 * M }],
  data: {
    city: 'Colombo 13', location: 'Colombo 13', startingPriceLkr: 11 * M, priceRange: 'From Rs. 11,000,000 plus taxes',
    typeNote: 'Government-built apartment tower (UDA)',
    summary: 'Two-bedroom, 550 sq ft apartments by the Urban Development Authority in Colombo 13 with a view of the Colombo Harbour, from Rs 11 million plus taxes.',
    description: 'Harbour View Residencies is an apartment tower by the Urban Development Authority (UDA), sold under its "Lotus - Homes For You" name, in Colombo 13 with a view of the Colombo Harbour. The apartments are two-bedroom units of 550 sq ft, each with a living and dining area, pantry, master bedroom, second bedroom and one bathroom, priced from Rs 11 million plus taxes (US$ 32,500 upwards). The unit drawing shows four layouts, Types A to D, and marks each at 500 sq ft.\n\nThe UDA offers special 5-year payment plans for Sri Lankans working abroad. Sri Lankans living abroad and foreign nationals get a 10% discount for an upfront payment in US dollars, or 5% for payment in two instalments in US dollars. The building has a common parking facility and a garbage collection point.',
    highlights: ['2 bedrooms, 550 sq ft, from Rs 11 million plus taxes', 'View of the Colombo Harbour', '5-year payment plans for Sri Lankans working abroad', '10% discount for upfront payment in US dollars'],
    pricingNotes: ['Rs 11 million plus taxes, or US$ 32,500 upwards, as shown on the UDA flyer on 2026-11-27.'],
    paymentPlanItems: ['Special 5-year payment plans for Sri Lankans working abroad'],
    incentives: ['10% discount for Sri Lankans living abroad and foreign nationals paying upfront in US dollars', '5% discount for payment in two instalments in US dollars'],
    amenities: amen([['Parking', 'Common parking facility']]),
    unitFeatures: [plain('utilities', 'Utilities & Services', ['Garbage collection point'])],
  },
  todo: `${common} SIZE DOUBT: the UDA flyer says 550 sq ft, the unit drawing marks each type at 500 sq ft; entered as 550. The photos show a built tower; construction stage is not stated, so no construction status was set. No map on the UDA page, so no map pin. No video on the page. The discount and payment plan lines come from the UDA flyer, which gives no end date. The flyer itself was not added to the gallery because it carries phone numbers.`,
})

console.log(results.length ? 'created: ' + results.join(', ') : '(nothing created)')
console.log(apply ? 'APPLIED' : 'DRY RUN')
process.exit(0)
