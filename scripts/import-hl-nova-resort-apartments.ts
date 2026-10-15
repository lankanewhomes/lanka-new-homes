/* eslint-disable @typescript-eslint/no-explicit-any -- one-off import script */
// Nova Resort Apartments (Home Lands Skyline): UNPUBLISHED draft + to-dos.
//   HL_DIR=<folder with web/, plans/, brochure.pdf> NODE_ENV=production npx tsx scripts/import-hl-nova-resort-apartments.ts
// Sources: https://www.homelandsskyline.lk/apartment-project/nova-resort-apartments-rajagiriya and its brochure PDF.
import fs from 'node:fs'
import path from 'node:path'
import { config as loadEnv } from 'dotenv'

loadEnv({ path: path.join(process.cwd(), '.env.local') })
const base = process.env.HL_DIR ?? ''
if (!base) throw new Error('Set HL_DIR')
const cfg = ((await import('../payload.config')) as any).default
const { getPayload } = await import('payload')
const { mirrorToR2 } = await import('../src/lib/listing-import/mirror')
const SO = (await import('../src/collections/shared-fields')) as any
const payload = await getPayload({ config: cfg })

const find = async (collection: string, slug: string) =>
  ((await payload.find({ collection: collection as never, where: { slug: { equals: slug } }, limit: 1, overrideAccess: true, depth: 0 })).docs[0] as any) ?? null
const n1 = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '')
const so = (o: any, name: string, opts: string[]) => {
  const v = o[name]; if (v == null || v === '') return
  const hit = opts.find((x) => n1(x) === n1(String(v)))
  if (hit) { o[name] = hit; return }
  o[`${name}_other`] = v; delete o[name]
}
const feat = (field_other: string, value_other: string) => ({ field_other, value_other })
const SLUG = 'nova-resort-apartments'
const R2 = (sub: string, name: string) => `projects/${SLUG}/${sub}/${SLUG}_${name}`
const up = (sub: string, file: string, name: string, dir = 'web', type = 'image/jpeg') => mirrorToR2(R2(sub, name), fs.readFileSync(path.join(base, dir, file)), type)
const SOURCE = 'https://www.homelandsskyline.lk/apartment-project/nova-resort-apartments-rajagiriya'
if (await find('projects', SLUG)) { console.log('exists', SLUG); process.exit(0) }

const dev = await find('developers', 'home-lands-skyline')
if (!dev) throw new Error('developer home-lands-skyline missing')
const nb = await find('neighborhoods', 'rajagiriya')
if (!nb) throw new Error('neighbourhood missing')

const gal: [string, string][] = [["exterior-dusk", "Nova towers at dusk"], ["exterior-dusk-angle", "Nova tower at dusk, angled view"], ["exterior-towers", "Nova apartment towers"], ["exterior-masterplan", "Nova towers and car park"], ["entrance-day", "Entrance in daylight"], ["entrance-gate", "Entrance gate"], ["entrance-evening", "Entrance at evening"], ["swimming-pool", "Swimming pool"], ["pool-deck-evening", "Pool deck at evening"], ["bar-area", "Bar area"], ["sports-lounge", "Sports lounge"], ["community-hall", "Community hall"], ["private-dining-pods", "Private dining pods"]]
const gallery: any[] = []
for (const [k, label] of gal) gallery.push({ label, image: await up('gallery', `${k}.jpg`, `${k}.jpg`) })
const brochureUrl = await up('brochure', 'brochure.pdf', 'brochure.pdf', '.', 'application/pdf')

const PLANS: [string, string, number, number, number][] = [["2br-units-01-04-05-08", "2BR Units 01, 04, 05 and 08, 950 sq ft", 2, 2, 950], ["2br-units-02-03-06-07", "2BR Units 02, 03, 06 and 07, 950 sq ft", 2, 2, 950], ["3br-units-01-04-05-08", "3BR Units 01, 04, 05 and 08, 1,200 sq ft", 3, 2, 1200], ["3br-units-02-03-06-07", "3BR Units 02, 03, 06 and 07, 1,100 sq ft", 3, 2, 1100]]
const floorPlans: any[] = []
for (const [key, name, beds, baths, sqft] of PLANS) {
  floorPlans.push({ planName: name, bedrooms: beds, bathrooms: baths, floorAreaSqFt: sqft, startingPriceLkr: 0, availability: 'Available', image: await up('floor-plans', `${key}.jpg`, `${key}.jpg`, 'plans') })
}

const unitFeatures: any[] = [{"key_other": "General Features", "items": [{"field_other": "Parking", "value_other": "Comes with a dedicated parking slot"}, {"field_other": "Security", "value_other": "24-hour security; smart vehicle gate system"}, {"field_other": "EV Charging", "value_other": "EV charging dock"}, {"field_other": "Power", "value_other": "Back-up power for common areas"}]}]
for (const g of unitFeatures) for (const it of g.items as any[]) { so(it, 'field', SO.KEY_FEATURE_FIELD_OPTIONS); so(it, 'value', SO.KEY_FEATURE_VALUE_OPTIONS) }

const amenityNames: string[] = ["Gym", "Pool", "Steam Room", "Kids Pool", "Children's Area", "BBQ Area", "EV Charging", "Security", "Lounge", "Games Room", "Bar", "Function Room", "Parking"]
for (const a of amenityNames) if (!(SO.AMENITY_NAME_OPTIONS as string[]).includes(a)) throw new Error('amenity not in vocabulary ' + a)

