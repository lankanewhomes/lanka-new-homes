// Adds researched photos to existing neighbourhood pages (NBHD2_DIR/<slug>.json: photos[], drop[]). Photos are copied
// to R2 under neighborhoods/<slug>/ (never hot-linked); a `drop` entry removes a gallery photo whose source page/url
// contains that file name. The hero is only replaced when the JSON has a `hero`.
//   NBHD2_DIR=<dir> NODE_ENV=production npx tsx scripts/add-neighborhood-photos.ts meepe,bandaragama
import fs from 'node:fs'
import path from 'node:path'
import { config as loadEnv } from 'dotenv'
import type payloadConfigType from '../payload.config'

loadEnv({ path: path.join(process.cwd(), '.env.local') })
const dir = process.env.NBHD2_DIR ?? ''
const slugs = (process.argv[2] ?? '').split(',').filter(Boolean)
if (!dir || !slugs.length) throw new Error('Set NBHD2_DIR and pass slugs')
const payloadConfig = ((await import('../payload.config')) as { default: typeof payloadConfigType }).default
const { getPayload } = await import('payload')
const { mirrorToR2, fetchWithLimit, isMirrorConfigured } = await import('../src/lib/listing-import/mirror')
if (!isMirrorConfigured()) throw new Error('R2 env not configured')
const payload = await getPayload({ config: payloadConfig })

type Photo = { url: string; pageUrl: string; credit: string; caption: string; landmark: string | null }
const EXT: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' }
const kebab = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 48)
const fileOf = (u: string) => decodeURIComponent(u.split('/').pop()!.split('?')[0])

for (const slug of slugs) {
  const j = JSON.parse(fs.readFileSync(path.join(dir, `${slug}.json`), 'utf8')) as { photos: Photo[]; drop?: string[] }
  const f = await payload.find({ collection: 'neighborhoods', where: { slug: { equals: slug } }, limit: 1, depth: 0, overrideAccess: true })
  const doc = f.docs[0] as unknown as { id: number; gallery?: Record<string, unknown>[]; nearby?: Record<string, unknown>[] } | undefined
  if (!doc) { console.log('no page', slug); continue }
  let gallery = (doc.gallery ?? []).map(({ id: _id, ...rest }) => { void _id; return rest })
  const dropNames = (j.drop ?? []).map(fileOf)
  const before = gallery.length
  gallery = gallery.filter((g) => !dropNames.some((n) => String(g.sourceUrl ?? '').includes(n) || String(g.url ?? '').includes(n)))
  const have = new Set(gallery.map((g) => String(g.sourceUrl ?? '')))
  let added = 0
  for (const [i, p] of j.photos.entries()) {
    if (have.has(p.pageUrl)) continue
    try {
      const { body, contentType } = await fetchWithLimit(p.url.replace(/width=\d+/, 'width=1600'), { timeoutMs: 40000, maxBytes: 20 * 1024 * 1024, accept: 'image/*' })
      const ct = contentType.split(';')[0]
      const ext = EXT[ct]
      if (!ext) throw new Error(`unsupported type ${ct}`)
      const url = await mirrorToR2(`neighborhoods/${slug}/${slug}_extra-${gallery.length + 1}_${kebab(p.landmark || p.caption || 'photo')}.${ext}`, body, ct)
      gallery.push({ url, caption: p.caption, credit: p.credit, sourceUrl: p.pageUrl, ...(p.landmark ? { landmark: p.landmark } : {}) })
      added++
    } catch (e) {
      console.log('  photo failed', slug, i, e instanceof Error ? e.message : e)
    }
  }
  await payload.update({ collection: 'neighborhoods', id: doc.id, data: { gallery } as never, overrideAccess: true })
  console.log(slug, `dropped ${before - (gallery.length - added)}, added ${added}, total ${gallery.length}`)
}
process.exit(0)
