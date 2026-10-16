/* eslint-disable @typescript-eslint/no-explicit-any -- one-off data script */
// 2026-10-16 (owner: "these infos are already in the facts sheet, they shouldn't be in Key Features, always"): removes Key Feature rows that only
// repeat facts-sheet data: unit/residence counts, unit/residence/home types and size ranges, tower/floor counts, construction start,
// completion dates, location, developer/architect names. Room layouts, plan footprints and unit-level specs are left alone. Dry run first:
//   DRY=1 NODE_ENV=production npx tsx scripts/sweep-key-features-facts.ts
import path from 'node:path'
import fs from 'node:fs'
import { config } from 'dotenv'
config({ path: path.join(process.cwd(), '.env.local') })
const cfg = ((await import('../payload.config')) as any).default
const { getPayload } = await import('payload')
const p = await getPayload({ config: cfg })
const o = { overrideAccess: true, depth: 0 } as any
const DRY = process.env.DRY === '1'
const FACT = new Set(['units', 'unit types', 'residences', 'residence types', 'apartment types', 'home types', 'home size', 'studio sizes', 'one-bedroom duplex sizes', 'towers', 'development', 'total built-up area', 'building height', 'floor levels', 'apartment floors', 'construction commencement', 'estimated completion', 'completion', 'rooms', 'villas', 'architect', 'contractor', 'developer', 'location'])
const all = (await p.find({ collection: 'projects', limit: 500, pagination: false, ...o })).docs as any[]
fs.writeFileSync('/Users/rupansinnarajah/Desktop/Stuff - LankaNewHomes/Backups/key-features-before-facts-sweep-2026-10-16.json', JSON.stringify(all.map((x) => ({ id: x.id, slug: x.slug, unitFeatures: x.unitFeatures || [] })), null, 1))
let changed = 0
for (const x of all) {
  const removed: string[] = []
  const groups = (x.unitFeatures || []).map(({ id, ...g }: any) => ({ ...g, items: (g.items || []).filter((it: any) => { const f = String(it.field || it.field_other || '').toLowerCase().trim(); if (FACT.has(f)) { removed.push(`${it.field || it.field_other}: ${String(it.value || it.value_other).slice(0, 60)}`); return false } return true }).map(({ id, ...i }: any) => i) })).filter((g: any) => g.items.length)
  if (!removed.length) continue
  changed++
  console.log(x.id, x.slug, '->', removed.join(' | '))
  if (!DRY) await p.update({ collection: 'projects', id: x.id, data: { unitFeatures: groups } as never, ...o })
}
console.log(DRY ? 'DRY RUN' : 'WRITTEN', changed, 'of', all.length)
process.exit(0)
