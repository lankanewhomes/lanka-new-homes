/* eslint-disable @typescript-eslint/no-explicit-any -- one-off script */
// Owner request 2026-11-26: "check the renders from the developers website, also borchure and add the iamges".
// Bayfonte Marina Resort Apartments (project 149, published) had a hero image but an empty gallery. Add-only and idempotent.
// Gallery: 11 renders from the developer's page (cms.homelandsskyline.lk), 2 already in our storage (entrance gate, sports court)
// and 3 renders taken out of the developer's brochure PDF (aerial view, living room, dining area). Videos: the 2 YouTube videos on the page.
// Left out: the render that is already the hero, near-duplicate angles, the VR promo graphics, the brochure's stock lifestyle photos
// (banana boat, jet ski, kayaks, fishermen) and the Bayfonte restaurant photo (not confirmed as part of the apartment complex).
//   BAY_DIR=<folder holding src/NN.jpeg and pdfimg/NN.jpg> NODE_ENV=production npx tsx scripts/add-bayfonte-marina-images-2026-11-26.ts [--apply]
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
const ID = 149
const BASE = 'https://media.lankanewhomes.com/projects/bayfonte-marina/gallery/bayfonte-marina_'
// [local file or null when already in our storage, slug, label]
const IMAGES: [string | null, string, string][] = [
  ['src/04.jpeg', 'towers-from-lagoon', 'Towers seen from the lagoon'],
  ['src/05.jpeg', 'towers-and-boat-pier', 'Towers and boat pier'],
  ['src/16.jpeg', 'lagoon-view-dusk-wide', 'Lagoon view at dusk'],
  ['pdfimg/11.jpg', 'aerial-view', 'Aerial view of the development'],
  [null, 'entrance-gate', 'Entrance gate'],
  ['src/20.jpeg', 'car-park-and-podium', 'Car park and podium'],
  ['src/21.jpeg', 'swimming-pool', 'Swimming pool'],
  ['src/19.jpeg', 'pool-and-sports-court-aerial', 'Pool and sports court from above'],
  [null, 'sports-court', 'Sports court'],
  ['src/03.jpeg', 'outdoor-dining-deck', 'Outdoor dining deck'],
  ['src/07.jpeg', 'lounge-deck', 'Lounge deck'],
  ['src/08.jpeg', 'play-area-and-walkway', 'Play area and walkway'],
  ['src/10.jpeg', 'garden-pavilion', 'Garden pavilion'],
  ['src/14.jpeg', 'landscaped-garden', 'Landscaped garden'],
  ['pdfimg/08.jpg', 'living-room', 'Living room'],
  ['pdfimg/07.jpg', 'dining-area', 'Dining area'],
]
const VIDEOS = [
  { label: 'Bayfonte Marina Resort Apartments and Villas', embedUrl: 'https://www.youtube.com/watch?v=u_0F0hYZfpA' },
  { label: 'Lagoon-front homes in Negombo', embedUrl: 'https://www.youtube.com/watch?v=jeQQJwaYp0o' },
]

const p: any = await payload.findByID({ collection: 'projects', id: ID, depth: 0, overrideAccess: true })
if (p.slug !== 'bayfonte-marina') throw new Error('unexpected project')
const gallery = (p.gallery ?? []).map((g: any) => ({ label: g.label, image: g.image }))
const before = gallery.length
for (const [file, slug, label] of IMAGES) {
  if (gallery.some((g: any) => String(g.image).endsWith(`_${slug}.jpg`))) continue
  if (file) {
    const full = path.join(dir, file)
    if (!fs.existsSync(full)) throw new Error(`missing file ${full}`)
    const image = apply ? await mirrorToR2(`projects/bayfonte-marina/gallery/bayfonte-marina_${slug}.jpg`, fs.readFileSync(full), 'image/jpeg') : `(would upload ${file})`
    gallery.push({ label, image })
  } else {
    const res = await fetch(`${BASE}${slug}.jpg`, { method: 'HEAD' })
    if (!res.ok) throw new Error(`expected ${slug} in storage, got ${res.status}`)
    gallery.push({ label, image: `${BASE}${slug}.jpg` })
  }
  console.log('  +', label)
}
const videos = (p.videos ?? []).map((v: any) => ({ label: v.label, embedUrl: v.embedUrl, thumbnail: v.thumbnail }))
const videosBefore = videos.length
for (const v of VIDEOS) if (!videos.some((x: any) => x.embedUrl === v.embedUrl)) { videos.push(v); console.log('  + video:', v.label) }
console.log(p.id, p.name, '| gallery', before, '->', gallery.length, '| videos', videosBefore, '->', videos.length, '| hero', p.heroImage ? 'kept' : 'none')
if (apply && (gallery.length !== before || videos.length !== videosBefore)) {
  await payload.update({ collection: 'projects', id: ID, data: { gallery, videos } as never, overrideAccess: true })
  const a: any = await payload.findByID({ collection: 'projects', id: ID, depth: 0, overrideAccess: true })
  console.log('   saved: gallery', a.gallery?.length, '| videos', a.videos?.length, '| floor plans', a.floorPlans?.length, '| amenities', a.amenities?.length, '| highlights', a.highlights?.length, '| badges', a.locationBadges, '| price', a.startingPriceLkr, '| phone', a.contactPhone === p.contactPhone ? 'unchanged' : 'CHANGED', '| published', a.isPublished)
}
console.log(apply ? 'APPLIED' : 'DRY RUN')
process.exit(0)
