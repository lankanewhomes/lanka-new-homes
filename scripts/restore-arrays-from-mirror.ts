/* eslint-disable @typescript-eslint/no-explicit-any -- one-off restore */
// Restore (2026-10-22): put arrays that vanished from Payload back from the Supabase mirror backup (same method as the 2026-10-15 restore).
// Only arrays that are EMPTY in Payload and non-empty in the mirror are written. Run: node scripts via tsx with SLUGS=a,b,c
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { config as loadEnv } from 'dotenv'
loadEnv({ path: path.join(process.cwd(), '.env.local') })
const cfg = ((await import('../payload.config')) as any).default
const { getPayload } = await import('payload')
const payload = await getPayload({ config: cfg })
const dir = path.join(os.homedir(), 'Desktop/Stuff - LankaNewHomes/Backups')
const sb = new Map((JSON.parse(fs.readFileSync(path.join(dir, 'supabase-projects-2026-10-22.json'), 'utf8')) as any[]).map((r) => [r.slug, r.data]))
const KEYS = ['gallery', 'floorPlans', 'nearby', 'amenities', 'unitFeatures']
const stripIds = (v: any): any => (Array.isArray(v) ? v.map(stripIds) : v && typeof v === 'object' ? Object.fromEntries(Object.entries(v).filter(([k]) => k !== 'id').map(([k, x]) => [k, stripIds(x)])) : v)
for (const slug of (process.env.SLUGS ?? '').split(',').filter(Boolean)) {
  const mirror = sb.get(slug)
  const doc: any = (await payload.find({ collection: 'projects', where: { slug: { equals: slug } }, limit: 1, depth: 0, overrideAccess: true, draft: true })).docs[0]
  if (!mirror || !doc) { console.log('skip', slug); continue }
  const data: any = {}
  const force = (process.env.FORCE ?? '').split(',').filter(Boolean) // keys to rewrite even if Payload already has rows
  for (const k of KEYS) if ((force.includes(k) || !(doc[k]?.length)) && mirror[k]?.length) data[k] = stripIds(mirror[k])
  if (!Object.keys(data).length) { console.log('nothing to restore', slug); continue }
  for (let attempt = 0; attempt < 6; attempt++) {
    try { await payload.update({ collection: 'projects', id: doc.id, overrideAccess: true, data } as never); break } catch (e: any) {
      const errs = e?.data?.errors ?? []
      console.log('  validation', slug, JSON.stringify(errs).slice(0, 400))
      const bad = [...new Set(errs.map((x: any) => String(x.path ?? '').split('.')[0]).filter(Boolean))] as string[]
      if (!bad.length) throw e
      // Drop only the offending value inside the array (e.g. an invalid planType), not the whole array, when it is a floorPlans row.
      let fixed = false
      for (const x of errs) {
        const m = String(x.path ?? '').match(/^(\w+)\.(\d+)\.(\w+)/)
        if (m && Array.isArray(data[m[1]])) {
          const item = data[m[1]][Number(m[2])]
          const nested = String(x.path).match(/^(\w+)\.(\d+)\.items\.(\d+)\.(\w+)/)
          const target = nested ? data[nested[1]][Number(nested[2])].items[Number(nested[3])] : item
          const key = nested ? nested[4] : m[3]
          if (target[key] !== undefined) { target[`${key}_other`] = target[key]; delete target[key]; fixed = true }
        }
      }
      if (!fixed) for (const f of bad) delete data[f]
    }
  }
  const after: any = (await payload.find({ collection: 'projects', where: { slug: { equals: slug } }, limit: 1, depth: 0, overrideAccess: true, draft: true })).docs[0]
  console.log('restored', slug, JSON.stringify(Object.fromEntries(KEYS.map((k) => [k, `${doc[k]?.length ?? 0}->${after[k]?.length ?? 0}`]))))
}
process.exit(0)
