/* eslint-disable @typescript-eslint/no-explicit-any -- one-off script */
// Logs the premium 30s Cinnamon Life reel (Instagram reel + Facebook Page reel, both posted 2026-10-25, location
// Colombo, Sri Lanka on Instagram) as Social Posts rows on the Cinnamon Life project.
//   NODE_ENV=production npx tsx scripts/_add-cinnamon-premium-reel-social.ts
import fs from 'node:fs'
import path from 'node:path'
import { config as loadEnv } from 'dotenv'

loadEnv({ path: path.join(process.cwd(), '.env.local') })
const cfg = ((await import('../payload.config')) as any).default
const { getPayload } = await import('payload')
const { mirrorToR2 } = await import('../src/lib/listing-import/mirror')
const payload = await getPayload({ config: cfg })

const SLUG = 'cinnamon-life-apartments'
const DIR = `${process.env.HOME}/Desktop/Stuff - LankaNewHomes/LankaNewHomes Social Posts/35-Premium reel - Cinnamon Life`
const CAP = '/private/tmp/claude-501/-Users-rupansinnarajah-Desktop-lankanewhomes/55fc470c-0bb0-5d2a-99e5-ca673b82f416/scratchpad'
const project = (await payload.find({ collection: 'projects', where: { slug: { equals: SLUG } }, limit: 1, depth: 0, overrideAccess: true, draft: true } as any)).docs[0] as any
if (!project) throw new Error(`project ${SLUG} missing`)

const cover = await mirrorToR2(`projects/${SLUG}/social/${SLUG}_premium-reel-cover.jpg`, fs.readFileSync(path.join(DIR, 'Cover-IG-FB.jpg')), 'image/jpeg')
const video = await mirrorToR2(`projects/${SLUG}/social/${SLUG}_premium-reel.mp4`, fs.readFileSync(path.join(DIR, 'IG-Reel.mp4')), 'video/mp4')
const link = `https://www.lankanewhomes.com/projects/${SLUG}`
const meta = { format: 'premium 30s reel (9:16, original synthesized beat)', video, cover, seconds: 30, audio: 'original beat' }

for (const [platform, externalId, permalink, capFile, postedAt, extra] of [
  ['instagram', 'De8TIpiIUe3', 'https://www.instagram.com/reel/De8TIpiIUe3/', 'cap_cinnamon_reel_ig.txt', '2026-10-26T03:55:00.000Z', { location: 'Colombo, Sri Lanka' }],
  ['facebook', '1084228844372683', 'https://www.facebook.com/reel/1084228844372683', 'cap_cinnamon_reel_fb.txt', '2026-10-26T04:40:00.000Z', { firstComment: `See photos, floor plans and prices: ${link}` }],
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
