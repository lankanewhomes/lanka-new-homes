/* eslint-disable @typescript-eslint/no-explicit-any -- one-off script */
// Logs the Street Rush Residencies thumb reel posted 2026-11-16 to Instagram, TikTok and the Facebook Page.
// Safe to re-run: it skips permalinks that are already logged.
//   NODE_ENV=production npx tsx scripts/_add-street-rush-thumb-reel-social.ts
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { config as loadEnv } from 'dotenv'
loadEnv({ path: path.join(process.cwd(), '.env.local') })
const cfg = ((await import('../payload.config')) as any).default
const { getPayload } = await import('payload')
const { mirrorToR2 } = await import('../src/lib/listing-import/mirror')
const payload = await getPayload({ config: cfg })
const SLUG = 'street-rush-residencies-mount-lavinia'
const DIR = path.join(os.homedir(), 'Desktop/Social Queue/Day 22 - Street Rush Residencies thumb reel')
const rec = (await payload.find({ collection: 'projects', where: { slug: { equals: SLUG } }, limit: 1, depth: 0, overrideAccess: true } as any)).docs[0] as any
const video = await mirrorToR2(`projects/${SLUG}/social/${SLUG}_reel-thumb.mp4`, fs.readFileSync(path.join(DIR, 'reel.mp4')), 'video/mp4')
const cover = await mirrorToR2(`projects/${SLUG}/social/${SLUG}_reel-thumb-cover.png`, fs.readFileSync(path.join(DIR, 'cover.png')), 'image/png')
const caption = fs.readFileSync(path.join(DIR, 'caption.txt'), 'utf8').trim()
const fbCaption = fs.readFileSync(path.join(DIR, 'caption-fb.txt'), 'utf8').trim()
const rows = [
  { platform: 'instagram', externalId: 'DfzuePYI0PQ', permalink: 'https://www.instagram.com/lankanewhomes/reel/DfzuePYI0PQ/', caption },
  { platform: 'tiktok', externalId: '7708801271582428436', permalink: 'https://www.tiktok.com/@lankanewhomes/video/7708801271582428436', caption },
  { platform: 'facebook', externalId: '1157545517172779', permalink: 'https://www.facebook.com/reel/1157545517172779', caption: fbCaption },
]
for (const r of rows) {
  const ex = await payload.find({ collection: 'social-posts', where: { permalink: { equals: r.permalink } }, limit: 1, depth: 0, overrideAccess: true })
  if (ex.docs.length) { console.log(r.platform, 'already logged', ex.docs[0].id); continue }
  const doc = await payload.create({ collection: 'social-posts', overrideAccess: true, data: { project: rec.id, kind: 'reel', status: 'published', source: 'manual', matchedBy: 'link', triggeredBy: 'manual', mediaUrl: video, thumbnailUrl: cover, postedAt: new Date().toISOString(), details: { cover, format: 'reel 19s, thumb reel with voice', location: 'Mount Lavinia, Sri Lanka' }, ...r } as any })
  console.log('created', r.platform, doc.id)
}
process.exit(0)
