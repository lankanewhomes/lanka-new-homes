/* eslint-disable @typescript-eslint/no-explicit-any -- one-off import script */
// Greendale Retirement Resort Cottages, Athurugiriya (Home Lands Skyline): UNPUBLISHED draft + to-dos. Developer 69 already exists.
//   HL_DIR=<folder with web/, plans/, brochure.pdf> NODE_ENV=production npx tsx scripts/import-hl-greendale-retirement-cottages.ts
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
const SLUG = 'greendale-retirement-cottages'
const R2 = (sub: string, name: string) => `projects/${SLUG}/${sub}/${SLUG}_${name}`
const up = (sub: string, file: string, name: string, dir = 'web', type = 'image/jpeg') => mirrorToR2(R2(sub, name), fs.readFileSync(path.join(base, dir, file)), type)
const SOURCE = 'https://www.homelandsskyline.lk/housing-project/greendale-retirement-cottage-for-sale-in-athurugiriya'
if (await find('projects', SLUG)) { console.log('exists', SLUG); process.exit(0) }

const dev = await find('developers', 'home-lands-skyline')
if (!dev) throw new Error('developer missing')
const nb = await find('neighborhoods', 'athurugiriya')
const architect = ((await payload.find({ collection: 'architects' as never, where: { name: { like: 'Weeraratne' } } as never, limit: 1, overrideAccess: true, depth: 0 })).docs[0] as any) ?? null

const gal: [string, string][] = [['cottage-exterior-photo','Greendale retirement cottages'],['cottage-exterior-render','Cottage frontage render'],['cottage-street-render','Row of single-storey cottages'],['commercial-suite-exterior','Two-storey commercial suite cottages'],['village-aerial-masterplan','Aerial view of the village'],['interior-living-dining','Cottage living and dining area'],['interior-bedroom','Cottage bedroom'],['interior-kitchen','Cottage kitchen'],['interior-bathroom','Cottage bathroom with grab bars']]
const gallery: any[] = []
for (const [k, label] of gal) gallery.push({ label, image: await up('gallery', `${k}.jpg`, `${k}.jpg`) })
const brochureUrl = await up('brochure', 'brochure.pdf', 'brochure.pdf', '.', 'application/pdf')

