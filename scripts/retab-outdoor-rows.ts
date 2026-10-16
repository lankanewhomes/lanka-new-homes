/* eslint-disable @typescript-eslint/no-explicit-any -- one-off data script */
// 2026-10-16 (owner: "Finishes > Bathroom: provision for a jacuzzi on the balcony belongs under Outdoor Features, check other listings"):
// outdoor rows sitting in other tabs move to Outdoor Features; shared roof garden / BBQ / pool rows go to Amenities.
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
const all = (await p.find({ collection: 'projects', limit: 500, pagination: false, ...o })).docs as any[]
for (const x of all) {
  const amen: any[] = (x.amenities || []).map(({ id, ...a }: any) => a)
  const addAmenity = (name: string, description: string) => { const ex = amen.find((a) => a.name === name); if (ex) { if (!ex.description) ex.description = description } else amen.push({ name, description }) }
  const buckets = new Map<string, any[]>(); const rest: any[] = []; const log: string[] = []
  for (const g of x.unitFeatures || []) {
    const tk = tabOf(g)
    if (!tk) { rest.push({ ...g, id: undefined, items: (g.items || []).map(({ id, ...i }: any) => i) }); continue }
    for (const { id, ...it } of g.items || []) {
      const f = String(it.field || it.field_other || '').toLowerCase().trim(); const v = String(it.value || it.value_other || '')
      let to = tk
      if (tk !== 'outdoor' && tk !== 'recreation-wellness') {
        if (/jacuzzi|plunge pool/i.test(v) && /balcon|terrace|provision|largest apartments/i.test(v)) to = 'outdoor'
        else if (f === 'outdoor' && v) to = 'outdoor'
        else if (f === 'additional spaces' && /^(covered terrace|kitchen yard)/i.test(v)) to = 'outdoor'
        else if (tk === 'general-features' && /roof ?top garden/i.test(v) && !/sump|tank/i.test(v)) { addAmenity('Rooftop', 'Roof top garden'); if (/b\.?b\.?q/i.test(v)) addAmenity('BBQ Area', 'Open area for B.B.Q, reception and party facilities'); if (/kids play/i.test(v)) addAmenity("Children's Area", 'Kids play area and outdoor play area with net covering'); log.push('amenity: ' + v.slice(0, 50)); continue }
        else if (tk === 'general-features' && /^swimming pool and kids pool/i.test(v)) { addAmenity('Pool', 'Swimming pool'); addAmenity('Kids Pool', 'Kids pool'); log.push('amenity: pool'); continue }
      }
      if (to !== tk) log.push(`${LABEL[tk]} -> ${LABEL[to]}: ${v.slice(0, 50)}`)
      buckets.set(to, [...(buckets.get(to) || []), it])
    }
  }
  if (!log.length) continue
  const groups = [...ORDER.filter((k) => buckets.has(k)).map((k) => ({ key: k, label: LABEL[k], items: buckets.get(k)! })), ...rest]
  await p.update({ collection: 'projects', id: x.id, data: { unitFeatures: groups, amenities: amen } as never, ...o })
  console.log(x.slug, '|', log.join(' ; '))
}
process.exit(0)
