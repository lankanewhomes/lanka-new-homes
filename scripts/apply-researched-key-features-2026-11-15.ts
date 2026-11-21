/* eslint-disable @typescript-eslint/no-explicit-any -- one-off script */
// Owner 2026-11-15: fill Key Features for published projects that had none, from specs the developers actually published (brochure spec pages / project pages),
// researched by KF_DIR/<slug>.json files ({slug, sources, categories:[{key,label,items:[{field,value}]}]}). Never overwrites existing Key Features.
// Held back: rush-court-4-mount-lavinia (values only from PropertyGuide, a third party) and mantra-kandy (brochure is for a different villa).
//   KF_DIR=<folder> NODE_ENV=production npx tsx scripts/apply-researched-key-features-2026-11-15.ts [--apply]
import fs from 'node:fs'
import path from 'node:path'
import { config as loadEnv } from 'dotenv'
loadEnv({ path: path.join(process.cwd(), '.env.local') })
const apply = process.argv.includes('--apply')
const dir = process.env.KF_DIR ?? ''
if (!dir) throw new Error('Set KF_DIR')
const HOLD = new Set(['rush-court-4-mount-lavinia', 'mantra-kandy'])
const cfg = ((await import('../payload.config')) as any).default
const { getPayload } = await import('payload')
const SO = (await import('../src/collections/shared-fields')) as any
const payload = await getPayload({ config: cfg })
const CAT: Record<string, string> = { interior: 'Interior', 'building-structure': 'Building & Structure', finishes: 'Finishes', 'building-services': 'Building Services', 'safety-security': 'Safety & Security', 'general-features': 'General Features', outdoor: 'Outdoor Features', utilities: 'Utilities & Services', sustainability: 'Sustainability' }
const cap = (t: string) => t.charAt(0).toUpperCase() + t.slice(1)
for (const f of fs.readdirSync(dir).filter((x) => x.endsWith('.json')).sort()) {
  const rec = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'))
  const items = (rec.categories ?? []).reduce((n: number, c: any) => n + (c.items?.length ?? 0), 0)
  if (!items) { console.log('skip (no specs)', rec.slug); continue }
  if (HOLD.has(rec.slug)) { console.log('HOLD', rec.slug); continue }
  const p: any = (await payload.find({ collection: 'projects', where: { slug: { equals: rec.slug } }, limit: 1, depth: 0, overrideAccess: true })).docs[0]
  if (!p) { console.log('MISSING', rec.slug); continue }
  if ((p.unitFeatures ?? []).some((g: any) => g.items?.length)) { console.log('already has key features', rec.slug); continue }
  const groups = (rec.categories as any[]).filter((c) => CAT[c.key] && c.items?.length).map((c) => ({
    key: c.key, label: CAT[c.key],
    items: c.items.map((i: any) => { const it: Record<string, any> = { value_other: cap(String(i.value).trim()) }; const fo = (SO.KEY_FEATURE_FIELD_OPTIONS as string[]).find((o) => o === i.field); if (fo) it.field = fo; else it.field_other = i.field; return it }),
  }))
  const links = (p.referenceLinks ?? []).map((l: any) => ({ label: l.label, url: l.url, note: l.note }))
  for (const s of rec.sources ?? []) if (/^https?:\/\//.test(s) && !links.some((l: any) => l.url === s)) links.push({ label: 'Key Features source', url: s, note: 'Specs read 2026-11-15. Re-check for updates.' })
  console.log(rec.slug, groups.map((g) => `${g.label}:${g.items.length}`).join(' '))
  if (apply) await payload.update({ collection: 'projects', id: p.id, data: { unitFeatures: groups, referenceLinks: links } as never, overrideAccess: true })
}
console.log(apply ? 'APPLIED' : 'DRY RUN')
process.exit(0)
