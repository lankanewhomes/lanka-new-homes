/* eslint-disable @typescript-eslint/no-explicit-any -- one-off import */
// Araliya Lands (araliyalands.com) import, owner request 2026-10-13: developer profile + the 4 lands that are still Available
// (the other 38 are Sold Out and skipped per the "only active listings" rule). Plots and perches were read from the block-plan images.
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { config as loadEnv } from 'dotenv'
loadEnv({ path: path.join(process.cwd(), '.env.local') })
const cfg = ((await import('../payload.config')) as any).default
const { getPayload } = await import('payload')
const { mirrorToR2 } = await import('../src/lib/listing-import/mirror')
const payload = await getPayload({ config: cfg })
const SCRATCH = process.argv[2]
const sh = (await import('node:child_process')).execFileSync

const HQ = 'No. 381/B, Kandy Road, Mahara, Kadawatha, Sri Lanka'
const PAY_COMMON = ['Pay 30% of the initial payment within 14 days', 'Pay the balance within a month for a special discount', 'Bank loan facilities can be arranged', 'Outright payment: 5% discount on the full payment', 'Easy payment plan: only the NIC is needed, 1-hour documentation, no bank crib or guarantors']
const plots = (spec: Record<string, number>) => Object.entries(spec).map(([name, sizePerches]) => ({ name, sizePerches, priceLkr: null, status: null, image: null }))
const range = (from: number, to: number, size: number) => Object.fromEntries(Array.from({ length: to - from + 1 }, (_, i) => [String(from + i), size]))

const BLOSSOM = { '1': 11, '2': 11, '3': 11, '4': 11, '5': 10.5, '6': 10.5, '7': 10.25, '8': 12.4, '9': 10, '10': 10.1, '11': 10, '12': 10, '14': 10, '15': 10, '16': 10.7, '17': 10.5 }
const LAROMA = { '1': 10.5, '2': 10.5, '3': 14, '4': 7, '5': 7, '6': 7, '7': 7.5, '8': 8, '9': 8, '10': 7.5, '11': 7.5, '12': 8, '14': 8, '15': 7.5, '16': 7.5, '17': 8, '18': 8, '19': 7.5, '20': 8, '21': 8.5, '22': 8.75, '23': 8.85, '24': 7.55, '25': 8, '26': 8, '27': 7.85, '28': 8, '29': 7.85, '30': 9.4, '31': 9.9, '33': 7.9, '34': 6, '35': 6, '36': 6, '37': 8, '38': 8, '39': 8.75, '40': 8.2, '41': 8.65, '42': 9, '43': 10.8 }
const PLATINUM = {
  '1': 10.4, '2': 10.1, '3': 10, '4': 10, '5': 10, '6': 10, '7': 10.15, '8': 10.2, '9': 11.5, '10': 10.3, '11': 10.25, '12': 10.25, '14': 10.25, '15': 10, '16': 10, '17': 10.65, '18': 10.5, '19': 10.15,
  ...range(20, 28, 10.1), '29': 11.9, '30': 11.9, '31': 12, '32': 12, ...range(33, 37, 10), '38': 10.45, ...range(39, 49, 10), '50': 11.6, '51': 11.6, ...range(52, 64, 10.9), ...range(65, 68, 10), ...range(70, 76, 10),
  '77': 10.2, '78': 10.8, '79': 10.15, '80': 10.15, '81': 10.15, '82': 10.2, '83': 11.1, ...range(84, 100, 10), '101': 10.1, '102': 10.1, '103': 10, '104': 10, '105': 10, '106': 10.1, ...range(107, 110, 10), '111': 10.1, '112': 10.1, '113': 10.13, '114': 10, '115': 10.1, '116': 12, '117': 11.8, '118': 10.5, '119': 10.5, '120': 10.5, '121': 10, '122': 10,
} as Record<string, number>
const item = (field_other: string, value_other: string) => ({ field: null, field_other, value: null, value_other })

