/* eslint-disable @typescript-eslint/no-explicit-any -- one-off script */
// Logs the Capitol TwinPeaks reel (Instagram reel + Facebook Page reel, both posted 2026-10-27, location Colombo,
// Sri Lanka) as Social Posts rows on the Capitol TwinPeaks project. Not logged: the Facebook link post (no permalink
// captured) and the TikTok post (under TikTok review when posted).
//   NODE_ENV=production npx tsx scripts/_add-capitol-twinpeaks-reel-social.ts
import fs from 'node:fs'
import path from 'node:path'
import { config as loadEnv } from 'dotenv'

loadEnv({ path: path.join(process.cwd(), '.env.local') })
const cfg = ((await import('../payload.config')) as any).default
const { getPayload } = await import('payload')
const { mirrorToR2 } = await import('../src/lib/listing-import/mirror')
const payload = await getPayload({ config: cfg })

const SLUG = 'capitol-twinpeaks'
const DIR = `${process.env.HOME}/Desktop/Content - LNH/Social Media - LNH/40-Project reel - Capitol TwinPeaks (video)`
const CAP = '/private/tmp/claude-501/-Users-rupansinnarajah-Desktop-lankanewhomes/c9913ba0-e97b-527f-9e7a-80794c5f3dda/scratchpad/post'
const project = (await payload.find({ collection: 'projects', where: { slug: { equals: SLUG } }, limit: 1, depth: 0, overrideAccess: true, draft: true } as any)).docs[0] as any
if (!project) throw new Error(`project ${SLUG} missing`)

const cover = await mirrorToR2(`projects/${SLUG}/social/${SLUG}_reel-cover.jpg`, fs.readFileSync(path.join(DIR, 'Cover.jpg')), 'image/jpeg')
const video = await mirrorToR2(`projects/${SLUG}/social/${SLUG}_reel.mp4`, fs.readFileSync(path.join(DIR, 'CapitolTwinPeaks-reel-13s-v6-price.mp4')), 'video/mp4')
const link = `https://www.lankanewhomes.com/projects/${SLUG}`
const meta = { format: 'project reel 13s (9:16, developer footage, blue design)', video, cover, seconds: 13, audio: 'none' }

for (const [platform, externalId, permalink, capFile, postedAt, extra] of [
  ['instagram', 'DfBIdhFIozg', 'https://www.instagram.com/lankanewhomes/reel/DfBIdhFIozg/', 'cap_ig.txt', '2026-10-28T00:50:00.000Z', { location: 'Colombo, Sri Lanka' }],
  ['facebook', '1681280126985235', 'https://www.facebook.com/reel/1681280126985235', 'cap_fbreel.txt', '2026-10-28T01:10:00.000Z', { location: 'Colombo, Sri Lanka', firstComment: `Explore this property: ${link}` }],
] as const) {
  const existing = await payload.find({ collection: 'social-posts', where: { permalink: { equals: permalink } }, limit: 1, depth: 0, overrideAccess: true })
  if (existing.docs.length) { console.log(platform, 'already logged:', existing.docs[0].id); continue }
  const doc = await payload.create({
    collection: 'social-posts',
    overrideAccess: true,
    data: {
      project: project.id, platform, kind: 'reel', status: 'published', source: 'manual', externalId, matchedBy: 'link', permalink,
      caption: fs.readFileSync(`${CAP}/${capFile}`, 'utf8').trim(), mediaUrl: video, thumbnailUrl: cover, triggeredBy: 'manual',
      details: { ...meta, ...extra }, postedAt,
    } as any,
  })
  console.log('created', platform, 'reel social post', doc.id, 'on', project.id, project.name)
}
process.exit(0)
