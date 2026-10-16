/* eslint-disable @typescript-eslint/no-explicit-any -- one-off data script */
// 2026-10-16 (owner: fill the neighbourhood to-dos): nearby places with DRIVING distances from the listing's map pin.
// Places come from OpenStreetMap (Overpass, ODbL), driving distance from the OSRM public router. Lands: refreshes the existing nearby
// entries (distance + position). Projects: adds up to 2 hospitals, 2 shopping and 2 schools when the list is empty or thin.
//   NODE_ENV=production npx tsx scripts/nearby-driving-distances.ts
import path from 'node:path'
import { config } from 'dotenv'
config({ path: path.join(process.cwd(), '.env.local') })
const cfg = ((await import('../payload.config')) as any).default
const { getPayload } = await import('payload')
const payload = await getPayload({ config: cfg })
const o = { overrideAccess: true, depth: 0 } as any
const UA = { 'user-agent': 'LankaNewHomes-nearby/1.0 (support@lankanewhomes.com)' }
const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '')
const rad = (d: number) => (d * Math.PI) / 180
const air = (a: [number, number], b: [number, number]) => { const dl = rad(b[0] - a[0]), dg = rad(b[1] - a[1]); const h = Math.sin(dl / 2) ** 2 + Math.cos(rad(a[0])) * Math.cos(rad(b[0])) * Math.sin(dg / 2) ** 2; return 6371 * 2 * Math.asin(Math.sqrt(h)) }
type El = { tags?: Record<string, string>; lat?: number; lon?: number; center?: { lat: number; lon: number } }
async function overpass(lat: number, lng: number): Promise<El[]> {
  const q = `[out:json][timeout:40];(nwr(around:12000,${lat},${lng})[amenity=hospital][name];nwr(around:12000,${lat},${lng})[shop~"^(supermarket|mall|department_store)$"][name];nwr(around:8000,${lat},${lng})[amenity~"^(school|college|university)$"][name];);out center 400;`
  for (let i = 0; i < 3; i++) {
    const r = await fetch('https://overpass.openstreetmap.fr/api/interpreter', { method: 'POST', headers: { ...UA, 'content-type': 'application/x-www-form-urlencoded' }, body: `data=${encodeURIComponent(q)}` })
    if (r.ok) return ((await r.json()) as any).elements ?? []
    await new Promise((res) => setTimeout(res, 3000))
  }
  return []
}
async function drive(a: [number, number], b: [number, number]): Promise<number | null> {
  try {
    const r = await fetch(`https://router.project-osrm.org/route/v1/driving/${a[1]},${a[0]};${b[1]},${b[0]}?overview=false`, { headers: UA })
    const j: any = await r.json()
    const m = j?.routes?.[0]?.distance
    await new Promise((res) => setTimeout(res, 400))
    return typeof m === 'number' ? Math.round(m / 100) / 10 : null
  } catch { return null }
}
const pos = (e: El): [number, number] => [e.lat ?? e.center!.lat, e.lon ?? e.center!.lon]
const kind = (t: Record<string, string>) => (t.amenity === 'hospital' ? 'Hospital' : t.shop ? 'Shopping' : 'School')

// ---- lands
for (const id of [] as number[]) void id
const landTodos = (await payload.find({ collection: 'listing-todos' as never, where: { and: [{ listingType: { equals: 'land' } }, { title: { like: 'Check nearby places' } }, { done: { not_equals: true } }] } as never, limit: 50, ...o })).docs as any[]
for (const t of landTodos) {
  const landId = typeof t.land === 'object' ? t.land.id : t.land
  const land: any = await payload.findByID({ collection: 'lands', id: landId, ...o })
  const lat = land.coordinates?.lat, lng = land.coordinates?.lng
  if (lat == null) { console.log('no coords', land.slug); continue }
  const els = await overpass(lat, lng)
  const byName = new Map<string, El>()
  for (const e of els) if (e.tags?.name) byName.set(norm(e.tags.name), e)
  let updated = 0
  const nearby = []
  for (const n of land.nearby || []) {
    const { id: _i, ...rest } = n
    const e = byName.get(norm(n.name))
    if (e) {
      const d = await drive([lat, lng], pos(e))
      const [plat, plng] = pos(e)
      nearby.push({ ...rest, distanceKm: d ?? rest.distanceKm, lat: plat, lng: plng }); if (d != null) updated++
    } else nearby.push(rest)
  }
  await payload.update({ collection: 'lands', id: landId, data: { nearby } as never, ...o })
  await payload.update({ collection: 'listing-todos' as never, id: t.id, ...o, data: { done: true, actionTaken: `Checked 16 Oct 2026: ${updated} of ${nearby.length} nearby places now show driving distance from the map pin (OpenStreetMap routing) and their map position; the others keep their straight-line distance.`, actionAt: new Date().toISOString() } as never })
  console.log('land', land.slug, 'driving distances', updated, '/', nearby.length)
}

// ---- projects with a thin nearby list
for (const id of [147, 137]) {
  const x: any = await payload.findByID({ collection: 'projects', id, ...o })
  const lat = x.coordinates?.lat, lng = x.coordinates?.lng
  if (lat == null) { console.log('no coords', x.slug); continue }
  const els = (await overpass(lat, lng)).filter((e) => e.tags?.name)
  const have = new Set((x.nearby || []).map((n: any) => norm(n.name)))
  const add: any[] = []
  for (const cat of ['Hospital', 'Shopping', 'School']) {
    const picks = els.filter((e) => kind(e.tags!) === cat && !have.has(norm(e.tags!.name))).map((e) => ({ e, d: air([lat, lng], pos(e)) })).sort((a, b) => a.d - b.d)
    const seen = new Set<string>()
    for (const p of picks) { const k = norm(p.e.tags!.name); if (seen.has(k)) continue; seen.add(k); const d = await drive([lat, lng], pos(p.e)); add.push({ category: cat, name: p.e.tags!.name, distanceKm: d ?? Math.round(p.d * 10) / 10, lat: pos(p.e)[0], lng: pos(p.e)[1] }); if (seen.size >= 2) break }
  }
  const nearby = [...(x.nearby || []).map(({ id: _i, ...r }: any) => r), ...add]
  await payload.update({ collection: 'projects', id, data: { nearby } as never, ...o })
  const todos = (await payload.find({ collection: 'listing-todos' as never, where: { and: [{ project: { equals: id } }, { done: { not_equals: true } }, { title: { like: 'earby places' } }] } as never, limit: 10, ...o })).docs as any[]
  for (const t of todos) await payload.update({ collection: 'listing-todos' as never, id: t.id, ...o, data: { done: true, actionTaken: `16 Oct 2026: added ${add.length} nearby places (hospitals, shopping, schools) from OpenStreetMap with driving distances from the map pin.`, actionAt: new Date().toISOString() } as never })
  console.log('project', x.slug, 'added', add.map((a) => `${a.name} ${a.distanceKm}km`).join('; '))
}
process.exit(0)
