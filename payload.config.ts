import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { postgresAdapter } from '@payloadcms/db-postgres'
import { nodemailerAdapter } from '@payloadcms/email-nodemailer'
import { cloudStoragePlugin } from '@payloadcms/plugin-cloud-storage'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { buildConfig } from 'payload'

import { Analytics } from './src/collections/Analytics'
import { analyticsEndpoint } from './src/collections/endpoints/analytics'
import { Architects } from './src/collections/Architects'
import { Articles } from './src/collections/Articles'
import { ConstructionCompanies } from './src/collections/ConstructionCompanies'
import { Developers } from './src/collections/Developers'
import { HeroSlides } from './src/collections/HeroSlides'
import { InteriorDesigners } from './src/collections/InteriorDesigners'
import { Lands } from './src/collections/Lands'
import { Leads } from './src/collections/Leads'
import { MarketingCompanies } from './src/collections/MarketingCompanies'
import { Media } from './src/collections/Media'
import { Neighborhoods } from './src/collections/Neighborhoods'
import { Payments } from './src/collections/Payments'
import { PlacementPricing } from './src/collections/PlacementPricing'
import { Projects } from './src/collections/Projects'
import { SalesCompanies } from './src/collections/SalesCompanies'
import { SavedListings } from './src/collections/SavedListings'
import { supabaseStorageAdapter } from './src/collections/storage/supabase-storage-adapter'
import { TeamMembers } from './src/collections/TeamMembers'
import { Users } from './src/collections/Users'
import { SiteSettings } from './src/globals/SiteSettings'

const dirname = path.dirname(fileURLToPath(import.meta.url))

export default buildConfig({
  serverURL: process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000',
  secret: process.env.PAYLOAD_SECRET || '',
  // Mounted away from the existing app's own /admin and /api — see
  // docs/supabase-workflow.md and the "Payload CMS backend" plan notes.
  admin: {
    user: Users.slug,
    importMap: { baseDir: dirname },
  },
  // Top-level `routes` controls the base mount paths (admin panel, REST/
  // GraphQL API) — kept away from the existing app's own /admin and /api.
  // (`admin.routes.*` below would instead configure sub-paths *within* the
  // panel, like login/logout — not used here.)
  routes: { admin: '/cms', api: '/payload-api' },
  collections: [
    Users,
    Developers,
    Projects,
    Lands,
    ConstructionCompanies,
    MarketingCompanies,
    SalesCompanies,
    Architects,
    InteriorDesigners,
    Neighborhoods,
    HeroSlides,
    SavedListings,
    Leads,
    Analytics,
    Payments,
    PlacementPricing,
    TeamMembers,
    Articles,
    Media,
  ],
  globals: [SiteSettings],
  endpoints: [analyticsEndpoint],
  editor: lexicalEditor(),
  db: postgresAdapter({
    pool: { connectionString: process.env.DATABASE_URI },
    // Dedicated schema so Payload's tables never collide with (or touch)
    // the existing public.* Supabase tables/RLS policies/triggers.
    schemaName: 'payload',
  }),
  plugins: [
    cloudStoragePlugin({
      collections: {
        media: {
          adapter: supabaseStorageAdapter(),
          // Files live only in Supabase Storage, not also on local disk —
          // needed for this to work on Vercel's read-only/ephemeral
          // filesystem in production.
          disableLocalStorage: true,
        },
      },
    }),
  ],
  email: nodemailerAdapter({
    defaultFromAddress: process.env.EMAIL_FROM || 'no-reply@lankanewhomes.com',
    defaultFromName: 'LankaNewHomes',
    transportOptions: {
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
    },
  }),
  typescript: {
    outputFile: path.resolve(dirname, 'src/payload-types.ts'),
  },
})
