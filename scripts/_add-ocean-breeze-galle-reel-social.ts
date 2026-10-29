/* eslint-disable @typescript-eslint/no-explicit-any -- one-off script */
// Logs the Ocean Breeze Galle reel (Instagram reel + Facebook Page reel, both posted 2026-10-27 evening EDT, location
// Galle, Sri Lanka) as Social Posts rows on the Ocean Breeze Galle project. TikTok was NOT posted (the posting browser
// was logged out of TikTok).
//   NODE_ENV=production npx tsx scripts/_add-ocean-breeze-galle-reel-social.ts
import fs from 'node:fs'
import path from 'node:path'
import { config as loadEnv } from 'dotenv'

loadEnv({ path: path.join(process.cwd(), '.env.local') })
const cfg = ((await import('../payload.config')) as any).default
const { getPayload } = await import('payload')
const { mirrorToR2 } = await import('../src/lib/listing-import/mirror')
const payload = await getPayload({ config: cfg })

const SLUG = 'ocean-breeze-galle'
const CAP = '/private/tmp/claude-501/-Users-rupansinnarajah-Desktop-lankanewhomes/c9913ba0-e97b-527f-9e7a-80794c5f3dda/scratchpad/post/ob'
const project = (await payload.find({ collection: 'projects', where: { slug: { equals: SLUG } }, limit: 1, depth: 0, overrideAccess: true, draft: true } as any)).docs[0] as any
if (!project) throw new Error(`project ${SLUG} missing`)

const cover = await mirrorToR2(`projects/${SLUG}/social/${SLUG}_reel-cover.jpg`, fs.readFileSync(path.join(CAP, 'cover.jpg')), 'image/jpeg')
const video = await mirrorToR2(`projects/${SLUG}/social/${SLUG}_reel.mp4`, fs.readFileSync(path.join(CAP, 'reel.mp4')), 'video/mp4')
const link = `https://www.lankanewhomes.com/projects/${SLUG}`
const meta = { format: 'project reel 15s (9:16, developer renders, blue design)', video, cover, seconds: 15, audio: 'none' }

for (const [platform, externalId, permalink, capFile, postedAt, extra] of [
  ['instagram', 'DfBeOZkIQi9', 'https://www.instagram.com/lankanewhomes/reel/DfBeOZkIQi9/', 'cap_ig.txt', '2026-10-28T03:28:00.000Z', { location: 'Galle, Sri Lanka' }],
  ['facebook', '1593666839114192', 'https://www.facebook.com/reel/1593666839114192', 'cap_fbreel.txt', '2026-10-28T03:36:00.000Z', { location: 'Galle, Sri Lanka', firstComment: `Explore the project: ${link}` }],
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
