/* eslint-disable @typescript-eslint/no-explicit-any -- one-off import script */
// Creates the Crystal Property Group developer and the Crystal Sands Sky Villas listing (UNPUBLISHED draft).
//
//   CS_DIR=<folder holding the prepared images, see FILES below> NODE_ENV=production npx tsx scripts/import-crystal-sands.ts
//
// Sources: crystal-sands.com (/residences/, /our-suites/, /room/*), its brochure PDF, cpg.lk and cpg.lk/projects/crystal-sands/.
// Only developer-published facts are entered; conflicts between those sources are listed in the hand-off report, not resolved here.
import fs from 'node:fs'
import path from 'node:path'
import { config as loadEnv } from 'dotenv'
import type payloadConfigType from '../payload.config'

loadEnv({ path: path.join(process.cwd(), '.env.local') })
const dir = process.env.CS_DIR ?? ''
if (!dir) throw new Error('Set CS_DIR')
const SLUG = 'crystal-sands-sky-villas'
const DEV_SLUG = 'crystal-property-group'

const payloadConfig = ((await import('../payload.config')) as { default: typeof payloadConfigType }).default
const { getPayload } = await import('payload')
const { mirrorToR2 } = await import('../src/lib/listing-import/mirror')
const { AMENITY_NAME_OPTIONS } = await import('../src/collections/shared-fields')
const payload = await getPayload({ config: payloadConfig })

const up = async (file: string, key: string, type: string) => mirrorToR2(key, fs.readFileSync(path.join(dir, file)), type)
const find = async (collection: string, slug: string) =>
  ((await payload.find({ collection: collection as never, where: { slug: { equals: slug } }, limit: 1, overrideAccess: true, depth: 0 })).docs[0] as any) ?? null

// ---- developer
let dev = await find('developers', DEV_SLUG)
if (!dev) {
  const logo = await up('logo.png', `logos/developers/${DEV_SLUG}-logo.png`, 'image/png')
  dev = await payload.create({
    collection: 'developers',
    data: {
      slug: DEV_SLUG,
      name: 'Crystal Property Group',
      logo,
      description:
        'Crystal Property Group (CPG) is a luxury property developer and hospitality group founded in 2018, creating limited-inventory properties in city, coastal and highland locations across Sri Lanka. Through The One Group of Hotels, CPG integrates hospitality operations into its developments, offering owners private ownership, curated service and managed rental potential.',
      website: 'https://cpg.lk',
      location: 'Rajagiriya',
      establishedYear: 2018,
      contact_phone: '+94772292202',
      contact_email: 'sales@cpg.lk',
      socialLinks: {
        facebook: 'https://www.facebook.com/crystalpropertygroup/',
        instagram: 'https://www.instagram.com/cpgsrilanka/',
        linkedin: 'https://lk.linkedin.com/company/crystalpropertygroup',
        youtube: 'https://www.youtube.com/@crystalpropertygroupsl',
        // wa.me built from CPG's published sales mobile (077 229 2202); the developer does not publish a WhatsApp link.
        whatsapp: 'https://wa.me/94772292202',
      },
    } as never,
    overrideAccess: true,
  })
  console.log('Developer created', dev.id)
} else console.log('Developer exists', dev.id)

if (await find('projects', SLUG)) { console.log('project exists', SLUG); process.exit(0) }

