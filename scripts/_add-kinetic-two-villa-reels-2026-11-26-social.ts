/* eslint-disable @typescript-eslint/no-explicit-any -- one-off script */
// Logs the 2 featured villa Kinetic Type reels posted 2026-11-26 from the Windows PC (Villa Sahana and Villa Samagi, south coast),
// each on Instagram, TikTok and the Facebook Page. Part of the developer's Elite package social posts; the developer is not named in the posts.
// Media is read from the owner's Desktop: Social Queue/2026-11-26 - 2 featured villa Kinetic reels/<dir>/{reel.mp4,cover.png,caption.txt,caption-fb.txt}.
// Safe to re-run: skips rows whose permalink is already logged.
//   PowerShell:  $env:NODE_ENV='production'; npx tsx scripts/_add-kinetic-two-villa-reels-2026-11-26-social.ts
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { config as loadEnv } from 'dotenv'
loadEnv({ path: path.join(process.cwd(), '.env.local') })
const cfg = ((await import('../payload.config')) as any).default
const { getPayload } = await import('payload')
const { mirrorToR2 } = await import('../src/lib/listing-import/mirror')
const payload = await getPayload({ config: cfg })
const ROOT = process.env.SOCIAL_QUEUE_DIR || path.join(os.homedir(), 'OneDrive', 'Desktop', 'Social Queue', '2026-11-26 - 2 featured villa Kinetic reels')
const jobs = [
  { dir: '1 - Villa Sahana Kinetic reel', slug: 'villa-sahana', secs: '38.9', location: 'Weligama, Sri Lanka', ids: { ig: 'DgORmcGIwRq', tt: '7712626599190875444', fb: '1024923049893454' } },
  { dir: '2 - Villa Samagi Kinetic reel', slug: 'villa-samagi', secs: '39.7', location: 'Mirissa, Sri Lanka', ids: { ig: 'DgOSCnoItJb', tt: '7712627389699837204', fb: '2621663458344925' } },
]
for (const j of jobs) {
  const D = path.join(ROOT, j.dir)
  const rec = (await payload.find({ collection: 'projects', where: { slug: { equals: j.slug } }, limit: 1, depth: 0, overrideAccess: true } as any)).docs[0] as any
  if (!rec) throw new Error(j.slug + ' missing')
  const caption = fs.readFileSync(path.join(D, 'caption.txt'), 'utf8').trim()
  const fbCaption = fs.readFileSync(path.join(D, 'caption-fb.txt'), 'utf8').trim()
  const base = `projects/${j.slug}/social/${j.slug}_kinetic-voice`
  const mediaUrl = await mirrorToR2(`${base}_reel.mp4`, fs.readFileSync(path.join(D, 'reel.mp4')), 'video/mp4')
  const thumb = await mirrorToR2(`${base}_reel-cover.png`, fs.readFileSync(path.join(D, 'cover.png')), 'image/png')
  const details: any = { format: `reel ${j.secs}s, Kinetic Type reel with feature and benefit lines, grid lines and George voice`, location: j.location, cover: thumb, listingType: 'project' }
  const rows = [
    { platform: 'instagram', externalId: j.ids.ig, permalink: `https://www.instagram.com/lankanewhomes/reel/${j.ids.ig}/`, caption },
    { platform: 'tiktok', externalId: j.ids.tt, permalink: `https://www.tiktok.com/@lankanewhomes/video/${j.ids.tt}`, caption },
    ...(j.ids.fb ? [{ platform: 'facebook', externalId: j.ids.fb, permalink: `https://www.facebook.com/reel/${j.ids.fb}`, caption: fbCaption }] : []),
  ]
  for (const r of rows) {
    const ex = await payload.find({ collection: 'social-posts', where: { permalink: { equals: r.permalink } }, limit: 1, depth: 0, overrideAccess: true })
    if (ex.docs.length) { console.log(r.platform, 'already logged', ex.docs[0].id); continue }
    const doc = await payload.create({ collection: 'social-posts', overrideAccess: true, data: { project: rec.id, kind: 'reel', status: 'published', source: 'manual', matchedBy: 'link', triggeredBy: 'manual', mediaUrl, thumbnailUrl: thumb, postedAt: new Date().toISOString(), details, ...r } as any })
    console.log('created', j.slug, r.platform, doc.id)
  }
}
process.exit(0)