const data: Record<string, any> = {
  slug: SLUG, name: 'Nova Resort Apartments', developer: dev.id, isPublished: false,
  status: 'Now Selling', 
  type: 'Apartments', typeNote: '2 and 3 bedroom resort apartments in Rajagiriya',
  location: 'Rajagiriya', city: 'Rajagiriya', district: 'Colombo', province: 'Western',
  neighborhood: nb.id,
  contractor: 'Heyraa Construction (Pvt) Ltd.',
  units: 224, floors: 8,
  startingPriceLkr: 59000000, priceRange: 'From Rs. 59,000,000',
  summary: '224 two and three bedroom apartments (950 to 1,200 sq ft) in Rajagiriya, connected to Battaramulla, Nugegoda and Borella, with a pool, steam room, sports lounge and gym.',
  description: 'NOVA Resort Apartments is a 224-unit development in Rajagiriya, Ground + 7 floors, built by Heyraa Construction. It offers 2 and 3 bedroom apartments from 950 to 1,200 sq ft. The developer lists a swimming pool, indoor gym, steam room, sports lounge, kids play area, BBQ area and private dining areas, plus 24-hour security, a smart vehicle gate system, an EV charging dock and back-up power for common areas. Each apartment comes with a dedicated parking slot. The developer describes the location as keeping residents connected to Colombo while offering easy access to Battaramulla, Nugegoda and Borella, with hospitals, schools and shopping within reach.',
  highlights: ['224 apartments, 2 and 3 bedrooms, 950 to 1,200 sq ft','Rajagiriya, with easy access to Battaramulla, Nugegoda and Borella','Swimming pool, steam room, sports lounge and indoor gym','Dedicated parking slot with every apartment'],
  heroImage: gallery[0].image, gallery, brochureUrl, floorPlans,
  amenities: amenityNames.map((name) => ({ name })),
  unitFeatures,
  nearby: [{"category": "Hospital", "name": "Golden Key Hospital"}, {"category": "Hospital", "name": "Ayurveda National Hospital"}, {"category": "Shopping", "name": "Cargills Food City"}, {"category": "Shopping", "name": "Keells Super"}, {"category": "Shopping", "name": "JJC Mall"}, {"category": "Restaurant", "name": "Pizza Hut"}, {"category": "Restaurant", "name": "KFC"}, {"category": "Restaurant", "name": "Waters Edge"}, {"category": "School", "name": "Gateway College"}, {"category": "School", "name": "Universal College Lanka"}, {"category": "Landmark", "name": "Diyatha Uyana Park"}, {"category": "Landmark", "name": "Sri Lanka Birds Park"}],
  coordinates: { lat: 6.916495, lng: 79.908357 },
  
  sourceUrl: SOURCE,
  contact: { email: 'info@homelandsskyline.lk', phone: '+94 702 444 111' },
  socialLinks: { whatsapp: 'https://wa.me/94710299444' },
}
for (const k of ['district', 'city', 'province'] as const) so(data, k, SO[`${k.toUpperCase()}_OPTIONS`])
const created: any = await payload.create({ collection: 'projects', data: data as never, overrideAccess: true })
console.log('created', created.id, created.slug, 'published:', created.isPublished, 'plans', created.floorPlans?.length, 'gallery', created.gallery?.length)

const links = [SOURCE, 'https://cms.homelandsskyline.lk/wp-content/uploads/2026/03/Nova-Brochure.pdf', `https://www.lankanewhomes.com/listing-preview/${SLUG}`]
const todos: [string, string?][] = [["Construction stage / completion date", "The page has no \"Construction Stage\" row and no completion date; status entered as Now Selling per import rules. Confirm the real stage."], ["Price per unit and units available", "Only \"59M Upwards\" is published (entered as Rs. 59,000,000). No per-plan prices or availability. Unit split not given."], ["Payment plan", "No payment plan published."], ["Bathrooms per plan", "Site shows \"1-2 Bathrooms\"; brochure floor plans show two toilets plus a maid's toilet for both 2BR and 3BR. Entered 2 for every plan; confirm."], ["Floor count and unit mix", "Page says \"Ground + 7\"; entered 8 floors. 3BR plan areas: units 01/04/05/08 = 1,200 sq ft, units 02/03/06/07 = 1,100 sq ft (the second group's site card shows only \"1100 sq ft\")."], ["No specification sheet", "Unlike the sister projects, the page has no specification accordions, so the Key Features show only parking, security, EV charging and back-up power."], ["Parking detail", "Only \"dedicated parking slot\" is published; no slot count or visitor parking."], ["Architect", "Page lists the developer itself, so no architect record is linked."], ["Amenities not in our vocabulary", "Sports Lounge entered as Lounge and Games Room (approximate); Private Dining Area entered as Function Room (approximate); Back-up power and 24H security only in Key Features."], ["Images not used", "Two drone shots (DJI_...) of the Colombo skyline are area photos; Nova-1 cutout PNG; CAR-IN-01-a (duplicate-style entrance view with sign); CAR-OUT-03 (near-duplicate of the entrance gate)."], ["No video", "The page has no YouTube walkthrough."], ["Map pin", "Coordinates from the developer's Google Maps embed (marker \"Nova Resort Apartments\")."], ["Nearby places", "Taken from the brochure map (landmark names only, no distances)."], ["WhatsApp", "Project WhatsApp set to +94 71 029 9444."], ["Publish?"]]
for (const [title, notes] of todos) {
  await payload.create({ collection: 'listing-todos' as never, data: { title, listingType: 'project', project: created.id, notes, sourceLinks: links.join('\n') } as never, overrideAccess: true })
}
console.log('todos', todos.length)
process.exit(0)
