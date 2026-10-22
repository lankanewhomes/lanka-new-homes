/* eslint-disable @typescript-eslint/no-explicit-any -- one-off script */
// Logs the Ocean Breeze Hikkaduwa Instagram carousel (posted 2026-10-21, location Hikkaduwa) and Facebook Page link post as
// Social Posts rows on the listing, with the 5 carousel images copied to R2. /links lists the listing from the Instagram row.
//   NODE_ENV=production npx tsx scripts/_add-ocean-breeze-social.ts
import fs from 'node:fs'
import path from 'node:path'
import { config as loadEnv } from 'dotenv'

loadEnv({ path: path.join(process.cwd(), '.env.local') })
const cfg = ((await import('../payload.config')) as any).default
const { getPayload } = await import('payload')
const { mirrorToR2 } = await import('../src/lib/listing-import/mirror')
const payload = await getPayload({ config: cfg })

const SLUG = 'ocean-breeze-residencies-hikkaduwa'
const DIR = '/Users/rupansinnarajah/Desktop/Stuff - LankaNewHomes/LankaNewHomes Social Posts/20-Ocean Breeze Hikkaduwa'
const IG_CODE = 'DexuvOGjmQX'
const IG_PERMALINK = `https://www.instagram.com/p/${IG_CODE}/`
const LINK = `https://www.lankanewhomes.com/projects/${SLUG}`
const TAGS = '#OceanBreezeHikkaduwa #Hikkaduwa #BeachfrontLiving #SriLankaApartments #OceanView #GalleRoad #SriLankaRealEstate #NewHomesSriLanka #LankaNewHomes'
const BODY = `Beachfront living on Galle Road. 🌊

Ocean Breeze Hikkaduwa: a 20-floor beachfront residency with studio to three-bedroom apartments, dual-key and duplex layouts (400 to 1,721 sq ft), ocean or river views and a private balcony in every plan. From Rs. 28,000,000.`
const ASK = 'Ocean view or river view: which would you pick? Tell us below 👇'
const IG_CAPTION = `${BODY}\n\nSee the floor plans, photos and details on LankaNewHomes. Link in bio. 👆\n\n${ASK}\n\nListed on lankanewhomes.com\n\n${TAGS}`
const FB_CAPTION = `${BODY}\n\nSee the floor plans, photos and details 👉 ${LINK}\n\n${ASK}\n\nListed on lankanewhomes.com\n\n${TAGS}`

const project = (await payload.find({ collection: 'projects', where: { slug: { equals: SLUG } }, limit: 1, depth: 0, overrideAccess: true, draft: true } as any)).docs[0] as any
if (!project) throw new Error(`project ${SLUG} missing`)

const igExisting = await payload.find({ collection: 'social-posts', where: { permalink: { equals: IG_PERMALINK } }, limit: 1, depth: 0, overrideAccess: true })
if (igExisting.docs.length) {
  console.log('instagram already logged:', igExisting.docs[0].id)
} else {
  const images: string[] = []
  for (let i = 1; i <= 5; i++) {
    images.push(await mirrorToR2(`projects/${SLUG}/social/${SLUG}_instagram-carousel-${i}.jpg`, fs.readFileSync(path.join(DIR, `Instagram-${i}.jpg`)), 'image/jpeg'))
  }
  const doc = await payload.create({
    collection: 'social-posts',
    overrideAccess: true,
    data: {
      project: project.id,
      platform: 'instagram',
      kind: 'carousel',
      status: 'published',
      source: 'manual',
      externalId: IG_CODE,
      matchedBy: 'link',
      permalink: IG_PERMALINK,
      caption: IG_CAPTION,
      mediaUrl: images[0],
      thumbnailUrl: images[0],
      triggeredBy: 'manual',
      details: { images, crop: 'original', location: 'Hikkaduwa, Sri Lanka' },
      postedAt: '2026-10-21T22:48:00.000Z',
    } as any,
  })
  console.log('created instagram social post', doc.id, 'on project', project.id, project.name)
}

const fbExisting = await payload.find({ collection: 'social-posts', where: { and: [{ project: { equals: project.id } }, { platform: { equals: 'facebook' } }] }, limit: 1, depth: 0, overrideAccess: true })
if (fbExisting.docs.length) {
  console.log('facebook already logged:', fbExisting.docs[0].id)
} else {
  const preview = `https://media.lankanewhomes.com/projects/${SLUG}/gallery/${SLUG}_tower-aerial-beachfront-view.jpg`
  const doc = await payload.create({
    collection: 'social-posts',
    overrideAccess: true,
    data: {
      project: project.id,
      platform: 'facebook',
      kind: 'photo',
      status: 'published',
      source: 'manual',
      matchedBy: 'link',
      permalink: 'https://www.facebook.com/lankanewhomes',
      caption: FB_CAPTION,
      mediaUrl: preview,
      thumbnailUrl: preview,
      triggeredBy: 'manual',
      details: { format: 'link post (auto preview from the listing page)', link: LINK, location: 'Hikkaduwa, Sri Lanka', note: 'Post permalink not captured; permalink is the Page.' },
      postedAt: '2026-10-21T23:46:00.000Z',
    } as any,
  })
  console.log('created facebook social post', doc.id, 'on', project.id, project.name)
}
process.exit(0)