const LANDS: any[] = [
  {
    slug: 'imperium-negombo-kadirana', card: 'premium-land-for-sale-in-negombo-kadirana', title: 'Imperium Negombo - Kadirana', location: 'Kadirana, Negombo', district: 'Gampaha', city: 'Negombo',
    perch: 630000, phone: '0770131606', lat: 7.219903520001806, lng: 79.88597191685568, use: ['Residential', 'Commercial'], plotCount: 25, plots: null, road: 'Access Road', electricity: '3-Phase Available', titleType: 'Clear deeds with legal approvals',
    reserve: 'Reserve your plot by paying Rs. 250,000 at the land or at the office', interestFree: 'Or pay interest free within 12 months',
    summary: 'Imperium Negombo is a residential and commercial land project by Araliya Lands and Homes in Kadirana, Negombo: 25 plots (22 available) from LKR 630,000 per perch, with clear deeds, access roads, electricity and water.',
    description: 'Imperium Negombo is a premium residential land project by Araliya Lands and Homes in the Kadirana area of Negombo, within easy reach of Negombo town, with quick access to schools, supermarkets, hospitals, banks and public transport.\n\nAll plots come with clear deeds, proper access roads and essential infrastructure. The project has 25 plots, 22 of them available, for residential and commercial use.\n\nHighlights: prime location in Kadirana, Negombo; easy access to Negombo town; clear deeds with legal approvals; wide access roads; electricity and water facilities; peaceful residential environment; flexible payment plans; bank loan facilities can be arranged.',
    facilities: ['Wide Road', 'School', 'Three Phases Electricity', 'Super Market', 'Pipe Borne Water'], badges: ['Easy Payment Plan'],
    features: [{ label: 'Utilities', items: [item('Electricity', 'Three phases electricity'), item('Water', 'Pipe borne water')] }, { label: 'Road & access', items: [item('Road', 'Wide access roads')] }, { label: 'Title', items: [item('Deeds', 'Clear deeds with legal approvals')] }],
    links: [['Imperium Negombo page', 'https://araliyalands.com/land/premium-land-for-sale-in-negombo-kadirana']], streetView: null,
  },
  {
    slug: 'the-blossom-balummahara', card: 'the-blossom-balummahara', title: 'The Blossom - Balummahara', location: 'Balummahara, Gampaha', district: 'Gampaha', city: 'Gampaha',
    perch: 885000, phone: '0771064081', lat: 7.064319992938203, lng: 80.00234837499787, use: ['Residential', 'Commercial'], plotCount: 16, plots: BLOSSOM, road: 'Carpet Road', electricity: '3-Phase Available', titleType: null,
    reserve: 'Reserve your plot by paying Rs. 250,000 at the land or at the office', interestFree: 'Or pay interest free within 12 months',
    summary: 'The Blossom is a gated land project in Balummahara, Gampaha, 800 m from the Colombo–Kandy main road (A1): 16 plots of 10.00 to 12.40 perches from LKR 885,000 per perch.',
    description: 'The Blossom is a gated community land project by Araliya Lands and Homes in Balummahara, Gampaha, just 800 metres from the Colombo–Kandy main road (A1), with access to Kadawatha, Yakkala, Kiribathgoda and Colombo city. It has 16 plots (10 available) of 10.00 to 12.40 perches for residential and commercial use.\n\nHighlights: gated community; carpeted wide roads and a proper drainage system; three phase electricity and pipe borne water; only 800 m to Kandy Road (A1); quick access to Gampaha, Kadawatha and Yakkala town centres; direct bus routes and multiple town connections; close to schools, supermarkets, banks, religious places and hospitals.',
    facilities: ['Wide Road', 'Three Phases Electricity', 'Pipe Borne Water', 'Bus Route', 'Hospital', 'Communication'], badges: ['Gated Community', 'Easy Payment Plan'],
    features: [{ label: 'Utilities', items: [item('Electricity', 'Three phases electricity'), item('Water', 'Pipe borne water'), item('Drainage', 'Proper drainage system')] }, { label: 'Road & access', items: [item('Road', 'Carpeted wide roads'), item('Main road', '800 m to Kandy Road (A1)')] }, { label: 'Community', items: [item('Security', 'Gated community')] }],
    links: [['The Blossom page', 'https://araliyalands.com/land/the-blossom-balummahara']], nearby: [{ category: 'Transport', name: 'Colombo–Kandy Main Road (A1)', distanceKm: 0.8, lat: null, lng: null }],
  },
  {
    slug: 'la-roma-homagama', card: 'la-roma-homagama', title: "La' Roma - Homagama", location: 'Kiriwaththuduwa, Homagama', district: 'Colombo', city: 'Homagama',
    perch: 990000, phone: '0777771045', lat: 6.801454293195919, lng: 80.02402507499541, use: ['Residential', 'Commercial'], plotCount: 41, plots: LAROMA, road: 'Carpet Road', roadWidthFt: 30, electricity: '3-Phase Available', titleType: null,
    reserve: 'Reserve your plot by paying Rs. 250,000 at the land or at the office', interestFree: 'Or pay interest free within 12 months',
    summary: "La' Roma is a gated land project on the Maharagama–Horana main road in Homagama: 41 plots of 6.00 to 14.00 perches from LKR 990,000 per perch.",
    description: "La' Roma is a premium gated land project by Araliya Lands and Homes on the Maharagama–Horana main road in Homagama (Kiriwaththuduwa). It has 41 plots (24 available) of 6.00 to 14.00 perches, plus a 37.40 perch common area, for residential and commercial use.\n\nKey features: main road frontage with direct access to the Kottawa main road; fully gated community with 24/7 security; carpeted access roads; electricity, water and proper drainage; close to Homagama town, with schools, supermarkets, hospitals and banks nearby; residential and commercial potential.",
    facilities: ['Wide Road', 'Three Phases Electricity', 'Super Market', 'Bank', 'Bus Route', 'City Area', 'Communication'], badges: ['Gated Community', 'Easy Payment Plan'],
    features: [{ label: 'Utilities', items: [item('Electricity', 'Three phases electricity'), item('Water', 'Water supply'), item('Drainage', 'Proper drainage')] }, { label: 'Road & access', items: [item('Road', 'Main road frontage, direct access to the Kottawa main road'), item('Road', 'Carpeted access roads'), item('Internal roads', '30 ft, 22 ft, 16.5 ft and 15 ft wide, as marked on the block plan')] }, { label: 'Community', items: [item('Security', 'Fully gated community, 24/7 security'), item('Common area', '37.40 perch common area')] }],
    links: [["La' Roma page", 'https://araliyalands.com/land/la-roma-homagama']],
  },
  {
    slug: 'platinum-city-kesbewa', card: 'kesbewa-platinum-city', title: 'Platinum City - Kesbewa', location: 'Kindelpitiya, Kesbewa', district: 'Colombo', city: 'Kesbewa',
    perch: 410000, phone: '0777770980', lat: 6.74710247918722, lng: 79.96260481627428, use: ['Residential'], plotCount: 120, plots: PLATINUM, road: 'Access Road', electricity: '3-Phase Available', titleType: null,
    reserve: 'Reserve your plot by paying Rs. 100,000 at the land or at the office', interestFree: 'Or pay interest free within 6 months',
    summary: 'Platinum City is a master-planned residential land project between Kesbewa and Bandaragama: 120 plots of 10.00 to 12.00 perches from LKR 410,000 per perch.',
    description: 'Platinum City is a large-scale, master-planned township-style land project by Araliya Lands, positioned between Kesbewa and Bandaragama (Kindelpitiya). It has 120 plots (11 available) of 10.00 to 12.00 perches for residential use.\n\nHighlights: located between Kesbewa and Bandaragama; easy access to Bandaragama, Piliyandala, Kesbewa and the Southern Expressway; surrounded by green landscapes and peaceful residential neighbourhoods; fully developed plots with water, electricity, wide roads and clear boundaries; suited to residential living and investment.',
    facilities: ['Wide Road', 'Pipe Borne Water', 'Super Market', 'Communication'], badges: ['Easy Payment Plan'],
    features: [{ label: 'Utilities', items: [item('Electricity', 'Electricity'), item('Water', 'Pipe borne water')] }, { label: 'Road & access', items: [item('Road', 'Wide roads (6 m and 9 m road and drain, as marked on the block plan)')] }, { label: 'Plots', items: [item('Boundaries', 'Fully developed plots with clear boundaries'), item('Common area', 'Common area, as marked on the block plan')] }],
    links: [['Platinum City page', 'https://araliyalands.com/land/kesbewa-platinum-city']],
  },
]

