/* eslint-disable @typescript-eslint/no-explicit-any -- one-off data script */
// 2026-10-16 (owner: "parking can go into fact section"): the Parking amenity and its description move into the Facts sheet's Parking row
// (project.parking); the Parking amenity chip and any "Parking" Key Features rows are removed. Projects only; lands unchanged.
//   DRY=1 NODE_ENV=production npx tsx scripts/move-parking-to-facts.ts
import path from 'node:path'
import fs from 'node:fs'
import { config } from 'dotenv'
config({ path: path.join(process.cwd(), '.env.local') })
const cfg = ((await import('../payload.config')) as any).default
const { getPayload } = await import('payload')
const p = await getPayload({ config: cfg })
const o = { overrideAccess: true, depth: 0 } as any
const DRY = process.env.DRY === '1'
const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
const all = (await p.find({ collection: 'projects', limit: 500, pagination: false, ...o })).docs as any[]
const backup: any[] = []; let n = 0
for (const x of all) {
  const am = (x.amenities || []).find((a: any) => a.name === 'Parking')
  const kf = (x.unitFeatures || []).flatMap((g: any) => (g.items || []).filter((it: any) => /^parking$/i.test(String(it.field || it.field_other || '')).valueOf() ? true : false))
  if (!am && !kf.length) continue
  const fact = String(x.parking || '').trim(); const desc = String(am?.description || '').trim()
  const kfText = kf.map((it: any) => String(it.value || it.value_other || '')).filter(Boolean)
  let next = fact
  for (const t of [desc, ...kfText].filter(Boolean)) {
    // the amenity text and the fact paraphrase each other: keep the fuller one
    if (!next || t.length > next.length) next = t
  }
  if (!next) next = 'Available'
  n++; backup.push({ id: x.id, slug: x.slug, parking: x.parking, amenities: x.amenities, unitFeatures: x.unitFeatures })
  console.log(x.slug, '|', JSON.stringify(fact || null), '+', JSON.stringify(desc || null), kfText.length ? '+KF ' + JSON.stringify(kfText) : '', '=>', JSON.stringify(next))
  if (DRY) continue
  const groups = (x.unitFeatures || []).map(({ id, ...g }: any) => ({ ...g, items: (g.items || []).filter((it: any) => !/^parking$/i.test(String(it.field || it.field_other || ''))).map(({ id: _i, ...i }: any) => i) })).filter((g: any) => g.items.length)
  await p.update({ collection: 'projects', id: x.id, data: { parking: next, amenities: (x.amenities || []).filter((a: any) => a.name !== 'Parking').map(({ id, ...a }: any) => a), unitFeatures: groups } as never, ...o })
}
fs.writeFileSync('/Users/rupansinnarajah/Desktop/Stuff - LankaNewHomes/Backups/parking-before-move-to-facts-2026-10-16.json', JSON.stringify(backup))
console.log(DRY ? 'DRY' : 'WRITTEN', n)
process.exit(0)
