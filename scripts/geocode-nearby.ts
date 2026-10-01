// Adds lat/lng to every `nearby` entry (projects + lands) that lacks them, so the Map tab / lightbox map can
// plot the places. Source: OpenStreetMap Nominatim (ODbL), restricted to a box around the listing's own pin
// and the nearest match kept; entries with no match inside ~15 km are left without coordinates (no guessing).
//
//   NODE_ENV=production npx tsx scripts/geocode-nearby.ts [--dry]
import path from 'node:path'
import { config as loadEnv } from 'dotenv'
import type payloadConfigType from '../payload.config'

loadEnv({ path: path.join(process.cwd(), '.env.local') })
const dry = process.argv.includes('--dry')
const payloadConfig = ((await import('../payload.config')) as { default: typeof payloadConfigType }).default
const { getPayload } = await import('payload')
const payload = await getPayload({ config: payloadConfig })

const rad = (d: number) => (d * Math.PI) / 180
const km = (a: [number, number], b: [number, number]) => {
  const h = Math.sin(rad(b[0] - a[0]) / 2) ** 2 + Math.cos(rad(a[0])) * Math.cos(rad(b[0])) * Math.sin(rad(b[1] - a[1]) / 2) ** 2
  return 6371 * 2 * Math.asin(Math.sqrt(h))
}
const cache = new Map<string, [number, number] | null>()
async function geocode(name: string, lat: number, lng: number): Promise<[number, number] | null> {
  const clean = name.replace(/\(.*?\)/g, '').replace(/\s+/g, ' ').trim()
  const key = `${clean}|${lat.toFixed(2)}|${lng.toFixed(2)}`
  if (cache.has(key)) return cache.get(key)!
  const d = 0.17 // ≈ 19 km box
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=5&countrycodes=lk&bounded=1&viewbox=${lng - d},${lat + d},${lng + d},${lat - d}&q=${encodeURIComponent(clean)}`
  let best: [number, number] | null = null
  try {
    const res = await fetch(url, { headers: { 'user-agent': 'LankaNewHomes-nearby/1.0 (support@lankanewhomes.com)' } })
    if (res.ok) {
      const rows = (await res.json()) as { lat: string; lon: string }[]
      const pts = rows.map((r) => [Number(r.lat), Number(r.lon)] as [number, number]).filter((p) => km([lat, lng], p) <= 15).sort((a, b) => km([lat, lng], a) - km([lat, lng], b))
      best = pts[0] ?? null
    }
  } catch { /* leave null */ }
  cache.set(key, best)
  await new Promise((r) => setTimeout(r, 1100))
  return best
}

type Near = { category: string; name: string; distanceKm?: number | null; lat?: number | null; lng?: number | null; [k: string]: unknown }
for (const coll of ['projects', 'lands'] as const) {
  const docs = await payload.find({ collection: coll, limit: 500, depth: 0, overrideAccess: true })
  for (const doc of docs.docs as unknown as { id: number; slug: string; coordinates?: { lat?: number | null; lng?: number | null }; nearby?: Near[] }[]) {
    const lat = doc.coordinates?.lat, lng = doc.coordinates?.lng
    const nearby = doc.nearby ?? []
    if (lat == null || lng == null || !nearby.some((n) => n.lat == null)) continue
    let found = 0
    const next: Near[] = []
    for (const n of nearby) {
      if (n.lat != null && n.lng != null) { next.push(n); continue }
      const p = await geocode(n.name, lat, lng)
      if (p) found++
      next.push(p ? { ...n, lat: p[0], lng: p[1] } : n)
    }
    console.log(coll, doc.slug, `${found}/${nearby.length}`)
    if (found && !dry) await payload.update({ collection: coll, id: doc.id, data: { nearby: next.map(({ id: _id, ...rest }) => rest) } as never, overrideAccess: true })
  }
}
process.exit(0)