const toJpg = (src: string, dst: string, max = 2000) => sh('python3', ['-c', `from PIL import Image\nim=Image.open(${JSON.stringify(src)}).convert('RGB')\nim.thumbnail((${max},${max}))\nim.save(${JSON.stringify(dst)},quality=88)`])
const tmp = path.join(SCRATCH, 'out'); fs.mkdirSync(tmp, { recursive: true })
const html = (slug: string) => fs.readFileSync(path.join(SCRATCH, `${slug}.html`), 'utf8')

// ---- developer
let dev: any = (await payload.find({ collection: 'developers', where: { slug: { equals: 'araliya-lands' } }, limit: 1, depth: 0, overrideAccess: true })).docs[0]
if (!dev) {
  const logo = await mirrorToR2('logos/developers/araliya-lands-logo-colour.png', fs.readFileSync(path.join(SCRATCH, 'logo.png')), 'image/png')
  dev = await payload.create({ collection: 'developers', overrideAccess: true, data: {
    name: 'Araliya Lands', slug: 'araliya-lands', logo,
    description: 'Araliya Lands & Homes is the land and property arm of the Araliya Group, based in Kadawatha. It develops and sells residential and commercial land plots across Sri Lanka, with branches in Kadawatha and Kottawa. Its stated mission is to provide properly developed lands and a quality residential environment for its customers.',
    contact_email: 'info@araliyalands.com', contact_phone: '+94 11 292 0719', website: 'https://araliyalands.com', location: HQ,
    socialLinks: { facebook: 'https://www.facebook.com/araliyalandsandhomes/', instagram: 'https://www.instagram.com/araliyalands/?hl=en', linkedin: 'https://www.linkedin.com/company/araliya-lands/', youtube: 'https://www.youtube.com/channel/UClmovlhVFuH55lGoO72dr5w', whatsapp: 'https://wa.me/94112920719' },
    lead_alerts: { enabled: true, email: 'info@araliyalands.com' },
  } as never })
  console.log('developer created', dev.id)
}

