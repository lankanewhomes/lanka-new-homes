/* eslint-disable @typescript-eslint/no-explicit-any -- one-off script */
// Logs the Yarl Royal Palace "Guess the City" reel posted 2026-11-14 to Instagram, TikTok and the Facebook Page.
// Already run once (social-posts rows 288-290); safe to re-run, it skips permalinks that are already logged.
//   NODE_ENV=production npx tsx scripts/_add-yarl-guess-city-reel-social.ts
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { config as loadEnv } from 'dotenv'
loadEnv({ path: path.join(process.cwd(), '.env.local') })
const cfg = ((await import('../payload.config')) as any).default
const { getPayload } = await import('payload')
const { mirrorToR2 } = await import('../src/lib/listing-import/mirror')
const payload = await getPayload({ config: cfg })
const SLUG = 'yarl-royal-palace-jaffna'
const DIR = path.join(os.homedir(), 'Desktop/Social Queue/Day 20 - Guess the City reel/1 - Yarl Royal Palace Jaffna')
const rec = (await payload.find({ collection: 'projects', where: { slug: { equals: SLUG } }, limit: 1, depth: 0, overrideAccess: true } as any)).docs[0] as any
const video = await mirrorToR2(`projects/${SLUG}/social/${SLUG}_reel-guess-the-city.mp4`, fs.readFileSync(path.join(DIR, 'reel.mp4')), 'video/mp4')
const cover = await mirrorToR2(`projects/${SLUG}/social/${SLUG}_reel-guess-the-city-cover.png`, fs.readFileSync(path.join(DIR, 'cover.png')), 'image/png')
const caption = fs.readFileSync(path.join(DIR, 'caption.txt'), 'utf8').trim()
const fbCaption = fs.readFileSync(path.join(DIR, 'caption-fb.txt'), 'utf8').trim()
const rows = [
  { platform: 'instagram', externalId: 'DfvozWlIY10', permalink: 'https://www.instagram.com/lankanewhomes/reel/DfvozWlIY10/', caption },
  { platform: 'tiktok', externalId: '7708209948341161237', permalink: 'https://www.tiktok.com/@lankanewhomes/video/7708209948341161237', caption },
  { platform: 'facebook', externalId: '1585555146588838', permalink: 'https://www.facebook.com/reel/1585555146588838', caption: fbCaption },
]
for (const r of rows) {
  const ex = await payload.find({ collection: 'social-posts', where: { permalink: { equals: r.permalink } }, limit: 1, depth: 0, overrideAccess: true })
  if (ex.docs.length) { console.log(r.platform, 'already logged', ex.docs[0].id); continue }
  const doc = await payload.create({ collection: 'social-posts', overrideAccess: true, data: { project: rec.id, kind: 'reel', status: 'published', source: 'manual', matchedBy: 'link', triggeredBy: 'manual', mediaUrl: video, thumbnailUrl: cover, postedAt: new Date().toISOString(), details: { cover, format: 'reel 19s, Guess the City game', location: 'Jaffna, Sri Lanka' }, ...r } as any })
  console.log('created', r.platform, doc.id)
}
process.exit(0)
