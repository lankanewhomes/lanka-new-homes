/* eslint-disable @typescript-eslint/no-explicit-any -- one-off import script */
// BayFonte Marina Villas (Home Lands Skyline), Negombo: UNPUBLISHED draft + to-dos.
//   NODE_ENV=production npx tsx scripts/import-hl-bayfonte-marina-villas.ts
import { HL_DIR, SO, payload, find, so, feat, up, checkAmenities, near, addTodos } from './hl-common'

const SLUG = 'bayfonte-marina-villas'
const SOURCE = 'https://www.homelandsskyline.lk/housing-project/bayfonte-marina-villas-for-sale-in-negombo'
const BROCHURE = 'https://cms.homelandsskyline.lk/wp-content/uploads/2025/11/Bayfonte-Villa-Brochure-compressed-1.5MB-1.pdf'
if (await find('projects', SLUG)) { console.log('exists', SLUG); process.exit(0) }
const dev = await find('developers', 'home-lands-skyline')
const nb = await find('neighborhoods', 'negombo')
const D = `${HL_DIR}/out/bay`

const gal: [string, string, string][] = [
  ['exterior-villa-row', 'BayFonte Marina Villas, row of villas', 'exterior-villa-row.jpg'],
  ['exterior-entrance-clubhouse-dusk', 'Villas and the BayFonte entrance and clubhouse at dusk', 'exterior-entrance-clubhouse-dusk.jpg'],
  ['exterior-type-c-villas', 'Type C villas', 'exterior-type-c-villas.jpg'],
]
const gallery: any[] = []
for (const [k, label, f] of gal) gallery.push({ label, image: await up(SLUG, 'gallery', `${k}.jpg`, `${D}/g/${f}`) })
const brochureUrl = await up(SLUG, 'brochure', 'brochure.pdf', `${HL_DIR}/bay/brochure.pdf`, 'application/pdf')

const PLANS = [
  { key: 'type-a-3br-2950', name: 'Type A 3BR Villa, 2,950 sq ft', beds: 3, baths: 3, sqft: 2950 },
  { key: 'type-b-3br-2775', name: 'Type B 3BR Villa, 2,775 sq ft', beds: 3, baths: 3, sqft: 2775 },
  { key: 'type-c-4br-3400', name: 'Type C 4BR Villa, 3,400 sq ft', beds: 4, baths: 4, sqft: 3400 },
]
const floorPlans: any[] = []
for (const p of PLANS) floorPlans.push({ planName: p.name, bedrooms: p.beds, bathrooms: p.baths, floorAreaSqFt: p.sqft, startingPriceLkr: 0, availability: 'Available', image: await up(SLUG, 'floor-plans', `${p.key}.jpg`, `${D}/plans/${p.key}.jpg`) })

const unitFeatures = [{
  key: 'specifications',
  items: [
    feat('Substructure', 'Individual footing foundation with R.C.C. columns, plinth beam and random rubble masonry'),
    feat('Superstructure', 'R.C.C. columns, beams, slabs and bricks and cement blocks on walls'),
    feat('Flooring', 'Engineered timber in the ground floor living and dining area; floor tiles in bedrooms and other internal areas; non-slip tiles on verandas, balconies, terraces and bathroom floors'),
    feat('Bathroom Walls', 'Wall tiles up to the soffit'),
    feat('Painting', 'Internal walls: two coats of putty, filler coat and two coats of emulsion paint. External walls: five-coat paint system with 10 years warranty'),
    feat('Handrail', 'Glass handrail on terrace and balcony'),
    feat('Pantry', 'Fully equipped imported high-gloss pantry unit with granite or quartz worktop, kitchen cabinets, hob, hood, electric oven, dishwasher and sink with tap'),
    feat('Electrical', 'Three-phase supply with separate electric meter, 13 amp sockets, ceiling fans in all bedrooms, air conditioning in the living area and all bedrooms except the servant room, TV, telephone and data sockets in the family lounge and master bedroom, provision for a solar panel system'),
    feat('Lighting', 'Point wiring only; no light fittings provided by the developer'),
    feat('Water Supply & Drainage', 'PVC cold water pipe network to each bathroom from roof-top tanks via a booster pump; sewerage treatment plant and soakage pit'),
    feat('Plumbing & Sanitary Fittings', 'Fully fitted bathrooms except the servant toilet, a bath tub in the master bathroom of specific units, a washing machine water and power point, hot water via a solar tank for the master and common bathrooms'),
    feat('Doors & Windows', 'Engineering front and rear doors; wood plastic composite bedroom and bathroom doors; powder-coated aluminium French and other windows'),
    feat('Waterproofing', 'Bathroom floors, shower walls, balconies and terraces waterproofed by a reputed company with a 10-year warranty'),
    feat('Termite Treatment', 'Ground floor treated for termites by a reputed company with a 10-year warranty'),
    feat('External Works', 'Landscaping and interlocking paving; car park covered by a roller door'),
  ],
}]
for (const g of unitFeatures) for (const it of g.items as any[]) { so(it, 'field', SO.KEY_FEATURE_FIELD_OPTIONS); so(it, 'value', SO.KEY_FEATURE_VALUE_OPTIONS) }

