/* eslint-disable @typescript-eslint/no-explicit-any -- one-off script */
// 2026-10-28: the Capitol TwinPeaks + Ocean Breeze Galle reels were redone (v16: blue grid background, large photo,
// logo top-left, low translucent text box) and reposted on Instagram, Facebook and TikTok. Points the existing Social
// Posts rows (41 IG Capitol, 42 FB Capitol, 44 TikTok Capitol, 45 IG Ocean Breeze, 46 FB Ocean Breeze) at the new posts
// and media, clears removedAt, and adds the Ocean Breeze TikTok row.
//   NODE_ENV=production npx tsx scripts/_update-reels-v16-social.ts
import fs from 'node:fs'
import path from 'node:path'
import { config as loadEnv } from 'dotenv'

loadEnv({ path: path.join(process.cwd(), '.env.local') })
const cfg = ((await import('../payload.config')) as any).default
const { getPayload } = await import('payload')
const { mirrorToR2 } = await import('../src/lib/listing-import/mirror')
const payload = await getPayload({ config: cfg })

const P = '/private/tmp/claude-501/-Users-rupansinnarajah-Desktop-lankanewhomes/c9913ba0-e97b-527f-9e7a-80794c5f3dda/scratchpad/post'
const TT = 'https://www.tiktok.com/@lankanewhomes/video/'
const jobs = [
  { slug: 'capitol-twinpeaks', video: `${P}/cap_v16.mp4`, cover: `${P}/cap_v16_cover.jpg`, seconds: 13, format: 'project reel 13s (9:16, developer footage, blue grid background, large photo)',
    rows: [
      { id: 41, externalId: 'DfCFFSyoN6P', permalink: 'https://www.instagram.com/lankanewhomes/reel/DfCFFSyoN6P/', postedAt: '2026-10-28T08:20:00.000Z', location: 'Colombo, Sri Lanka' },
      { id: 42, externalId: '28622626157409596', permalink: 'https://www.facebook.com/reel/28622626157409596', postedAt: '2026-10-28T08:55:00.000Z', location: 'Colombo, Sri Lanka' },
      { id: 44, externalId: '7701641711734377729', permalink: `${TT}7701641711734377729`, postedAt: '2026-10-28T09:03:00.000Z', location: 'Colombo', note: 'Submitted 2026-10-28; TikTok showed Content under review / Only me at the time.' },
    ] },
  { slug: 'ocean-breeze-galle', video: `${P}/ob_v16.mp4`, cover: `${P}/ob_v16_cover.jpg`, seconds: 15, format: 'project reel 15s (9:16, developer renders, blue grid background, large photo)',
    rows: [
      { id: 45, externalId: 'DfCEnr4on7G', permalink: 'https://www.instagram.com/lankanewhomes/reel/DfCEnr4on7G/', postedAt: '2026-10-28T08:05:00.000Z', location: 'Galle, Sri Lanka' },
      { id: 46, externalId: '2191453868463696', permalink: 'https://www.facebook.com/reel/2191453868463696', postedAt: '2026-10-28T08:40:00.000Z', location: 'Galle, Sri Lanka' },
      { id: 0, platform: 'tiktok', capFile: `${P}/ob/cap_tt.txt`, externalId: '7701640806297390337', permalink: `${TT}7701640806297390337`, postedAt: '2026-10-28T08:59:00.000Z', location: 'Galle' },
    ] },
]
for (const j of jobs) {
  const project = (await payload.find({ collection: 'projects', where: { slug: { equals: j.slug } }, limit: 1, depth: 0, overrideAccess: true, draft: true } as any)).docs[0] as any
  const cover = await mirrorToR2(`projects/${j.slug}/social/${j.slug}_reel-v16-cover.jpg`, fs.readFileSync(j.cover), 'image/jpeg')
  const video = await mirrorToR2(`projects/${j.slug}/social/${j.slug}_reel-v16.mp4`, fs.readFileSync(j.video), 'video/mp4')
  for (const r of j.rows as any[]) {
    const common = { externalId: r.externalId, permalink: r.permalink, mediaUrl: video, thumbnailUrl: cover, postedAt: r.postedAt, status: 'published', removedAt: null }
    if (r.id) {
      const cur = (await payload.findByID({ collection: 'social-posts', id: r.id, depth: 0, overrideAccess: true })) as any
      const details = { ...(cur.details || {}), format: j.format, video, cover, seconds: j.seconds, audio: 'none', location: r.location, ...(r.note ? { note: r.note } : {}) }
      await payload.update({ collection: 'social-posts', id: r.id, overrideAccess: true, data: { ...common, details } as any })
      console.log('updated row', r.id, cur.platform, '->', r.permalink)
    } else {
      const ex = await payload.find({ collection: 'social-posts', where: { permalink: { equals: r.permalink } }, limit: 1, depth: 0, overrideAccess: true })
      if (ex.docs.length) { console.log('already logged', ex.docs[0].id); continue }
      const doc = await payload.create({ collection: 'social-posts', overrideAccess: true, data: { project: project.id, platform: r.platform, kind: 'reel', source: 'manual', matchedBy: 'link', triggeredBy: 'manual', caption: fs.readFileSync(r.capFile, 'utf8').trim(), ...common, details: { format: j.format, video, cover, seconds: j.seconds, audio: 'none', location: r.location, note: 'Submitted 2026-10-28; TikTok review result not checked.' } } as any })
      console.log('created', r.platform, doc.id, 'on', project.id, project.name)
    }
  }
}
process.exit(0)
