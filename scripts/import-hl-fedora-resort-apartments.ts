/* eslint-disable @typescript-eslint/no-explicit-any -- one-off import script */
// Fedora Resort Apartments (Home Lands Skyline): UNPUBLISHED draft + to-dos.
//   HL_DIR=<folder with web/, plans/, brochure.pdf> NODE_ENV=production npx tsx scripts/import-hl-fedora-resort-apartments.ts
// Sources: https://www.homelandsskyline.lk/apartment-project/fedora-resort-apartments-athurugiriya and its brochure PDF.
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
const SLUG = 'fedora-resort-apartments'
const R2 = (sub: string, name: string) => `projects/${SLUG}/${sub}/${SLUG}_${name}`
const up = (sub: string, file: string, name: string, dir = 'web', type = 'image/jpeg') => mirrorToR2(R2(sub, name), fs.readFileSync(path.join(base, dir, file)), type)
const SOURCE = 'https://www.homelandsskyline.lk/apartment-project/fedora-resort-apartments-athurugiriya'
if (await find('projects', SLUG)) { console.log('exists', SLUG); process.exit(0) }

const dev = await find('developers', 'home-lands-skyline')
if (!dev) throw new Error('developer home-lands-skyline missing')
const nb = await find('neighborhoods', 'athurugiriya')
if (!nb) throw new Error('neighbourhood missing')

const gal: [string, string][] = [["exterior-pool-view", "Fedora towers and pool"], ["swimming-pool", "Swimming pool"], ["pool-deck", "Pool deck"], ["entrance-gate", "Entrance gate"], ["kids-play-area", "Kids play area"], ["gymnasium", "Fully equipped gym"], ["community-hall", "Community hall"]]
const gallery: any[] = []
for (const [k, label] of gal) gallery.push({ label, image: await up('gallery', `${k}.jpg`, `${k}.jpg`) })
const brochureUrl = await up('brochure', 'brochure.pdf', 'brochure.pdf', '.', 'application/pdf')

const PLANS: [string, string, number, number, number][] = [["2br-units-01-04-05-08", "2BR Units 01, 04, 05 and 08, 950 sq ft", 2, 2, 950], ["2br-units-02-03", "2BR Units 02 and 03, 950 sq ft", 2, 2, 950], ["2br-units-06-07", "2BR Units 06 and 07, 950 sq ft", 2, 2, 950], ["3br-units-01-04-05-08", "3BR Units 01, 04, 05 and 08, 1,200 sq ft", 3, 2, 1200], ["3br-units-02-03", "3BR Units 02 and 03, 1,100 sq ft", 3, 2, 1100], ["3br-units-06-07", "3BR Units 06 and 07, 1,100 sq ft", 3, 2, 1100]]
const floorPlans: any[] = []
for (const [key, name, beds, baths, sqft] of PLANS) {
  floorPlans.push({ planName: name, bedrooms: beds, bathrooms: baths, floorAreaSqFt: sqft, startingPriceLkr: 0, availability: 'Available', image: await up('floor-plans', `${key}.jpg`, `${key}.jpg`, 'plans') })
}

