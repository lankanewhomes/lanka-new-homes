/* eslint-disable @typescript-eslint/no-explicit-any -- one-off script */
// Logs a TikTok photo carousel (new approved design) in social-posts so /links updates.
//   NODE_ENV=production npx tsx scripts/_instagram-carousel-social.ts <land|project> <slug> <slidesDir> <slideCount> <location> <caption-file>
import fs from 'node:fs'
import path from 'node:path'
import { config as loadEnv } from 'dotenv'
loadEnv({ path: path.join(process.cwd(), '.env.local') })
const [kind, slug, dir, count, location, capFile] = process.argv.slice(2)
const cfg = ((await import('../payload.config')) as any).default
const { getPayload } = await import('payload')
const { mirrorToR2 } = await import('../src/lib/listing-import/mirror')
const payload = await getPayload({ config: cfg })
const col = kind === 'land' ? 'lands' : 'projects'
const rec = (await payload.find({ collection: col, where: { slug: { equals: slug } }, limit: 1, depth: 0, overrideAccess: true } as any)).docs[0] as any
const images: string[] = []
for (let i = 1; i <= +count; i++) images.push(await mirrorToR2(`${col}/${slug}/social/${slug}_instagram-carousel-${i}.png`, fs.readFileSync(`${dir}/slide-${String(i).padStart(2, '0')}.png`), 'image/png'))
const d = await payload.create({ collection: 'social-posts', overrideAccess: true, data: { [kind === 'land' ? 'land' : 'project']: rec.id, platform: 'instagram', kind: 'carousel', status: 'published', source: 'manual', matchedBy: 'link', triggeredBy: 'manual', permalink: process.argv[8], caption: fs.readFileSync(capFile, 'utf8'), mediaUrl: images[0], thumbnailUrl: images[0], postedAt: new Date().toISOString(), details: { [kind === 'land' ? 'landSlug' : 'projectSlug']: slug, listingType: kind, location, images, format: `${count}-slide 4:5 carousel, approved design, Instagram carousel post` } } as any })
console.log('created instagram', d.id)
process.exit(0)
