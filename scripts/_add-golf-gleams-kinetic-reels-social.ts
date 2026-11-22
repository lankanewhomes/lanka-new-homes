/* eslint-disable @typescript-eslint/no-explicit-any -- one-off script */
// Logs the 2 kinetic reels posted 2026-11-22 (Day 26): The Golf, Colombo 08 (project) and Gleams Creek, Hirana (land),
// each on Instagram, TikTok and the Facebook Page. Media is read from /private/tmp/claude-501/d26_post/{golf,gc}.
// Safe to re-run: skips rows whose permalink is already logged.
//   NODE_ENV=production npx tsx scripts/_add-golf-gleams-kinetic-reels-social.ts
import fs from 'node:fs'
import path from 'node:path'
import { config as loadEnv } from 'dotenv'
loadEnv({ path: path.join(process.cwd(), '.env.local') })
const cfg = ((await import('../payload.config')) as any).default
const { getPayload } = await import('payload')
const { mirrorToR2 } = await import('../src/lib/listing-import/mirror')
const payload = await getPayload({ config: cfg })
const ROOT = '/private/tmp/claude-501/d26_post'
const jobs = [
  { dir: 'golf', coll: 'projects', slug: 'the-golf-colombo-08', location: 'Colombo, Sri Lanka', ids: { ig: 'DgDsJMNoBIo', tt: '7711100289884949781', fb: '4665018310409858' } },
  { dir: 'gc', coll: 'lands', slug: 'gleams-creek-hirana', location: 'Panadura, Sri Lanka', ids: { ig: 'DgDtmITozUv', tt: '7711106350142524692', fb: '1883836306120836' } },
]
for (const j of jobs) {
  const D = path.join(ROOT, j.dir)
  const rec = (await payload.find({ collection: j.coll, where: { slug: { equals: j.slug } }, limit: 1, depth: 0, overrideAccess: true } as any)).docs[0] as any
  if (!rec) throw new Error(j.slug + ' missing')
  const caption = fs.readFileSync(path.join(D, 'caption.txt'), 'utf8').trim()
  const fbCaption = fs.readFileSync(path.join(D, 'caption-fb.txt'), 'utf8').trim()
  const base = `${j.coll}/${j.slug}/social/${j.slug}_kinetic-voice`
  const mediaUrl = await mirrorToR2(`${base}_reel.mp4`, fs.readFileSync(path.join(D, 'reel.mp4')), 'video/mp4')
  const thumb = await mirrorToR2(`${base}_reel-cover.png`, fs.readFileSync(path.join(D, 'cover.png')), 'image/png')
  const details: any = { format: 'reel 28.8s, Kinetic Type reel with grid lines and George voice', location: j.location, cover: thumb, listingType: j.coll === 'lands' ? 'land' : 'project' }
  if (j.coll === 'lands') { details.landSlug = j.slug; details.landId = rec.id }
  const rows = [
    { platform: 'instagram', externalId: j.ids.ig, permalink: `https://www.instagram.com/lankanewhomes/reel/${j.ids.ig}/`, caption },
    { platform: 'tiktok', externalId: j.ids.tt, permalink: `https://www.tiktok.com/@lankanewhomes/video/${j.ids.tt}`, caption },
    { platform: 'facebook', externalId: j.ids.fb, permalink: `https://www.facebook.com/reel/${j.ids.fb}`, caption: fbCaption },
  ]
  for (const r of rows) {
    const ex = await payload.find({ collection: 'social-posts', where: { permalink: { equals: r.permalink } }, limit: 1, depth: 0, overrideAccess: true })
    if (ex.docs.length) { console.log(r.platform, 'already logged', ex.docs[0].id); continue }
    const doc = await payload.create({ collection: 'social-posts', overrideAccess: true, data: { ...(j.coll === 'projects' ? { project: rec.id } : {}), kind: 'reel', status: 'published', source: 'manual', matchedBy: 'link', triggeredBy: 'manual', mediaUrl, thumbnailUrl: thumb, postedAt: new Date().toISOString(), details, ...r } as any })
    console.log('created', j.slug, r.platform, doc.id)
  }
}
process.exit(0)
