/* eslint-disable @typescript-eslint/no-explicit-any -- one-off data script */
// 2026-10-16 (owner: "Kitchen space with a separate utility room / W/C on the ground floor... describe layout and room arrangements, they belong
// in Indoor Features, not Finishes"): layout and room-arrangement rows in Finishes move to Indoor Features; hot water rows to General Features.
//   DRY=1 NODE_ENV=production npx tsx scripts/retab-layout-rows.ts
import path from 'node:path'
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
const FIELD = /^(kitchen|bathrooms?|toilets?|pantry|living & dining|additional details|servant'?s toilet)$/i
const INDOOR = /kitchen space|separate kitchens?|kitchen with pantry|^(luxury |modern )?pantry|pantry and kitchen|open kitchen|provision for washing machine|domestic help|laundry area|private washroom|maids? room|en-suite|cozy lounge|dining nook|integrated dining|w\/c|utility room|\b\d (w\/c|toilets)/i
const GENERAL = /^hot water[^;]*$/i
const NOT_INDOOR = /granite|cupboard|cabinet|tile|counter|finish|fitting|sanitar|laminat|bidet|mixer|basin|geyser/i
const all = (await p.find({ collection: 'projects', limit: 500, pagination: false, ...o })).docs as any[]
let n = 0
for (const x of all) {
  const buckets = new Map<string, any[]>(); const rest: any[] = []; const log: string[] = []
  for (const g of x.unitFeatures || []) {
    const tk = tabOf(g)
    if (!tk) { rest.push({ ...g, id: undefined, items: (g.items || []).map(({ id, ...i }: any) => i) }); continue }
    for (const { id, ...it } of g.items || []) {
      const f = String(it.field || it.field_other || '').trim(); const v = String(it.value || it.value_other || '').trim()
      let to = tk
      if (tk === 'finishes' && FIELD.test(f)) {
        if ((GENERAL.test(v) && !/sanitar|tile/i.test(v)) || /hot water geyser/i.test(v)) to = 'general-features'
        else if (INDOOR.test(f + ' ' + v) && !NOT_INDOOR.test(v)) to = 'indoor'
        else if (/^en-suite|maids? room/i.test(v)) to = 'indoor'
      }
      if (to !== tk) log.push(`${LABEL[to]}: ${f}: ${v.slice(0, 55)}`)
      buckets.set(to, [...(buckets.get(to) || []), it])
    }
  }
  if (!log.length) continue
  n++; console.log(x.slug, '|', log.join(' ; ').slice(0, 330))
  if (DRY) continue
  const groups = [...ORDER.filter((k) => buckets.has(k)).map((k) => ({ key: k, label: LABEL[k], items: buckets.get(k)! })), ...rest]
  await p.update({ collection: 'projects', id: x.id, data: { unitFeatures: groups } as never, ...o })
}
console.log(DRY ? 'DRY' : 'WRITTEN', n)
process.exit(0)
