// Adds researched, sourced awards/certifications to developers' Awards tab (AWARDS_DIR/<slug>.json, each item has
// the page it was read on as `url`). Merges with what's already there (skips an existing title), never deletes.
//   AWARDS_DIR=<dir> NODE_ENV=production npx tsx scripts/import-developer-awards.ts [--dry]
import fs from 'node:fs'
import path from 'node:path'
import { config as loadEnv } from 'dotenv'
import type payloadConfigType from '../payload.config'

loadEnv({ path: path.join(process.cwd(), '.env.local') })
const dir = process.env.AWARDS_DIR ?? ''
if (!dir) throw new Error('Set AWARDS_DIR')
const dry = process.argv.includes('--dry')
const payloadConfig = ((await import('../payload.config')) as { default: typeof payloadConfigType }).default
const { getPayload } = await import('payload')
const payload = await getPayload({ config: payloadConfig })

type Award = { title: string; issuer?: string | null; year?: string | null; description?: string | null; url?: string | null }
const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()

for (const file of fs.readdirSync(dir).filter((f) => f.endsWith('.json'))) {
  const j = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8')) as { slug: string; awards: Award[] }
  if (!j.awards?.length) { console.log(j.slug, 'nothing to add'); continue }
  const f = await payload.find({ collection: 'developers', where: { slug: { equals: j.slug } }, limit: 1, depth: 0, overrideAccess: true })
  const d = f.docs[0] as unknown as { id: number; awards?: (Award & { id?: string })[] } | undefined
  if (!d) { console.log('no developer', j.slug); continue }
  const have = d.awards ?? []
  const keys = new Set(have.map((a) => `${norm(a.title)}|${a.year ?? ''}`))
  const fresh = j.awards.filter((a) => a.title && !keys.has(`${norm(a.title)}|${a.year ?? ''}`))
  console.log(j.slug, `existing ${have.length}, new ${fresh.length}`, fresh.length < j.awards.length ? `(skipped ${j.awards.length - fresh.length} duplicates)` : '')
  if (!fresh.length || dry) continue
  const clean = (a: Award) => ({ title: a.title, ...(a.issuer ? { issuer: a.issuer } : {}), ...(a.year ? { year: String(a.year) } : {}), ...(a.description ? { description: a.description } : {}), ...(a.url ? { url: a.url } : {}) })
  await payload.update({
    collection: 'developers',
    id: d.id,
    data: { awards: [...have.map(({ id: _id, ...rest }) => { void _id; return clean(rest) }), ...fresh.map(clean)] } as never,
    overrideAccess: true,
  })
}
process.exit(0)
