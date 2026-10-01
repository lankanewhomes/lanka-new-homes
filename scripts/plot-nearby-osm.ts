// Puts nearby places on the Map tab for listings the name geocoder couldn't match (see geocode-nearby.ts):
//  1. an existing Hospital/Shopping nearby row without coordinates gets them when an OpenStreetMap hospital /
//     supermarket / mall with the same (or containing) name exists within 15 km;
//  2. a listing that still has fewer than 2 plotted places gets its nearest hospital and nearest supermarket/mall
//     added (name, straight-line distance, coordinates), unless already listed.
// Data: OpenStreetMap contributors (ODbL) via Overpass.
//
//   NODE_ENV=production npx tsx scripts/plot-nearby-osm.ts [--dry]
import path from 'node:path'
import { config as loadEnv } from 'dotenv'
import type payloadConfigType from '../payload.config'

loadEnv({ path: path.join(process.cwd(), '.env.local') })
const dry = process.argv.includes('--dry')
const payloadConfig = ((await import('../payload.config')) as { default: typeof payloadConfigType }).default
const { getPayload } = await import('payload')
const payload = await getPayload({ config: payloadConfig })

const ENDPOINT = 'https://overpass.openstreetmap.fr/api/interpreter'
const RADIUS_M = 15000
const rad = (d: number) => (d * Math.PI) / 180
const km = (a: [number, number], b: [number, number]) => {
  const h = Math.sin(rad(b[0] - a[0]) / 2) ** 2 + Math.cos(rad(a[0])) * Math.cos(rad(b[0])) * Math.sin(rad(b[1] - a[1]) / 2) ** 2
  return 6371 * 2 * Math.asin(Math.sqrt(h))
}
type El = { tags?: Record<string, string>; lat?: number; lon?: number; center?: { lat: number; lon: number } }
type Poi = { name: string; category: 'Hospital' | 'Shopping'; lat: number; lng: number }
async function pois(lat: number, lng: number): Promise<Poi[]> {
  const q = `[out:json][timeout:40];(nwr(around:${RADIUS_M},${lat},${lng})[amenity=hospital][name];nwr(around:${RADIUS_M},${lat},${lng})[shop~"^(supermarket|mall|department_store)$"][name];);out center 200;`
  for (let attempt = 0; attempt < 3; attempt++) {
    const res = await fetch(ENDPOINT, { method: 'POST', headers: { 'user-agent': 'LankaNewHomes-nearby/1.0 (support@lankanewhomes.com)', 'content-type': 'application/x-www-form-urlencoded' }, body: `data=${encodeURIComponent(q)}` })
    if (res.ok) {
      const j = (await res.json()) as { elements?: El[] }
      return (j.elements ?? []).flatMap((e) => {
        const la = e.lat ?? e.center?.lat, lo = e.lon ?? e.center?.lon
        if (la == null || lo == null || !e.tags?.name) return []
        return [{ name: e.tags.name, category: e.tags.amenity === 'hospital' ? ('Hospital' as const) : ('Shopping' as const), lat: la, lng: lo }]
      })
    }
    await new Promise((r) => setTimeout(r, 4000))
  }
  return []
}
const norm = (s: string) => s.toLowerCase().replace(/\(.*?\)/g, '').replace(/[^a-z0-9]+/g, ' ').trim()

type Near = { category: string; name: string; distanceKm?: number | null; lat?: number | null; lng?: number | null; [k: string]: unknown }
for (const coll of ['projects', 'lands'] as const) {
  const docs = await payload.find({ collection: coll, limit: 500, depth: 0, overrideAccess: true })
  for (const doc of docs.docs as unknown as { id: number; slug: string; coordinates?: { lat?: number | null; lng?: number | null }; nearby?: Near[] }[]) {
    const lat = doc.coordinates?.lat, lng = doc.coordinates?.lng
    if (lat == null || lng == null) continue
    const nearby = (doc.nearby ?? []).map(({ id: _id, ...rest }) => rest as Near)
    const plotted = () => nearby.filter((n) => n.lat != null && n.lng != null).length
    if (plotted() >= 2 && !nearby.some((n) => (n.category === 'Hospital' || n.category === 'Shopping') && n.lat == null)) continue
    const all = (await pois(lat, lng)).map((p) => ({ ...p, d: km([lat, lng], [p.lat, p.lng]) })).sort((a, b) => a.d - b.d)
    let changed = 0
    for (const n of nearby) {
      if (n.lat != null || (n.category !== 'Hospital' && n.category !== 'Shopping')) continue
      const key = norm(n.name)
      const hit = key && all.find((p) => p.category === n.category && (norm(p.name) === key || norm(p.name).includes(key) || key.includes(norm(p.name))))
      if (hit) { n.lat = hit.lat; n.lng = hit.lng; changed++ }
    }
    let added = 0
    if (plotted() < 2) {
      for (const cat of ['Hospital', 'Shopping'] as const) {
        const have = new Set(nearby.filter((n) => n.category === cat).map((n) => norm(n.name)))
        const best = all.find((p) => p.category === cat && !have.has(norm(p.name)))
        if (best && !nearby.some((n) => n.category === cat && n.lat != null)) {
          nearby.push({ category: cat, name: best.name, distanceKm: Math.round(best.d * 10) / 10, lat: best.lat, lng: best.lng }); added++
        }
      }
    }
    console.log(coll, doc.slug, `matched ${changed}, added ${added}, plotted now ${plotted()}`)
    if ((changed || added) && !dry) await payload.update({ collection: coll, id: doc.id, data: { nearby } as never, overrideAccess: true })
    await new Promise((r) => setTimeout(r, 1500))
  }
}
process.exit(0)
