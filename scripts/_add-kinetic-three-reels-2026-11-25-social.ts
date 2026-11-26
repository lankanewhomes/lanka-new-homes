/* eslint-disable @typescript-eslint/no-explicit-any -- one-off script */
// Logs the 3 Kinetic Type reels posted 2026-11-25 from the Windows PC: Vauxhall DSTRCT (Colombo 02), Crystal Sands Sky Villas (Hikkaduwa)
// and Lakefront Residencies (Nuwara Eliya), on Instagram and TikTok. Facebook was not posted that day (the posting Chrome was not logged in
// to Facebook); fill in `fb` below and re-run when those reels exist.
// Media is read from the owner's Desktop: Social Queue/2026-11-25 - 3 Bomb Drop reels (preview)/<dir>/{reel.mp4,cover.png,caption.txt,caption-fb.txt}.
// Safe to re-run: skips rows whose permalink is already logged.
//   PowerShell:  $env:NODE_ENV='production'; npx tsx scripts/_add-kinetic-three-reels-2026-11-25-social.ts
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { config as loadEnv } from 'dotenv'
loadEnv({ path: path.join(process.cwd(), '.env.local') })
const cfg = ((await import('../payload.config')) as any).default
const { getPayload } = await import('payload')
const { mirrorToR2 } = await import('../src/lib/listing-import/mirror')
const payload = await getPayload({ config: cfg })
const ROOT = process.env.SOCIAL_QUEUE_DIR || path.join(os.homedir(), 'OneDrive', 'Desktop', 'Social Queue', '2026-11-25 - 3 Bomb Drop reels (preview)')
const jobs = [
  { dir: '1 - Vauxhall DSTRCT Kinetic reel', slug: 'vauxhall-dstrct', secs: '32.6', location: 'Colombo, Sri Lanka', ids: { ig: 'DgMMP3sIx_S', tt: '7712326925083036980', fb: '' } },
  { dir: '2 - Crystal Sands Sky Villas Kinetic reel', slug: 'crystal-sands-sky-villas', secs: '31.6', location: 'Hikkaduwa, Sri Lanka', ids: { ig: 'DgMMiA0I92t', tt: '7712327485379218709', fb: '' } },
  { dir: '3 - Lakefront Residencies Kinetic reel', slug: 'lakefront-residencies', secs: '35.5', location: 'Nuwara Eliya, Sri Lanka', ids: { ig: 'DgMM0aaIL7d', tt: '7712328150839037204', fb: '' } },
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
  const details: any = { format: `reel ${j.secs}s, Kinetic Type reel with grid lines and George voice`, location: j.location, cover: thumb, listingType: 'project' }
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
