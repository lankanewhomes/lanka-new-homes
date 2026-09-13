import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { postgresAdapter } from '@payloadcms/db-postgres'
import { nodemailerAdapter } from '@payloadcms/email-nodemailer'
import { cloudStoragePlugin } from '@payloadcms/plugin-cloud-storage'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { buildConfig } from 'payload'

import { Analytics } from './src/collections/Analytics'
import { analyticsEndpoint, analyticsSummaryEndpoint } from './src/collections/endpoints/analytics'
import { importListingEndpoint } from './src/collections/endpoints/import-listing'
import { listingTodoEndpoint } from './src/collections/endpoints/listing-todo'
import { leadActivityEndpoint } from './src/collections/endpoints/lead-activity'
import { socialPostEndpoint, socialStatusEndpoint } from './src/collections/endpoints/social-post'
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
import { Reviews } from './src/collections/Reviews'
import { SalesCompanies } from './src/collections/SalesCompanies'
import { SavedListings } from './src/collections/SavedListings'
import { SeoKeywords } from './src/collections/SeoKeywords'
import { SocialAssets } from './src/collections/SocialAssets'
import { SocialPosts } from './src/collections/SocialPosts'
import { Subscriptions } from './src/collections/Subscriptions'
import { isR2Configured, r2Storage } from './src/collections/storage/r2-storage'
import { supabaseStorageAdapter } from './src/collections/storage/supabase-storage-adapter'
import { TeamMembers } from './src/collections/TeamMembers'
import { Users } from './src/collections/Users'
import { SiteSettings } from './src/globals/SiteSettings'
import { LeadAlertSettings } from './src/globals/LeadAlertSettings'

const dirname = path.dirname(fileURLToPath(import.meta.url))

export default buildConfig({
  serverURL: process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000',
  secret: process.env.PAYLOAD_SECRET || '',
  // Mounted away from the existing app's own /admin and /api — see
  // docs/supabase-workflow.md and the "Payload CMS backend" plan notes.
  admin: {
    user: Users.slug,
    importMap: { baseDir: dirname },
    components: {
      // Full custom sidebar (see docs/design.md "LankaNewHomes admin
      // redesign") — regroups every existing collection/global into the
      // requested IA. Reads Payload's own `visibleEntities` (already
      // permission-filtered by each collection's existing access/hidden
      // rules) rather than reimplementing any access logic.
      Nav: '@/components/payload/AdminNav#AdminNav',
      // Payload's default logout is a small icon at the bottom of the left
      // sidebar — this adds a conventional top-right "Account / Log out"
      // menu alongside it (doesn't replace the sidebar one).
      header: [
        '@/components/payload/TopRightAccountMenu#TopRightAccountMenu',
        '@/components/payload/FloatingSaveBar#FloatingSaveBar',
        '@/components/payload/StatusVerificationStyles#StatusVerificationStyles',
      ],
      // "Admin Dashboard" / "Developer Dashboard" heading on the /cms
      // landing page itself, so it's obvious at a glance which account
      // you're signed in as — same list of collections either way, just a
      // label (the real scoping is baseListFilter/hiddenUnlessAdmin).
      beforeDashboard: [
        '@/components/payload/DashboardHeading#DashboardHeading',
        '@/components/payload/LeadAlertModeBanner#LeadAlertModeBanner',
        '@/components/payload/ListingTodoPanel#ListingTodoPanel',
      ],
      // "✨ Get Featured" link into the placements wizard below — developer
      // accounts only (see NavPlacementLink.tsx).
      afterNavLinks: [
        '@/components/payload/NavPlacementLink#NavPlacementLink',
        '@/components/payload/NavImportLink#NavImportLink',
        '@/components/payload/NavLeadActivityLink#NavLeadActivityLink',
      ],
      views: {
        // Replaces Payload's default dashboard entirely — see AdminDashboard.tsx.
        // Renders LeadAlertModeBanner/ListingTodoPanel itself (they normally
        // come from the beforeDashboard slot below, which only the *default*
        // dashboard composes) — nothing from beforeDashboard is lost.
        dashboard: {
          Component: '@/components/payload/AdminDashboard#AdminDashboard',
        },
        // "Import from your website": paste a project URL / upload a
        // brochure, get an unpublished draft — see ImportListing.tsx and
        // src/collections/endpoints/import-listing.ts.
        importListing: {
          Component: '@/components/payload/ImportListing#ImportListing',
          path: '/import',
        },
        // Admin-only "what's happening with leads": alerts sent, replies,
        // response times, per-developer scoreboard — see LeadActivity.tsx and
        // src/collections/endpoints/lead-activity.ts.
        leadActivity: {
          Component: '@/components/payload/LeadActivity#LeadActivity',
          path: '/lead-activity',
        },
        // Step-by-step "choose a placement, submit a request" flow for
        // developers — see PlacementPicker.tsx. Payment stays request-only
        // (creates a pending Payments record an admin confirms manually)
        // until a real payment gateway is wired up.
        placements: {
          Component: '@/components/payload/PlacementPicker#PlacementPicker',
          path: '/placements',
        },
        // Real billing summary (Subscriptions collection + packages.ts) —
        // admin-only, see BillingOverview.tsx.
        billingOverview: {
          Component: '@/components/payload/BillingOverview#BillingOverview',
          path: '/billing',
        },
        // A developer's own subscriptions across all their projects — see
        // MyBilling.tsx.
        myBilling: {
          Component: '@/components/payload/MyBilling#MyBilling',
          path: '/my-billing',
        },
      },
    },
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
    SocialAssets,
    SocialPosts,
    SeoKeywords,
    Subscriptions,
    Leads,
    Reviews,
    Analytics,
    Payments,
    PlacementPricing,
    TeamMembers,
    Articles,
    Media,
  ],
  globals: [SiteSettings, LeadAlertSettings],
  endpoints: [analyticsEndpoint, analyticsSummaryEndpoint, importListingEndpoint, listingTodoEndpoint, leadActivityEndpoint, socialStatusEndpoint, socialPostEndpoint],
  editor: lexicalEditor(),
  db: postgresAdapter({
    pool: { connectionString: process.env.DATABASE_URI },
    // Dedicated schema so Payload's tables never collide with (or touch)
    // the existing public.* Supabase tables/RLS policies/triggers.
    schemaName: 'payload',
  }),
  plugins: [
    // Media uploads go to Cloudflare R2 once the R2_* env vars are set
    // (src/collections/storage/r2-storage.ts); until then the original
    // Supabase Storage adapter stays in place so an unconfigured
    // environment still boots. Either way files live only in the bucket,
    // never on local disk — Vercel's filesystem is read-only/ephemeral.
    isR2Configured()
      ? r2Storage()
      : cloudStoragePlugin({
          collections: {
            media: {
              adapter: supabaseStorageAdapter(),
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
