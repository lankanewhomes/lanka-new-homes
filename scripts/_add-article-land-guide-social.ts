/* eslint-disable @typescript-eslint/no-explicit-any -- one-off script */
// Logs the "Before Buying Land in Sri Lanka" article posts (Instagram carousel and Facebook Page link post, both posted
// 2026-10-23, no location, no flag) as Social Posts rows. About the blog article, so no project or land is attached.
//   NODE_ENV=production npx tsx scripts/_add-article-land-guide-social.ts
import fs from 'node:fs'
import path from 'node:path'
import { config as loadEnv } from 'dotenv'

loadEnv({ path: path.join(process.cwd(), '.env.local') })
const cfg = ((await import('../payload.config')) as any).default
const { getPayload } = await import('payload')
const { mirrorToR2 } = await import('../src/lib/listing-import/mirror')
const payload = await getPayload({ config: cfg })

const DIR = '/Users/rupansinnarajah/Desktop/Stuff - LankaNewHomes/LankaNewHomes Social Posts/30-Article - Before buying land'
const CAP = '/private/tmp/claude-501/-Users-rupansinnarajah-Desktop-lankanewhomes/55fc470c-0bb0-5d2a-99e5-ca673b82f416/scratchpad'
const IG_CODE = 'De12WsYFRpv'
const IG_PERMALINK = `https://www.instagram.com/p/${IG_CODE}/`
const ARTICLE = 'https://www.lankanewhomes.com/blog/before-buying-land-in-sri-lanka'
const meta = { listingType: 'business', topic: 'Article: Before Buying Land in Sri Lanka', article: ARTICLE }

if ((await payload.find({ collection: 'social-posts', where: { permalink: { equals: IG_PERMALINK } }, limit: 1, depth: 0, overrideAccess: true })).docs.length) {
  console.log('instagram already logged')
} else {
  const images: string[] = []
  for (let i = 1; i <= 5; i++) images.push(await mirrorToR2(`brand/social/land-guide/instagram-carousel-${i}.png`, fs.readFileSync(path.join(DIR, `Instagram-${i}.png`)), 'image/png'))
  const doc = await payload.create({ collection: 'social-posts', overrideAccess: true, data: {
    platform: 'instagram', kind: 'carousel', status: 'published', source: 'manual', externalId: IG_CODE, matchedBy: 'link', permalink: IG_PERMALINK,
    caption: fs.readFileSync(`${CAP}/cap_art_ig.txt`, 'utf8'), mediaUrl: images[0], thumbnailUrl: images[0], triggeredBy: 'manual',
    details: { ...meta, images, crop: '4:5' }, postedAt: '2026-10-23T16:30:00.000Z' } as any })
  console.log('created instagram social post', doc.id)
}
if ((await payload.find({ collection: 'social-posts', where: { and: [{ platform: { equals: 'facebook' } }, { caption: { contains: 'Before buying land in Sri Lanka, read this' } }] }, limit: 1, depth: 0, overrideAccess: true })).docs.length) {
  console.log('facebook already logged')
} else {
  const preview = 'https://media.lankanewhomes.com/lands/isla-hokandara/gallery/isla-hokandara_photo-01.png'
  const doc = await payload.create({ collection: 'social-posts', overrideAccess: true, data: {
    platform: 'facebook', kind: 'photo', status: 'published', source: 'manual', matchedBy: 'link', permalink: 'https://www.facebook.com/lankanewhomes',
    caption: fs.readFileSync(`${CAP}/cap_art_fb3.txt`, 'utf8'), mediaUrl: preview, thumbnailUrl: preview, triggeredBy: 'manual',
    details: { ...meta, format: 'link post (preview from the article page)', firstComment: `Read the full guide: ${ARTICLE}`, note: 'Post permalink not captured; permalink is the Page.' }, postedAt: '2026-10-23T16:20:00.000Z' } as any })
  console.log('created facebook social post', doc.id)
}
process.exit(0)
