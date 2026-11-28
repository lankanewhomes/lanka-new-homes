/* eslint-disable @typescript-eslint/no-explicit-any -- one-off script */
// Logs the 10 posts made 2026-11-27 from the Windows PC: 5 Kinetic Type reels (Prime Marina 2, Oceanfront Marine Drive, Courtyard by Prime, Zenza, Prime Express Five)
// on Instagram, TikTok and the Facebook Page, and 5 carousels (Elemint Suites, Layards Breeze, Kaloora Kalutara, Harbour View Residencies, City Link) on Instagram only.
// Developers are not named in the posts. Media is read from the owner's Desktop: Social Queue/2026-11-27 - 10 new posts (5 reels + 5 carousels)/<dir>/.
// Safe to re-run: skips rows whose permalink is already logged.
//   PowerShell:  $env:NODE_ENV='production'; npx tsx scripts/_add-batch-ten-2026-11-27-social.ts
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { config as loadEnv } from 'dotenv'
loadEnv({ path: path.join(process.cwd(), '.env.local') })
const cfg = ((await import('../payload.config')) as any).default
const { getPayload } = await import('payload')
const { mirrorToR2 } = await import('../src/lib/listing-import/mirror')
const payload = await getPayload({ config: cfg })
const ROOT = process.env.SOCIAL_QUEUE_DIR || path.join(os.homedir(), 'OneDrive', 'Desktop', 'Social Queue', '2026-11-27 - 10 new posts (5 reels + 5 carousels)')
type Job = { kind: 'reel' | 'carousel'; col: 'projects' | 'lands'; dir: string; slug: string; secs?: string; location: string; ig: string; tt?: string; fb?: string }
const jobs: Job[] = [
  { kind: 'reel', col: 'projects', dir: '01 - Prime Marina 2 reel', slug: 'prime-marina-2-port-city-colombo', secs: '35.6', location: 'Colombo, Sri Lanka', ig: 'DgQ1bnBI8Gr', tt: '7712998377780235541', fb: '1195102710027676' },
  { kind: 'reel', col: 'projects', dir: '02 - Oceanfront Marine Drive reel', slug: 'oceanfront-marine-drive-colombo-06', secs: '32.8', location: 'Colombo, Sri Lanka', ig: 'DgQ12IvIsEV', tt: '7712999157614644500', fb: '1865067321583383' },
  { kind: 'reel', col: 'projects', dir: '03 - Courtyard by Prime reel', slug: 'courtyard-by-prime-samagi-mawatha-thalawathugoda', secs: '36.2', location: 'Thalawathugoda, Sri Lanka', ig: 'DgQ2PFxoWz0', tt: '7713007058534026516', fb: '1165098562657670' },
  { kind: 'reel', col: 'lands', dir: '04 - Zenza Ganemulla land reel', slug: 'zenza-ganemulla', secs: '36', location: 'Ganemulla, Sri Lanka', ig: 'DgQ2rBNIlqd', tt: '7713007865472093460', fb: '1676520133857232' },
  { kind: 'reel', col: 'lands', dir: '05 - Prime Express Five Mattegoda land reel', slug: 'prime-express-five-mattegoda', secs: '37', location: 'Mattegoda, Sri Lanka', ig: 'DgQ3G_AIeDX', tt: '7713008683294264597', fb: '1659440812308058' },
  { kind: 'carousel', col: 'projects', dir: '06 - Elemint Suites carousel', slug: 'elemint-suites-gampaha', location: 'Gampaha, Sri Lanka', ig: 'DgQ8gGaFXZ2' },
  { kind: 'carousel', col: 'projects', dir: '07 - Layards Breeze carousel', slug: 'layards-breeze-colombo-04', location: 'Colombo, Sri Lanka', ig: 'DgQ8x4pFXy6' },
  { kind: 'carousel', col: 'projects', dir: '08 - Kaloora Kalutara carousel', slug: 'kaloora-kalutara', location: 'Kalutara', ig: 'DgQ9EAsFaK7' },
  { kind: 'carousel', col: 'projects', dir: '09 - Harbour View Residencies carousel', slug: 'harbour-view-residencies-colombo-13', location: 'Colombo, Sri Lanka', ig: 'DgQ9VdRlThC' },
  { kind: 'carousel', col: 'lands', dir: '10 - City Link Kiriwaththuduwa land carousel', slug: 'city-link-kiriwaththuduwa', location: 'Kiriwaththuduwa Homagama', ig: 'DgQ9nfFFSgy' },
]
for (const j of jobs) {
  const D = path.join(ROOT, j.dir)
  const rec = (await payload.find({ collection: j.col, where: { slug: { equals: j.slug } }, limit: 1, depth: 0, overrideAccess: true } as any)).docs[0] as any
  if (!rec) throw new Error(j.slug + ' missing')
  const caption = fs.readFileSync(path.join(D, 'caption.txt'), 'utf8').trim()
  const fbCaption = fs.readFileSync(path.join(D, 'caption-fb.txt'), 'utf8').trim()
  const base = `${j.col}/${j.slug}/social/${j.slug}_batch-2026-11-27`
  let mediaUrl: string, thumb: string, images: string[] | undefined
  if (j.kind === 'reel') {
    mediaUrl = await mirrorToR2(`${base}_reel.mp4`, fs.readFileSync(path.join(D, 'reel.mp4')), 'video/mp4')
    thumb = await mirrorToR2(`${base}_reel-cover.png`, fs.readFileSync(path.join(D, 'cover.png')), 'image/png')
  } else {
    images = []
    for (const s of fs.readdirSync(D).filter((f) => /^slide-\d+\.png$/.test(f)).sort()) images.push(await mirrorToR2(`${base}_carousel-${s}`, fs.readFileSync(path.join(D, s)), 'image/png'))
    mediaUrl = images[0]; thumb = images[0]
  }
  const land = j.col === 'lands'
  const details: any = { format: j.kind === 'reel' ? `reel ${j.secs}s, Kinetic Type ${land ? 'land ' : ''}reel with feature and benefit lines and George voice` : `carousel ${images!.length} slides, capital-letter lines`, location: j.location, cover: j.kind === 'reel' ? thumb : undefined, images, listingType: land ? 'land' : 'project', ...(land ? { landSlug: j.slug, landId: rec.id } : {}) }
  const rows: any[] = [{ platform: 'instagram', externalId: j.ig, permalink: `https://www.instagram.com/lankanewhomes/${j.kind === 'reel' ? 'reel' : 'p'}/${j.ig}/`, caption }]
  if (j.tt) rows.push({ platform: 'tiktok', externalId: j.tt, permalink: `https://www.tiktok.com/@lankanewhomes/video/${j.tt}`, caption })
  if (j.fb) rows.push({ platform: 'facebook', externalId: j.fb, permalink: `https://www.facebook.com/reel/${j.fb}`, caption: fbCaption })
  for (const r of rows) {
    const ex = await payload.find({ collection: 'social-posts', where: { permalink: { equals: r.permalink } }, limit: 1, depth: 0, overrideAccess: true })
    if (ex.docs.length) { console.log(r.platform, 'already logged', ex.docs[0].id); continue }
    const doc = await payload.create({ collection: 'social-posts', overrideAccess: true, data: { ...(land ? { land: rec.id } : { project: rec.id }), kind: j.kind, status: 'published', source: 'manual', matchedBy: 'link', triggeredBy: 'manual', mediaUrl, thumbnailUrl: thumb, postedAt: new Date().toISOString(), details, ...r } as any })
    console.log('created', j.slug, r.platform, doc.id)
  }
}
process.exit(0)
