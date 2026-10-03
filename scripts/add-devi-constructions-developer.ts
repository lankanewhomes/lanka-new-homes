// Adds Devi Constructions (Jaffna) as a developer profile only — no listings (owner, 2026-10-02).
// Facts are those published on https://deviconstructions.lk (home, story and contact pages). No logo file is published
// there, so none is set. Idempotent: does nothing if the slug already exists.
//   NODE_ENV=production npx tsx scripts/add-devi-constructions-developer.ts
import path from 'node:path'
import { config as loadEnv } from 'dotenv'
import type payloadConfigType from '../payload.config'

loadEnv({ path: path.join(process.cwd(), '.env.local') })
const payloadConfig = ((await import('../payload.config')) as { default: typeof payloadConfigType }).default
const { getPayload } = await import('payload')
const payload = await getPayload({ config: payloadConfig })

const SLUG = 'devi-constructions'
const found = await payload.find({ collection: 'developers', where: { slug: { equals: SLUG } }, limit: 1, overrideAccess: true })
if (found.docs[0]) { console.log('exists', SLUG); process.exit(0) }

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
const created = await payload.create({
  collection: 'developers',
  data: {
    slug: SLUG,
    name: 'Devi Constructions',
    description:
      'Devi Constructions is a small, family-led architecture and building studio based in Jaffna, building homes across the north of Sri Lanka. It offers house construction, architectural design, renovation and remodelling, project management, cost estimation, and interiors and finishing. The studio reports more than 100 projects delivered, including a private home in Manipay, Neervely Villa in Jaffna and the four-storey Manipay GMJ Mall.',
    website: 'https://deviconstructions.lk',
    location: 'Jaffna',
    yearsInBusiness: 22,
    completedProjects: 100,
    contact_phone: '+94779305667',
    contact_email: 'deviconstructionsconsultation@gmail.com',
    officeHours: days.map((day) => (day === 'Sunday' ? { day, open: false } : { day, open: true, from: '08:30', to: '18:00' })),
  } as never,
  overrideAccess: true,
})
console.log('Developer created', created.id)
process.exit(0)
