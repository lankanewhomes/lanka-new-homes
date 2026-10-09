import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { postgresAdapter } from '@payloadcms/db-postgres'
import { resendEmailAdapter } from './src/lib/mailer'
import { cloudStoragePlugin } from '@payloadcms/plugin-cloud-storage'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { buildConfig } from 'payload'

import { Analytics } from './src/collections/Analytics'
import { analyticsEndpoint, analyticsSummaryEndpoint } from './src/collections/endpoints/analytics'
import { importListingEndpoint } from './src/collections/endpoints/import-listing'
import { listingTodoEndpoint } from './src/collections/endpoints/listing-todo'
import { leadActivityEndpoint } from './src/collections/endpoints/lead-activity'
import { socialPostEndpoint, socialStatusEndpoint } from './src/collections/endpoints/social-post'
import { AddonRequests } from './src/collections/AddonRequests'
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
import { PlanWaitlist } from './src/collections/PlanWaitlist'
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

// Cloudflare Workers opens a brand-new database connection for every query (see maxUses below), so the 15-slot
// session-mode pooler (port 5432) runs out as soon as an admin page fires a few queries at once -> "This page couldn't
// load". Supabase's transaction-mode pooler (port 6543) shares backends between queries and has no such cap. Tested
// read-only against 14 collections in parallel. Node/Vercel keeps the connection string exactly as configured.
const onWorkers = typeof navigator !== 'undefined' && navigator.userAgent === 'Cloudflare-Workers'
const databaseUri = onWorkers ? process.env.DATABASE_URI?.replace(/(\.pooler\.supabase\.com):5432\//, '$1:6543/') : process.env.DATABASE_URI

export default buildConfig({
  serverURL: process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000',
  secret: process.env.PAYLOAD_SECRET || '',
  // Mounted away from the existing app's own /admin and /api — see
  // docs/supabase-workflow.md and the "Payload CMS backend" plan notes.
  admin: {
    // The admin is designed as black-on-white. Payload's dark theme turned cards/rows dark while text stayed dark (unreadable).
    theme: 'light',
    user: Users.slug,
    importMap: { baseDir: dirname },
    components: {
      // Real LankaNewHomes wordmark on the login / forgot / reset pages instead of the Payload logo.
      graphics: { Logo: '@/components/payload/AdminLogo#AdminLogo' },
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
    AddonRequests,
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
    PlanWaitlist,
    TeamMembers,
    Articles,
    Media,
  ],
  globals: [SiteSettings, LeadAlertSettings],
  endpoints: [analyticsEndpoint, analyticsSummaryEndpoint, importListingEndpoint, listingTodoEndpoint, leadActivityEndpoint, socialStatusEndpoint, socialPostEndpoint],
  editor: lexicalEditor(),
  db: postgresAdapter({
    pool: {
      // On Cloudflare the Worker entry stores Hyperdrive's connection string per request (cloudflare/worker.js); read lazily
      // when the pool is created. Everywhere else (local, Node) this is the normal DATABASE_URI.
      get connectionString() {
        return (globalThis as { __cfHyperdriveUrl?: string }).__cfHyperdriveUrl || databaseUri
      },
      // DATABASE_URI points at Supabase's SESSION-mode pooler (port 5432),
      // which has a small hard client cap (15 backends on this project's
      // compute size — see `select ... from pg_stat_activity` grouped by
      // application_name = 'Supavisor'). node-postgres' default `max` is
      // 10, so ONE serverless instance running the admin dashboard's
      // parallel count() queries can grab most of that cap, and Vercel
      // instances that go idle keep their pooled connections open while
      // suspended. When the cap is hit, the next cold start can't connect,
      // Payload's root layout throws, and /cms/login shows Next's "This
      // page couldn't load — ERROR <digest>" screen until a reload lands on
      // a free slot (intermittent, worst right after deploys). Keep each
      // instance small and release idle connections quickly. Queries just
      // queue for a free connection; connectionTimeoutMillis bounds the
      // worst-case wait so a stuck request fails loudly instead of hanging.
      // Override with DATABASE_POOL_MAX if the pooler's pool size is raised
      // in the Supabase dashboard.
      max: Number(process.env.DATABASE_POOL_MAX) || 4,
      idleTimeoutMillis: 5_000,
      connectionTimeoutMillis: 20_000,
      // Cloudflare Workers: a TCP connection opened during one request cannot be used by another request (the second
      // request hangs: "Worker's code had hung"). maxUses: 1 closes every connection after a single use so the pool always
      // opens a fresh one inside the current request. Vercel/Node keeps normal pooling.
      ...(typeof navigator !== 'undefined' && navigator.userAgent === 'Cloudflare-Workers' ? { maxUses: 1 } : {}),
    },
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
  // Resend over HTTPS — SMTP connections hang on Cloudflare Workers (see src/lib/mailer.ts).
  email: resendEmailAdapter,
  typescript: {
    outputFile: path.resolve(dirname, 'src/payload-types.ts'),
  },
})
