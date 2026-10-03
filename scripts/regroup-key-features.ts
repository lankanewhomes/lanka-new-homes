/* eslint-disable @typescript-eslint/no-explicit-any -- one-off script over arbitrary CMS docs */
// Regroups Key Features (unitFeatures) into extra accordions using only data already in the CMS:
//  - projects: building-service items -> "Building services", team items -> "Project team"
//  - lands (no Key Features yet): the flat `facilities` list -> Utilities / Road & access / Payment & finance / Legal & documents / Location
//   NODE_ENV=production npx tsx scripts/regroup-key-features.ts [--apply]
import path from 'node:path'
import { config as loadEnv } from 'dotenv'
loadEnv({ path: path.join(process.cwd(), '.env.local') })
const apply = process.argv.includes('--apply')
const cfg = ((await import('../payload.config')) as any).default
const { getPayload } = await import('payload')
const payload = await getPayload({ config: cfg })

const BUILDING = new Set(['Elevators', 'Elevator', 'Lifts', 'Car Lifts', 'Generator', 'Standby Power', 'Backup Power', 'Power backup', 'Garbage Collection', 'Waste Management', 'Sewerage & Waste System', 'Maintenance Services', 'Lobby', 'Reception', 'Hotel Management', 'Building Services', 'Laundry', 'Mini Markets', 'Fire Lobby'])
const TEAM = new Set(['Architect', 'Build supervision', 'Developer entity', 'Structural engineer', 'MEP partner', 'Contractors', 'QS and project management'])
const fieldOf = (i: any) => i.field_other ?? i.field
const slim = (i: any) => ({ field: i.field, field_other: i.field_other, value: i.value, value_other: i.value_other })
const labelOf = (g: any) => g.key_other ?? g.key
const group = (label: string, items: any[]) => ({ key: null, key_other: label, label, items })

function regroupProject(d: any) {
  const src: any[] = d.unitFeatures ?? []
  const b: any[] = [], t: any[] = []
  const kept = src.map((g) => ({ key: g.key, key_other: g.key_other, label: g.label, items: (g.items ?? []).filter((i: any) => {
    const f = fieldOf(i)
    if (labelOf(g) !== 'Building services' && BUILDING.has(f)) { b.push(slim(i)); return false }
    if (labelOf(g) !== 'Project team' && TEAM.has(f)) { t.push(slim(i)); return false }
    return true
  }).map(slim) })).filter((g) => g.items.length)
  if (!b.length && !t.length) return null
  const existing = (label: string) => kept.find((g) => labelOf(g) === label)
  for (const [label, items] of [['Building services', b], ['Project team', t]] as const) {
    if (!items.length) continue
    const g = existing(label)
    if (g) g.items.push(...items)
    else kept.push(group(label, items) as any)
  }
  return { unitFeatures: kept, moved: `${b.length} building, ${t.length} team` }
}

const RULES: [RegExp, string, string][] = [
  [/bus route/i, 'Road & access', 'Public transport'],
  [/road|tar\b/i, 'Road & access', 'Road'],
  [/tap water|well water|water/i, 'Utilities', 'Water'],
  [/electric|phase/i, 'Utilities', 'Electricity'],
  [/drain|sewage|sewer/i, 'Utilities', 'Drainage & sewerage'],
  [/telephone|internet|fib(er|re)/i, 'Utilities', 'Telecom'],
  [/interest|payment|instal|loan/i, 'Payment & finance', 'Terms'],
  [/deed|title|survey|clearance|approved/i, 'Legal & documents', 'Documents'],
  [/city area/i, 'Location', 'Area'],
]
const ORDER = ['Utilities', 'Road & access', 'Payment & finance', 'Legal & documents', 'Location', 'Other features']
function regroupLand(d: any) {
  if ((d.unitFeatures ?? []).length) return null
  const by: Record<string, any[]> = {}
  for (const f of d.facilities ?? []) {
    const text = String(f).trim()
    if (!text || /^show more$/i.test(text)) continue
    const hit = RULES.find(([re]) => re.test(text))
    const [g, field] = hit ? [hit[1], hit[2]] : ['Other features', 'Feature']
    ;(by[g] ??= []).push({ field_other: field, value_other: text })
  }
  const unitFeatures = ORDER.filter((g) => by[g]?.length).map((g) => group(g, by[g]))
  return unitFeatures.length ? { unitFeatures, moved: unitFeatures.map((g: any) => `${g.key_other}:${g.items.length}`).join(' ') } : null
}

for (const [col, fn] of [['projects', regroupProject], ['lands', regroupLand]] as const) {
  const r = await payload.find({ collection: col as any, limit: 2000, depth: 0, pagination: false, overrideAccess: true })
  let n = 0
  for (const d of r.docs as any[]) {
    const res = (fn as any)(d)
    if (!res) continue
    n++
    if (col === 'projects' || n <= 3) console.log(`${col} ${d.slug}: ${res.moved}`)
    if (apply) await payload.update({ collection: col as any, id: d.id, data: { unitFeatures: res.unitFeatures } as any, overrideAccess: true })
  }
  console.log(`== ${col}: ${n} of ${r.docs.length} ${apply ? 'updated' : 'would change'}`)
}
process.exit(0)
