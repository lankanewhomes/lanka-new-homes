// Final 3 Jaysons Realty listings, now that both neighbourhood pages exist.
import path from 'node:path'
import { config as loadEnv } from 'dotenv'
import type payloadConfigType from '../payload.config'

loadEnv({ path: path.join(process.cwd(), '.env.local') })
const payloadConfig = ((await import('../payload.config')) as { default: typeof payloadConfigType }).default
const { getPayload } = await import('payload')
const payload = await getPayload({ config: payloadConfig })

const dev = await payload.find({ collection: 'developers', where: { slug: { equals: 'jaysons-realty' } }, limit: 1, overrideAccess: true })
const developer = dev.docs[0]
if (!developer) throw new Error('Jaysons Realty developer not found — run create-jaysons-realty.ts first.')

const nuwaraEliya = await payload.find({ collection: 'neighborhoods', where: { slug: { equals: 'nuwara-eliya' } }, limit: 1, overrideAccess: true })
const rannaRekawa = await payload.find({ collection: 'neighborhoods', where: { slug: { equals: 'ranna-rekawa' } }, limit: 1, overrideAccess: true })
const digana = await payload.find({ collection: 'neighborhoods', where: { slug: { equals: 'digana' } }, limit: 1, overrideAccess: true })
const neNeighborhood = nuwaraEliya.docs[0]
const rrNeighborhood = rannaRekawa.docs[0]
const diganaNeighborhood = digana.docs[0]
if (!neNeighborhood || !rrNeighborhood || !diganaNeighborhood) throw new Error('Neighborhoods not found — run create-jaysons-neighborhoods.ts first.')

// Retroactive fix: Raintree Villas (created earlier this session) was
// created with city_other only, no `neighborhood` relationship set — the
// Project sync hook needs the actual relationship, not just city text, to
// populate neighborhoodSlug. Link it now.
const raintree = await payload.find({ collection: 'projects', where: { slug: { equals: 'raintree-villas-digana-kandy' } }, limit: 1, overrideAccess: true })
if (raintree.docs[0]) {
  await payload.update({ collection: 'projects', id: raintree.docs[0].id, data: { neighborhood: diganaNeighborhood.id } as never, overrideAccess: true })
  console.log('Fixed Raintree Villas neighborhood link ->', diganaNeighborhood.slug)
}

// 1. Bonavista Phase 2 — Land, Nuwara Eliya
const bonavista = await payload.create({
  collection: 'lands',
  data: {
    slug: 'bonavista-phase-2-nuwara-eliya',
    title: 'Bonavista Phase 2',
    sellerType: 'developer',
    seller: { relationTo: 'developers', value: developer.id },
    sellerName: 'Jaysons Realty',
    location: 'Nuwara Eliya',
    district: 'Nuwara Eliya',
    city: 'Nuwara Eliya',
    province: 'Central',
    status: 'Available',
    landUse: ['Residential'],
    landType: 'Land Subdivision',
    summary:
      'The continuing second phase of the Bonavista development in Nuwara Eliya, comprising additional residential land allotments with views towards Lake Gregory.',
    description:
      'Bonavista Phase 2 is the continuing second phase of the Bonavista development in Nuwara Eliya, comprising additional residential land allotments in an established setting close to Nuwara Eliya town, with views towards Lake Gregory. Structured as a land subdivision development rather than a serviced land project, it offers a well-positioned opportunity within one of Sri Lanka\'s most established highland residential markets. Available for immediate enquiry.',
    heroImage: 'https://media.lankanewhomes.com/projects/bonavista-phase-2-nuwara-eliya/gallery/bonavista-phase-2-nuwara-eliya_hero.webp',
    gallery: [{ image: 'https://media.lankanewhomes.com/projects/bonavista-phase-2-nuwara-eliya/gallery/bonavista-phase-2-nuwara-eliya_hero.webp' }],
    facilities: ['Views towards Lake Gregory', 'Established highland residential setting'],
    isPublished: false,
  } as never,
  overrideAccess: true,
})
console.log('Land:', bonavista.id, bonavista.slug)