type P = { key: string; name: string; beds: number; baths: number; sqft: number }
const PLANS: P[] = [{key:'1br-735',name:'1 Bedroom Single Storey Cottage, 735 sq ft',beds:1,baths:1,sqft:735},{key:'2br-960',name:'2 Bedroom Single Storey Cottage, 960 sq ft',beds:2,baths:1,sqft:960},{key:'2br-1160',name:'2 Bedroom Single Storey Cottage, 1,160 sq ft',beds:2,baths:2,sqft:1160},{key:'3br-commercial-2125',name:'3 Bedroom Commercial Suite, 2,125 sq ft',beds:3,baths:2,sqft:2125}]
const floorPlans: any[] = []
for (const p of PLANS) {
  floorPlans.push({
    planName: p.name, bedrooms: p.beds, bathrooms: p.baths, floorAreaSqFt: p.sqft, startingPriceLkr: 0, availability: 'Available',
    image: await up('floor-plans', `${p.key}.jpg`, `${p.key}.jpg`, 'plans'),
  })
}
const near = (category: string, names: string[]) => names.map((name) => ({ category, name }))
const amenityNames = ['Pool', 'Spa', 'Gym', 'Mini Mart', 'Cafe', 'BBQ Area', 'Jogging Track', 'Library', 'Sauna', 'Steam Room', 'Yoga & Meditation Area', 'Lounge', 'Clubhouse', 'Parking']
for (const a of amenityNames) if (!(SO.AMENITY_NAME_OPTIONS as string[]).includes(a)) throw new Error('amenity not in vocabulary ' + a)
const BROCHURE_SRC = 'https://cms.homelandsskyline.lk/wp-content/uploads/2025/09/Greendale-Retirement-BROCHURE-new-2-1.pdf'
const unitFeatures: any[] = [
  {
    key: 'specifications',
    items: [
      feat('Substructure', 'Individual footing foundation with RCC columns, plinth beam and random rubble masonry work as suggested by the structural engineer'),
      feat('Superstructure', 'RCC columns, beams and slabs with cement block walls as directed by the architect'),
      feat('Flooring', 'Floor tiles in living, dining, bedrooms and other internal areas; non-slippery floor tiles in bathrooms, balconies and terrace'),
      feat('Painting', 'Internal walls: smooth plaster, two coats of putty, filler coat and two coats of emulsion paint. External walls: rough or semi-rough plaster with one coat of wall primer and two coats of weather shield paint'),
    ],
  },
  {
    key_other: 'Age-friendly Design',
    items: [
      feat('Emergency', 'SOS emergency bell buttons in the bedroom, with 24x7 monitoring'),
      feat('Safety', 'Specially designed two-way live audio camera system; grab bars and measures to prevent falls; safety railings where needed'),
      feat('Accessibility', 'Wheelchair accessibility in and around the cottage; provision to bathe in a wheelchair; raised toilet seats with additional grab bars'),
      feat('Hot Water', 'Hot water facility for all taps'),
      feat('Energy', 'Solar power facility'),
      feat('Outdoor', 'Leisure verandah areas and a personal drying area'),
    ],
  },
]
for (const g of unitFeatures) for (const it of g.items as any[]) { so(it, 'field', SO.KEY_FEATURE_FIELD_OPTIONS); so(it, 'value', SO.KEY_FEATURE_VALUE_OPTIONS) }
const nearby = [
  ...near('Transport', ['Athurugiriya Expressway Interchange (900 m)']),
  ...near('School', ['SLIIT', 'Horizon College International', 'CINEC Campus', 'SAITM Campus', 'Colombo Academy of Hospitality Management (CAHM)']),
  ...near('Hospital', ['Dr. Neville Fernando Hospital']),
  ...near('Landmark', ['MillenniumIT Software', 'ITN', 'Ministry of Defence', 'Millennium City Housing Scheme']),
]
const data: Record<string, any> = {
  slug: SLUG, name: 'Greendale Retirement Resort Cottages', developer: dev.id, isPublished: false,
  status: 'Completed', constructionStatus: 'Ready to Move In',
  type: 'Luxury Retirement Cottages', typeNote: 'Single-storey and two-storey retirement cottages',
  location: 'Athurugiriya', city: 'Athurugiriya', district: 'Colombo', province: 'Western',
  neighborhood: nb?.id, architect: architect?.id,
  contractor: 'Heyraa Construction (Pvt.) Ltd.',
  units: 260,
  startingPriceLkr: 46000000, priceRange: 'From Rs. 46,000,000',
  parking: '1 - 2 private parking spaces available depending on the unit',
  summary: 'Greendale Retirement Resort Cottages: 260 Californian-style retirement cottages for residents aged 55 and above in Athurugiriya, ready to move in, with on-site medical care and resort facilities.',
  description:
    'Greendale Retirement Resort Cottages is part of Greendale Retirement Resort & Residencies in Athurugiriya, which the developer calls Sri Lanka\'s first retirement village built to international standards, for senior citizens from 55 years of age. The village comprises 260 Californian-style cottages (plus 96 apartment suites, listed separately). Cottages are one, two and three bedrooms, from 735 to 2,125 sq ft, on one or two floors, with 1 to 2 private parking spaces depending on the unit. The developer states construction is completed and the homes are ready to move in. Age-friendly design features include SOS bell buttons, a two-way audio camera system, wheelchair access, grab bars and hot water at all taps. Resort facilities listed include a heated swimming pool, spa, fitness studio, library, minimart and pharmacy, coffee shop, BBQ pavilion, hobby club, nature park, jogging track and common dining, with on-call doctor and ambulance services and a medical center. The developer lists the architect as Philip Weeraratne and the builder as Heyraa Construction (Pvt.) Ltd.',
  highlights: [
    '260 retirement cottages, 1 to 3 bedrooms, 735 to 2,125 sq ft',
    'Completed and ready to move in',
    'On-site medical center, 24x7 doctor service and on-call ambulance',
    'Age-friendly design with SOS buttons and wheelchair access',
  ],
  heroImage: gallery[0].image, gallery, brochureUrl, floorPlans,
  amenities: amenityNames.map((name) => ({ name })),
  unitFeatures, nearby,
  coordinates: { lat: 6.8729419, lng: 79.9875968 },
  videos: [
    { label: 'Greendale Model Cottage', embedUrl: 'https://www.youtube.com/watch?v=eI0Y0_6rydE' },
    { label: 'Greendale walkthrough', embedUrl: 'https://www.youtube.com/watch?v=prLRk7hQcM4' },
    { label: 'Greendale Walkthrough 2', embedUrl: 'https://www.youtube.com/watch?v=W9N-djOiAU4' },
  ],
  sourceUrl: SOURCE,
  contact: { email: 'info@homelandsskyline.lk', phone: '+94 702 444 111' },
  socialLinks: { whatsapp: 'https://wa.me/94710299444' },
}
const todos: [string, string?][] = [
  ['Per-unit price and availability', 'Only "46M" is published as the starting price (entered). No per-plan prices; plans show Contact for pricing. The page marks only the 1BR type as available; the other types have no availability on the page.'],
  ['Unit split and floors', '260 cottages in total; no count per type. Floors entered as blank because the page says "1-2" (single and two-storey).'],
  ['Plans', 'Only 4 cottage layouts are published (1BR 735, 2BR 960, 2BR 1,160, 3BR commercial suite 2,125 sq ft), cropped from brochure page 16-17. The site\'s unit card shows 1BR/735 only. Bathrooms from the brochure captions; the 3BR commercial suite also has a store and commercial area.'],
  ['Conflict: house/"three bedroom" range', 'Page headline says "1, 2 & 3 Bedroom Cottages, 735-2125 sq ft", consistent with the brochure. Page bathrooms line says "1-2", but the 3BR suite shows 2 bathrooms plus 1 toilet.'],
  ['Apartment suites in this village', 'The same brochure shows 96 retirement apartment suites (1BR 750, 2BR 985 sq ft); these are on the separate Greendale Retirement Resort Apartments listing.'],
  ['Spec detail missing', 'Page specification accordion has substructure, superstructure, flooring and walls only. No kitchen, bathroom fittings or electrical details published; the brochure spec page is blank.'],
  ['Amenities with no match in the list', 'Hobby Club, Nature Park, Common Dining, Communal Kitchen, Medical Center, Physiotherapy Area, Pharmacy, Butler Service, Meal Supply Service, Open Theater, Hangout Areas, Party Lawn, Pool Parlor, 24x7 Doctor Service, Shuttle Service.'],
  ['Coordinates', 'Map pin taken from the developer\'s Google Maps embed place "Greendale Retirement Leisure Village by Home Lands Skyline" (6.8729419, 79.9875968 from the short link on the sister apartments page). The embed itself is centred elsewhere.'],
  ['Neighbourhood', nb ? 'Linked to the Athurugiriya neighbourhood page.' : 'No Athurugiriya neighbourhood page exists.'],
  ['Photos', 'Hero is the site\'s real photo of a completed cottage; gallery also has 2 street renders, the commercial suite render, a village aerial and 4 interior renders (living/dining, bedroom, kitchen, bathroom) from the brochure. Not used: stock lifestyle photos of people from the brochure, a duplicate cut-out version of the hero, a small clubhouse aerial. Interior renders are illustrations ("may not be an exact match" per the brochure).'],
  ['Publish?'],
]
for (const k of ['district', 'city', 'province'] as const) so(data, k, SO[`${k.toUpperCase()}_OPTIONS`])
for (const p of data.floorPlans) { so(p, 'furnishing', SO.FURNISHING_OPTIONS) }
const created: any = await payload.create({ collection: 'projects', data: data as never, overrideAccess: true })
console.log('created', created.id, created.slug, 'published:', created.isPublished, 'plans', created.floorPlans?.length, 'gallery', created.gallery?.length)
const links = [SOURCE, BROCHURE_SRC, `https://www.lankanewhomes.com/listing-preview/${SLUG}`]
for (const [title, notes] of todos) {
  await payload.create({ collection: 'listing-todos' as never, data: { title, listingType: 'project', project: created.id, notes, sourceLinks: links.join('\n') } as never, overrideAccess: true })
}
console.log('todos', todos.length)
process.exit(0)
