/* eslint-disable @typescript-eslint/no-explicit-any -- one-off script */
// Logs the Isla Hokandara land Instagram carousel and Facebook Page link post (both posted 2026-10-22, location Hokandara
// South) as Social Posts rows. Social Posts only relate to projects, so these carry no project; the land is in `details`.
//   NODE_ENV=production npx tsx scripts/_add-isla-hokandara-social.ts
import fs from 'node:fs'
import path from 'node:path'
import { config as loadEnv } from 'dotenv'

loadEnv({ path: path.join(process.cwd(), '.env.local') })
const cfg = ((await import('../payload.config')) as any).default
const { getPayload } = await import('payload')
const { mirrorToR2 } = await import('../src/lib/listing-import/mirror')
const payload = await getPayload({ config: cfg })

const SLUG = 'isla-hokandara'
const DIR = '/Users/rupansinnarajah/Desktop/Stuff - LankaNewHomes/LankaNewHomes Social Posts/22-Isla Hokandara'
const CAP = '/private/tmp/claude-501/-Users-rupansinnarajah-Desktop-lankanewhomes/55fc470c-0bb0-5d2a-99e5-ca673b82f416/scratchpad'
const IG_CODE = 'DeyMnqQjqd1'
const IG_PERMALINK = `https://www.instagram.com/p/${IG_CODE}/`
const LINK = `https://www.lankanewhomes.com/land/${SLUG}`
const land = (await payload.find({ collection: 'lands', where: { slug: { equals: SLUG } }, limit: 1, depth: 0, overrideAccess: true } as any)).docs[0] as any
if (!land) throw new Error(`land ${SLUG} missing`)
const meta = { landSlug: SLUG, landId: land.id, listingType: 'land', location: 'Hokandara South, Sri Lanka' }

const igExisting = await payload.find({ collection: 'social-posts', where: { permalink: { equals: IG_PERMALINK } }, limit: 1, depth: 0, overrideAccess: true })
if (igExisting.docs.length) {
  console.log('instagram already logged:', igExisting.docs[0].id)
} else {
  const images: string[] = []
  for (let i = 1; i <= 5; i++) images.push(await mirrorToR2(`lands/${SLUG}/social/${SLUG}_instagram-carousel-${i}.jpg`, fs.readFileSync(path.join(DIR, `Instagram-${i}.jpg`)), 'image/jpeg'))
  const doc = await payload.create({
    collection: 'social-posts',
    overrideAccess: true,
    data: {
      platform: 'instagram', kind: 'carousel', status: 'published', source: 'manual', externalId: IG_CODE, matchedBy: 'link',
      permalink: IG_PERMALINK, caption: fs.readFileSync(`${CAP}/cap_22_ig.txt`, 'utf8'), mediaUrl: images[0], thumbnailUrl: images[0], triggeredBy: 'manual',
      details: { ...meta, images, crop: 'original' }, postedAt: '2026-10-22T05:50:00.000Z',
    } as any,
  })
  console.log('created instagram social post', doc.id)
}

const fbExisting = await payload.find({ collection: 'social-posts', where: { and: [{ platform: { equals: 'facebook' } }, { permalink: { equals: 'https://www.facebook.com/lankanewhomes' } }, { caption: { contains: 'Isla, Hokandara' } }] }, limit: 1, depth: 0, overrideAccess: true })
if (fbExisting.docs.length) {
  console.log('facebook already logged:', fbExisting.docs[0].id)
} else {
  const preview = await mirrorToR2(`lands/${SLUG}/social/${SLUG}_facebook-1.jpg`, fs.readFileSync(path.join(DIR, 'Facebook-1.jpg')), 'image/jpeg')
  const doc = await payload.create({
    collection: 'social-posts',
    overrideAccess: true,
    data: {
      platform: 'facebook', kind: 'photo', status: 'published', source: 'manual', matchedBy: 'link',
      permalink: 'https://www.facebook.com/lankanewhomes', caption: fs.readFileSync(`${CAP}/cap_22_fb.txt`, 'utf8'), mediaUrl: preview, thumbnailUrl: preview, triggeredBy: 'manual',
      details: { ...meta, format: 'link post (auto preview from the listing page)', link: LINK, note: 'Post permalink not captured; permalink is the Page.' }, postedAt: '2026-10-22T05:56:00.000Z',
    } as any,
  })
  console.log('created facebook social post', doc.id)
}
process.exit(0)