const amenityNames = ['Restaurant', 'Bar', 'Spa', 'Cafe', 'Meeting Room', 'Function Room', 'Karaoke Room', "Children's Area", 'EV Charging', 'Security']
checkAmenities(amenityNames)

const nearby = [
  ...near('School', ["Maris Stella College", 'Ave Maria Convent', "Newstead Girls' College", "St Mary's College", 'Gateway College', "St. Nicholas college", 'Loyola College', "St. Thomas' College"]),
  ...near('Hospital', ['District General Hospital Negombo', 'Nawaloka Hospital']),
  ...near('Restaurant', ['KFC', 'Dinemore', 'Pizza Hut', "Domino's", 'Burger King']),
  ...near('Landmark', ['Heritance Negombo', 'Avenra Garden hotel', 'Grandeeza hotel', 'Jetwing Blue', 'Jetwing Sea', 'Jetwing Lagoon', 'Jetwing Beach', 'Negombo Lagoon', 'Negombo Beach', 'Negombo Fish Market']),
  ...near('Transport', ['Bandaranaike International Airport', 'Airport Expressway', 'Katunayake South Railway']),
]

const data: Record<string, any> = {
  slug: SLUG, name: 'BayFonte Marina Villas', developer: dev.id, isPublished: false,
  status: 'Now Selling',
  type: 'Villas', typeNote: 'Two-storey 3 and 4 bedroom villas by the Negombo lagoon',
  location: 'Negombo (Negombo-Colombo main road)', city: 'Negombo', district: 'Gampaha', province: 'Western',
  neighborhood: nb?.id, contractor: undefined, floors: 2,
  startingPriceLkr: 108000000, priceRange: 'From Rs. 108,000,000',
  parking: '2 covered parking spaces per villa',
  rentalIncome: 'Developer states the villas have the potential to generate rental income in dollars.',
  summary: 'Two-storey 3 and 4 bedroom villas of 2,775 to 3,400 sq ft facing the Negombo-Colombo main road, in the BayFonte Marina development, with a restaurant, bar, spa and meeting rooms.',
  description:
    'BayFonte Marina Villas is a villa development by Home Lands Skyline in Negombo, facing the Negombo-Colombo main road. The brochure shows three two-storey layouts: Type A, a 3 bedroom villa of 2,950 sq ft; Type B, a 3 bedroom villa of 2,775 sq ft; and Type C, a 4 bedroom villa of 3,400 sq ft. Each plan includes a living and dining area, a pantry, a maid\'s facility and a service yard, with covered parking for two cars and a rear garden, as the developer describes. The developer lists exclusive villa activities and amenities including the BayFonte bar, an restaurant, a coffee shop, a VIP dining room, a private party room, meeting rooms, a karaoke room, a spa, a toddlers\' area, kids art and craft, EV charging stations and 24/7 security. The developer\'s page also mentions a modern shopping mall with a supermarket, cafe, food court, pub and game zone next to the villas, and says the villas could generate rental income in dollars.',
  highlights: [
    'Two-storey 3 and 4 bedroom villas, 2,775 to 3,400 sq ft',
    'Facing the Negombo-Colombo main road, near the Negombo lagoon',
    'On-site restaurant, bar, spa, meeting rooms and EV charging',
    'Developer states the villas could earn rental income in dollars',
  ],
  heroImage: gallery[0].image, gallery, brochureUrl, floorPlans,
  amenities: amenityNames.map((name) => ({ name })),
  unitFeatures, nearby,
  sourceUrl: SOURCE,
  contact: { email: 'info@homelandsskyline.lk', phone: '+94 702 444 111' },
  socialLinks: { whatsapp: 'https://wa.me/94710299444' },
}
data.description = data.description.replace('an restaurant', 'a restaurant')
delete data.contractor
for (const k of ['district', 'city', 'province'] as const) so(data, k, SO[`${k.toUpperCase()}_OPTIONS`])
const created: any = await payload.create({ collection: 'projects', data, overrideAccess: true })
console.log('created', created.id, created.slug, 'published:', created.isPublished, 'plans', created.floorPlans?.length, 'gallery', created.gallery?.length)

