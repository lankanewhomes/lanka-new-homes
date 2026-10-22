/* eslint-disable @typescript-eslint/no-explicit-any -- one-off script */
// Logs business post 1 "Who we are" (Design B carousel on Instagram, link post on the Facebook Page, both posted 2026-10-22,
// no location) as Social Posts rows. It is about LankaNewHomes itself, so the rows carry no project or land.
//   NODE_ENV=production npx tsx scripts/_add-business-post-1-social.ts
import fs from 'node:fs'
import path from 'node:path'
import { config as loadEnv } from 'dotenv'

loadEnv({ path: path.join(process.cwd(), '.env.local') })
const cfg = ((await import('../payload.config')) as any).default
const { getPayload } = await import('payload')
const { mirrorToR2 } = await import('../src/lib/listing-import/mirror')
const payload = await getPayload({ config: cfg })

const DIR = '/Users/rupansinnarajah/Desktop/Stuff - LankaNewHomes/LankaNewHomes Social Posts/25-About us - Who we are/Designed B - Website style'
const CAP = '/private/tmp/claude-501/-Users-rupansinnarajah-Desktop-lankanewhomes/55fc470c-0bb0-5d2a-99e5-ca673b82f416/scratchpad'
const IG_CODE = 'DezpBsyiXuo'
const IG_PERMALINK = `https://www.instagram.com/p/${IG_CODE}/`
const meta = { listingType: 'business', topic: 'Who we are', design: 'B (website style)', counts: { projects: 107, floorPlans: 539, lands: 349, plots: 9806, developers: 21, cities: 38 } }

const igExisting = await payload.find({ collection: 'social-posts', where: { permalink: { equals: IG_PERMALINK } }, limit: 1, depth: 0, overrideAccess: true })
if (igExisting.docs.length) {
  console.log('instagram already logged:', igExisting.docs[0].id)
} else {
  const images: string[] = []
  for (let i = 1; i <= 5; i++) images.push(await mirrorToR2(`brand/social/who-we-are/instagram-carousel-${i}.png`, fs.readFileSync(path.join(DIR, `Slide-${i}.png`)), 'image/png'))
  const doc = await payload.create({
    collection: 'social-posts',
    overrideAccess: true,
    data: {
      platform: 'instagram', kind: 'carousel', status: 'published', source: 'manual', externalId: IG_CODE, matchedBy: 'link',
      permalink: IG_PERMALINK, caption: fs.readFileSync(`${CAP}/cap_25_ig.txt`, 'utf8'), mediaUrl: images[0], thumbnailUrl: images[0], triggeredBy: 'manual',
      details: { ...meta, images, crop: '4:5' }, postedAt: '2026-10-22T12:35:00.000Z',
    } as any,
  })
  console.log('created instagram social post', doc.id)
}

const fbExisting = await payload.find({ collection: 'social-posts', where: { and: [{ platform: { equals: 'facebook' } }, { caption: { contains: 'Right now that is 107 new home projects' } }] }, limit: 1, depth: 0, overrideAccess: true })
if (fbExisting.docs.length) {
  console.log('facebook already logged:', fbExisting.docs[0].id)
} else {
  const preview = await mirrorToR2('brand/social/who-we-are/facebook-1.png', fs.readFileSync(path.join(DIR, 'Slide-1.png')), 'image/png')
  const doc = await payload.create({
    collection: 'social-posts',
    overrideAccess: true,
    data: {
      platform: 'facebook', kind: 'photo', status: 'published', source: 'manual', matchedBy: 'link',
      permalink: 'https://www.facebook.com/lankanewhomes', caption: fs.readFileSync(`${CAP}/cap_25_fb.txt`, 'utf8'), mediaUrl: preview, thumbnailUrl: preview, triggeredBy: 'manual',
      details: { ...meta, format: 'link post (preview from the home page)', link: 'https://www.lankanewhomes.com', note: 'Post permalink not captured; permalink is the Page.' }, postedAt: '2026-10-22T12:55:00.000Z',
    } as any,
  })
  console.log('created facebook social post', doc.id)
}
process.exit(0)
