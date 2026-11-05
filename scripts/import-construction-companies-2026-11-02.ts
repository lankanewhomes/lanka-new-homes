/* eslint-disable @typescript-eslint/no-explicit-any -- one-off import script */
// Adds eight Sri Lankan construction companies to the directory (owner, 2026-11-02: "go online and find out more construction
// companies and add it to the list"). Every address, phone, email and claim below was read from the company's own website that day
// (see docs/listings/construction-companies-2026-11-02.md). Claims only the company makes are worded "says it…". Logos are copied to R2.
//   NODE_ENV=production npx tsx scripts/import-construction-companies-2026-11-02.ts
import path from 'node:path'
import { config as loadEnv } from 'dotenv'
loadEnv({ path: path.join(process.cwd(), '.env.local') })
const cfg = ((await import('../payload.config')) as any).default
const { getPayload } = await import('payload')
const { mirrorToR2 } = await import('../src/lib/listing-import/mirror')
const payload = await getPayload({ config: cfg })

type Co = { slug: string; name: string; description: string; email?: string; phone?: string; website: string; location: string; services: string[]; designBuild: boolean; logo?: string; social?: Record<string, string> }
const COMPANIES: Co[] = [
  {
    slug: 'maga-engineering', name: 'Maga Engineering (Pvt) Ltd', website: 'https://maga.lk', email: 'maga@maga.lk', phone: '+94 11 2808835',
    location: '200, Nawala Road, Narahenpita, Colombo 05, Sri Lanka', designBuild: true,
    services: ['Building construction', 'Roads, expressways and bridges', 'Construction management', 'Design-build', 'Scaffolding leasing'],
    description: "Maga Engineering describes itself as one of Sri Lanka's leading construction companies. It builds residential towers and commercial buildings (its site lists Fairway SkyGardens in Rajagiriya, Kandy City Centre and the Grand Hyatt Colombo hotel) as well as roads, expressways and bridges, and offers construction management and design-build services. It was recognised at the National Awards for Construction Excellence 2017.",
    logo: 'https://maga.lk/wp-content/uploads/2015/02/Maga-Logo-120x78.png',
  },
  {
    slug: 'tudawe-brothers', name: 'Tudawe Brothers (Pvt) Ltd', website: 'https://tudawe.com', email: 'info@tudawe.com', phone: '+94 11 435 6200',
    location: '505/2, Elvitigala Mawatha, Colombo 05, Sri Lanka', designBuild: true,
    services: ['Building construction', 'Architectural design and engineering', 'Bridges', 'Water supply systems'],
    description: 'Tudawe Brothers says it keeps architectural design, engineering, procurement, construction and finishing in-house, and builds residential, commercial and industrial projects. Its site also lists bridge and water supply work.',
    logo: 'https://tudawe.com/wp-content/uploads/2023/04/TBL-Header-Logo.png',
    social: { linkedin: 'https://www.linkedin.com/company/tudawe-brothers-limited/', youtube: 'https://www.youtube.com/channel/UCno95zu9hyLkslKAISSMe7Q' },
  },
  {
    slug: 'nawaloka-construction', name: 'Nawaloka Construction Company (Pvt) Ltd', website: 'https://nawalokaconstruction.com', email: 'construction@nawaloka.net', phone: '+94 76 355 5640',
    location: 'No. 115, Sir James Peiris Mawatha, Colombo 02, Sri Lanka', designBuild: false,
    services: ['Building construction', 'Road works', 'Piling and foundations', 'Mechanical, electrical and plumbing (MEP)', 'Civil engineering'],
    description: 'Nawaloka Construction Company says it is a CIDA grade CS2 registered contractor with more than 50 years of construction experience, ISO 9001:2015 certified and a member of the National Construction Association of Sri Lanka. It builds residential, commercial, industrial and high-rise buildings, roads and highways, and does piling and MEP work.',
    logo: 'https://nawalokaconstruction.com/nccweb/assets/images/logopng.png',
    social: { facebook: 'https://www.facebook.com/nawalokaconstructions', youtube: 'https://www.youtube.com/@nawalokaconstructioncompan8638' },
  },
  {
    slug: 'access-engineering', name: 'Access Engineering PLC', website: 'https://www.accessengsl.com', email: 'inquiries@accessengsl.com', phone: '+94 11 760 6606',
    location: 'No. 278, Union Place, Colombo 02, Sri Lanka', designBuild: false,
    services: ['Civil engineering', 'Building construction', 'Roads and highways', 'Bridges and flyovers', 'Water treatment plants'],
    description: "Access Engineering PLC is a civil engineering and construction company listed on the Colombo Stock Exchange. Its work includes buildings, roads and highways, bridges and flyovers, harbours and water treatment plants. A group company, Blue Star Realties, developed Capital Heights in Rajagiriya.",
  },
  {
    slug: 'hello-builders', name: 'Hello Builders', website: 'https://hellobuilders.lk', email: 'hello@hellobuilders.lk', phone: '+94 777 699 019',
    location: '5/1, Girton School Road, Nugegoda, Sri Lanka', designBuild: true,
    services: ['Modern house design and build', 'Villa design and build', 'Renovation'],
    description: 'Hello Builders is a design and build company in Nugegoda that designs and builds modern houses and villas in Sri Lanka, and also advises on renovating or rebuilding existing homes.',
    logo: 'https://hellobuilders.lk/wp-content/uploads/2016/12/Hello-Builders-Black-Logo-Copy.png',
    social: { facebook: 'https://www.facebook.com/hellobuilders', instagram: 'https://www.instagram.com/hellobuilders' },
  },
  {
    slug: 'lex-duco', name: 'Lex Duco (Pvt) Ltd', website: 'https://lexduco.lk', email: 'info@lexduco.lk', phone: '+94 773 222 555',
    location: 'No. 73, Robert Gunawardana Mawatha, Battaramulla, Sri Lanka', designBuild: true,
    services: ['House design', 'House construction', 'Home construction management'],
    description: 'Lex Duco designs and builds houses in Sri Lanka. It says it offers more than 500 house designs and gives buyers a 20-year structural warranty and a complete drawing folder.',
    logo: 'https://lexduco.lk/wp-content/uploads/2025/06/logo_.png',
    social: { facebook: 'https://www.facebook.com/lexduco', instagram: 'https://www.instagram.com/lexduco.lk', youtube: 'https://www.youtube.com/@lexduco7680' },
  },
  {
    slug: 'janco-home-construction', name: 'Janco Home & Construction', website: 'https://jancohomes.com', email: 'info@jancohomes.com', phone: '+94 11 209 0090',
    location: 'Colombo, Sri Lanka', designBuild: true,
    services: ['Residential construction', 'Turn-key home building', 'Luxury villa construction'],
    description: 'Janco Homes says it is an ICTAD-registered contractor with more than 20 years of experience in residential construction and turn-key home building across Sri Lanka, including luxury villas in Colombo.',
    logo: 'https://jancohomes.com/janco-logo.svg',
    social: { facebook: 'https://www.facebook.com/jancohomesconstruction' },
  },
  {
    slug: 'kedalla-design-and-construction', name: 'Kedalla Design and Construction', website: 'https://kedalla.lk', email: 'info@kedalla.lk',
    location: '247 1/3, Peradeniya Road, Kandy, Sri Lanka', designBuild: true,
    services: ['House construction', 'Architectural design'],
    description: 'Kedalla Design and Construction (Kedalla Homes) is a house builder and design firm based on Peradeniya Road in Kandy. It says it focuses on quality craftsmanship, design and value for homes in Sri Lanka.',
    social: { facebook: 'https://www.facebook.com/kedalla.lk', instagram: 'https://www.instagram.com/kedallaarc2026/', youtube: 'https://www.youtube.com/@kedallaarchitecturaldesign1937' },
  },
]

