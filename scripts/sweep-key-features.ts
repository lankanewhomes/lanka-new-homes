/* eslint-disable @typescript-eslint/no-explicit-any -- one-off data script */
// 2026-10-16 (owner: "check all the listings key features and move to where it needs to go: amenities, facts section"): conservative sweep
// of every project's Key Features. Removes an item ONLY when its content already lives somewhere else on the page:
//   - Security/Surveillance/Parking/Pool/Rooftop/Jacuzzi/EV charging/Terraces/Beach/Additional Spaces whose parts are all existing amenities
//     (the text moves into the amenity's blank description first),
//   - Architect (moves to the Architect page, created when missing),
//   - Unit/apartment/home types and sizes when the project has floor plans.
// Anything else stays. Backup first: Stuff/Backups/key-features-before-full-sweep-2026-10-16.json.
//   DRY=1 NODE_ENV=production npx tsx scripts/sweep-key-features.ts   (prints the plan)   |   without DRY it writes
import path from 'node:path'
import { config } from 'dotenv'
config({ path: path.join(process.cwd(), '.env.local') })
const cfg = ((await import('../payload.config')) as any).default
const { getPayload } = await import('payload')
const p = await getPayload({ config: cfg })
const o = { overrideAccess: true, depth: 0 } as any
const DRY = process.env.DRY === '1'
const lc = (s: string) => s.toLowerCase().trim()
const AMEN_FOR: Record<string, (a: string) => boolean> = {
  security: (a) => a === 'Security' || a === 'CCTV', surveillance: (a) => a === 'CCTV', parking: (a) => a === 'Parking',
  pool: (a) => /pool/i.test(a), rooftop: (a) => /roof/i.test(a), jacuzzi: (a) => a === 'Jacuzzi',
  'ev charging': (a) => a === 'EV Charging', terraces: (a) => /terrace/i.test(a), terrace: (a) => /terrace/i.test(a), beach: (a) => a === 'Beachfront',
}
const SPACE_WORDS: [RegExp, (a: string) => boolean][] = [
  [/gym/, (a) => /gym/i.test(a)], [/club ?house/, (a) => a === 'Clubhouse'], [/roof/, (a) => /roof/i.test(a)], [/walking|jogging|track/, (a) => /track|walk/i.test(a)],
  [/lounge|reading|relax/, (a) => /lounge/i.test(a)], [/bbq|barbecue|grill/, (a) => a === 'BBQ Area'], [/kids|child|play/, (a) => /child|kids/i.test(a)],
  [/pool/, (a) => /pool/i.test(a)], [/garden/, (a) => /garden/i.test(a)], [/parking/, (a) => a === 'Parking'], [/security|cctv/, (a) => a === 'Security' || a === 'CCTV'],
]
const TYPE_FIELDS = new Set(['unit types', 'apartment types', 'home types', 'home size', 'studio sizes', 'one-bedroom duplex sizes', 'villa designs'])
const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
const projects = (await p.find({ collection: 'projects', limit: 500, pagination: false, ...o })).docs as any[]
const report: string[] = []
let changed = 0
for (const x of projects) {
  const amen: string[] = (x.amenities || []).map((a: any) => a.name)
  const hasPlans = (x.floorPlans || []).length > 0
  // A field repeated in the same project (per-building or per-plan spec rows) can carry different details: leave those alone.
  const seen = new Map<string, number>()
  for (const g of x.unitFeatures || []) for (const it of g.items || []) { const k = lc(it.field || it.field_other || ''); seen.set(k, (seen.get(k) || 0) + 1) }
  const descPatch = new Map<string, string>()
  let architectId: number | null | undefined
  const notes: string[] = []
  const groups = (x.unitFeatures || []).map(({ id, ...g }: any) => ({
    ...g,
    items: (g.items || []).filter((it: any) => {
      const f = lc(it.field || it.field_other || ''); const v = String(it.value || it.value_other || '')
      if (f === 'architect' && !x.architect && v) {
        const name = v.split(',')[0].trim(); architectId = -1; (x as any).__archName = name; (x as any).__archAddr = v.split(',').slice(1).join(',').trim(); notes.push('Architect→page ' + name); return false
      }
      if (f === 'architect' && x.architect) { notes.push('Architect (already linked)'); return false }
      if (TYPE_FIELDS.has(f) && hasPlans) { notes.push('dropped ' + f); return false }
      if (f === 'additional spaces') {
        const parts = v.toLowerCase().split(/,|;| and /).map((s) => s.trim()).filter(Boolean)
        const ok = parts.length && parts.every((pt) => SPACE_WORDS.some(([re, test]) => re.test(pt) && amen.some(test)))
        if (ok) { notes.push('dropped Additional Spaces'); return false }
        return true
      }
      const test = AMEN_FOR[f]
      if (test && (seen.get(f) || 0) === 1) {
        const match = amen.find(test)
        if (match) {
          if (v && v.length < 220 && !descPatch.has(match)) descPatch.set(match, v)
          notes.push(`${it.field || f}→${match}`); return false
        }
      }
      return true
    }).map(({ id, ...i }: any) => i),
  })).filter((g: any) => g.items.length)
  if (!notes.length) continue
  changed++
  report.push(`${x.id} ${x.slug}: ${notes.join('; ')}`)
  if (DRY) continue
  const data: any = { unitFeatures: groups }
  if (descPatch.size) data.amenities = (x.amenities || []).map(({ id, ...a }: any) => ({ ...a, description: a.description || descPatch.get(a.name) || a.description }))
  if (architectId === -1) {
    const name = (x as any).__archName as string
    let a: any = (await p.find({ collection: 'architects', where: { name: { equals: name } } as never, limit: 1, ...o })).docs[0]
    if (!a) a = await p.create({ collection: 'architects', ...o, data: { slug: slugify(name), name, location: (x as any).__archAddr || undefined, description: `${name} is named as the architect of ${x.name}.` } as never })
    data.architect = a.id
  }
  await p.update({ collection: 'projects', id: x.id, data, ...o })
}
console.log(report.join('\n'))
console.log(DRY ? 'DRY RUN' : 'WRITTEN', changed, 'of', projects.length, 'projects')
process.exit(0)