// ---- lands
const created: any[] = []
for (const L of LANDS) {
  if ((await payload.find({ collection: 'lands', where: { slug: { equals: L.slug } }, limit: 1, depth: 0, overrideAccess: true })).docs[0]) { console.log('exists', L.slug); continue }
  const raw = html(L.card)
  const gal = [...new Set(raw.match(/https:\/\/araliyalands\.com\/storage\/app\/public\/landGallery\/[^"'\s)]+/g) ?? [])]
  const det = [...new Set(raw.match(/https:\/\/araliyalands\.com\/storage\/app\/public\/landDetails\/[^"'\s)]+/g) ?? [])]
  const base = (u: string) => { const f = path.join(SCRATCH, 'img', L.card, u.split('/').pop()!); if (fs.existsSync(f)) return f; const alt = fs.readdirSync(path.join(SCRATCH, 'img', L.card)).find((n) => n.startsWith(u.split('/').pop()!)); return path.join(SCRATCH, 'img', L.card, alt!) }
  const upImg = async (sub: string, name: string, u: string) => { const dst = path.join(tmp, `${L.slug}-${name}.jpg`); toJpg(base(u), dst); return mirrorToR2(`lands/${L.slug}/${sub}/${L.slug}_${name}.jpg`, fs.readFileSync(dst), 'image/jpeg') }
  const gallery: any[] = []
  for (const [i, u] of gal.entries()) gallery.push({ label: 'Photo', image: await upImg('gallery', `photo-${String(i + 1).padStart(2, '0')}`, u) })
  const block = det.find((u) => /block-plan/i.test(u)); const road = det.find((u) => /road-map/i.test(u))
  const blockPlanImages = block ? [{ label: 'Block Plan', image: await upImg('block-plan', 'block-plan-01', block) }] : []
  const roadMapImages = road ? [{ label: 'Road Map', image: await upImg('road-map', 'road-map-01', road) }] : []
  const sv = raw.match(/maps\/embed\?pb=(!4v[^"&]+)/)
  const view360Url = sv ? `https://www.google.com/maps/embed?pb=${sv[1]}` : null
  const sizes = L.plots ? Object.values(L.plots) as number[] : []
  const data: any = {
    slug: L.slug, title: L.title, sellerType: 'developer', seller: { relationTo: 'developers', value: dev.id }, sellerName: 'Araliya Lands',
    location: L.location, district: L.district, city: L.city, province: 'Western', status: 'Available',
    landSizePerches: sizes.length ? Math.min(...sizes) : 0, ...(sizes.length ? { landSizePerchesMax: Math.max(...sizes) } : {}),
    landUse: L.use, landType: 'Bare Land (subdivided plots)', roadAccess: L.road, ...(L.roadWidthFt ? { roadWidthFt: L.roadWidthFt } : {}), electricity: L.electricity, water: 'Piped water', ...(L.titleType ? { titleType: L.titleType } : {}),
    priceLkr: 0, pricePerPerchLkrMin: L.perch, paymentPlanItems: [L.reserve, ...PAY_COMMON.slice(0, 2), L.interestFree, ...PAY_COMMON.slice(2)],
    summary: L.summary, description: L.description, heroImage: gallery[0]?.image ?? null, gallery, blockPlanImages, roadMapImages, view360Url,
    badges: L.badges, facilities: L.facilities, unitFeatures: L.features.map((g: any) => ({ key: null, key_other: g.label, label: g.label, items: g.items })),
    plotCount: L.plots ? Object.keys(L.plots).length : L.plotCount, ...(L.plots ? { plots: plots(L.plots) } : {}),
    nearby: L.nearby ?? [], coordinates: { lat: L.lat, lng: L.lng, streetViewAvailable: Boolean(view360Url) },
    contact: { name: 'Araliya Lands', email: 'info@araliyalands.com', phone: L.phone, address: HQ },
  }
  const doc: any = await payload.create({ collection: 'lands', overrideAccess: true, data } as never)
  created.push(doc)
  const pool = (payload.db as any).pool
  const refs: [string, string][] = [...L.links, ['Payment plans page', 'https://araliyalands.com/payment-plans'], ['About page', 'https://araliyalands.com/about-us'], ['Contact page', 'https://araliyalands.com/contact-us']]
  if (block) refs.push(['Block plan image', block]); if (road) refs.push(['Road map image', road]); if (view360Url) refs.push(['Street View embed', view360Url])
  let order = 0
  for (const [label, url] of refs) { order += 1; await pool.query('insert into payload.lands_reference_links (_order,_parent_id,id,label,url,note) values ($1,$2,$3,$4,$5,$6)', [order, doc.id, crypto.randomBytes(12).toString('hex'), label, url, 'araliyalands.com, shared by the owner 2026-10-13']) }
  console.log('created', L.slug, doc.id, 'plots', data.plotCount, 'gallery', gallery.length, 'block', blockPlanImages.length, 'road', roadMapImages.length, 'streetview', Boolean(view360Url))
}
// developer reference links
{
  const pool = (payload.db as any).pool
  const have = (await pool.query('select url,_order from payload.developers_reference_links where _parent_id=$1', [dev.id])).rows as any[]
  let order = have.reduce((m, r) => Math.max(m, r._order), 0)
  for (const [label, url] of [['Website: araliyalands.com', 'https://araliyalands.com'], ['Land listings', 'https://araliyalands.com/land'], ['Payment plans', 'https://araliyalands.com/payment-plans'], ['About us', 'https://araliyalands.com/about-us'], ['Contact us / branches', 'https://araliyalands.com/contact-us']]) if (!have.some((h) => h.url === url)) { order += 1; await pool.query('insert into payload.developers_reference_links (_order,_parent_id,id,label,url,note) values ($1,$2,$3,$4,$5,$6)', [order, dev.id, crypto.randomBytes(12).toString('hex'), label, url, 'shared by the owner 2026-10-13']) }
}
console.log('done', created.map((c) => c.slug).join(', '), 'developer', dev.id)
process.exit(0)