// ---- media
const R = (sub: string, name: string) => `projects/${SLUG}/${sub}/${SLUG}_${name}`
const gal: [string, string][] = [
  ['g_building-exterior', 'Crystal Sands Sky Villas, beachfront building'],
  ['g_building-facade-rooftop-above-beach', 'Building facade and rooftop above the beach'],
  ['g_presidential-suite-living-dining', 'Presidential Suite, living and dining area'],
  ['g_suite-living-room-ocean-view', 'Sky Villa living room with ocean view'],
  ['g_suite-living-room-balcony-doors', 'Sky Villa living room'],
  ['g_suite-living-area-balcony', 'Sky Villa living area and balcony'],
  ['g_suite-balcony-ocean-view', 'Sky Villa balcony, ocean view'],
  ['g_suite-living-dining-balcony', 'Sky Villa living and dining area'],
  ['g_suite-living-terrace-sea-view', 'Sky Villa living area and terrace, sea view'],
  ['g_suite-bedroom', 'Sky Villa bedroom'],
  ['g_suite-bedroom-ocean-view', 'Sky Villa bedroom with ocean view'],
  ['g_suite-bedroom-lounge', 'Sky Villa bedroom and lounge'],
  ['g_suite-bathroom-rain-shower', 'Sky Villa en-suite bathroom'],
  ['g_balcony-lounge-sea-view', 'Balcony lounge, sea view'],
  ['g_private-plunge-pool-balcony', 'Private plunge pool on the balcony'],
  ['g_balcony-plunge-pool-lounge', 'Balcony plunge pool and lounge'],
  ['g_plunge-pool-terrace-ocean', 'Plunge pool terrace overlooking the ocean'],
  ['g_beachfront-terrace-dining', 'Beachfront terrace dining'],
  ['g_beach-dinner-sunset', 'Beach dinner at sunset'],
  ['g_rooftop-terrace-sunset', 'Rooftop terrace at sunset'],
  ['g_tempest-rooftop-restaurant', 'Tempest rooftop restaurant'],
  ['g_rooftop-infinity-pool-dining', 'Rooftop infinity pool dining'],
]
const gallery: { label: string; image: string }[] = []
for (const [f, label] of gal) gallery.push({ label, image: await up(`${f}.jpg`, R('gallery', `${f.slice(2)}.jpg`), 'image/jpeg') })
// amenities/ photos: the label must equal the amenity name for the Amenities section to pick it up.
for (const [f, label] of [['a_pool', 'Pool'], ['a_infinity-pool', 'Infinity Pool'], ['a_beachfront', 'Beachfront'], ['a_rooftop', 'Rooftop'], ['a_sea-view', 'Sea View']] as const)
  gallery.push({ label, image: await up(`${f}.jpg`, R('amenities', `${f.slice(2)}.jpg`), 'image/jpeg') })
const heroImage = gallery[0].image
const brochureUrl = await up('brochure.pdf', R('brochure', 'brochure.pdf'), 'application/pdf')
const fp = async (n: string) => up(`fp_${n}.jpg`, R('floor-plans', `${n}.jpg`), 'image/jpeg')

// ---- floor plans (one per suite type). Bathrooms/area per the unit drawings and cpg.lk; floors/units available per the brochure and /residences/.
const plan = async (o: { name: string; file: string; beds: number; baths: number; sqft: number; inPlan: number; avail: number; floors: string[]; view?: boolean; kitchen?: string }) => ({
  planName: o.name,
  bedrooms: o.beds,
  bathrooms: o.baths,
  ensuiteBaths: o.baths,
  floorAreaSqFt: o.sqft,
  startingPriceLkr: 0,
  unitsInPlan: o.inPlan,
  unitsAvailable: o.avail,
  furnishing: 'Fully Furnished',
  pantry: 'Yes',
  image: await fp(o.file),
  availability: 'Available',
  floorAvailability: o.floors.map((floor) => ({ floor, available: true })),
})
const floorPlans = [
  await plan({ name: 'Palm Suite', file: 'palm-suite', beds: 2, baths: 2, sqft: 855, inPlan: 7, avail: 2, floors: ['6th floor', '7th floor'] }),
  await plan({ name: 'Sands Suite', file: 'sands-suite', beds: 2, baths: 2, sqft: 1050, inPlan: 8, avail: 3, floors: ['2nd floor', '5th floor', '7th floor'] }),
  await plan({ name: 'Surf Suite', file: 'surf-suite', beds: 3, baths: 3, sqft: 1456, inPlan: 8, avail: 1, floors: ['6th floor'] }),
  await plan({ name: 'Presidential Suite', file: 'presidential-suite', beds: 4, baths: 4, sqft: 3696, inPlan: 1, avail: 1, floors: ['9th floor (entire floor)'] }),
]

