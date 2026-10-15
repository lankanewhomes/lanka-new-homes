/* eslint-disable @typescript-eslint/no-explicit-any -- one-off import script */
// Serene Heights Resort Apartments (Home Lands Skyline): UNPUBLISHED draft + to-dos.
//   HL_DIR=<folder with web/, plans/, brochure.pdf> NODE_ENV=production npx tsx scripts/import-hl-serene-heights.ts
// Sources: https://www.homelandsskyline.lk/apartment-project/serene-heights-resort-apartments and its brochure PDF.
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
const SLUG = 'serene-heights'
const R2 = (sub: string, name: string) => `projects/${SLUG}/${sub}/${SLUG}_${name}`
const up = (sub: string, file: string, name: string, dir = 'web', type = 'image/jpeg') => mirrorToR2(R2(sub, name), fs.readFileSync(path.join(base, dir, file)), type)
const SOURCE = 'https://www.homelandsskyline.lk/apartment-project/serene-heights-resort-apartments'
if (await find('projects', SLUG)) { console.log('exists', SLUG); process.exit(0) }

const dev = await find('developers', 'home-lands-skyline')
if (!dev) throw new Error('developer home-lands-skyline missing')
const nb = await find('neighborhoods', 'thalawathugoda')
if (!nb) throw new Error('neighbourhood missing')

const gal: [string, string][] = [["exterior-towers", "Serene Heights apartment towers"], ["exterior-paddy-view", "Towers set against paddy fields"], ["exterior-aerial", "Aerial view of the towers"], ["aerial-masterplan", "Aerial view of the development layout"], ["entrance-drive", "Entrance drive"], ["entrance-gate", "Entrance gate"], ["exterior-facade", "Tower facade"], ["swimming-pool", "Swimming pool"], ["swimming-pool-night", "Swimming pool at night"], ["garden-pavilion", "Garden pavilion"], ["kids-play-zone", "Nature friendly kids zone"], ["yoga-deck", "Yoga and meditation deck"], ["artisan-cafe", "Artisan cafe and coffee shop"], ["interior-living", "Apartment living area"], ["interior-dining", "Apartment dining area"], ["interior-bedroom", "Apartment bedroom"]]
const gallery: any[] = []
for (const [k, label] of gal) gallery.push({ label, image: await up('gallery', `${k}.jpg`, `${k}.jpg`) })
const brochureUrl = await up('brochure', 'brochure.pdf', 'brochure.pdf', '.', 'application/pdf')

const PLANS: [string, string, number, number, number][] = [["2br-unit-01", "2BR Unit 01, 950 sq ft", 2, 2, 950], ["2br-unit-02", "2BR Unit 02, 950 sq ft", 2, 2, 950], ["2br-unit-03", "2BR Unit 03, 950 sq ft", 2, 2, 950], ["2br-unit-04", "2BR Unit 04, 950 sq ft", 2, 2, 950], ["2br-unit-05", "2BR Unit 05, 985 sq ft", 2, 2, 985], ["2br-unit-06", "2BR Unit 06, 985 sq ft", 2, 2, 985], ["2br-unit-07", "2BR Unit 07, 985 sq ft", 2, 2, 985], ["2br-unit-08", "2BR Unit 08, 985 sq ft", 2, 2, 985], ["3br-unit-01", "3BR Unit 01, 1,200 sq ft", 3, 2, 1200], ["3br-unit-02", "3BR Unit 02, 1,200 sq ft", 3, 2, 1200], ["3br-unit-03", "3BR Unit 03, 1,200 sq ft", 3, 2, 1200], ["3br-unit-04", "3BR Unit 04, 1,200 sq ft", 3, 2, 1200], ["3br-unit-05", "3BR Unit 05, 1,200 sq ft", 3, 2, 1200], ["3br-unit-06", "3BR Unit 06, 1,200 sq ft", 3, 2, 1200], ["3br-unit-07", "3BR Unit 07, 1,200 sq ft", 3, 2, 1200], ["3br-unit-08", "3BR Unit 08, 1,200 sq ft", 3, 2, 1200]]
const floorPlans: any[] = []
for (const [key, name, beds, baths, sqft] of PLANS) {
  floorPlans.push({ planName: name, bedrooms: beds, bathrooms: baths, floorAreaSqFt: sqft, startingPriceLkr: 0, availability: 'Available', image: await up('floor-plans', `${key}.jpg`, `${key}.jpg`, 'plans') })
}