const unitFeatures: any[] = [{"key": "specifications", "items": [{"field_other": "Substructure", "value_other": "Individual footing foundation with R.C.C. columns, plinth beam and random rubble masonry work as suggested by the structural engineer"}, {"field_other": "Superstructure", "value_other": "R.C.C. columns, beams, slabs, and brick, pre-cast panel or cement block walls as directed by the architect"}, {"field_other": "Flooring", "value_other": "Floor tiles in living, dining, bedrooms and other internal areas; non-slip tiles in verandas, balconies, terraces and bathroom floors"}, {"field_other": "Bathroom Walls", "value_other": "Wall tiles up to the soffit"}, {"field_other": "Painting", "value_other": "Internal walls plastered smooth with two coats of putty, filler coat and two coats of emulsion paint. External walls plastered rough or semi-rough with a five-coat paint system and 10 years warranty"}, {"field_other": "Soffit", "value_other": "Concrete slab with two coats of putty, filler coat and two coats of emulsion paint; balcony soffit with weather shield filler and paint"}, {"field_other": "Pantry", "value_other": "Fully equipped pantry unit with granite or quartz worktop, kitchen cabinets, hob, hood, electric oven and kitchen sink with tap"}, {"field_other": "Electrical", "value_other": "230V supply with separate electric meter, 13 amp socket outlets, ceiling fans in all bedrooms, air conditioning in the living area and all bedrooms except the servant room, TV, telephone and data outlets, fire detection and protection system, standby generator power, 24-7 CCTV monitoring of common areas"}, {"field_other": "Lighting", "value_other": "No light fittings provided by the developer for the unit (point wiring only); common area lighting supplied and fixed"}, {"field_other": "Water Supply & Drainage", "value_other": "PVC cold water pipe network to each bathroom from roof-top tanks filled from an underground sump, separate water meter for each unit, sewer and waste water lines connected to the main sewer line"}, {"field_other": "Plumbing & Sanitary Fittings", "value_other": "International-standard fully fitted bathrooms, a water inlet, drain and power point for the washing machine, hot water via geyser for the master and common bathrooms"}, {"field_other": "Doors & Windows", "value_other": "Fire-rated engineering front and rear doors; engineering composite doors for bedrooms and bathrooms; powder-coated aluminium French and other windows, servant room and bathroom doors"}, {"field_other": "Waterproofing", "value_other": "Bathroom floors, shower walls, balconies and terraces waterproofed by a reputed company with a 10-year warranty"}, {"field_other": "Termite Treatment", "value_other": "Ground floor treated for termites by a reputed company with a 10-year warranty"}]}, {"key_other": "General Features", "items": [{"field_other": "Parking", "value_other": "One parking slot per unit; the allocation cannot be changed"}, {"field_other": "Lift", "value_other": "One passenger lift"}, {"field_other": "Garbage", "value_other": "Separate garbage collection area on the ground floor"}]}]
for (const g of unitFeatures) for (const it of g.items as any[]) { so(it, 'field', SO.KEY_FEATURE_FIELD_OPTIONS); so(it, 'value', SO.KEY_FEATURE_VALUE_OPTIONS) }

const amenityNames: string[] = ["Pool", "Kids Pool", "Gym", "Jogging Track", "Spa", "Cafe", "BBQ Area", "Children's Area", "EV Charging", "Function Room", "Parking", "Security", "CCTV"]
for (const a of amenityNames) if (!(SO.AMENITY_NAME_OPTIONS as string[]).includes(a)) throw new Error('amenity not in vocabulary ' + a)

