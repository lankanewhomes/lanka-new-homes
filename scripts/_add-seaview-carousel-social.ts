/* eslint-disable @typescript-eslint/no-explicit-any -- one-off script */
// Logs the 5 posts made 2026-11-17 (Day 23): Rush City map reel, Legado land map reel, The Reflection / Prime Kadawatha / The Regal carousels,
// each on Instagram, TikTok and the Facebook Page, as Social Posts rows. Social Posts only relate to projects, so the two lands carry no project (land in `details`).
// Facebook carousel permalinks could not be read from the Page feed, so they use the Page URL (same as earlier carousel rows); reels use their reel URLs.
// Safe to re-run: skips rows whose permalink (or Page URL + caption start) is already logged.
//   NODE_ENV=production npx tsx scripts/_add-day23-five-posts-social.ts
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { config as loadEnv } from 'dotenv'
loadEnv({ path: path.join(process.cwd(), '.env.local') })
const cfg = ((await import('../payload.config')) as any).default
const { getPayload } = await import('payload')
const { mirrorToR2 } = await import('../src/lib/listing-import/mirror')
const payload = await getPayload({ config: cfg })
const ROOT = path.join(os.homedir(), 'Desktop/Social Queue/Day 23 - 5 posts (preview)')
const FBPAGE = 'https://www.facebook.com/lankanewhomes'
const AT = new Date().toISOString()
const D = path.join(os.homedir(), 'Desktop/Social Queue/Day 25 - carousels/1 - Seaview Heights carousel')
const slug = 'seaview-heights-mount-lavinia'
const rec = (await payload.find({ collection: 'projects', where: { slug: { equals: slug } }, limit: 1, depth: 0, overrideAccess: true } as any)).docs[0] as any
if (!rec) throw new Error('project missing')
const caption = fs.readFileSync(path.join(D, 'caption.txt'), 'utf8').trim()
const fbCaption = fs.readFileSync(path.join(D, 'caption-fb.txt'), 'utf8').trim()
const base = `projects/${slug}/social/${slug}_day25`
const images: string[] = []
for (const f of fs.readdirSync(D).filter((x) => /^slide-\d+\.png$/.test(x)).sort()) images.push(await mirrorToR2(`${base}_carousel-${f}`, fs.readFileSync(path.join(D, f)), 'image/png'))
const details: any = { format: 'carousel 8 slides', location: 'Mount Lavinia, Sri Lanka', images }
const rows = [
  { platform: 'instagram', externalId: 'Df-OxDLkdOW', permalink: 'https://www.instagram.com/lankanewhomes/p/Df-OxDLkdOW/', caption },
  { platform: 'tiktok', externalId: '7710312641809370388', permalink: 'https://www.tiktok.com/@lankanewhomes/video/7710312641809370388', caption },
  { platform: 'facebook', externalId: '', permalink: FBPAGE, caption: fbCaption },
]
for (const r of rows) {
  const ex = r.permalink === FBPAGE
    ? await payload.find({ collection: 'social-posts', where: { and: [{ platform: { equals: 'facebook' } }, { permalink: { equals: FBPAGE } }, { caption: { equals: r.caption } }] }, limit: 1, depth: 0, overrideAccess: true } as any)
    : await payload.find({ collection: 'social-posts', where: { permalink: { equals: r.permalink } }, limit: 1, depth: 0, overrideAccess: true })
  if (ex.docs.length) { console.log(r.platform, 'already logged', ex.docs[0].id); continue }
  const doc = await payload.create({ collection: 'social-posts', overrideAccess: true, data: { project: rec.id, kind: 'carousel', status: 'published', source: 'manual', matchedBy: 'link', triggeredBy: 'manual', mediaUrl: images[0], thumbnailUrl: images[0], postedAt: new Date().toISOString(), details, ...r } as any })
  console.log('created', r.platform, doc.id)
}
process.exit(0)
