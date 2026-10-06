import path from 'node:path'
import { config as loadEnv } from 'dotenv'
import type payloadConfigType from '../payload.config'

loadEnv({ path: path.join(process.cwd(), '.env.local') })
const payloadConfig = ((await import('../payload.config')) as { default: typeof payloadConfigType }).default
const { getPayload } = await import('payload')
const payload = await getPayload({ config: payloadConfig })

const existing = await payload.find({ collection: 'developers', where: { slug: { equals: 'gangani-land-sales' } }, limit: 1, overrideAccess: true })
if (existing.docs[0]) {
  console.log('Already exists:', existing.docs[0].id)
  process.exit(0)
}

const developer = await payload.create({
  collection: 'developers',
  data: {
    slug: 'gangani-land-sales',
    name: 'Gangani Land Sales',
    logo: 'https://media.lankanewhomes.com/logos/developers/gangani-land-sales-logo.png',
    description:
      'Gangani Land Sales was founded in 1982 by chairman K.A.S. Premachandra, growing from a single land development into one of Sri Lanka\'s established land subdivision sellers. The company has delivered serviced residential plots to more than 11,000 families over more than 40 years, operating across major districts in the Western Province with structured, affordable payment plans.',
    website: 'https://www.ganganilandsales.com',
    location: 'Colombo',
    establishedYear: 1982,
    yearsInBusiness: 43,
    contact_phone: '+94112677822',
  } as never,
  overrideAccess: true,
})
console.log('Developer:', developer.id, developer.slug)
process.exit(0)
