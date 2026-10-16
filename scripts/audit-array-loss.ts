/* eslint-disable @typescript-eslint/no-explicit-any */
// Compares the list rows in Payload (floor plans, gallery, amenities, nearby, key features, videos) with the Supabase copy the public
// site reads, per project, and prints every project where Payload has FEWER rows. Run after any bulk script or schema push:
//   NODE_ENV=production npx tsx scripts/audit-array-loss.ts
// Written after floor plans / galleries went missing on several projects on 2026-10-15 (see docs/data-loss-audit.md).
import path from 'node:path'
import { config } from 'dotenv'
config({ path: path.join(process.cwd(), '.env.local') })
const cfg = ((await import('../payload.config')) as any).default
const { getPayload } = await import('payload')
const { createClient } = await import('@supabase/supabase-js')
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
const p = await getPayload({ config: cfg })
const pool = (p.db as any).pool
const map: Record<string, string> = { projects_floor_plans: 'floorPlans', projects_gallery: 'gallery', projects_amenities: 'amenities', projects_nearby: 'nearby', projects_unit_features: 'unitFeatures', projects_videos: 'videos' }
const { data } = await sb.from('projects').select('slug, data')
const m = new Map((data ?? []).map((r: any) => [r.slug, r.data]))
const ids = (await pool.query('select id, slug from payload.projects')).rows
let bad = 0
for (const [t, key] of Object.entries(map)) {
  const cnt = new Map((await pool.query(`select _parent_id, count(*)::int n from payload.${t} group by 1`)).rows.map((r: any) => [r._parent_id, r.n]))
  for (const r of ids) {
    const d: any = m.get(r.slug); if (!d) continue
    const sn = Array.isArray(d[key]) ? d[key].length : 0, pn = Number(cnt.get(r.id) ?? 0)
    if (sn > pn) { bad++; console.log('LOSS?', r.id, r.slug, key, 'payload', pn, 'supabase copy', sn) }
  }
}
console.log(bad ? `${bad} possible losses` : 'No list rows missing in Payload.')
process.exit(0)
