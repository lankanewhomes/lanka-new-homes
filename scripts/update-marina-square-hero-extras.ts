/* eslint-disable @typescript-eslint/no-explicit-any -- one-off script */
// Marina Square: map position, video, virtual tour and site plan (hero pills), plus a shorter description. 2026-11-09.
//   MS_DIR=<folder with pdf/aerial-hi-1.jpg, pdf/video-thumb.jpeg> NODE_ENV=production npx tsx scripts/update-marina-square-hero-extras.ts
// Pin: the developer's own Google Maps embed on marinasquare.lk/en/contact. Video + Matterport show apartment: marinasquare.lk media-downloads pages.
import fs from 'node:fs'
import path from 'node:path'
import { config as loadEnv } from 'dotenv'
loadEnv({ path: path.join(process.cwd(), '.env.local') })
const dir = process.env.MS_DIR ?? ''
if (!dir) throw new Error('Set MS_DIR')
const cfg = ((await import('../payload.config')) as any).default
const { getPayload } = await import('payload')
const { mirrorToR2 } = await import('../src/lib/listing-import/mirror')
const payload = await getPayload({ config: cfg })
const SLUG = 'marina-square-colombo-15'
const proj = (await payload.find({ collection: 'projects' as never, where: { slug: { equals: SLUG } }, limit: 1, overrideAccess: true, depth: 0 })).docs[0] as any
const before = { plans: proj.floorPlans?.length, gallery: proj.gallery?.length, amenities: proj.amenities?.length }
const plan = await mirrorToR2(`projects/${SLUG}/block-plan/${SLUG}_site-plan-views.jpg`, fs.readFileSync(path.join(dir, 'pdf/aerial-hi-1.jpg')), 'image/jpeg')
const thumb = await mirrorToR2(`projects/${SLUG}/gallery/${SLUG}_video-thumbnail.jpg`, fs.readFileSync(path.join(dir, 'pdf/video-thumb.jpeg')), 'image/jpeg')
const description =
  'Marina Square - Uptown Colombo is a five-tower condominium on five acres in Colombo 15, close to Port City and the elevated expressway. Homes range from 1 to 3 bedroom condos up to 4 bedroom penthouses on floors 35 and 36. Residents share over two acres of landscaped gardens, an infinity pool, gym, club house and sky decks. Construction milestones are shown at 100% and finished show apartments are ready to view.\n\n' +
  'The two 4-bedroom penthouses currently listed with prices are 4 D/E (2,104 sq ft, from LKR 192,209,929) and 4 F/G (2,047 sq ft, from LKR 172,222,237). The developer offers customised, interest-free payment plans.'
const updated: any = await payload.update({
  collection: 'projects' as never, id: proj.id, overrideAccess: true,
  data: {
    description,
    coordinates: { lat: 6.95226, lng: 79.85592 },
    videos: [{ label: 'Marina Square - Uptown Colombo video', embedUrl: 'https://www.youtube.com/embed/UFuHcS5RxOc', thumbnail: thumb }],
    virtualTours: [{ label: 'Show apartment (3D tour)', url: 'https://my.matterport.com/show/?m=wxsqmAByoi8' }],
    blockPlanImages: [{ label: 'Site plan and view directions', image: plan }],
  } as never,
})
const after = { plans: updated.floorPlans?.length, gallery: updated.gallery?.length, amenities: updated.amenities?.length }
console.log('before', JSON.stringify(before), 'after', JSON.stringify(after), 'coords', JSON.stringify(updated.coordinates), 'videos', updated.videos?.length, 'tours', updated.virtualTours?.length, 'block', updated.blockPlanImages?.length)
process.exit(0)
