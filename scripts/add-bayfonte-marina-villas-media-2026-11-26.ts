/* eslint-disable @typescript-eslint/no-explicit-any -- one-off script */
// Owner request 2026-11-26: "Check for villas photos and videos" (BayFonte Marina Villas, project 143, published). Add-only and idempotent.
// The developer's villas page has one render (the villa row, already our hero) and no video. The villas brochure is a 1.5 MB compressed PDF
// whose interior and amenity renders sit inside small collages (about 500 px wide), too small for the gallery, so they are not used.
// Added: the aerial render of the whole development (from the apartments brochure; it shows the villa row) and the developer's
// YouTube video "Bayfonte Marina Resort Apartments & Villas - Negombo".
//   BAY_DIR=<folder holding pdfimg/11.jpg> NODE_ENV=production npx tsx scripts/add-bayfonte-marina-villas-media-2026-11-26.ts [--apply]
import fs from 'node:fs'
import path from 'node:path'
import { config as loadEnv } from 'dotenv'
loadEnv({ path: path.join(process.cwd(), '.env.local') })
const apply = process.argv.includes('--apply')
const dir = process.env.BAY_DIR ?? ''
const cfg = ((await import('../payload.config')) as any).default
const { getPayload } = await import('payload')
const { mirrorToR2 } = await import('../src/lib/listing-import/mirror')
const payload = await getPayload({ config: cfg })
const ID = 143
const KEY = 'projects/bayfonte-marina-villas/gallery/bayfonte-marina-villas_aerial-view.jpg'
const VIDEO = { label: 'Bayfonte Marina Resort Apartments and Villas', embedUrl: 'https://www.youtube.com/watch?v=u_0F0hYZfpA' }

const p: any = await payload.findByID({ collection: 'projects', id: ID, depth: 0, overrideAccess: true })
if (p.slug !== 'bayfonte-marina-villas') throw new Error('unexpected project')
const data: Record<string, any> = {}
const log: string[] = []
if (!(p.gallery ?? []).some((g: any) => String(g.image).endsWith('_aerial-view.jpg'))) {
  const full = path.join(dir, 'pdfimg/11.jpg')
  if (!fs.existsSync(full)) throw new Error(`missing file ${full}`)
  const image = apply ? await mirrorToR2(KEY, fs.readFileSync(full), 'image/jpeg') : '(would upload)'
  data.gallery = [...(p.gallery ?? []).map((g: any) => ({ label: g.label, image: g.image })), { label: 'Aerial view of the development, with the villa row', image }]
  log.push('gallery +1 (aerial view)')
}
if (!(p.videos ?? []).some((v: any) => v.embedUrl === VIDEO.embedUrl)) {
  data.videos = [...(p.videos ?? []).map((v: any) => ({ label: v.label, embedUrl: v.embedUrl, thumbnail: v.thumbnail })), VIDEO]
  log.push('video +1')
}
console.log(p.id, p.name, '->', log.join(' | ') || 'nothing to add', '| gallery now', p.gallery?.length, '| videos now', p.videos?.length ?? 0)
if (apply && Object.keys(data).length) {
  await payload.update({ collection: 'projects', id: ID, data: data as never, overrideAccess: true })
  const a: any = await payload.findByID({ collection: 'projects', id: ID, depth: 0, overrideAccess: true })
  console.log('   saved: gallery', a.gallery?.length, '| videos', a.videos?.length, '| floor plans', a.floorPlans?.length, '| amenities', a.amenities?.length, '| badges', a.locationBadges, a.marketingBadges, '| price', a.startingPriceLkr, '| phone', a.contactPhone === p.contactPhone ? 'unchanged' : 'CHANGED', '| published', a.isPublished)
}
console.log(apply ? 'APPLIED' : 'DRY RUN')
process.exit(0)