const data: Record<string, any> = {
  slug: SLUG, name: 'Fedora Resort Apartments', developer: dev.id, isPublished: false,
  status: 'Under Construction', constructionStatus: 'Foundation',
  type: 'Apartments', typeNote: '2 and 3 bedroom resort apartments in Athurugiriya',
  location: 'Athurugiriya', city: 'Athurugiriya', district: 'Colombo', province: 'Western',
  neighborhood: nb.id,
  contractor: 'Heyraa Construction (Pvt) Ltd.',
  units: 280, floors: 7,
  startingPriceLkr: 40000000, priceRange: 'From Rs. 40,000,000',
  summary: '280 two and three bedroom apartments (950 to 1,200 sq ft) in Athurugiriya, 900 m from the Athurugiriya highway interchange, with a pool, gym, jogging track and on-site medical centre.',
  description: 'Fedora Resort Apartments is a 280-unit development in Athurugiriya, 7 floors, built by Heyraa Construction. The developer gives the construction stage as under construction, at the piling stage. It offers 2 and 3 bedroom apartments from 950 to 1,200 sq ft, each with one parking slot. The developer lists a swimming pool and kids pool, fully equipped gym, jogging track, spa, coffee shop, BBQ pavilion, kids play area and day care center, a medical center with 24/7 doctor service, bill paying facilities, EV charging facilities and standby generators. The developer describes the location as 900 m from the Athurugiriya highway interchange, with higher educational institutes, hospitals, supermarkets and shopping centers a few minutes away.',
  highlights: ['280 apartments, 2 and 3 bedrooms, 950 to 1,200 sq ft','900 m to the Athurugiriya highway interchange','Pool, kids pool, gym, jogging track, spa and coffee shop','Medical center with 24/7 doctor service on site'],
  heroImage: gallery[0].image, gallery, brochureUrl, floorPlans,
  amenities: amenityNames.map((name) => ({ name })),
  unitFeatures,
  nearby: [{"category": "Transport", "name": "Athurugiriya Highway Interchange (900 m)"}],
  coordinates: { lat: 6.873409, lng: 79.984785 },
  
  sourceUrl: SOURCE,
  contact: { email: 'info@homelandsskyline.lk', phone: '+94 702 444 111' },
  socialLinks: { whatsapp: 'https://wa.me/94710299444' },
}
for (const k of ['district', 'city', 'province'] as const) so(data, k, SO[`${k.toUpperCase()}_OPTIONS`])
const created: any = await payload.create({ collection: 'projects', data: data as never, overrideAccess: true })
console.log('created', created.id, created.slug, 'published:', created.isPublished, 'plans', created.floorPlans?.length, 'gallery', created.gallery?.length)

const links = [SOURCE, 'https://cms.homelandsskyline.lk/wp-content/uploads/2026/03/Fedora-Brochure-2025_12-Low.pdf', `https://www.lankanewhomes.com/listing-preview/${SLUG}`]
const todos: [string, string?][] = [["Completion / handover date", "No completion date published. Page says \"Under Construction - Piling stage\" (entered as Under Construction, construction status Foundation)."], ["Price per unit and units available", "Only \"40M\" is published (entered as Rs. 40,000,000). No per-plan prices or availability."], ["Payment plan", "No payment plan published."], ["Bathrooms per plan", "Site shows \"2 Bathrooms\"; brochure plans show two toilets plus a maid's toilet for both 2BR and 3BR. Entered 2 for every plan."], ["Floor count", "Page says \"7 Floors\"; entered 7."], ["3BR areas", "Units 01/04/05/08 = 1,200 sq ft, units 02/03 and 06/07 = 1,100 sq ft (site cards). Site headline range is 950-1200."], ["Nearby places", "The page gives only \"900m to Athurugiriya Highway Interchange\" plus unnamed schools, hospitals and shops. No named landmarks, so Nearby has one entry. The page's area photo is Colombo-area (Galle Face Mall style) and was not used."], ["Parking", "Brochure and page: one parking slot per unit; visitor parking not mentioned."], ["Architect", "Page lists the developer itself, so no architect record is linked."], ["Amenities not in our vocabulary", "Medical Center with 24/7 doctor service, Bill Paying Facilities, Day Care Center, Standby Generators, BBQ Pavilion (entered as BBQ Area), Community Hall (page gallery only), Day care entered as Children's Area. Function Room entered for the community hall (approximate)."], ["Images not used", "ARIAL-COM-004-1.png (aerial render with large white margins) and GFM.jpeg (area photo of a mall)."], ["No video", "The page has no YouTube walkthrough."], ["Map pin", "Coordinates from the developer's Google Maps embed (marker \"Fedora Resort Apartments\")."], ["WhatsApp", "Project WhatsApp set to +94 71 029 9444."], ["Publish?"]]
for (const [title, notes] of todos) {
  await payload.create({ collection: 'listing-todos' as never, data: { title, listingType: 'project', project: created.id, notes, sourceLinks: links.join('\n') } as never, overrideAccess: true })
}
console.log('todos', todos.length)
process.exit(0)
