/* eslint-disable @typescript-eslint/no-explicit-any -- one-off data script */
// 2026-10-16 (owner: Viman "Sustainability: Solar-powered apartments, EV charging, Green Certification" belongs in the Sustainability tab; check other listings).
import path from 'node:path'
import { config } from 'dotenv'
config({ path: path.join(process.cwd(), '.env.local') })
const cfg = ((await import('../payload.config')) as any).default
const { getPayload } = await import('payload')
const p = await getPayload({ config: cfg })
const o = { overrideAccess: true, depth: 0 } as any
const ORDER = ['specifications', 'finishes', 'general-features', 'safety-security', 'indoor', 'building-services', 'outdoor', 'recreation-wellness', 'sustainability', 'accessibility', 'utilities', 'road-access']
const LABEL: Record<string, string> = { specifications: 'Specifications', finishes: 'Finishes', 'general-features': 'General Features', 'safety-security': 'Safety & Security', indoor: 'Indoor Features', 'building-services': 'Building & Services', outdoor: 'Outdoor Features', 'recreation-wellness': 'Recreation & Wellness', sustainability: 'Sustainability', accessibility: 'Accessibility', utilities: 'Utilities', 'road-access': 'Road & Access' }
const L2K = Object.fromEntries(Object.entries(LABEL).map(([k, v]) => [v.toLowerCase(), k]))
const tabOf = (g: any) => (g.key && LABEL[g.key] ? g.key : L2K[String(g.key_other || g.label || g.key || '').toLowerCase()])
const TARGET: Record<string, (f: string, v: string) => boolean> = {
  'greendale-retirement-cottages': (f) => f === 'energy', 'viman-ja-ela-apartments': (f) => f === 'sustainability', 'bay-one-residences-colombo': (f) => f === 'sustainability',
  'edmonton-bliss-residencies': (f, v) => f === 'water' && /^rainwater harvesting tank/i.test(v), 'rush-residencies-watarappala': (_f, v) => /^solar power for common/i.test(v),
  'rush-court-3-ratmalana': (_f, v) => /^solar power for common/i.test(v), 'rush-tower-2-dehiwala': (_f, v) => /^solar power for common/i.test(v), 'aathavan-apartments-dehiwala': (f, v) => f === 'water' && /^rainwater/i.test(v),
}
for (const [slug, test] of Object.entries(TARGET)) {
  const x: any = (await p.find({ collection: 'projects', where: { slug: { equals: slug } } as never, limit: 1, ...o })).docs[0]
  if (!x) continue
  const buckets = new Map<string, any[]>(); const rest: any[] = []; const log: string[] = []
  for (const g of x.unitFeatures || []) {
    const tk = tabOf(g)
    if (!tk) { rest.push({ ...g, id: undefined, items: (g.items || []).map(({ id, ...i }: any) => i) }); continue }
    for (const { id, ...it } of g.items || []) {
      const f = String(it.field || it.field_other || '').toLowerCase().trim(); const v = String(it.value || it.value_other || '')
      if (tk !== 'sustainability' && test(f, v)) {
        log.push(v.slice(0, 50))
        if (slug === 'viman-ja-ela-apartments') { buckets.set('sustainability', [...(buckets.get('sustainability') || []), { field_other: 'Solar power', value_other: 'Solar-powered apartments' }, { field_other: 'EV charging', value_other: 'EV charging stations' }, { field_other: 'Green certification', value_other: 'Green building certification (per brochure)' }]); continue }
        buckets.set('sustainability', [...(buckets.get('sustainability') || []), it]); continue
      }
      buckets.set(tk, [...(buckets.get(tk) || []), it])
    }
  }
  if (!log.length) { console.log(slug, 'nothing'); continue }
  const groups = [...ORDER.filter((k) => buckets.has(k)).map((k) => ({ key: k, label: LABEL[k], items: buckets.get(k)! })), ...rest]
  await p.update({ collection: 'projects', id: x.id, data: { unitFeatures: groups } as never, ...o })
  console.log(slug, '->', log.join(' ; '))
}
process.exit(0)
