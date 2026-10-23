/* eslint-disable @typescript-eslint/no-explicit-any -- one-off restore */
// Key Features of Lakefront Residencies and Ocean Breeze Hikkaduwa vanished from Payload (found 2026-10-23). The last backup that holds them is
// key-features-before-retab-2026-10-16.json (state right before the 16 Oct tab re-sort); put those groups back, then the retab scripts re-sort them.
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { config as loadEnv } from 'dotenv'
loadEnv({ path: path.join(process.cwd(), '.env.local') })
const cfg = ((await import('../payload.config')) as any).default
const { getPayload } = await import('payload')
const payload = await getPayload({ config: cfg })
const snap = JSON.parse(fs.readFileSync(path.join(os.homedir(), 'Desktop/Stuff - LankaNewHomes/Backups/key-features-before-retab-2026-10-16.json'), 'utf8')) as any[]
const strip = (v: any): any => (Array.isArray(v) ? v.map(strip) : v && typeof v === 'object' ? Object.fromEntries(Object.entries(v).filter(([k]) => k !== 'id').map(([k, x]) => [k, strip(x)])) : v)
for (const slug of (process.env.SLUGS ?? '').split(',').filter(Boolean)) {
  const row = snap.find((x) => x.slug === slug && (x.coll ?? 'projects') === 'projects')
  const doc: any = (await payload.find({ collection: 'projects', where: { slug: { equals: slug } }, limit: 1, depth: 0, overrideAccess: true, draft: true })).docs[0]
  if (!row?.unitFeatures?.length) { console.log('no snapshot rows', slug); continue }
  if (doc.unitFeatures?.length) { console.log('already has', slug, doc.unitFeatures.length); continue }
  await payload.update({ collection: 'projects', id: doc.id, overrideAccess: true, data: { unitFeatures: strip(row.unitFeatures) } as never })
  const a: any = (await payload.find({ collection: 'projects', where: { slug: { equals: slug } }, limit: 1, depth: 0, overrideAccess: true, draft: true })).docs[0]
  console.log('restored', slug, 'groups', a.unitFeatures?.length, JSON.stringify(a.unitFeatures.map((g: any) => `${g.label ?? g.key_other ?? g.key}:${g.items?.length}`)))
}
process.exit(0)