// 2. Ranna & Rekawa Coastal Land — Land
const ranna = await payload.create({
  collection: 'lands',
  data: {
    slug: 'ranna-rekawa-coastal-land',
    title: 'Ranna & Rekawa Coastal Land',
    sellerType: 'developer',
    seller: { relationTo: 'developers', value: developer.id },
    sellerName: 'Jaysons Realty',
    location: 'Ranna & Rekawa, Southern Coast',
    district: 'Hambantota',
    // Not the plain `city` select ("Ranna" alone) — the land detail page
    // derives its "View neighbourhood" link by slugifying `city` verbatim
    // (toSlug(land.city)), and the neighbourhood page covering both
    // villages together is slugged `ranna-rekawa`. Using city_other with
    // this exact text makes that slugify land on the right page instead of
    // silently falling back to a search link.
    city_other: 'Ranna & Rekawa',
    province: 'Southern',
    status: 'Available',
    landUse: ['Residential'],
    landType: 'Coastal Land',
    summary:
      "A coastal land development on Sri Lanka's southern seaboard in the Ranna and Rekawa area, defined by its shoreline and ecological significance.",
    description:
      "A coastal land development on Sri Lanka's southern seaboard, in the Ranna and Rekawa area, a setting defined not only by its shoreline but also by its ecological richness. Known for one of the island's most important sea turtle conservation areas, the wider landscape also offers birdwatching, lagoon and mangrove habitats, and a quieter, nature-oriented coastal character that continues to strengthen its long-term appeal. This is a limited-availability coastal offering in a location of genuine environmental significance and enduring investment interest, available on confidential enquiry.",
    heroImage: 'https://media.lankanewhomes.com/projects/ranna-rekawa-coastal-land/gallery/ranna-rekawa-coastal-land_hero.webp',
    gallery: [{ image: 'https://media.lankanewhomes.com/projects/ranna-rekawa-coastal-land/gallery/ranna-rekawa-coastal-land_hero.webp' }],
    facilities: ['Coastal frontage', 'Near sea turtle conservation area', 'Lagoon & mangrove habitat nearby'],
    isPublished: false,
  } as never,
  overrideAccess: true,
})
console.log('Land:', ranna.id, ranna.slug)

// 3. Glendower Suites — Project, Nuwara Eliya
const glendower = await payload.create({
  collection: 'projects',
  data: {
    slug: 'glendower-suites-nuwara-eliya',
    name: 'Glendower Suites',
    developer: developer.id,
    neighborhood: neNeighborhood.id,
    type: 'Apartments',
    status: 'Under Construction',
    district: 'Nuwara Eliya',
    city: 'Nuwara Eliya',
    province: 'Central',
    location: 'Nuwara Eliya',
    isPublished: false,
    summary:
      "A premium apartment development under construction in Nuwara Eliya, positioned adjacent to the group's established Hotel Glendower.",
    description:
      "A premium apartment development under construction in Nuwara Eliya, positioned adjacent to the group's established Hotel Glendower. Glendower Suites is designed to bring an institutionally delivered apartment product to the Hill Country market — a segment with constrained supply and consistent long-term demand from both domestic and international buyers. Further details available to qualified enquirers.",
    pricingComingSoon: 'Price on enquiry — contact Jaysons Realty directly.',
    heroImage: 'https://media.lankanewhomes.com/projects/glendower-suites-nuwara-eliya/gallery/glendower-suites-nuwara-eliya_hero.webp',
    gallery: [{ image: 'https://media.lankanewhomes.com/projects/glendower-suites-nuwara-eliya/gallery/glendower-suites-nuwara-eliya_hero.webp' }],
  } as never,
  overrideAccess: true,
})
console.log('Project:', glendower.id, glendower.slug)

process.exit(0)
