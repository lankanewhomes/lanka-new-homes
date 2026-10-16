/* eslint-disable @typescript-eslint/no-explicit-any -- one-off data script */
// 2026-10-16 (owner: "you should have on the facts section Balcony: available, 1, 2, 3"): the Facts sheet has a Balcony row
// (project.balcony, else "Available" when a floor plan has balconies). Balcony rows in Key Features move there.
import path from 'node:path'
import fs from 'node:fs'
import { config } from 'dotenv'
config({ path: path.join(process.cwd(), '.env.local') })
const cfg = ((await import('../payload.config')) as any).default
const { getPayload } = await import('payload')
const p = await getPayload({ config: cfg })
const o = { overrideAccess: true, depth: 0 } as any
const backup: any[] = JSON.parse(fs.readFileSync('/Users/rupansinnarajah/Desktop/Stuff - LankaNewHomes/Backups/key-features-before-restructure-2026-10-16.json', 'utf8'))
const lake = backup.find((b) => b.slug === 'lakefront-residencies').unitFeatures.flatMap((g: any) => g.items).filter((i: any) => /^balcon/i.test(i.field || '')).map((i: any) => i.value || i.value_other)
console.log('lakefront removed rows:', JSON.stringify(lake))
const VALUES: Record<string, string | ((rows: string[]) => string)> = {
  'skye-blossom-kottawa': 'Available', 'venezia-negombo': 'Shared and private balconies', 'bay-one-residences-colombo': 'Extra wide, ocean view',
  'the-hive-rathmalana': 'Private balcony', 'nemra-jewel-court-dehiwala': 'Private balcony', 'the-kingdom-sigiriya': 'Private balcony',
  'ocean-breeze-residencies-hikkaduwa': 'Private balcony in every floor plan', 'viman-ja-ela-apartments': 'Private balcony on the 2 and 3 bedroom plans',
  'ocean-breeze-negombo-phase-two': '1 (studios) to 5 (3-bedroom Type S), by unit type', 'park-road-colombo05': 'Type A 4, Type B 5, Type C 4, Type D 3, Type E 2, Type F 6',
  'edmonton-bliss-residencies': (rows) => '3 to 5 by unit type' + (rows.filter((r) => /^unit 0/i.test(r)).length ? ' (' + rows.filter((r) => /^unit 0/i.test(r)).map((r) => r.replace(/:\s*(\w+) private balconies?/i, (_m, n) => ' ' + ({ one: 1, two: 2, three: 3, four: 4, five: 5, six: 6 } as any)[n.toLowerCase()])).join(', ') + ')' : ''),
  'rush-residencies-colombo-6': 'Private balconies', 'springfield-residencies': 'Two balconies on the first floor', 'lakefront-residencies': lake.join('; '),
}
for (const [slug, v] of Object.entries(VALUES)) {
  const x: any = (await p.find({ collection: 'projects', where: { slug: { equals: slug } } as never, limit: 1, ...o })).docs[0]
  if (!x) { console.log('missing', slug); continue }
  const rows: string[] = []
  const groups = (x.unitFeatures || []).map(({ id, ...g }: any) => ({ ...g, items: (g.items || []).filter((it: any) => {
    const f = String(it.field || it.field_other || '')
    if (/^balcon/i.test(f) && !(slug === 'rush-residencies-colombo-6' && !/^private balconies/i.test(String(it.value || it.value_other)))) { rows.push(`${it.field_other || f}: ${String(it.value || it.value_other)}`); return false }
    return true
  }).map(({ id: _i, ...i }: any) => i) })).filter((g: any) => g.items.length)
  const value = typeof v === 'function' ? v(rows.map((r) => r.replace(/^[^:]*:\s*/, ''))) : v
  await p.update({ collection: 'projects', id: x.id, data: { balcony: value.slice(0, 250), unitFeatures: groups } as never, ...o })
  console.log(slug, '=>', value.slice(0, 160), '| rows removed', rows.length)
}
process.exit(0)
