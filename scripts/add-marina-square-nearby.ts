/* eslint-disable @typescript-eslint/no-explicit-any */
// Marina Square: Neighborhood section places. Names and coordinates are the Wikipedia article positions (geosearch around the project pin);
// distances are straight-line from the pin (6.95226, 79.85592), rounded to 0.1 km. The three developer-stated items are kept as they were.
//   NODE_ENV=production npx tsx scripts/add-marina-square-nearby.ts
import path from 'node:path'
import { config as loadEnv } from 'dotenv'
loadEnv({ path: path.join(process.cwd(), '.env.local') })
const cfg = ((await import('../payload.config')) as any).default
const { getPayload } = await import('payload')
const payload = await getPayload({ config: cfg })
const SLUG = process.env.MS_SLUG ?? 'marina-square-uptown-colombo'
const pin: [number, number] = [6.95226, 79.85592]
const rad = (d: number) => (d * Math.PI) / 180
const km = (b: [number, number]) => {
  const dLat = rad(b[0] - pin[0]), dLng = rad(b[1] - pin[1])
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(pin[0])) * Math.cos(rad(b[0])) * Math.sin(dLng / 2) ** 2
  return Math.round(6371 * 2 * Math.asin(Math.sqrt(h)) * 10) / 10
}
const P: [string, string, number, number][] = [
  ['Landmark', 'Port of Colombo', 6.95278, 79.84472], ['Landmark', "St. Anthony's Shrine, Kochchikade", 6.94689, 79.85608],
  ['Landmark', "St. Lucia's Cathedral", 6.94806, 79.86444], ['Landmark', 'Wolvendaal Church', 6.9421, 79.859], ['Landmark', 'Grand Mosque of Colombo', 6.94038, 79.859],
  ['Landmark', 'Colombo Lighthouse', 6.9363, 79.84077], ['Landmark', 'Lotus Tower', 6.92703, 79.85828], ['Landmark', 'Beira Lake', 6.92943, 79.85418],
  ['Landmark', 'Sugathadasa Stadium', 6.94806, 79.86861], ['Landmark', 'R. Premadasa Stadium', 6.93972, 79.87194],
  ['Transport', 'Fort railway station', 6.93361, 79.85083], ['Transport', 'Maradana railway station', 6.92917, 79.86556], ['Transport', 'New Kelani Bridge', 6.95483, 79.88228],
  ['Shopping', 'Pettah Market', 6.93626, 79.84995], ['Shopping', 'One Galle Face', 6.92778, 79.84472], ['Shopping', 'Liberty Plaza', 6.91194, 79.85008],
  ['Hospital', 'Ratnam Private Hospital', 6.92105, 79.85715], ['Hospital', 'National Hospital of Sri Lanka', 6.91914, 79.86803], ['Hospital', "Lady Ridgeway Hospital for Children", 6.9176, 79.8758],
  ['School', "St. Lucia's College", 6.94866, 79.86454], ['School', 'De La Salle College', 6.9623, 79.8626], ['School', 'Hameed Al Husseinie College', 6.94089, 79.85964],
  ['School', 'Zahira College', 6.92735, 79.86418], ['School', "St. Joseph's College", 6.92482, 79.86041], ['School', 'Ananda College', 6.925, 79.86917],
]
const proj: any = (await payload.find({ collection: 'projects' as never, where: { slug: { equals: SLUG } }, limit: 1, overrideAccess: true, depth: 0 })).docs[0]
const keep = (proj.nearby ?? []).filter((x: any) => /developer|Port City Colombo$|Fort \/ Pettah|Elevated Highway/i.test(x.name) || /Port City Colombo$|multi-modal|Elevated Highway/.test(x.name)).map((x: any) => ({ category: x.category, name: x.name, distanceKm: x.distanceKm, lat: x.lat ?? undefined, lng: x.lng ?? undefined }))
const added = P.map(([category, name, lat, lng]) => ({ category, name, distanceKm: km([lat, lng]), lat, lng }))
const nearby = [...keep, ...added]
const r: any = await payload.update({ collection: 'projects' as never, id: proj.id, overrideAccess: true, data: { nearby } as never })
console.log('kept', keep.length, 'added', added.length, '=> nearby', r.nearby?.length, 'plans', r.floorPlans?.length, 'gallery', r.gallery?.length)
process.exit(0)
