/* eslint-disable @typescript-eslint/no-explicit-any -- one-off update script */
// Oceana Wadduwa (project 15, published): ADD-ONLY update from the Home Lands Skyline pages. Nothing is removed or overwritten.
//   NODE_ENV=production npx tsx scripts/update-hl-oceana-wadduwa.ts
import { HL_DIR, payload, up, addTodos } from './hl-common'

const SLUG = 'oceana-wadduwa'
const SOURCE = 'https://www.homelandsskyline.lk/apartment-project/oceana-beach-resort-apartments'
const VILLA_SRC = 'https://www.homelandsskyline.lk/housing-project/oceana-beach-villas-for-sale-in-wadduwa'
const BROCHURE_SRC = 'https://cms.homelandsskyline.lk/wp-content/uploads/2025/11/Oceana-Brochure.pdf'
const D = `${HL_DIR}/out/oc`
const p: any = await payload.findByID({ collection: 'projects', id: 15, depth: 0, overrideAccess: true })
if (p.slug !== SLUG) throw new Error('unexpected project')
if ((p.floorPlans ?? []).some((f: any) => /Penthouse Type 01/i.test(f.planName))) { console.log('already updated'); process.exit(0) }

const upd: Record<string, any> = {}
const done: string[] = []

// floor plans (append)
const PLANS = [
  { key: '2br-860', name: '2BR Apartment, 860 sq ft', beds: 2, baths: 1, sqft: 860 },
  { key: '2br-985', name: '2BR Apartment, 985 sq ft', beds: 2, baths: 2, sqft: 985 },
  { key: '2br-1070', name: '2BR Apartment Type C, 1,070 sq ft', beds: 2, baths: 2, sqft: 1070 },
  { key: '3br-1270', name: '3BR Apartment, 1,270 sq ft', beds: 3, baths: 2, sqft: 1270 },
  { key: 'ph1-3br-1975', name: 'Penthouse Type 01, 3BR, 1,975 sq ft', beds: 3, baths: 3, sqft: 1975 },
  { key: 'ph2-4br-2575', name: 'Penthouse Type 02, 4BR, 2,575 sq ft', beds: 4, baths: 3, sqft: 2575 },
]
const plans = [...(p.floorPlans ?? [])]
for (const x of PLANS) plans.push({ planName: x.name, bedrooms: x.beds, bathrooms: x.baths, floorAreaSqFt: x.sqft, startingPriceLkr: 0, availability: 'Available', image: await up(SLUG, 'floor-plans', `skyline-${x.key}.jpg`, `${D}/plans/${x.key}.jpg`) })
upd.floorPlans = plans; done.push('6 floor plans')

// gallery (append)
const G: [string, string][] = [
  ['interior-living-room', 'Apartment living room'], ['interior-living-dining', 'Apartment living and dining'], ['interior-dining-living', 'Apartment dining and living area'],
  ['interior-dining-living-bedroom', 'Apartment dining area and bedroom'], ['interior-dining-kitchen-view', 'Apartment dining and kitchen'], ['interior-kitchen', 'Apartment kitchen'],
  ['exterior-aerial-towers-villas', 'Aerial view of the towers and villas'], ['exterior-beach-towers-render', 'Beachfront towers and villas'],
  ['exterior-villa-balcony-pool', 'Beach villa balcony with plunge pool'], ['exterior-villa-lane', 'Villa lane'],
]
const gallery = [...(p.gallery ?? [])]
for (const [k, label] of G) gallery.push({ label, image: await up(SLUG, 'gallery', `skyline-${k}.jpg`, `${D}/g/${k}.jpg`) })
upd.gallery = gallery; done.push('10 gallery images')

// brochure
if (!p.brochureUrl) { upd.brochureUrl = await up(SLUG, 'brochure', 'brochure.pdf', `${HL_DIR}/../oceana/brochure.pdf`, 'application/pdf'); done.push('brochureUrl') }
if (!p.sourceUrl) { upd.sourceUrl = SOURCE; done.push('sourceUrl') }
if (!p.socialLinks?.whatsapp) { upd.socialLinks = { ...(p.socialLinks ?? {}), whatsapp: 'https://wa.me/94710299444' }; done.push('whatsapp') }
if (!p.parking) { upd.parking = 'Large'; done.push('parking') }
if (!p.rentalIncome) {
  upd.rentalIncome = "Developer's marketing claim (not verified by LankaNewHomes): USD 3,000+ rental income every month, all year round, and up to 100% capital appreciation in 4 years."
  done.push('rentalIncome')
}
if (!p.startingPriceLkr || p.startingPriceLkr > 36000000) { upd.startingPriceLkr = 36000000; upd.priceRange = 'From Rs. 36,000,000'; done.push('startingPrice 36M') }