const unitFeatures: any[] = [{"key": "specifications", "items": [{"field_other": "Substructure", "value_other": "Individual footing foundation with R.C.C. columns, plinth beam and random rubble masonry work as suggested by the structural engineer"}, {"field_other": "Superstructure", "value_other": "R.C.C. columns, beams, slabs, and brick, pre-cast panel or cement block walls as directed by the architect"}, {"field_other": "Flooring", "value_other": "Floor tiles in living, dining, bedrooms and other internal areas; non-slip tiles in verandas, balconies, terraces and bathroom floors"}, {"field_other": "Bathroom Walls", "value_other": "Wall tiles up to the soffit"}, {"field_other": "Painting", "value_other": "Internal walls plastered smooth with two coats of putty, filler coat and two coats of emulsion paint. External walls plastered rough or semi-rough with a five-coat paint system and 10 years warranty"}, {"field_other": "Soffit", "value_other": "Concrete slab with two coats of putty, filler coat and two coats of emulsion paint; balcony soffit with weather shield filler and paint"}, {"field_other": "Pantry", "value_other": "Fully fitted pantry unit with granite or quartz worktop, kitchen cabinets, hob, hood, oven and kitchen sink with tap"}, {"field_other": "Electrical", "value_other": "230V supply with separate electric meter, 13 amp socket outlets, ceiling fans in all bedrooms, air conditioning in the living area and all bedrooms except the servant room, TV, telephone and data outlets, fire detection and protection system, standby generator power, 24-7 CCTV monitoring of common areas"}, {"field_other": "Lighting", "value_other": "Basic soffit-mounted panel light fittings provided by the developer for the unit; common area lighting supplied and fixed"}, {"field_other": "Water Supply & Drainage", "value_other": "PVC cold water pipe network to each bathroom from roof-top tanks filled from an underground sump, separate water meter for each unit, sewer and waste water lines connected to the main sewer line"}, {"field_other": "Plumbing & Sanitary Fittings", "value_other": "International-standard fully fitted bathrooms, a water inlet, drain and power point for the washing machine, hot water via geyser for the master and common bathrooms"}, {"field_other": "Doors & Windows", "value_other": "Fire-rated engineering front door with smart lock; engineering composite doors for bedrooms and bathrooms; powder-coated aluminium French and other windows, servant room and bathroom doors"}, {"field_other": "Waterproofing", "value_other": "Bathroom floors, shower walls, balconies and terraces waterproofed by a reputed company with a 10-year warranty"}, {"field_other": "Termite Treatment", "value_other": "Ground floor treated for termites by a reputed company with a 10-year warranty"}]}, {"key_other": "General Features", "items": [{"field_other": "Parking", "value_other": "One or two parking slots allocated per unit; the allocation cannot be changed"}, {"field_other": "Lift", "value_other": "One passenger lift"}, {"field_other": "Garbage", "value_other": "Separate garbage collection area on the ground floor"}, {"field_other": "Air Conditioning", "value_other": "Fully air conditioned apartments"}, {"field_other": "Access", "value_other": "Smart door lock; tower access control system; smart vehicle gate system"}, {"field_other": "Connectivity", "value_other": "Fibre optic internet"}, {"field_other": "Accessibility", "value_other": "Disabled accessibility"}, {"field_other": "EV Charging", "value_other": "EV charging dock"}, {"field_other": "Security", "value_other": "24/7 security; CCTV for common areas"}]}]
for (const g of unitFeatures) for (const it of g.items as any[]) { so(it, 'field', SO.KEY_FEATURE_FIELD_OPTIONS); so(it, 'value', SO.KEY_FEATURE_VALUE_OPTIONS) }

const amenityNames: string[] = ["Spa", "Pool", "Kids Pool", "Sauna", "Steam Room", "Outdoor Gym", "Gym", "Yoga & Meditation Area", "Jogging Track", "Garden", "BBQ Area", "Children's Area", "Cafe", "Function Room", "Library", "Basketball Court", "Laundry Service", "EV Charging", "Security", "CCTV", "Parking", "Games Room", "Clubhouse"]
for (const a of amenityNames) if (!(SO.AMENITY_NAME_OPTIONS as string[]).includes(a)) throw new Error('amenity not in vocabulary ' + a)