const links = [SOURCE, BROCHURE, `https://www.lankanewhomes.com/listing-preview/${SLUG}`]
await addTodos(created.id, links, [
  ['Unit cards on the page are placeholders', 'The page\'s unit cards (Type A 3BR 1,218 sq ft, Type B 4BR 1,506 sq ft) are copied from the Canterbury listing and its specification text is the Canterbury one. They were ignored. The brochure layouts (Type A 2,950, Type B 2,775, Type C 3,400 sq ft) were used; they match the page header range of 2,775 to 3,400 sq ft.'],
  ['Number of villas and construction stage not published', 'Neither the page nor the brochure gives a villa count, completion year or construction stage. Units left blank and status set to Now Selling (default).'],
  ['Price per plan and availability', 'Only "108M upwards" is published (entered as from Rs. 108,000,000). No per-plan prices; all plans set Available.'],
  ['Payment plan', 'No payment plan is published on the page or in the brochure.'],
  ['Map pin', 'No Google Maps embed on the page, so no coordinates. The brochure shows the site on the Colombo-Negombo road next to the Negombo lagoon and the Airport Expressway. Exact address not published.'],
  ['Amenities not in our list', 'Not mapped: Exclusive VIP Dining Room, Kids Art & Craft, Entertaining Karaoke Room (mapped as Karaoke Room), Toddlers\' Area (mapped as Children\'s Area). Page also lists "Modern Meeting Rooms" and "Private Party Room" (mapped to Meeting Room and Function Room).'],
  ['Shopping mall next to the villas', 'The page text says a modern shopping mall with supermarket, cafe, food court, pub and game zone is within reach. It is not confirmed as part of this development, so it is only mentioned in the description as the developer says.'],
  ['Rental income claim', 'Developer marketing: the villas have the potential to generate rental income in dollars. Entered as the developer\'s statement, no figure given.'],
  ['Architect and contractor', 'The page lists the architect as Home Lands Skyline (Pvt) Ltd itself (no architect record linked) and gives no construction company.'],
  ['Nearby places', 'Transcribed from the brochure connectivity page: schools, hospitals, restaurants, hotels (as landmarks), airport and expressway. Banks were left out. Distances are not published.'],
  ['WhatsApp number', 'Project WhatsApp set to +94 71 029 9444 (the number the Skyline site uses). Contact email is the developer\'s info@homelandsskyline.lk.'],
  ['Unused images', 'Not used: best-choice banner (generic), brochure aerial masterplan with text overlays, interior collages (several small renders on one page), stock restaurant couple photo, Negombo tourism photos.'],
  ['Publish?'],
])
process.exit(0)
