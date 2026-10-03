/* eslint-disable @typescript-eslint/no-explicit-any -- one-off script over arbitrary CMS docs */
// Second regroup of Key Features (owner, 2026-10-03): every project's items go into Specifications / Finishes /
// Safety & security / Recreation & wellness by field name (Safety also by content for "Smart Home & Security").
// Items that fit none stay where they are. Ownership/Tenure items are dropped (Ownership is already a fact).
// "Project team" and "After-sales" are left alone until the owner decides where they go.
//   NODE_ENV=production npx tsx scripts/regroup-key-features-2.ts [--apply]
import path from 'node:path'
import { config as loadEnv } from 'dotenv'
loadEnv({ path: path.join(process.cwd(), '.env.local') })
const apply = process.argv.includes('--apply')
const cfg = ((await import('../payload.config')) as any).default
const { getPayload } = await import('payload')
const payload = await getPayload({ config: cfg })

const norm = (s: string) => s.trim().toLowerCase().replace(/\s+/g, ' ')
const set = (...a: string[]) => new Set(a.map(norm))
const SAFETY = set('Security', 'Safety', 'Fire Safety', 'Fire Protection System', 'Fire Protection', 'Fire Lobby', 'CCTV')
const RECREATION = set('Pool', 'Rooftop Pool', 'Rooftop', 'Roof', 'Gymnasium', 'Games', 'Games Room', 'Wellness', 'Dining & Leisure', 'Dining', 'Kids', 'Events', 'Beach', 'Water Sports', 'Garden Lounge', 'Landscaping', 'Garden', 'Community', 'Common Amenities', 'Amenities', 'Restaurant', 'Banquet Hall', 'Ayurvedic Spa', 'Jacuzzi')
const FINISHES = set('Kitchen', 'Flooring', 'Finishes', 'Wall Finishes', 'Colour Scheme', 'Toilets', 'Toilet Walls', 'Pantry Cupboard', 'Pantry', 'Bathroom', 'Bathrooms', 'Bathroom Fittings', 'Staircase Hand Rail', 'Ceilings', 'Flooring & Finishes', 'Doors & Windows', 'Doors and Windows', 'Windows', 'Locks', 'Living & Dining', 'Bedrooms', 'Bedrooms & Closets', "Servant's Toilet", 'Fans and Light')
const SPECS = set('Foundation', 'Sub Structure', 'Super Structure', 'Roof & Ceiling', 'Plumbing', 'Plumbing Work', 'Electrical Works / Fixtures', 'Water Supply', 'Storm Water Drainage', 'TV & Telephone', 'Air Conditioner', 'Infrastructure Works', 'General', 'General Specification', 'Sewerage & Waste System', 'Water', 'Utilities')
const DROP = set('Ownership', 'Tenure')
const SECURITY_TEXT = /security|cctv|guard|surveillance|access control|alarm|intercom/i

const fieldOf = (i: any) => i.field_other ?? i.field
const valueOf = (i: any) => i.value_other ?? i.value ?? ''
const labelOf = (g: any) => g.key_other ?? g.key
const slim = (i: any) => ({ field: i.field, field_other: i.field_other, value: i.value, value_other: i.value_other })

function target(g: any, i: any): string | null {
  const f = norm(String(fieldOf(i) ?? ''))
  if (labelOf(g) === 'Specifications' || labelOf(g) === 'specifications') {
    // inside Specifications: only finish-type items leave it
    if (FINISHES.has(f)) return 'Finishes'
    if (SAFETY.has(f)) return 'Safety & security'
    return null
  }
  if (labelOf(g) === 'Project team' || labelOf(g) === 'Documentation') return null
  if (f === 'smart home & security' && SECURITY_TEXT.test(String(valueOf(i)))) return 'Safety & security'
  if (SAFETY.has(f)) return 'Safety & security'
  if (RECREATION.has(f)) return 'Recreation & wellness'
  if (FINISHES.has(f)) return 'Finishes'
  if (SPECS.has(f)) return 'Specifications'
  return null
}

const r = await payload.find({ collection: 'projects', limit: 2000, depth: 0, pagination: false, overrideAccess: true })
const total: Record<string, number> = {}
let touched = 0, dropped = 0
for (const d of r.docs as any[]) {
  const src: any[] = d.unitFeatures ?? []
  if (!src.length) continue
  const moved: Record<string, any[]> = {}
  let drop = 0
  let kept = src.map((g) => ({
    key: g.key, key_other: g.key_other, label: g.label,
    items: (g.items ?? []).filter((i: any) => {
      if (DROP.has(norm(String(fieldOf(i) ?? '')))) { drop++; return false }
      const t = target(g, i)
      if (t) { (moved[t] ??= []).push(slim(i)); return false }
      return true
    }).map(slim),
  }))
  // merge the older "Wellness & Recreation" group into the new one
  const old = kept.find((g) => labelOf(g) === 'Wellness & Recreation')
  if (old) { (moved['Recreation & wellness'] ??= []).push(...old.items); old.items = [] }
  kept = kept.filter((g) => g.items.length)
  const n = Object.values(moved).reduce((a, x) => a + x.length, 0)
  if (!n && !drop) continue
  for (const t of ['Specifications', 'Finishes', 'Safety & security', 'Recreation & wellness']) {
    const items = moved[t]; if (!items?.length) continue
    total[t] = (total[t] ?? 0) + items.length
    const existing = kept.find((g) => labelOf(g)?.toLowerCase() === t.toLowerCase())
    if (existing) existing.items.push(...items)
    else kept.push(t === 'Specifications' ? ({ key: 'specifications', key_other: undefined, label: 'Specifications', items } as any) : ({ key: null, key_other: t, label: t, items } as any))
  }
  touched++; dropped += drop
  console.log(`${d.slug}: ${Object.entries(moved).map(([k, v]) => `${k} ${v.length}`).join(', ')}${drop ? `, dropped ${drop}` : ''}`)
  if (apply) await payload.update({ collection: 'projects', id: d.id, data: { unitFeatures: kept } as any, overrideAccess: true })
}
console.log(apply ? 'APPLIED' : 'DRY RUN', `${touched} projects`, JSON.stringify(total), 'dropped', dropped)
process.exit(0)
