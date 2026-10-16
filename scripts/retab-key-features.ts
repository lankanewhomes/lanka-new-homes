/* eslint-disable @typescript-eslint/no-explicit-any -- one-off data script */
// 2026-10-16 (owner: "Finishes > Pantry: Pantry and Dining Separate should be in Indoor Features, check all the listings"):
// moves Key Features rows into the tab where they belong. Finishes keeps materials (flooring, walls, doors, windows, kitchen cabinetry, sanitaryware, paint);
// layout/rooms go to Indoor Features; A/C, TV points, wardrobes, smart home to General Features; lifts, power backup, waste to Building & Services;
// fire/security to Safety & Security; terraces/pools to Outdoor Features; solar/energy to Sustainability.
//   DRY=1 NODE_ENV=production npx tsx scripts/retab-key-features.ts   (plan)   |   without DRY it writes (projects and lands)
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
const MATERIAL = /cupboard|granite|countertop|cabinet|finish|tile|worktop|top\b|macply|sink|laminat/i
const f = (s: string) => s.toLowerCase().trim()
// returns the tab key a row belongs in, or undefined to leave it
function target(field: string, value: string, tab: string): string | undefined {
  const n = f(field)
  if (n === 'pantry' && tab !== 'indoor' && !MATERIAL.test(value)) return 'indoor'
  if (['bedrooms', 'bedrooms & closets', 'living & dining', "servant's toilet", 'servant toilet', "maid's toilet", 'maid facility', "maid's quarters", 'service quarters', 'servant quarters'].includes(n) && ['finishes', 'specifications'].includes(tab)) return 'indoor'
  if (['wardrobes', 'tv & telephone', 'cable tv', 'air conditioner', 'smart home', 'heating, cooling & systems'].includes(n) && tab !== 'general-features') return 'general-features'
  if (['air conditioning'].includes(n) && ['specifications', 'indoor', 'utilities'].includes(tab)) return 'general-features'
  if (['lifts', 'lift', 'elevators', 'elevator', 'car lifts', 'car lift', 'generator', 'standby power', 'backup power', 'power backup', 'garbage', 'garbage collection', 'waste management'].includes(n) && ['general-features', 'specifications', 'utilities'].includes(tab)) return 'building-services'
  if (/^fire|^security$|^escape routes|^fire lobby/.test(n) && tab !== 'safety-security') return 'safety-security'
  if (['terraces', 'terrace', 'plunge pool', 'verandah', 'gazebos', 'natural water plunge pools'].includes(n) && ['indoor', 'specifications', 'general-features'].includes(tab)) return 'outdoor'
  if (['solar', 'solar energy', 'energy efficiency', 'energy and noise'].includes(n) && tab !== 'sustainability') return 'sustainability'
  if (n === 'accessibility' && tab === 'general-features') return 'accessibility'
  return undefined
}
const tabOf = (g: any) => (g.key && LABEL[g.key] ? g.key : L2K[String(g.key_other || g.label || g.key || '').toLowerCase()])
const moves = new Map<string, number>(); const sample: string[] = []
const backup: any[] = []
for (const coll of ['projects', 'lands'] as const) {
  const docs = (await p.find({ collection: coll, limit: 600, pagination: false, ...o })).docs as any[]
  for (const x of docs) {
    backup.push({ coll, id: x.id, slug: x.slug, unitFeatures: x.unitFeatures || [] })
    const buckets = new Map<string, any[]>(); const rest: any[] = []; let moved = 0
    for (const g of (x.unitFeatures || [])) {
      const tk = tabOf(g)
      if (!tk) { rest.push({ ...g, id: undefined, items: (g.items || []).map(({ id, ...i }: any) => i) }); continue }
      for (const { id, ...it } of g.items || []) {
        const dest = target(String(it.field || it.field_other || ''), String(it.value || it.value_other || ''), tk)
        const to = dest ?? tk
        if (dest && dest !== tk) { moved++; const key = `${LABEL[tk]} -> ${LABEL[dest]}`; moves.set(key, (moves.get(key) || 0) + 1); if (sample.length < 60) sample.push(`${x.slug}: ${key} | ${it.field || it.field_other}: ${String(it.value || it.value_other).slice(0, 60)}`) }
        buckets.set(to, [...(buckets.get(to) || []), it])
      }
    }
    if (!moved) continue
    const groups = [...ORDER.filter((k) => buckets.has(k)).map((k) => ({ key: k, label: LABEL[k], items: buckets.get(k)! })), ...rest]
    if (!DRY) await p.update({ collection: coll, id: x.id, data: { unitFeatures: groups } as never, ...o })
  }
}
fs.writeFileSync('/Users/rupansinnarajah/Desktop/Stuff - LankaNewHomes/Backups/key-features-before-retab-2026-10-16.json', JSON.stringify(backup))
console.log([...moves.entries()].sort((a, b) => b[1] - a[1]).map(([k, v]) => v + '  ' + k).join('\n'))
console.log(sample.join('\n')); console.log(DRY ? 'DRY RUN' : 'WRITTEN')
process.exit(0)
