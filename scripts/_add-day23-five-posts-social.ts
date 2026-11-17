/* eslint-disable @typescript-eslint/no-explicit-any -- one-off script */
// Logs the 5 posts made 2026-11-17 (Day 23): Rush City map reel, Legado land map reel, The Reflection / Prime Kadawatha / The Regal carousels,
// each on Instagram, TikTok and the Facebook Page, as Social Posts rows. Social Posts only relate to projects, so the two lands carry no project (land in `details`).
// Facebook carousel permalinks could not be read from the Page feed, so they use the Page URL (same as earlier carousel rows); reels use their reel URLs.
// Safe to re-run: skips rows whose permalink (or Page URL + caption start) is already logged.
//   NODE_ENV=production npx tsx scripts/_add-day23-five-posts-social.ts
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { config as loadEnv } from 'dotenv'
loadEnv({ path: path.join(process.cwd(), '.env.local') })
const cfg = ((await import('../payload.config')) as any).default
const { getPayload } = await import('payload')
const { mirrorToR2 } = await import('../src/lib/listing-import/mirror')
const payload = await getPayload({ config: cfg })
const ROOT = path.join(os.homedir(), 'Desktop/Social Queue/Day 23 - 5 posts (preview)')
const FBPAGE = 'https://www.facebook.com/lankanewhomes'
const AT = new Date().toISOString()
type Item = { kind: 'reel' | 'carousel'; col: 'projects' | 'lands'; slug: string; dir: string; loc: string; ig: string; tt: string; fb?: string; fbId?: string; format: string }
const items: Item[] = [
  { kind: 'reel', col: 'projects', slug: 'rush-city-dematagoda', dir: '1 - Rush City map reel', loc: 'Colombo, Sri Lanka', ig: 'Df2LxVUI9ea', tt: '7709153677319228693', fbId: '2368199773931786', format: 'reel 32s, map minutes-from, one project reel' },
  { kind: 'reel', col: 'lands', slug: 'legado-homagama', dir: '3 - Legado land map reel', loc: 'Homagama, Sri Lanka', ig: 'Df2NN3codxz', tt: '7709156833121815829', fbId: '1990809904920725', format: 'reel 26s, map minutes-from, land reel' },
  { kind: 'carousel', col: 'projects', slug: 'the-reflection-samagi-mawatha-thalawathugoda', dir: '2 - The Reflection carousel', loc: 'Thalawathugoda, Sri Lanka', ig: 'Df2ORm6lceX', tt: '7709158599574031617', format: 'carousel 6 slides' },
  { kind: 'carousel', col: 'projects', slug: 'prime-kadawatha', dir: '4 - Prime Kadawatha carousel', loc: 'Kadawatha, Sri Lanka', ig: 'Df2PGlDFfu5', tt: '7709160465141681429', format: 'carousel 9 slides' },
  { kind: 'carousel', col: 'lands', slug: 'the-regal-ratmalana', dir: '5 - The Regal land carousel', loc: 'Ratmalana, Sri Lanka', ig: 'Df2PmUTFXzz', tt: '7709161619007360277', format: 'carousel 9 slides' },
]
for (const it of items) {
  const rec = (await payload.find({ collection: it.col, where: { slug: { equals: it.slug } }, limit: 1, depth: 0, overrideAccess: true } as any)).docs[0] as any
  if (!rec) throw new Error(`${it.col} ${it.slug} missing`)
  const D = path.join(ROOT, it.dir)
  const caption = fs.readFileSync(path.join(D, 'caption.txt'), 'utf8').trim()
  const fbCaption = fs.readFileSync(path.join(D, 'caption-fb.txt'), 'utf8').trim()
  const base = `${it.col}/${it.slug}/social/${it.slug}_day23`
  let mediaUrl: string, thumb: string, images: string[] | undefined
  if (it.kind === 'reel') {
    mediaUrl = await mirrorToR2(`${base}_reel-map-minutes-from.mp4`, fs.readFileSync(path.join(D, 'reel.mp4')), 'video/mp4')
    thumb = await mirrorToR2(`${base}_reel-cover.png`, fs.readFileSync(path.join(D, 'cover.png')), 'image/png')
  } else {
    const slides = fs.readdirSync(D).filter((f) => /^slide-\d+\.png$/.test(f)).sort()
    images = []
    for (const s of slides) images.push(await mirrorToR2(`${base}_carousel-${s}`, fs.readFileSync(path.join(D, s)), 'image/png'))
    mediaUrl = images[0]; thumb = images[0]
  }
  const rel = it.col === 'projects' ? { project: rec.id } : {}
  const details: any = { format: it.format, location: it.loc, cover: it.kind === 'reel' ? thumb : undefined, images, ...(it.col === 'lands' ? { landSlug: it.slug, landId: rec.id, listingType: 'land' } : {}) }
  const rows = [
    { platform: 'instagram', externalId: it.ig, permalink: `https://www.instagram.com/lankanewhomes/${it.kind === 'reel' ? 'reel' : 'p'}/${it.ig}/`, caption },
    { platform: 'tiktok', externalId: it.tt, permalink: `https://www.tiktok.com/@lankanewhomes/video/${it.tt}`, caption },
    { platform: 'facebook', externalId: it.fbId ?? '', permalink: it.fbId ? `https://www.facebook.com/reel/${it.fbId}` : FBPAGE, caption: fbCaption },
  ]
  for (const r of rows) {
    const ex = r.permalink === FBPAGE
      ? await payload.find({ collection: 'social-posts', where: { and: [{ platform: { equals: 'facebook' } }, { permalink: { equals: FBPAGE } }, { caption: { equals: r.caption } }] }, limit: 1, depth: 0, overrideAccess: true } as any)
      : await payload.find({ collection: 'social-posts', where: { permalink: { equals: r.permalink } }, limit: 1, depth: 0, overrideAccess: true })
    if (ex.docs.length) { console.log(it.slug, r.platform, 'already logged', ex.docs[0].id); continue }
    const doc = await payload.create({ collection: 'social-posts', overrideAccess: true, data: { ...rel, kind: it.kind, status: 'published', source: 'manual', matchedBy: 'link', triggeredBy: 'manual', mediaUrl, thumbnailUrl: thumb, postedAt: AT, details, ...r } as any })
    console.log('created', it.slug, r.platform, doc.id)
  }
}
process.exit(0)
