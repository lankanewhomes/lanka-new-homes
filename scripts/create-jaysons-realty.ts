// Creates the Jaysons Realty developer profile + the 2 listings that don't
// need a new neighbourhood (Digana already exists): Digana Land Development
// (Lands) and Raintree Villas (Projects). Bonavista Phase 2, Ranna & Rekawa
// Coastal Land, and Glendower Suites follow once their neighbourhood pages
// (Nuwara Eliya, Ranna & Rekawa) are ready.
import path from 'node:path'
import { config as loadEnv } from 'dotenv'
import type payloadConfigType from '../payload.config'

loadEnv({ path: path.join(process.cwd(), '.env.local') })
const payloadConfig = ((await import('../payload.config')) as { default: typeof payloadConfigType }).default
const { getPayload } = await import('payload')
const payload = await getPayload({ config: payloadConfig })

const existingDev = await payload.find({ collection: 'developers', where: { slug: { equals: 'jaysons-realty' } }, limit: 1, overrideAccess: true })
const developer = existingDev.docs[0] ?? await payload.create({
  collection: 'developers',
  data: {
    slug: 'jaysons-realty',
    name: 'Jaysons Realty',
    logo: 'https://media.lankanewhomes.com/logos/developers/jaysons-realty-logo.png',
    description:
      "Jaysons Realty (Pvt) Ltd is a real estate development and property investment company based in Sri Lanka, operating within the Jaysons Holdings Group — a family-owned conglomerate with close to five decades of history across real estate, hospitality, quick commerce and manufacturing. Chairman-led since 1991, the company takes on a deliberately limited number of high-conviction residential and land development opportunities, from luxury housing in Nuwara Eliya to land subdivision projects across the island.",
    website: 'https://jaysonsrealty.com',
    location: 'Mount Lavinia',
    establishedYear: 1991,
    yearsInBusiness: 35,
    contact_phone: '+94701969969',
  } as never,
  overrideAccess: true,
})
console.log('Developer:', developer.id, developer.slug)

const land = await payload.create({
  collection: 'lands',
  data: {
    slug: 'digana-land-development-kandy',
    title: 'Digana Land Development',
    sellerType: 'developer',
    seller: { relationTo: 'developers', value: developer.id },
    sellerName: 'Jaysons Realty',
    location: 'Digana, Kandy',
    district: 'Kandy',
    city_other: 'Digana',
    province: 'Central',
    status: 'Available',
    landUse: ['Residential'],
    landType: 'Bare Land',
    summary:
      'A waterfront residential land development in Digana, Kandy, bordered by the Victoria Reservoir and adjoining the Victoria Golf Course.',
    description:
      "A waterfront residential land development in Digana, Kandy, bordered by the Victoria Reservoir and adjoining the Victoria Golf Course. Defined by its highland setting, proximity to Kandy city, and strong long-term demand, the development is also positioned to benefit from improving regional accessibility through the continued expansion of the Central Expressway network. Plot details and availability on enquiry.",
    heroImage: 'https://media.lankanewhomes.com/projects/digana-land-development-kandy/gallery/digana-land-development-kandy_hero.webp',
    gallery: [{ image: 'https://media.lankanewhomes.com/projects/digana-land-development-kandy/gallery/digana-land-development-kandy_hero.webp' }],
    facilities: ['Waterfront (Victoria Reservoir)', 'Adjoins Victoria Golf Course'],
    isPublished: false,
  } as never,
  overrideAccess: true,
})
console.log('Land:', land.id, land.slug)

const project = await payload.create({
  collection: 'projects',
  data: {
    slug: 'raintree-villas-digana-kandy',
    name: 'Raintree Villas',
    developer: developer.id,
    type: 'Luxury Villas',
    status: 'Under Construction',
    district: 'Kandy',
    city_other: 'Digana',
    province: 'Central',
    location: 'Digana, Kandy',
    isPublished: false,
    summary:
      "A boutique luxury villa development on approximately two acres in Digana, Kandy — one of Sri Lanka's most sought-after highland residential addresses.",
    description:
      "A boutique luxury villa development on approximately two acres in Digana, Kandy — one of Sri Lanka's most sought-after highland residential addresses. The development comprises approximately ten villas of 3,000 square feet each, offering two to four bedroom configurations. Each villa is designed for owner occupiers and investors seeking a private, high-specification residential product in the Kandy hill country. Completion timeline available upon enquiry.",
    pricingComingSoon: 'Price on enquiry — contact Jaysons Realty directly.',
    heroImage: 'https://media.lankanewhomes.com/projects/raintree-villas-digana-kandy/gallery/raintree-villas-digana-kandy_hero.webp',
    gallery: [{ image: 'https://media.lankanewhomes.com/projects/raintree-villas-digana-kandy/gallery/raintree-villas-digana-kandy_hero.webp' }],
  } as never,
  overrideAccess: true,
})
console.log('Project:', project.id, project.slug)

process.exit(0)
