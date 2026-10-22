/* eslint-disable @typescript-eslint/no-explicit-any -- one-off script */
// Logs the "LankaNewHomes by the numbers" web-style reel (Instagram reel and Facebook Page reel, both posted 2026-10-22,
// no location) as Social Posts rows. It is about LankaNewHomes itself, so the rows carry no project or land.
//   NODE_ENV=production npx tsx scripts/_add-reel-1-social.ts
import fs from 'node:fs'
import path from 'node:path'
import { config as loadEnv } from 'dotenv'

loadEnv({ path: path.join(process.cwd(), '.env.local') })
const cfg = ((await import('../payload.config')) as any).default
const { getPayload } = await import('payload')
const { mirrorToR2 } = await import('../src/lib/listing-import/mirror')
const payload = await getPayload({ config: cfg })

const DIR = '/Users/rupansinnarajah/Desktop/Stuff - LankaNewHomes/LankaNewHomes Social Posts/29-About us - Reel'
const CAP = '/private/tmp/claude-501/-Users-rupansinnarajah-Desktop-lankanewhomes/55fc470c-0bb0-5d2a-99e5-ca673b82f416/scratchpad'
const IG_CODE = 'Dezu82CoNLI'
const IG_PERMALINK = `https://www.instagram.com/reel/${IG_CODE}/`
const FB_ID = '1099418989659512'
const FB_PERMALINK = `https://www.facebook.com/reel/${FB_ID}`
const meta = { listingType: 'business', topic: 'Reel: by the numbers', design: 'B (website style)', counts: { projects: 107, floorPlans: 570, lands: 349, plots: 9806, developers: 21, cities: 38 } }

const cover = await mirrorToR2('brand/social/reel-by-the-numbers/cover.jpg', fs.readFileSync(`${CAP}/reel/cover.jpg`), 'image/jpeg')
const video = await mirrorToR2('brand/social/reel-by-the-numbers/LankaNewHomes-reel.mp4', fs.readFileSync(path.join(DIR, 'LankaNewHomes-reel.mp4')), 'video/mp4')

for (const [platform, externalId, permalink, capFile, postedAt, extra] of [
  ['instagram', IG_CODE, IG_PERMALINK, 'cap_reel_ig.txt', '2026-10-22T17:35:00.000Z', {}],
  ['facebook', FB_ID, FB_PERMALINK, 'cap_reel_fb.txt', '2026-10-22T18:05:00.000Z', { firstComment: 'Find your next home: https://www.lankanewhomes.com' }],
] as const) {
  const existing = await payload.find({ collection: 'social-posts', where: { permalink: { equals: permalink } }, limit: 1, depth: 0, overrideAccess: true })
  if (existing.docs.length) { console.log(platform, 'already logged:', existing.docs[0].id); continue }
  const doc = await payload.create({
    collection: 'social-posts',
    overrideAccess: true,
    data: {
      platform, kind: 'reel', status: 'published', source: 'manual', externalId, matchedBy: 'link', permalink,
      caption: fs.readFileSync(`${CAP}/${capFile}`, 'utf8'), mediaUrl: video, thumbnailUrl: cover, triggeredBy: 'manual',
      details: { ...meta, ...extra, video, cover, seconds: 10, audio: 'none' }, postedAt,
    } as any,
  })
  console.log('created', platform, 'reel social post', doc.id)
}
process.exit(0)
