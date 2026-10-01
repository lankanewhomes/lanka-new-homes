// Adds the nearest hospitals and shopping (supermarkets / malls) to every land that has
// map coordinates, so the Neighborhood section's Hospital and Shopping groups are filled.
// Data: OpenStreetMap contributors (ODbL) via the Overpass API; distances are straight-line
// from the listing's map pin (rounded to 0.1 km). Skips lands that already have those groups.
//
//   NODE_ENV=production npx tsx scripts/add-land-nearby-osm.ts
import path from 'node:path'
import { config as loadEnv } from 'dotenv'
import type payloadConfigType from '../payload.config'

loadEnv({ path: path.join(process.cwd(), '.env.local') })
const payloadConfig = ((await import('../payload.config')) as { default: typeof payloadConfigType }).default
const { getPayload } = await import('payload')
const payload = await getPayload({ config: payloadConfig })

const ENDPOINT = 'https://overpass.openstreetmap.fr/api/interpreter'
const RADIUS_M = 12000
const rad = (d: number) => (d * Math.PI) / 180
const km = (a: [number, number], b: [number, number]) => {
  const dLat = rad(b[0] - a[0]), dLng = rad(b[1] - a[1])
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a[0])) * Math.cos(rad(b[0])) * Math.sin(dLng / 2) ** 2
  return 6371 * 2 * Math.asin(Math.sqrt(h))
}

type El = { tags?: Record<string, string>; lat?: number; lon?: number; center?: { lat: number; lon: number } }
async function query(lat: number, lng: number): Promise<El[]> {
  const q = `[out:json][timeout:30];(nwr(around:${RADIUS_M},${lat},${lng})[amenity=hospital][name];nwr(around:${RADIUS_M},${lat},${lng})[shop~"^(supermarket|mall|department_store)$"][name];);out center 120;`
  for (let attempt = 0; attempt < 3; attempt++) {
    const res = await fetch(ENDPOINT, { method: 'POST', headers: { 'user-agent': 'LankaNewHomes-nearby/1.0 (support@lankanewhomes.com)', 'content-type': 'application/x-www-form-urlencoded' }, body: `data=${encodeURIComponent(q)}` })
    if (res.ok) {
      const j = (await res.json()) as { elements?: El[] }
      return j.elements ?? []
    }
    await new Promise((r) => setTimeout(r, 3000))
  }
  return []
}

const lands = await payload.find({ collection: 'lands', limit: 300, depth: 0, overrideAccess: true })
let done = 0
for (const land of lands.docs as unknown as { id: number; slug: string; coordinates?: { lat?: number | null; lng?: number | null }; nearby?: { category: string; name: string; distanceKm?: number | null }[] }[]) {
  const lat = land.coordinates?.lat, lng = land.coordinates?.lng
  if (lat == null || lng == null) { console.log('no coords', land.slug); continue }
  const have = land.nearby ?? []
  const needHospital = !have.some((n) => n.category === 'Hospital')
  const needShopping = !have.some((n) => n.category === 'Shopping')
  if (!needHospital && !needShopping) continue
  const els = await query(lat, lng)
  const pick = (test: (t: Record<string, string>) => boolean, category: string) => {
    const seen = new Set<string>()
    return els
      .filter((e) => e.tags && test(e.tags))
      .map((e) => ({ name: e.tags!.name, d: km([lat, lng], [e.lat ?? e.center!.lat, e.lon ?? e.center!.lon]) }))
      .sort((a, b) => a.d - b.d)
      .filter((p) => (seen.has(p.name.toLowerCase()) ? false : (seen.add(p.name.toLowerCase()), true)))
      .slice(0, 2)
      .map((p) => ({ category, name: p.name, distanceKm: Math.round(p.d * 10) / 10 }))
  }
  const add = [
    ...(needHospital ? pick((t) => t.amenity === 'hospital', 'Hospital') : []),
    ...(needShopping ? pick((t) => t.shop === 'supermarket' || t.shop === 'mall' || t.shop === 'department_store', 'Shopping') : []),
  ]
  if (add.length) {
    await payload.update({ collection: 'lands', id: land.id, data: { nearby: [...have.map((n) => ({ category: n.category, name: n.name, distanceKm: n.distanceKm ?? undefined })), ...add] } as never, overrideAccess: true })
    done++
  }
  console.log(land.slug, add.map((a) => `${a.category}:${a.name} ${a.distanceKm}km`).join(' | ') || '(none within 12 km)')
  await new Promise((r) => setTimeout(r, 1200))
}
console.log('DONE', done)
process.exit(0)