for (const c of COMPANIES) {
  const exists = await payload.find({ collection: 'construction-companies', where: { slug: { equals: c.slug } }, limit: 1, depth: 0, overrideAccess: true })
  if (exists.docs[0]) { console.log('exists', c.slug); continue }
  let logo: string | undefined
  if (c.logo) {
    try {
      const res = await fetch(c.logo, { headers: { 'user-agent': 'Mozilla/5.0 LankaNewHomes importer' } })
      if (res.ok) {
        const ext = (c.logo.split('.').pop() || 'png').toLowerCase()
        logo = await mirrorToR2(`construction-companies/${c.slug}/${c.slug}_logo.${ext}`, Buffer.from(await res.arrayBuffer()), ext === 'svg' ? 'image/svg+xml' : ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : 'image/png')
      } else console.log('  logo fetch failed', c.slug, res.status)
    } catch (e) { console.log('  logo error', c.slug, String(e)) }
  }
  const created = await payload.create({
    collection: 'construction-companies',
    data: {
      slug: c.slug, name: c.name, description: c.description, contact_email: c.email, contact_phone: c.phone, website: c.website, location: c.location,
      services: c.services, isDesignBuild: c.designBuild, ...(logo ? { logo } : {}), ...(c.social ? { socialLinks: c.social } : {}),
    } as never,
    overrideAccess: true,
  })
  console.log('created', created.slug, logo ? 'logo ok' : 'no logo')
}
process.exit(0)
