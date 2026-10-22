/* eslint-disable @typescript-eslint/no-explicit-any -- one-off audit */
// Audit (2026-10-22): compare array counts per project/land between Payload (source of truth) and the Supabase mirror; save both as backups.
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { config as loadEnv } from 'dotenv'
loadEnv({ path: path.join(process.cwd(), '.env.local') })
const cfg = ((await import('../payload.config')) as any).default
const { getPayload } = await import('payload')
const { supabaseAdmin } = await import('../src/lib/supabase')
const payload = await getPayload({ config: cfg })
const dir = path.join(os.homedir(), 'Desktop/Stuff - LankaNewHomes/Backups')
const out: any = {}
for (const [coll, table] of [['projects', 'projects'], ['lands', 'lands']] as const) {
  const sb = (await supabaseAdmin.from(table).select('slug, data').limit(2000)).data as any[]
  fs.writeFileSync(path.join(dir, `supabase-${table}-2026-10-22.json`), JSON.stringify(sb))
  const docs = (await payload.find({ collection: coll, limit: 2000, depth: 0, overrideAccess: true, pagination: false, draft: true })).docs as any[]
  fs.writeFileSync(path.join(dir, `payload-${table}-2026-10-22.json`), JSON.stringify(docs))
  const keys = coll === 'projects' ? ['gallery', 'floorPlans', 'nearby', 'amenities', 'unitFeatures'] : ['gallery', 'plots', 'nearby', 'blockPlanImages']
  const sbBy = new Map(sb.map((r) => [r.slug, r.data]))
  out[coll] = []
  for (const d of docs) {
    const s = sbBy.get(d.slug)
    if (!s) continue
    const diffs: any = {}
    for (const k of keys) { const a = d[k]?.length ?? 0, b = s[k]?.length ?? 0; if (a !== b) diffs[k] = { payload: a, supabase: b } }
    if (Object.keys(diffs).length) out[coll].push({ slug: d.slug, diffs })
  }
}
fs.writeFileSync(path.join(os.homedir(), 'Desktop/Stuff - LankaNewHomes/Backups/array-diff-2026-10-22.json'), JSON.stringify(out, null, 1))
for (const c of ['projects', 'lands']) { console.log('==', c, out[c].length, 'differ'); for (const r of out[c]) console.log(r.slug, JSON.stringify(r.diffs)) }
process.exit(0)