const amenities = ['Pool', 'Infinity Pool', 'Beachfront', 'Sea View', 'Rooftop', 'Gym', 'Concierge', 'Security', 'Hotel'].map((name) => {
  if (!(AMENITY_NAME_OPTIONS as string[]).includes(name)) throw new Error('amenity not in vocabulary ' + name)
  return { name }
})

const feat = (field_other: string, value_other: string) => ({ field_other, value_other })
const unitFeatures = [
  {
    key: 'indoor',
    items: [
      feat('Smart Home', 'Alexa-enabled home automation'),
      feat('Air Conditioning', 'Air-conditioned suites'),
      feat('Furnishing', 'Fully furnished'),
      feat('Bathrooms', 'En-suite bathrooms with rain showers'),
      feat('Kitchen', 'Kitchenette in the Palm, Sands and Surf Suites; gourmet kitchen in the Presidential Suite'),
      feat('Living Areas', 'Indoor and outdoor living spaces with a terrace and pantry'),
      feat('In-suite Extras', 'Safety deposit box, mini fridge, cable TV and Netflix, Wi-Fi, bathrobes, iron and ironing board, hair dryer'),
      feat('Security', 'Enhanced security and restricted floor access'),
    ],
  },
  {
    key: 'outdoor',
    items: [
      feat('Plunge Pool', 'Private plunge pool on the balcony of every Sky Villa'),
      feat('Rooftop Pool', 'Rooftop infinity pool overlooking the ocean'),
      feat('Rooftop Dining', 'Tempest rooftop multi-cuisine restaurant and bar'),
      feat('Wellness', 'Fully equipped gymnasium and spa'),
      feat('Beach', 'Direct beachfront access'),
      feat('Dining', 'Family-friendly spaces and en-suite dining'),
    ],
  },
]

const ownershipServices = [
  {
    key: 'After-Sales & Services',
    items: [
      {
        field: 'Property Management',
        value:
          'Owners enter a Rental Management Agreement with The One Group of Hotels, which manages the Sky Villa as part of Crystal Sands hotel operations when the owner is away. Owners have no restriction on personal use and receive an app to track their unit\'s availability and returns.',
      },
      { field_other: 'Rental Returns', value: 'Approximately 40% of the topline revenue generated by the owner\'s unit' },
      { field: 'Resident Services', value: 'Restaurant and room service, 24-hour on-site reception, security and concierge service, on-site maintenance' },
      { field_other: 'Owner Privileges', value: 'Home Around The Pearl: owners join The One Group of Hotels collection, with discounted stays, access to exclusive resort facilities and the dedicated Group Concierge' },
    ],
  },
]

const nbhd = await find('neighborhoods', 'hikkaduwa')
if (!nbhd) throw new Error('hikkaduwa neighbourhood missing')