const data: Record<string, any> = {
  slug: SLUG, name: 'Serene Heights Resort Apartments', developer: dev.id, isPublished: false,
  status: 'Under Construction', constructionStatus: 'Under Construction',
  type: 'Apartments', typeNote: '2 and 3 bedroom resort apartments set beside paddy fields',
  location: 'Thalawathugoda', city: 'Thalawathugoda', district: 'Colombo', province: 'Western',
  neighborhood: nb.id,
  contractor: 'Heyraa Construction (Pvt) Ltd.',
  units: 300, floors: 8,
  startingPriceLkr: 42000000, priceRange: 'From Rs. 42,000,000',
  summary: '300 two and three bedroom apartments (950 to 1,200 sq ft) in Thalawathugoda, framed by paddy-field views, with 45+ amenities and the Outer Circular Expressway close by.',
  description: 'Serene Heights Resort Apartments is a 300-unit development in Thalawathugoda, Ground + 7 floors, built by Heyraa Construction. It offers 2 and 3 bedroom apartments from 950 to 1,200 sq ft, with views of paddy fields. The developer lists more than 45 amenities, including a swimming pool and kiddies pool, spa room, sauna and steam room, indoor and outdoor gymnasiums, a yoga and meditation deck, jogging track, artisan cafe, party lawn and BBQ area, a nature friendly kids zone, private tuition class pods, a pool parlor, table tennis, basketball and tennis courts. Each apartment has a modern pantry, spacious balconies, smart door lock and air conditioning in the living area and bedrooms, with one or two parking slots and EV charging docks. The developer describes the location as just minutes from Colombo and the Outer Circular Expressway, with leading hospitals, schools, supermarkets and restaurants a few minutes away.',
  highlights: ['300 apartments, 2 and 3 bedrooms, 950 to 1,200 sq ft','Paddy-field views in Thalawathugoda','45+ amenities including pool, spa and sports lounge','Just minutes from the Outer Circular Expressway'],
  heroImage: gallery[0].image, gallery, brochureUrl, floorPlans,
  amenities: amenityNames.map((name) => ({ name })),
  unitFeatures,
  nearby: [{"category": "Hospital", "name": "Hemas Hospital Thalawathugoda"}, {"category": "Shopping", "name": "SPAR Supermarket Thalawathugoda"}, {"category": "Shopping", "name": "Cargills Food City Thalawathugoda"}, {"category": "Shopping", "name": "Keells Thalawathugoda"}, {"category": "Shopping", "name": "Laugfs SuperMart"}, {"category": "Restaurant", "name": "Domino's Pizza"}, {"category": "Restaurant", "name": "Pizza Hut"}, {"category": "Restaurant", "name": "KFC"}, {"category": "Restaurant", "name": "Arcadia Cafe"}, {"category": "Transport", "name": "Outer Circular Expressway"}, {"category": "Transport", "name": "Athurugiriya Interchange"}, {"category": "Landmark", "name": "Parliament of Sri Lanka"}],
  coordinates: { lat: 6.876556, lng: 79.956647 },
  videos: [{ label: 'Serene Heights Walkthrough', embedUrl: 'https://www.youtube.com/watch?v=QjTyJ-vTVbY' }],
  sourceUrl: SOURCE,
  contact: { email: 'info@homelandsskyline.lk', phone: '+94 702 444 111' },
  socialLinks: { whatsapp: 'https://wa.me/94710299444' },
}
for (const k of ['district', 'city', 'province'] as const) so(data, k, SO[`${k.toUpperCase()}_OPTIONS`])
const created: any = await payload.create({ collection: 'projects', data: data as never, overrideAccess: true })
console.log('created', created.id, created.slug, 'published:', created.isPublished, 'plans', created.floorPlans?.length, 'gallery', created.gallery?.length)

const links = [SOURCE, 'https://cms.homelandsskyline.lk/wp-content/uploads/2026/03/Serene-Heights-Brochure.pdf', `https://www.lankanewhomes.com/listing-preview/${SLUG}`]
const todos: [string, string?][] = [["Completion / handover date", "No completion year on the page or in the brochure. Construction Stage is \"Under Construction\". Left blank."], ["Price per unit and units available", "Only \"42M Upwards\" is published (entered as Rs. 42,000,000). No per-plan prices or availability, so each plan shows \"Contact for pricing\". No split of the 300 units between 2BR and 3BR is given."], ["Payment plan", "No payment plan or deposit terms published."], ["Bathrooms per plan", "Site shows \"2 Bathrooms\"; brochure plan captions say 2 toilets for both 2BR and 3BR (plans also show a maid's toilet). Entered 2 for every plan."], ["Floor count", "Page says \"Ground + 7\"; entered 8 floors. Confirm."], ["Plan labels", "Site groups plans as \"02 Bedroom Units\" for both floors; the 3BR units are 1200 sq ft. Plans named by unit number from the brochure."], ["Architect", "Page lists the developer itself as architect, so no architect record is linked."], ["Amenities not in our vocabulary (not entered)", "Private Tuition Class Pods, Hammock Garden, Bird Feeding Deck, Aerobic Area, Pool Parlor, Table Tennis, Tennis Court, Party Lawn, Community Hall, Management Office, Car Washing Bay, Reading Nooks, Back-up power. Private Dining Areas mapped to Function Room (approximate); Pool Parlor to Games Room; Community Hall to Clubhouse."], ["Images not used", "Area-guide photos (Hemas Hospital, SPAR, a bank ATM) and a photo of a sign reading \"Monarch Imperial\", which is a different project. Pool-table room and gym close-ups skipped."], ["Map pin", "Coordinates from the developer's Google Maps embed (marker \"Serene Heights Resort Apartments\")."], ["WhatsApp", "Project WhatsApp set to +94 71 029 9444 (same as other Home Lands Skyline listings)."], ["Publish?"]]
for (const [title, notes] of todos) {
  await payload.create({ collection: 'listing-todos' as never, data: { title, listingType: 'project', project: created.id, notes, sourceLinks: links.join('\n') } as never, overrideAccess: true })
}
console.log('todos', todos.length)
process.exit(0)
