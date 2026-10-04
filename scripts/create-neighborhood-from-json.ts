/* eslint-disable @typescript-eslint/no-explicit-any -- one-off script over researched JSON */
// Creates a neighbourhood page from a researched JSON (scratchpad/nbhd/<slug>.json: hero + photos with localFile,
// credit, caption, landmark). Uploads the photos to R2 (neighborhoods/<slug>/…), then creates the record.
//   NBHD_DIR=<scratchpad/nbhd> NODE_ENV=production npx tsx scripts/create-neighborhood-from-json.ts <slug>
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { config as loadEnv } from 'dotenv'
loadEnv({ path: path.join(process.cwd(), '.env.local') })
const dir = process.env.NBHD_DIR ?? ''
const slug = process.argv[2]
if (!dir || !slug) throw new Error('Usage: NBHD_DIR=… npx tsx scripts/create-neighborhood-from-json.ts <slug>')
const cfg = ((await import('../payload.config')) as any).default
const { getPayload } = await import('payload')
const { mirrorToR2 } = await import('../src/lib/listing-import/mirror')
const payload = await getPayload({ config: cfg })

const rec = JSON.parse(fs.readFileSync(path.join(dir, `${slug}.json`), 'utf8'))
const exists = await payload.find({ collection: 'neighborhoods', where: { slug: { equals: slug } }, limit: 1, overrideAccess: true })
if (exists.docs[0]) { console.log('exists', slug); process.exit(0) }

const kebab = (s: string) => String(s ?? '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40) || 'photo'
async function upload(file: string, key: string): Promise<string> {
  const ext = path.extname(file).slice(1).toLowerCase() || 'jpg'
  let body = fs.readFileSync(file)
  if (body.length > 4 * 1024 * 1024 && (ext === 'jpg' || ext === 'jpeg')) {
    const tmp = path.join(os.tmpdir(), `nb-${path.basename(key)}`)
    execFileSync('sips', ['-Z', '2400', '-s', 'format', 'jpeg', '-s', 'formatOptions', '85', file, '--out', tmp], { stdio: 'ignore' })
    body = fs.readFileSync(tmp)
  }
  return mirrorToR2(key, body, ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg')
}

const hero = rec.hero
const heroUrl = await upload(hero.localFile, `neighborhoods/${slug}/${slug}_hero_${kebab(hero.landmark || hero.caption)}.jpg`)
const gallery: any[] = []
let n = 0
for (const ph of rec.photos ?? []) {
  n++
  if (!ph.localFile || !fs.existsSync(ph.localFile)) { console.log('  missing photo file', ph.localFile); continue }
  const url = await upload(ph.localFile, `neighborhoods/${slug}/${slug}_photo-${n}_${kebab(ph.landmark || ph.caption)}.jpg`)
  gallery.push({ url, caption: ph.caption, credit: ph.credit, sourceUrl: ph.pageUrl, landmark: ph.landmark ?? undefined })
}
const created = await payload.create({
  collection: 'neighborhoods',
  data: {
    slug, name: rec.name, city: rec.city, province: rec.province, district: rec.district,
    ...(rec.population ? { population: rec.population } : {}), approxLocation: rec.approxLocation, nearbyAreas: rec.nearbyAreas,
    latitude: rec.latitude, longitude: rec.longitude, mapRadiusKm: rec.mapRadiusKm,
    description: rec.description, highlights: rec.highlights, faqs: rec.faqs, sources: rec.sources,
    heroImage: heroUrl, heroImageCredit: hero.credit, heroImageSourceUrl: hero.pageUrl,
    gallery,
    ...(Array.isArray(rec.nearby) && rec.nearby.length ? { nearby: rec.nearby.map((x: any) => ({ category: x.category, name: x.name, distanceKm: x.distanceKm ?? undefined, lat: x.lat, lng: x.lng })) } : {}),
  } as never,
  overrideAccess: true,
})
console.log('created neighbourhood', created.slug, 'photos', gallery.length)
process.exit(0)
