/* eslint-disable @typescript-eslint/no-explicit-any -- one-off script */
// Logs the 3 posts made 2026-11-18 (Day 24): Havelock Signature Bomb Drop reel, Blue Ocean Waves Quick Quiz reel, The Highway (Kottawa) land carousel,
// each on Instagram, TikTok and the Facebook Page, as Social Posts rows. The land carries no project (land in `details`).
// Facebook carousel permalink could not be read from the Page feed, so it uses the Page URL (same as earlier carousel rows); reels use their reel URLs.
// Safe to re-run: skips rows whose permalink (or Page URL + caption) is already logged.
//   NODE_ENV=production npx tsx scripts/_add-day24-three-posts-social.ts
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { config as loadEnv } from 'dotenv'
loadEnv({ path: path.join(process.cwd(), '.env.local') })
const cfg = ((await import('../payload.config')) as any).default
const { getPayload } = await import('payload')
const { mirrorToR2 } = await import('../src/lib/listing-import/mirror')
const payload = await getPayload({ config: cfg })
const ROOT = path.join(os.homedir(), 'Desktop/Social Queue/Day 24 - 2 reels + carousel (preview)')
const FBPAGE = 'https://www.facebook.com/lankanewhomes'
const AT = new Date().toISOString()
type Item = { kind: 'reel' | 'carousel'; col: 'projects' | 'lands'; id: number; dir: string; loc: string; ig: string; igPath: 'reel' | 'p'; tt: string; fbId?: string; format: string; tag: string }
const items: Item[] = [
  { kind: 'reel', col: 'projects', id: 160, dir: '1 - Havelock Signature Bomb Drop reel', loc: 'Colombo, Sri Lanka', ig: 'Df43P4JoZZb', igPath: 'reel', tt: '7709539728940338453', fbId: '933726793027417', format: 'reel 16s, bomb drop, full-screen project reel', tag: 'reel-bomb-drop' },
  { kind: 'reel', col: 'projects', id: 154, dir: '2 - Blue Ocean Waves Quick Quiz reel', loc: 'Colombo, Sri Lanka', ig: 'Df44L_DI6VI', igPath: 'reel', tt: '7709541539319696660', fbId: '1052748061169707', format: 'reel 19s, quick quiz, project reel', tag: 'reel-quick-quiz' },
  { kind: 'carousel', col: 'lands', id: 14, dir: '3 - The Highway land carousel', loc: 'Kottawa, Sri Lanka', ig: 'Df45E6lkUoX', igPath: 'p', tt: '7709543345365716245', format: 'carousel 9 slides', tag: 'carousel' },
]
for (const it of items) {
  const rec = (await payload.findByID({ collection: it.col, id: it.id, depth: 0, overrideAccess: true } as any)) as any
  if (!rec) throw new Error(`${it.col} ${it.id} missing`)
  const slug = rec.slug as string
  const D = path.join(ROOT, it.dir)
  const caption = fs.readFileSync(path.join(D, 'caption.txt'), 'utf8').trim()
  const fbCaption = fs.readFileSync(path.join(D, 'caption-fb.txt'), 'utf8').trim()
  const base = `${it.col}/${slug}/social/${slug}_day24`
  let mediaUrl: string, thumb: string, images: string[] | undefined
  if (it.kind === 'reel') {
    mediaUrl = await mirrorToR2(`${base}_${it.tag}.mp4`, fs.readFileSync(path.join(D, 'reel.mp4')), 'video/mp4')
    thumb = await mirrorToR2(`${base}_reel-cover.png`, fs.readFileSync(path.join(D, 'cover.png')), 'image/png')
  } else {
    const slides = fs.readdirSync(D).filter((f) => /^slide-\d+\.png$/.test(f)).sort()
    images = []
    for (const s of slides) images.push(await mirrorToR2(`${base}_carousel-${s}`, fs.readFileSync(path.join(D, s)), 'image/png'))
    mediaUrl = images[0]; thumb = images[0]
  }
  const rel = it.col === 'projects' ? { project: rec.id } : {}
  const details: any = { format: it.format, location: it.loc, cover: it.kind === 'reel' ? thumb : undefined, images, ...(it.col === 'lands' ? { landSlug: slug, landId: rec.id, listingType: 'land' } : {}) }
  const rows = [
    { platform: 'instagram', externalId: it.ig, permalink: `https://www.instagram.com/lankanewhomes/${it.igPath}/${it.ig}/`, caption },
    { platform: 'tiktok', externalId: it.tt, permalink: `https://www.tiktok.com/@lankanewhomes/video/${it.tt}`, caption },
    { platform: 'facebook', externalId: it.fbId ?? '', permalink: it.fbId ? `https://www.facebook.com/reel/${it.fbId}` : FBPAGE, caption: fbCaption },
  ]
  for (const r of rows) {
    const ex = r.permalink === FBPAGE
      ? await payload.find({ collection: 'social-posts', where: { and: [{ platform: { equals: 'facebook' } }, { permalink: { equals: FBPAGE } }, { caption: { equals: r.caption } }] }, limit: 1, depth: 0, overrideAccess: true } as any)
      : await payload.find({ collection: 'social-posts', where: { permalink: { equals: r.permalink } }, limit: 1, depth: 0, overrideAccess: true })
    if (ex.docs.length) { console.log(slug, r.platform, 'already logged', ex.docs[0].id); continue }
    const doc = await payload.create({ collection: 'social-posts', overrideAccess: true, data: { ...rel, kind: it.kind, status: 'published', source: 'manual', matchedBy: 'link', triggeredBy: 'manual', mediaUrl, thumbnailUrl: thumb, postedAt: AT, details, ...r } as any })
    console.log('created', slug, r.platform, doc.id)
  }
}
process.exit(0)
