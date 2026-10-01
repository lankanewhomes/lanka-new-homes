// Creates neighbourhood pages from researched JSON files (one per area), for the
// areas the Gangani Land Sales lands link to. Each JSON was produced by a research
// pass (facts + licence-checked photo candidates) and visually verified before this
// runs. Photos are copied into R2 under neighborhoods/<slug>/ — never hot-linked.
//
//   NBHD_DIR=<dir with <slug>.json files> NODE_ENV=production npx tsx scripts/create-gangani-neighborhoods.ts aluthgama,kaduwela
//
// Idempotent: skips a slug that already has a neighbourhood row.
import fs from 'node:fs'
import path from 'node:path'
import { config as loadEnv } from 'dotenv'
import type payloadConfigType from '../payload.config'

loadEnv({ path: path.join(process.cwd(), '.env.local') })
const dir = process.env.NBHD_DIR ?? ''
if (!dir) throw new Error('Set NBHD_DIR')
const slugs = (process.argv[2] ?? '').split(',').filter(Boolean)
// Owner-approved override for areas where verified openly-licensed photos are scarce.
const MIN_PHOTOS = Number(process.env.MIN_PHOTOS ?? 5)
if (!slugs.length) throw new Error('Pass comma-separated slugs')

const payloadConfig = ((await import('../payload.config')) as { default: typeof payloadConfigType }).default
const { getPayload } = await import('payload')
const { mirrorToR2, fetchWithLimit, isMirrorConfigured } = await import('../src/lib/listing-import/mirror')
if (!isMirrorConfigured()) throw new Error('R2 env not configured')
const payload = await getPayload({ config: payloadConfig })

type Photo = { url: string; pageUrl: string; credit: string; caption: string; landmark: string | null }
type Nearby = { category: string; name: string; distanceKm?: number | null; lat?: number | null; lng?: number | null }

const CATEGORY: Record<string, string> = {
  Access: 'Access', Road: 'Road', School: 'School', Education: 'School', Hospital: 'Hospital', Health: 'Hospital',
  Shopping: 'Shopping', Restaurant: 'Restaurant', Business: 'Business', Transport: 'Transport', Landmark: 'Landmark',
}
const kebab = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 48)
const EXT: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' }

async function mirrorPhoto(slug: string, label: string, p: Photo): Promise<string> {
  const { body, contentType } = await fetchWithLimit(p.url, { timeoutMs: 40000, maxBytes: 20 * 1024 * 1024, accept: 'image/*' })
  const ext = EXT[contentType.split(';')[0]]
  if (!ext) throw new Error(`unsupported type ${contentType} for ${p.url}`)
  const key = `neighborhoods/${slug}/${slug}_${label}_${kebab(p.landmark || p.caption || 'photo')}.${ext}`
  return mirrorToR2(key, body, contentType.split(';')[0])
}

for (const slug of slugs) {
  const file = path.join(dir, `${slug}.json`)
  if (!fs.existsSync(file)) { console.log('MISSING json', slug); continue }
  const d = JSON.parse(fs.readFileSync(file, 'utf8')) as Record<string, unknown> & { hero?: Photo; photos?: Photo[]; nearby?: Nearby[]; name: string; city: string; province: string; district: string; population?: string | null; approxLocation?: string | null; nearbyAreas?: string[]; latitude: number; longitude: number; mapRadiusKm: number; description: string; highlights?: string[]; faqs?: unknown[]; sources?: unknown[] }
  const exists = await payload.find({ collection: 'neighborhoods', where: { slug: { equals: slug } }, limit: 1, overrideAccess: true })
  if (exists.docs[0]) { console.log('exists', slug); continue }

  const all: Photo[] = [d.hero, ...(d.photos ?? [])].filter((p): p is Photo => Boolean(p))
  if (all.length < MIN_PHOTOS) { console.log('SKIP (<MIN_PHOTOS photos)', slug, all.length); continue }

  const gallery: Record<string, unknown>[] = []
  let heroUrl = ''
  for (let i = 0; i < all.length; i++) {
    const p = all[i]
    try {
      const url = await mirrorPhoto(slug, i === 0 ? 'hero' : `photo-${i}`, p)
      if (i === 0) heroUrl = url
      gallery.push({ url, caption: p.caption, credit: p.credit, sourceUrl: p.pageUrl, ...(p.landmark ? { landmark: p.landmark } : {}) })
    } catch (e) {
      console.log('  photo failed', slug, i, e instanceof Error ? e.message : e)
    }
  }
  if (gallery.length < MIN_PHOTOS || (MIN_PHOTOS > 0 && !heroUrl)) { console.log('SKIP (not enough photos mirrored)', slug, gallery.length); continue }

  const nearby: Nearby[] = (d.nearby ?? []).map((n: Nearby) => ({ ...n, category: CATEGORY[n.category] ?? 'Landmark' }))
  // A photo's `landmark` must match a Nearby place name exactly to show under Known Landmarks.
  for (const g of gallery) {
    const lm = g.landmark as string | undefined
    if (lm && !nearby.some((n) => n.name === lm)) nearby.push({ category: 'Landmark', name: lm })
  }

  const created = await payload.create({
    collection: 'neighborhoods',
    data: {
      slug,
      name: d.name,
      city: d.city,
      province: d.province,
      district: d.district,
      population: d.population ?? undefined,
      approxLocation: d.approxLocation ?? undefined,
      nearbyAreas: d.nearbyAreas ?? [],
      latitude: d.latitude,
      longitude: d.longitude,
      mapRadiusKm: d.mapRadiusKm,
      description: d.description,
      highlights: d.highlights ?? [],
      faqs: d.faqs ?? [],
      sources: d.sources ?? [],
      ...(heroUrl ? { heroImage: heroUrl, heroImageCredit: all[0].credit, heroImageSourceUrl: all[0].pageUrl } : {}),
      gallery,
      nearby,
    } as never,
    overrideAccess: true,
  })
  console.log('created', created.slug, `${gallery.length} photos`, `${nearby.length} nearby`)
}
process.exit(0)
