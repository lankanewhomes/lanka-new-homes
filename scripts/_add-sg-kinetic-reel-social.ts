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
const D = '/private/tmp/claude-501/sg_post'
const slug = 'spice-grove-madawala-ulpotha'
const rec = (await payload.find({ collection: 'lands', where: { slug: { equals: slug } }, limit: 1, depth: 0, overrideAccess: true } as any)).docs[0] as any
if (!rec) throw new Error('land missing')
const caption = fs.readFileSync(path.join(D, 'caption.txt'), 'utf8').trim()
const fbCaption = fs.readFileSync(path.join(D, 'caption-fb.txt'), 'utf8').trim()
const base = `lands/${slug}/social/${slug}_kinetic`
const mediaUrl = await mirrorToR2(`${base}_reel-grid.mp4`, fs.readFileSync(path.join(D, 'reel.mp4')), 'video/mp4')
const thumb = await mirrorToR2(`${base}_reel-cover.png`, fs.readFileSync(path.join(D, 'cover.png')), 'image/png')
const details: any = { format: 'reel 28.8s, Kinetic Type reel with grid lines', location: 'Matale, Sri Lanka', cover: thumb, landSlug: slug, landId: rec.id, listingType: 'land' }
const rows = [
  { platform: 'instagram', externalId: 'Df-hJtXojge', permalink: 'https://www.instagram.com/lankanewhomes/reel/Df-hJtXojge/', caption },
  { platform: 'tiktok', externalId: '7710492525143821588', permalink: 'https://www.tiktok.com/@lankanewhomes/video/7710492525143821588', caption },
  { platform: 'facebook', externalId: '1950642199251386', permalink: 'https://www.facebook.com/reel/1950642199251386', caption: fbCaption },
]
for (const r of rows) {
  const ex = await payload.find({ collection: 'social-posts', where: { permalink: { equals: r.permalink } }, limit: 1, depth: 0, overrideAccess: true })
  if (ex.docs.length) { console.log(r.platform, 'already logged', ex.docs[0].id); continue }
  const doc = await payload.create({ collection: 'social-posts', overrideAccess: true, data: { kind: 'reel', status: 'published', source: 'manual', matchedBy: 'link', triggeredBy: 'manual', mediaUrl, thumbnailUrl: thumb, postedAt: new Date().toISOString(), details, ...r } as any })
  console.log('created', r.platform, doc.id)
}
process.exit(0)
