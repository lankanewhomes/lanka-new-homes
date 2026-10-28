/* eslint-disable @typescript-eslint/no-explicit-any -- one-off script */
// Logs the rest of the Capitol TwinPeaks posts from 2026-10-27: the Facebook Page link post (permalink not captured,
// so the permalink is the Page, same as the Skyhaus link post) and the TikTok reel (under TikTok review when posted).
//   NODE_ENV=production npx tsx scripts/_add-capitol-twinpeaks-fblink-tiktok-social.ts
import fs from 'node:fs'
import { config as loadEnv } from 'dotenv'
import path from 'node:path'

loadEnv({ path: path.join(process.cwd(), '.env.local') })
const cfg = ((await import('../payload.config')) as any).default
const { getPayload } = await import('payload')
const payload = await getPayload({ config: cfg })

const SLUG = 'capitol-twinpeaks'
const CAP = '/private/tmp/claude-501/-Users-rupansinnarajah-Desktop-lankanewhomes/c9913ba0-e97b-527f-9e7a-80794c5f3dda/scratchpad/post'
const LINK = `https://www.lankanewhomes.com/projects/${SLUG}`
const project = (await payload.find({ collection: 'projects', where: { slug: { equals: SLUG } }, limit: 1, depth: 0, overrideAccess: true, draft: true } as any)).docs[0] as any
if (!project) throw new Error(`project ${SLUG} missing`)
const reel = (await payload.find({ collection: 'social-posts', where: { permalink: { equals: 'https://www.instagram.com/lankanewhomes/reel/DfBIdhFIozg/' } }, limit: 1, depth: 0, overrideAccess: true })).docs[0] as any
const video = reel?.mediaUrl, cover = reel?.thumbnailUrl
const preview = (project.heroImage as string) || cover

const rows: any[] = [
  {
    key: 'fblink', platform: 'facebook', kind: 'photo', permalink: 'https://www.facebook.com/lankanewhomes',
    caption: `A completed condominium in central Colombo.\n\n${fs.readFileSync(`${CAP}/fblink_body.txt`, 'utf8').split('\n').slice(2).join('\n').trim()}`,
    mediaUrl: preview, thumbnailUrl: preview, postedAt: '2026-10-28T01:30:00.000Z',
    details: { format: 'link post (auto preview from the listing page)', link: LINK, location: 'Colombo, Sri Lanka', note: 'Post permalink not captured; permalink is the Page.' },
  },
  {
    key: 'tiktok', platform: 'tiktok', kind: 'reel', permalink: 'https://www.tiktok.com/@lankanewhomes/video/7701507973620845845', externalId: '7701507973620845845',
    caption: fs.readFileSync(`${CAP}/cap_tt.txt`, 'utf8').trim(), mediaUrl: video, thumbnailUrl: cover, postedAt: '2026-10-28T01:00:00.000Z',
    details: { format: 'project reel 13s (9:16, developer footage, blue design)', video, cover, seconds: 13, location: 'Colombo', note: 'Submitted 2026-10-27; TikTok showed Content under review / Only me at the time.' },
  },
]
for (const r of rows) {
  const { key, ...data } = r
  const existing = key === 'tiktok'
    ? await payload.find({ collection: 'social-posts', where: { permalink: { equals: data.permalink } }, limit: 1, depth: 0, overrideAccess: true })
    : await payload.find({ collection: 'social-posts', where: { and: [{ project: { equals: project.id } }, { platform: { equals: 'facebook' } }, { kind: { equals: 'photo' } }] }, limit: 1, depth: 0, overrideAccess: true })
  if (existing.docs.length) { console.log(key, 'already logged:', existing.docs[0].id); continue }
  const doc = await payload.create({ collection: 'social-posts', overrideAccess: true, data: { project: project.id, status: 'published', source: 'manual', matchedBy: 'link', triggeredBy: 'manual', ...data } as any })
  console.log('created', key, doc.id, 'on', project.id, project.name)
}
process.exit(0)
