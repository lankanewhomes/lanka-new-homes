/* eslint-disable @typescript-eslint/no-explicit-any -- one-off script */
// Logs the 5 land Kinetic Type reels posted 2026-11-26 from the Windows PC, each on Instagram, TikTok and the Facebook Page:
// The Few (Nawala), Callisto (Kadawatha), Prime Azure (Ahangama), Sunridge (Ballapitiya, Horana) and Green Hide (Yakkala).
// Each row carries the `land` relation as well as details.landSlug / details.landId.
// Media is read from the owner's Desktop: Social Queue/2026-11-26 - 5 land Kinetic reels/<dir>/{reel.mp4,cover.png,caption.txt,caption-fb.txt}.
// Safe to re-run: skips rows whose permalink is already logged.
//   PowerShell:  $env:NODE_ENV='production'; npx tsx scripts/_add-kinetic-five-land-reels-2026-11-26-social.ts
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { config as loadEnv } from 'dotenv'
loadEnv({ path: path.join(process.cwd(), '.env.local') })
const cfg = ((await import('../payload.config')) as any).default
const { getPayload } = await import('payload')
const { mirrorToR2 } = await import('../src/lib/listing-import/mirror')
const payload = await getPayload({ config: cfg })
const ROOT = process.env.SOCIAL_QUEUE_DIR || path.join(os.homedir(), 'OneDrive', 'Desktop', 'Social Queue', '2026-11-26 - 5 land Kinetic reels')
const jobs = [
  { dir: '1 - The Few Nawala land reel', slug: 'the-few-nawala', secs: '34.9', location: 'Nawala, Sri Lanka', ids: { ig: 'DgNliWYoSZT', tt: '7712530891356114196', fb: '1471284241638374' } },
  { dir: '2 - Callisto Kadawatha land reel', slug: 'callisto-kadawatha', secs: '35.7', location: 'Kadawatha, Sri Lanka', ids: { ig: 'DgNmEBFo-SR', tt: '7712532062753885461', fb: '2218537765392509' } },
  { dir: '3 - Prime Azure Ahangama land reel', slug: 'prime-azure-ahangama', secs: '34.7', location: 'Ahangama, Sri Lanka', ids: { ig: 'DgNmlz-IElf', tt: '7712544130227768596', fb: '2296919924435079' } },
  { dir: '4 - Sunridge Ballapitiya land reel', slug: 'sunridge-ballapitiya', secs: '33.5', location: 'Horana, Sri Lanka', ids: { ig: 'DgNtT77IM87', tt: '7712533760360746260', fb: '1151140050999642' } },
  { dir: '5 - Green Hide Yakkala land reel', slug: 'green-hide-yakkala', secs: '35.8', location: 'Yakkala, Sri Lanka', ids: { ig: 'DgNnhaiIZOn', tt: '7712534630984994049', fb: '1092745887142235' } },
]
for (const j of jobs) {
  const D = path.join(ROOT, j.dir)
  const rec = (await payload.find({ collection: 'lands', where: { slug: { equals: j.slug } }, limit: 1, depth: 0, overrideAccess: true } as any)).docs[0] as any
  if (!rec) throw new Error(j.slug + ' missing')
  const caption = fs.readFileSync(path.join(D, 'caption.txt'), 'utf8').trim()
  const fbCaption = fs.readFileSync(path.join(D, 'caption-fb.txt'), 'utf8').trim()
  const base = `lands/${j.slug}/social/${j.slug}_kinetic-voice`
  const mediaUrl = await mirrorToR2(`${base}_reel.mp4`, fs.readFileSync(path.join(D, 'reel.mp4')), 'video/mp4')
  const thumb = await mirrorToR2(`${base}_reel-cover.png`, fs.readFileSync(path.join(D, 'cover.png')), 'image/png')
  const details: any = { format: `reel ${j.secs}s, Kinetic Type land reel with grid lines and George voice`, location: j.location, cover: thumb, listingType: 'land', landSlug: j.slug, landId: rec.id }
  const rows = [
    { platform: 'instagram', externalId: j.ids.ig, permalink: `https://www.instagram.com/lankanewhomes/reel/${j.ids.ig}/`, caption },
    { platform: 'tiktok', externalId: j.ids.tt, permalink: `https://www.tiktok.com/@lankanewhomes/video/${j.ids.tt}`, caption },
    { platform: 'facebook', externalId: j.ids.fb, permalink: `https://www.facebook.com/reel/${j.ids.fb}`, caption: fbCaption },
  ]
  for (const r of rows) {
    const ex = await payload.find({ collection: 'social-posts', where: { permalink: { equals: r.permalink } }, limit: 1, depth: 0, overrideAccess: true })
    if (ex.docs.length) { console.log(r.platform, 'already logged', ex.docs[0].id); continue }
    const doc = await payload.create({ collection: 'social-posts', overrideAccess: true, data: { land: rec.id, kind: 'reel', status: 'published', source: 'manual', matchedBy: 'link', triggeredBy: 'manual', mediaUrl, thumbnailUrl: thumb, postedAt: new Date().toISOString(), details, ...r } as any })
    console.log('created', j.slug, r.platform, doc.id)
  }
}
process.exit(0)
