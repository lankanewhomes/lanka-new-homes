// One-time: migrates the single existing hero_ads row (Supabase, old admin
// system) into Payload's HeroSlides collection + a matching Payments record
// (payment_type: hero_slide, status: completed — it was already paid/
// approved under the old system), now that HeroSlides has full field parity
// (headline, review_note, archived status) and Payments has a
// related_hero_slide link. Safe to re-run: no-ops if a HeroSlides doc
// already links to this project + advertiser.
//
// Run with: npx tsx scripts/migrate-hero-ad.ts
import path from 'node:path'
import { config as loadEnv } from 'dotenv'
import type payloadConfigType from '../payload.config'

loadEnv({ path: path.join(process.cwd(), '.env.local') })

const payloadConfig = ((await import('../payload.config')) as { default: typeof payloadConfigType }).default
const { getPayload } = await import('payload')
const payload = await getPayload({ config: payloadConfig })

const OLD_ROW = {
  image: '/courtyard by prime/260730100700COURTYARD_1200x540_2.jpg',
  headline: 'Headline Image',
  linkUrl: '/projects/courtyard-by-prime',
  startDate: '2026-09-10',
  endDate: '2026-09-16',
  priceLkr: 27,
  developerSlug: 'primelands',
  projectSlug: 'courtyard-by-prime',
  order: 0,
}

const developerRes = await payload.find({ collection: 'developers', where: { slug: { equals: OLD_ROW.developerSlug } }, limit: 1, overrideAccess: true })
const developer = developerRes.docs[0]
if (!developer) throw new Error(`Developer ${OLD_ROW.developerSlug} not found`)

const projectRes = await payload.find({ collection: 'projects', where: { slug: { equals: OLD_ROW.projectSlug } }, limit: 1, overrideAccess: true })
const project = projectRes.docs[0]
if (!project) throw new Error(`Project ${OLD_ROW.projectSlug} not found`)

const existing = await payload.find({
  collection: 'hero-slides',
  where: { and: [{ advertiser: { equals: developer.id } }, { project: { equals: project.id } }] },
  limit: 1,
  overrideAccess: true,
})

if (existing.docs.length > 0) {
  console.log('Already migrated — hero-slides doc', existing.docs[0].id, 'already links this developer + project. No-op.')
  process.exit(0)
}

const heroSlide = await payload.create({
  collection: 'hero-slides',
  data: {
    headline: OLD_ROW.headline,
    image: OLD_ROW.image,
    project: project.id,
    link: OLD_ROW.linkUrl,
    display_order: OLD_ROW.order,
    advertiser: developer.id,
    start_date: OLD_ROW.startDate,
    end_date: OLD_ROW.endDate,
    is_paid_placement: true,
    status: 'pending',
  } as never,
  overrideAccess: true,
})
console.log('Created hero-slides doc', heroSlide.id)

const payment = await payload.create({
  collection: 'payments',
  data: {
    payer: { relationTo: 'developers', value: developer.id },
    amount: OLD_ROW.priceLkr,
    currency: 'LKR',
    payment_type: 'hero_slide',
    related_hero_slide: heroSlide.id,
    status: 'pending',
  } as never,
  overrideAccess: true,
})
console.log('Created payments doc', payment.id, '(pending)')

// Confirming it (status -> completed) is what the activatePlacementOnPayment
// hook watches for — this both activates the hero slide (status -> active)
// and links it back via HeroSlides.payment, same as a real admin approval
// would trigger.
const completed = await payload.update({
  collection: 'payments',
  id: payment.id,
  data: { status: 'completed', payment_date: new Date().toISOString() } as never,
  overrideAccess: true,
})
console.log('Confirmed payment', completed.id, '-> completed')

const finalSlide = await payload.findByID({ collection: 'hero-slides', id: heroSlide.id, overrideAccess: true })
console.log('Final hero-slides status:', finalSlide.status, '| payment linked:', finalSlide.payment)

process.exit(0)