const data: Record<string, any> = {
  slug: SLUG,
  name: 'Crystal Sands Sky Villas',
  developer: dev.id,
  isPublished: false,
  status: 'Completed',
  constructionStatus: 'Completed',
  type: 'Serviced Apartment',
  typeNote: 'Hotel-managed beachfront Sky Villas',
  location: 'No. 503, Galle Road, Rathgama, Hikkaduwa',
  city: 'Hikkaduwa',
  district: 'Galle',
  province: 'Southern',
  neighborhood: nbhd.id,
  security: '24/7 Security Guard',
  units: 24,
  availableUnits: 7,
  floors: 9,
  priceRange: 'From USD 200,000',
  availablePlanPrices: 'Palm Suite from USD 200,000 · Sands Suite from USD 340,000 · Surf Suite from USD 310,000 · Presidential Suite from USD 750,000',
  rentalIncome: 'Approximately 40% of the topline revenue generated by the owner\'s unit, under a Rental Management Agreement with The One Group of Hotels',
  pricingUpdated: '2026-10-10',
  summary:
    'Twenty-four beachfront Sky Villas, two, three and four bedrooms, on Galle Road in Rathgama, Hikkaduwa, each with a private plunge pool and ocean views, managed as part of Crystal Sands hotel operations by The One Group of Hotels.',
  description:
    'Crystal Sands offers 24 luxury Sky Villas on Sri Lanka\'s southern coast, each with a plunge pool, ocean views and smart living, including 2, 3 and 4-bedroom residences. Owners enjoy their residence whenever they wish, and when they are away the team manages it as part of Crystal Sands hotel operations. The building has direct beachfront access, a rooftop infinity pool, the Tempest rooftop multi-cuisine restaurant and bar, a fully equipped gymnasium and spa, and 24-hour concierge, reception and security.',
  highlights: [
    '24 beachfront Sky Villas in Hikkaduwa, two to four bedrooms',
    'Private plunge pool and ocean views in every Sky Villa',
    'Rooftop infinity pool, restaurant and bar',
    'Managed by The One Group of Hotels, with unrestricted owner use',
  ],
  heroImage,
  gallery,
  brochureUrl,
  floorPlans,
  amenities,
  unitFeatures,
  ownershipServices,
  coordinates: { lat: 6.0865138, lng: 80.1449341 },
  contact: { email: 'sales@cpg.lk', phone: '+94772292202', address: 'No. 503, Galle Road, Rathgama, Hikkaduwa' },
  socialLinks: {
    facebook: 'https://www.facebook.com/crystalsandssrilanka',
    instagram: 'https://www.instagram.com/crystalsandssrilanka/',
    whatsapp: 'https://wa.me/94772292202',
  },
  nearby: [
    { category: 'Landmark', name: 'Rathgama Lake (5 min)' },
    { category: 'Landmark', name: 'Hikkaduwa Beach (10 min)' },
    { category: 'Landmark', name: 'Seenigama Vihara (10 min)' },
    { category: 'Landmark', name: 'Moonstone Mine (10 min)' },
    { category: 'Landmark', name: 'Galle Fort (15 min)' },
    { category: 'Landmark', name: 'Bentota (40 min)' },
    { category: 'Transport', name: 'Hikkaduwa Railway Station (10 min)' },
    { category: 'Transport', name: 'Southern Expressway, Baddegama Exit (Exit 7)', distanceKm: 12.8 },
    { category: 'Landmark', name: 'Colombo (about 2 hours)' },
  ],
}

// Select-with-other fields: keep fixed options, spill anything else into *_other.
const SO = await import('../src/collections/shared-fields')
const n1 = (v: string) => v.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
const so = (o: Record<string, any>, name: string, opts: string[]) => {
  const v = o[name]
  if (typeof v !== 'string' || !v) return
  const hit = opts.find((x) => n1(x) === n1(v))
  if (hit) { o[name] = hit; return }
  o[`${name}_other`] = v
  delete o[name]
}
so(data, 'district', (SO as any).DISTRICT_OPTIONS)
so(data, 'city', (SO as any).CITY_OPTIONS)
so(data, 'province', (SO as any).PROVINCE_OPTIONS)
for (const g of unitFeatures as any[]) for (const it of g.items) { so(it, 'field', (SO as any).KEY_FEATURE_FIELD_OPTIONS); so(it, 'value', (SO as any).KEY_FEATURE_VALUE_OPTIONS) }
for (const g of ownershipServices as any[]) for (const it of g.items) so(it, 'field', (SO as any).OWNERSHIP_FIELD_OPTIONS)
for (const p of floorPlans as any[]) { so(p, 'furnishing', (SO as any).FURNISHING_OPTIONS); so(p, 'pantry', (SO as any).YES_NO_OPTIONS) }

const created = await payload.create({ collection: 'projects', data: data as never, overrideAccess: true })
console.log('created project', created.id, (created as any).slug, 'published:', (created as any).isPublished)
process.exit(0)
