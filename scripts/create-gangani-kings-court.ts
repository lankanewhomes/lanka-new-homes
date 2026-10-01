// Creates the "Kings Court" land listing from Gangani Land Sales' homepage
// "Our Upcoming Projects" card (https://www.ganganilandsales.com/). The card is
// all the source there is (no detail page): name, area, one description line,
// three nearby facts and a banner photo — nothing else is stated, so no price,
// size or coordinates are invented.
//
//   PKGS_JSON=<pkgs_exact.json> NODE_ENV=production npx tsx scripts/create-gangani-kings-court.ts
import fs from 'node:fs'
import path from 'node:path'
import { config as loadEnv } from 'dotenv'
import type payloadConfigType from '../payload.config'

loadEnv({ path: path.join(process.cwd(), '.env.local') })
const pkgsPath = process.env.PKGS_JSON ?? ''
if (!pkgsPath) throw new Error('Set PKGS_JSON to the exact payment-plan packages JSON')

const payloadConfig = ((await import('../payload.config')) as { default: typeof payloadConfigType }).default
const { getPayload } = await import('payload')
const { mirrorRemoteFiles } = await import('../src/lib/listing-import/mirror')
const payload = await getPayload({ config: payloadConfig })

const slug = 'kings-court-homagama'
const exists = await payload.find({ collection: 'lands', where: { slug: { equals: slug } }, limit: 1, overrideAccess: true })
if (exists.docs[0]) { console.log('exists', slug); process.exit(0) }

const dev = await payload.find({ collection: 'developers', where: { slug: { equals: 'gangani-land-sales' } }, limit: 1, overrideAccess: true })
if (!dev.docs[0]) throw new Error('Developer gangani-land-sales not found')

const photos = await mirrorRemoteFiles(['https://www.ganganilandsales.com/wp-content/uploads/2024/02/1000230736.jpg'], {
  keyPrefix: `projects/${slug}/gallery`, namePrefix: slug, label: 'photo', max: 1,
})
if (!photos.mirrored[0]) throw new Error(`image mirror failed: ${JSON.stringify(photos.failed)}`)
const hero = photos.mirrored[0].url

const packages = (JSON.parse(fs.readFileSync(pkgsPath, 'utf8')) as string[][]).flat()
const description = 'Conveniently located just 1 km from the 280/129 bus route at Beruketiya, Homagama, offering all modern amenities.'

const created = await payload.create({
  collection: 'lands',
  data: {
    slug,
    title: 'Kings Court',
    sellerType: 'developer',
    seller: { relationTo: 'developers', value: dev.docs[0].id },
    sellerName: 'Gangani Land Sales',
    location: 'Homagama',
    district: 'Colombo',
    city: 'Homagama',
    province: 'Western',
    status: 'Available',
    landUse: ['Residential'],
    landType: 'Residential Plots',
    landSizePerches: 0,
    priceLkr: 0,
    electricity: 'Available',
    paymentPlanItems: packages,
    summary: description,
    description,
    heroImage: hero,
    gallery: [{ image: hero }],
    badges: ['Upcoming project'],
    facilities: ['Only 2.5 km to Moragahahena', 'A quick 15-minutes drive to Meepe', 'Just 15 minutes away from Padukka'],
  } as never,
  overrideAccess: true,
})
console.log('created', created.slug)
process.exit(0)
