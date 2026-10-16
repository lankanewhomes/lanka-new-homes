/* eslint-disable @typescript-eslint/no-explicit-any */
// Neighbourhood pages: Meegoda, Hadeniya, Gattuwana, Kiriwaththuduwa, Halthota (+ nearby fixes for Meepe, Bandaragama). 16 Oct 2026.
import fs from 'node:fs'
import path from 'node:path'
import { config as loadEnv } from 'dotenv'
loadEnv({ path: path.join(process.cwd(), '.env.local') })
const S = '/private/tmp/claude-501/-Users-rupansinnarajah-Desktop-lankanewhomes/e4990c10-5391-4fb0-8f5a-3a7fe8004abd/scratchpad'
const cfg = ((await import('../payload.config')) as any).default
const { getPayload } = await import('payload')
const { mirrorToR2 } = await import('../src/lib/listing-import/mirror')
const sharp = (await import('sharp')).default
const payload = await getPayload({ config: cfg })
const find = async (slug: string) => ((await payload.find({ collection: 'neighborhoods', where: { slug: { equals: slug } }, limit: 1, overrideAccess: true, depth: 0 })).docs[0] as any)
const W = 'via Wikimedia Commons'
const wc = (f: string) => 'https://commons.wikimedia.org/wiki/File:' + f.replace(/ /g, '_')
type P = { src: string; file: string; key: string; caption: string; landmark: string; artist: string; lic: string }
const photo = (src: string, file: string, key: string, caption: string, landmark: string, artist: string, lic: string): P => ({ src, file, key, caption, landmark, artist, lic })
const credit = (p: { artist: string; lic: string }) => `Photo: ${p.artist}, ${p.lic === 'Public domain' ? 'public domain' : p.lic} ${W}`

async function addPhotos(slug: string, photos: P[], nearbyExtra: any[], extra: Record<string, any> = {}, heroIdx = 0) {
  const doc = await find(slug)
  const gallery: any[] = [...(doc.gallery ?? [])]
  const have = new Set(gallery.map((g) => g.sourceUrl))
  let heroSet = !!doc.heroImage
  const data: any = { ...extra }
  let k = gallery.length
  for (let i = 0; i < photos.length; i++) {
    const p = photos[i]
    if (have.has(wc(p.file))) continue
    const buf = await sharp(fs.readFileSync(path.join(S, p.src))).rotate().resize({ width: 2000, height: 2000, fit: 'inside', withoutEnlargement: true }).jpeg({ quality: 84 }).toBuffer()
    const url = await mirrorToR2(`neighborhoods/${slug}/${slug}_${p.key}.jpg`, buf, 'image/jpeg')
    gallery.push({ url, caption: p.caption, credit: credit(p), sourceUrl: wc(p.file), landmark: p.landmark })
    if (!heroSet && i === heroIdx) { data.heroImage = url; data.heroImageCredit = credit(p); data.heroImageSourceUrl = wc(p.file); heroSet = true }
    k++
  }
  const nearby: any[] = [...(doc.nearby ?? [])]
  for (const n of nearbyExtra) if (!nearby.some((x) => x.name === n.name)) nearby.push(n)
  for (const g of gallery) if (g.landmark && !nearby.some((x) => x.name === g.landmark)) throw new Error(slug + ' missing nearby ' + g.landmark)
  data.gallery = gallery
  data.nearby = nearby
  await payload.update({ collection: 'neighborhoods', id: doc.id, data, overrideAccess: true, depth: 0 })
  console.log(slug, 'gallery', gallery.length, 'nearby', nearby.length)
}
const L = (name: string, lat?: number, lng?: number) => ({ category: 'Landmark', name, lat, lng })

await addPhotos('kiriwaththuduwa', [
  photo('m/14.jpg', 'Kottawa Town, Pannipitiya, Sri Lanka - panoramio (5).jpg', 'kottawa-bank', 'Banks and shops along the main road in Kottawa town', 'Kottawa', 'Daibo Taku', 'CC BY 3.0'),
], [])
process.exit(0)
