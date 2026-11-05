/* eslint-disable @typescript-eslint/no-explicit-any -- one-off script */
// Logs the Bayfonte Marina reel posted 2026-11-04 to Instagram, TikTok and the Facebook Page (FB version is the earlier cut: orange location line, no URL in caption).
//   NODE_ENV=production npx tsx scripts/_add-bayfonte-reels-social.ts
import fs from 'node:fs'
import path from 'node:path'
import { config as loadEnv } from 'dotenv'
loadEnv({ path: path.join(process.cwd(), '.env.local') })
const cfg = ((await import('../payload.config')) as any).default
const { getPayload } = await import('payload')
const { mirrorToR2 } = await import('../src/lib/listing-import/mirror')
const payload = await getPayload({ config: cfg })
const SLUG = 'bayfonte-marina'
const rec = (await payload.find({ collection: 'projects', where: { slug: { equals: SLUG } }, limit: 1, depth: 0, overrideAccess: true } as any)).docs[0] as any
const video = await mirrorToR2(`projects/${SLUG}/social/${SLUG}_reel-final.mp4`, fs.readFileSync('/private/tmp/claude-501/-Volumes-MyStorage-LNH-lankanewhomes/0123044d-b531-5879-a665-5da5e681f76a/scratchpad/reelpost/bayfonte-reel.mp4'), 'video/mp4')
const caption = fs.readFileSync('/private/tmp/claude-501/-Volumes-MyStorage-LNH-lankanewhomes/0123044d-b531-5879-a665-5da5e681f76a/scratchpad/reelpost/caption.txt', 'utf8').trim()
const fbCaption = caption.replace(/ Full details: www\.lankanewhomes\.com\/projects\/bayfonte-marina/, ' Full details at the link in bio.')
const rows = [
  { platform: 'instagram', permalink: 'https://www.instagram.com/lankanewhomes/reel/DfVSRx5IIW2/', caption },
  { platform: 'tiktok', permalink: 'https://www.tiktok.com/@lankanewhomes/video/7704410883224603924', caption },
  { platform: 'facebook', permalink: 'https://www.facebook.com/reel/1138646518647525', caption: fbCaption },
]
for (const r of rows) {
  const ex = await payload.find({ collection: 'social-posts', where: { permalink: { equals: r.permalink } }, limit: 1, depth: 0, overrideAccess: true })
  if (ex.docs.length) { console.log(r.platform, 'already logged', ex.docs[0].id); continue }
  const doc = await payload.create({ collection: 'social-posts', overrideAccess: true, data: { project: rec.id, kind: 'reel', status: 'published', source: 'manual', matchedBy: 'link', triggeredBy: 'manual', mediaUrl: video, postedAt: new Date().toISOString(), details: { projectSlug: SLUG, listingType: 'project', location: 'Negombo', video, format: '30s reel 9:16, light style' + (r.platform === 'facebook' ? ' (earlier cut: orange location line)' : ''), seconds: 30 }, ...r } as any })
  console.log('created', r.platform, doc.id)
}
process.exit(0)
