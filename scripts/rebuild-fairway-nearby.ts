/* eslint-disable @typescript-eslint/no-explicit-any -- one-off rebuild */
// Fairway Latitude nearby places (lost 2026-10-22, rebuilt 2026-10-23) re-read from the developer's own "nearby places by distance" wheel
// (R2: projects/fairway-latitude/road-map/fairway-latitude_nearby-places-by-distance.jpg) plus the exact km the developer's project page prints
// for nine places. The wheel gives distance BANDS only (within 1 km, 1-2, 2-4, 4-5 km): a band is kept as text in the name and no kilometre
// figure is invented; only the nine printed distances are stored as distanceKm.
import path from 'node:path'
import { config as loadEnv } from 'dotenv'
loadEnv({ path: path.join(process.cwd(), '.env.local') })
const cfg = ((await import('../payload.config')) as any).default
const { getPayload } = await import('payload')
const payload = await getPayload({ config: cfg })
const B = ['within 1 km', '1-2 km', '2-4 km', '4-5 km']
type Row = [string, string, number | [number]] // [category, name, band index | [exact km]]
const rows: Row[] = [
  // Schools
  ['School', 'Royal Institute', [1.0]], ['School', 'Anula Vidyalaya', [1.6]], ['School', 'Asian International School', [1.7]], ['School', 'Elizabeth Moir School', 1],
  ['School', 'Royal College', 2], ['School', 'Visakha Vidyalaya', 2], ['School', 'Lyceum Nugegoda', 2], ['School', 'Holy Family Convent', 3], ['School', 'British School in Colombo', 3], ['School', 'D.S. Senanayake College', 3],
  // Hospitals
  ['Hospital', 'Lanka Hospitals', [1.5]], ['Hospital', 'Asiri Medical Hospital', [2.0]], ['Hospital', 'Asiri Surgical Hospital', [2.2]], ['Hospital', 'Kings Hospital', 1],
  ['Hospital', 'Kalubowila Teaching Hospital', 2], ['Hospital', 'Ninewells Hospital', 2], ['Hospital', 'Colombo National Hospital', 3], ['Hospital', 'Durdans Hospital', 3],
  // Restaurants & cafes
  ['Restaurant', 'Barista Lavazza', [1.3]], ['Restaurant', 'Page And Coffee', [1.3]], ['Restaurant', 'Cafe Mocha by Barista', [1.4]], ['Restaurant', 'La Maison', 0], ['Restaurant', 'Tasty Caterers', 1], ['Restaurant', 'The Fab', 1],
  ['Restaurant', 'Giovanni\'s', 2], ['Restaurant', 'Tea Avenue', 2], ['Restaurant', 'Java Lounge', 2], ['Restaurant', 'The t-Lounge by Dilmah', 3], ['Restaurant', 'London House Of Coffee', 3], ['Restaurant', 'The Commons Coffeehouse', 3],
  // Malls / recreation
  ['Shopping', 'Havelock City Mall', 0], ['Landmark', 'Colombo Colts Cricket Club', 1], ['Landmark', 'Havelock Sports Club', 1], ['Landmark', 'CR & FC', 2], ['Landmark', 'Orient Club', 2],
  ['Landmark', 'SSC (Sinhalese Sports Club)', 3], ['Landmark', 'Colombo Swimming Club', 3], ['Landmark', 'Royal Colombo Golf Club', 3],
  // Supermarkets
  ['Shopping', 'Keells Edmonton', 0], ['Shopping', 'Laugfs', 0], ['Shopping', 'Arpico', 1], ['Shopping', 'Cargills Foodcity Nawala', 1], ['Shopping', 'Glomark Nawala', 2], ['Shopping', 'Keells Laurie\'s Road', 2], ['Shopping', 'SPAR', 2],
  // Retail outlets
  ['Shopping', 'Gandhara', 0], ['Shopping', 'The Design Collective', 0], ['Shopping', 'ODEL', 1], ['Shopping', 'Cool Planet Nugegoda', 1], ['Shopping', 'Kelly Felder', 1],
  ['Shopping', 'Hameedia', 2], ['Shopping', 'Kandy', 2], ['Shopping', 'Dilly & Carlo', 3], ['Shopping', 'Envoy Mansion', 3], ['Shopping', 'Mimosa', 3],
  // Banks
  ['Landmark', 'People\'s Bank', 0], ['Landmark', 'BOC', 0], ['Landmark', 'Standard Chartered', 1], ['Landmark', 'HSBC', 1], ['Landmark', 'HNB', 1],
  ['Landmark', 'Commercial Bank', 2], ['Landmark', 'Sampath Bank', 2], ['Landmark', 'Seylan Bank', 2], ['Landmark', 'Amana Takaful PLC', 2],
  // Professional institutes
  ['School', 'The Open University of Sri Lanka', 1], ['School', 'Lyceum Campus', 1], ['School', 'University of Colombo', 2], ['School', 'CIMA Sri Lanka', 2], ['School', 'British Council Sri Lanka', 2], ['School', 'ANC', 3], ['School', 'Institute of Western Music & Speech', 3],
  // Health & wellness
  ['Landmark', 'Noeline\'s', 0], ['Landmark', 'High Octane Gym', 1], ['Landmark', 'Fitness Island', 1], ['Landmark', 'Body Bar', 2], ['Landmark', 'Spa Ceylon', 2], ['Landmark', 'Christell Skin Clinic', 3],
  // Places to worship
  ['Landmark', 'Balapokuna Rajamaha Viharaya', 1], ['Landmark', 'St. Peter\'s Church', 2], ['Landmark', 'Shree Weera Maha Kannagi Amman Kovil', 2], ['Landmark', 'Bhathiya Mawatha Mosque', 2],
  // Fuel & automobile services
  ['Transport', 'IOC Filling Station', 0], ['Transport', 'Lanka Ceypetco', 1], ['Transport', 'Laugfs Filling Station', 2], ['Landmark', 'LAUGFS Car Care', 0], ['Landmark', 'Merc-Stop Automotive', 1], ['Landmark', 'Auto Miraj Premier', 1],
]
const nearby = rows.map(([category, name, d]) => (Array.isArray(d) ? { category, name: `${name} (${d[0]} km)`, distanceKm: d[0] } : { category, name: `${name} (${B[d]})` }))
const doc: any = (await payload.find({ collection: 'projects', where: { slug: { equals: 'fairway-latitude' } }, limit: 1, depth: 0, overrideAccess: true, draft: true })).docs[0]
if (doc.nearby?.length) { console.log('nearby already present', doc.nearby.length); process.exit(0) }
// Wording fix: the developer's own project page dates the 51% figure "September 2026"; do not claim October.
const fix = (s: string) => s.replace(/\(developer update, October 2026\)/g, '(developer update)').replace(/\(October 2026\)/g, '(September 2026, developer update)')
await payload.update({
  collection: 'projects', id: doc.id, overrideAccess: true,
  data: { nearby, constructionStageNote: fix(String(doc.constructionStageNote ?? '')), highlights: (doc.highlights as string[]).map(fix), description: fix(String(doc.description ?? '')) } as never,
})
const after: any = (await payload.find({ collection: 'projects', where: { slug: { equals: 'fairway-latitude' } }, limit: 1, depth: 0, overrideAccess: true, draft: true })).docs[0]
console.log('nearby', after.nearby?.length, '| note:', after.constructionStageNote)
process.exit(0)