// videos (append, skip ids already present)
const have = new Set((p.videos ?? []).map((v: any) => String(v.embedUrl).match(/(?:embed\/|v=|youtu\.be\/)([\w-]{11})/)?.[1]))
const vids = [...(p.videos ?? [])]
for (const [id, label] of [['JpK14UZ0hSA', 'Oceana Villa Walkthrough'], ['jPxQ1dKl_9g', 'Oceana Construction Update'], ['h9sqOqJCJic', 'Oceana Apartments Walkthrough'], ['isK5jEfhf4U', 'Oceana Tour (Sinhala)'], ['co__zJCZ3Xo', 'Oceana Tour']]) {
  if (!have.has(id)) vids.push({ label, embedUrl: `https://www.youtube.com/watch?v=${id}` })
}
if (vids.length > (p.videos ?? []).length) { upd.videos = vids; done.push(`${vids.length - (p.videos ?? []).length} videos`) }

await payload.update({ collection: 'projects', id: 15, data: upd, overrideAccess: true })
const after: any = await payload.findByID({ collection: 'projects', id: 15, depth: 0, overrideAccess: true })
console.log('updated', done.join(', '), '| published', after.isPublished, '| plans', after.floorPlans.length, 'gallery', after.gallery.length, 'units', after.units, 'price', after.startingPriceLkr)

const links = [SOURCE, VILLA_SRC, BROCHURE_SRC, 'https://www.lankanewhomes.com/projects/oceana-wadduwa']
await addTodos(15, links, [
  ['Starting price changed from 153M to 36M', 'Previous listing: Rs. 153,000,000 - 200,000,000 (villas, from oceana.lk). The Skyline apartment page says "from Rs. 36M" (apartments) and the Skyline villa page says "from 97M". Starting price set to 36,000,000 and range "From Rs. 36,000,000". The old villa range (153M-200M) is no longer shown in the range text; review if villas should be priced separately.'],
  ['Units conflict, not changed', 'Listing says 321. Skyline apartment page: Apartments 335 + Villas 66 = 401. Skyline villa page: 91 units. Brochure: 335 apartments + 91 villas = 426. Units left at 321.'],
  ['Floors', 'Skyline page says "Ground + 9" floors. Not entered (the floors field is numeric and the listing mixes apartments and villas).'],
  ['Skyline plan captions vs listing', 'The 860 sq ft 2BR image caption reads "2 Bathrooms" but the card data and the drawing show 1 bathroom (entered 1). The 985 sq ft plan has no type name on the page. Penthouse Type 02 is printed as 4 bedrooms, 3 bathrooms (entered as printed). The 3BR 1,270 sq ft plan image carries a stray "2BR + 1T, Area 860" note.'],
  ['Rental income and appreciation claims', 'Added to Expected Rental Income as the developer\'s marketing claim: USD 3,000+ rental income every month, up to 100% capital appreciation in 4 years. The Skyline site words these as "guaranteed"; verify with the developer before publishing any guarantee wording.'],
  ['Map pin differs', 'Listing pin is 6.6552, 79.9325. The Skyline villa page Google Maps embed points to 6.6338, 79.9376 ("Oceana Beach Resort Apartments & Villas"). Pin left unchanged; check which is right.'],
  ['Contact', 'Contact email kept as info@oceana.lk (owner instruction). Skyline builder email info@homelandsskyline.lk is on the developer profile. WhatsApp set to +94 71 029 9444.'],
  ['Added from Skyline', 'Added: 6 apartment floor plans (2BR x3, 3BR, two penthouses), 10 gallery images (6 interiors, 4 exteriors), brochure PDF mirrored to R2, 4 extra videos, parking "Large", source URL. The villa Type A-D plans already existed. Skipped as duplicate: Oceana_Beach_Villa-1-2 render (same as an existing gallery image).'],
])
process.exit(0)
