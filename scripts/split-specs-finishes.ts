/* eslint-disable @typescript-eslint/no-explicit-any -- one-off data script */
// 2026-10-16 (owner: separate Finishes from Specifications): construction specs (substructure, superstructure, foundation, roof, waterproofing,
// electrical, plumbing, drainage, termite treatment) stay in Specifications; finishes (floors, walls, paint, doors, windows, ceilings,
// sanitary fittings, colour scheme) move to Finishes.
//   DRY=1 NODE_ENV=production npx tsx scripts/split-specs-finishes.ts
import path from 'node:path'
import fs from 'node:fs'
import { config } from 'dotenv'
config({ path: path.join(process.cwd(), '.env.local') })
const cfg = ((await import('../payload.config')) as any).default
const { getPayload } = await import('payload')
const p = await getPayload({ config: cfg })
const o = { overrideAccess: true, depth: 0 } as any
const DRY = process.env.DRY === '1'
const ORDER = ['specifications', 'finishes', 'general-features', 'safety-security', 'indoor', 'building-services', 'outdoor', 'recreation-wellness', 'sustainability', 'accessibility', 'utilities', 'road-access']
const LABEL: Record<string, string> = { specifications: 'Specifications', finishes: 'Finishes', 'general-features': 'General Features', 'safety-security': 'Safety & Security', indoor: 'Indoor Features', 'building-services': 'Building & Services', outdoor: 'Outdoor Features', 'recreation-wellness': 'Recreation & Wellness', sustainability: 'Sustainability', accessibility: 'Accessibility', utilities: 'Utilities', 'road-access': 'Road & Access' }
const L2K = Object.fromEntries(Object.entries(LABEL).map(([k, v]) => [v.toLowerCase(), k]))
const tabOf = (g: any) => (g.key && LABEL[g.key] ? g.key : L2K[String(g.key_other || g.label || g.key || '').toLowerCase()])
const FINISH_FIELD = /^(flooring|floor finishes?|floor finishes? \((apartments|villas)\)|wall finishes?|walls( \((apartments|villas)\))?|bathroom walls|toilet walls|painting|colou?r scheme|doors( & windows| and windows)?|windows|ceiling|ceilings|soffit|tiles|plumbing & sanitary fittings|toilet fittings|bathroom fittings|door locks|locks|staircase( and)? hand ?rail|handrail|blinds|materials)$/i
const backup: any[] = []; const moved = new Map<string, number>(); let n = 0; const sample: string[] = []
for (const coll of ['projects', 'lands'] as const) {
  const docs = (await p.find({ collection: coll, limit: 600, pagination: false, ...o })).docs as any[]
  for (const x of docs) {
    const buckets = new Map<string, any[]>(); const rest: any[] = []; let changed = 0
    for (const g of x.unitFeatures || []) {
      const tk = tabOf(g)
      if (!tk) { rest.push({ ...g, id: undefined, items: (g.items || []).map(({ id, ...i }: any) => i) }); continue }
      for (const { id, ...it } of g.items || []) {
        const f = String(it.field || it.field_other || '').trim()
        let to = tk
        if (tk === 'specifications' && FINISH_FIELD.test(f)) to = f.toLowerCase() === 'blinds' ? 'general-features' : 'finishes'
        if (to !== tk) { changed++; moved.set(f, (moved.get(f) || 0) + 1); if (sample.length < 12) sample.push(`${x.slug}: ${f}`) }
        buckets.set(to, [...(buckets.get(to) || []), it])
      }
    }
    if (!changed) continue
    n++; backup.push({ coll, id: x.id, slug: x.slug, unitFeatures: x.unitFeatures })
    if (DRY) continue
    const groups = [...ORDER.filter((k) => buckets.has(k)).map((k) => ({ key: k, label: LABEL[k], items: buckets.get(k)! })), ...rest]
    await p.update({ collection: coll, id: x.id, data: { unitFeatures: groups } as never, ...o })
  }
}
fs.writeFileSync('/Users/rupansinnarajah/Desktop/Stuff - LankaNewHomes/Backups/key-features-before-spec-finish-split-2026-10-16.json', JSON.stringify(backup))
console.log([...moved.entries()].sort((a, b) => b[1] - a[1]).map(([k, v]) => v + ' ' + k).join('\n')); console.log(sample.join('\n')); console.log(DRY ? 'DRY' : 'WRITTEN', n, 'listings')
process.exit(0)
