import type { Endpoint, PayloadRequest } from 'payload'
import { getOwnedDeveloperIds, getOwnedProjectIds, isAdmin } from '../access'
import { buildListingAnalyticsReport, type AnalyticsRange } from '@/lib/analytics-report'
import { buildAnalyticsSummary } from '@/lib/analytics-summary'
import { buildLeadPipelineSummary } from '@/lib/lead-pipeline'
import { addDays, dayKey } from '@/lib/analytics-time'
import { isGa4DataApiConfigured, runGa4Report } from '@/lib/ga4-data-client'
import { getSearchConsoleRows } from '@/lib/search-console-client'

function defaultRange(): { startDate: string; endDate: string } {
  const endDate = dayKey()
  return { startDate: addDays(endDate, -28), endDate }
}

function parseRange(url: URL): AnalyticsRange {
  const fallback = defaultRange()
  const startDate = url.searchParams.get('startDate') || fallback.startDate
  const endDate = url.searchParams.get('endDate') || fallback.endDate
  const bucketParam = url.searchParams.get('bucket')
  const bucket = bucketParam === 'month' ? 'month' : 'week'
  return { startDate, endDate, bucket }
}

function relatedId(value: unknown): string | number | undefined {
  if (value && typeof value === 'object' && 'id' in value) {
    return (value as { id: string | number }).id
  }
  return value as string | number | undefined
}

// GET /payload-api/listing-analytics/:listingId — listingId is the Payload
// Projects document id (the analytics admin component gets this for free
// from useDocumentInfo(), no extra lookup needed). Named "listing-analytics"
// rather than "analytics" specifically to avoid colliding with the existing
// Analytics collection's own auto-generated REST routes at
// /payload-api/analytics/*. Returns ListingAnalyticsResponse
// (src/lib/analytics-types.ts). Scoped so a developer-role user only ever
// sees analytics for projects their own company owns; admins see any.
export const analyticsEndpoint: Endpoint = {
  path: '/listing-analytics/:listingId',
  method: 'get',
  handler: async (req: PayloadRequest) => {
    if (!req.user) {
      return Response.json({ error: 'Not signed in.' }, { status: 401 })
    }

    const listingId = req.routeParams?.listingId as string | undefined
    if (!listingId) {
      return Response.json({ error: 'Missing listing id.' }, { status: 400 })
    }

    const project = await req.payload.findByID({
      collection: 'projects',
      id: listingId,
      depth: 0,
      overrideAccess: true,
      req,
    })
    if (!project) {
      return Response.json({ error: 'Listing not found.' }, { status: 404 })
    }

    if (!isAdmin(req)) {
      const ownedDeveloperIds = await getOwnedDeveloperIds(req)
      const developerId = relatedId(project.developer)
      const owns = ownedDeveloperIds.some((id) => String(id) === String(developerId))
      if (!owns) {
        return Response.json({ error: "You don't have access to this listing's analytics." }, { status: 403 })
      }
    }

    const url = new URL(req.url ?? '', 'http://localhost')
    const range = parseRange(url)

    const report = await buildListingAnalyticsReport(
      req.payload,
      { id: project.id, slug: project.slug, name: project.name, developer: relatedId(project.developer) ?? '' },
      range,
    )

    return Response.json(report)
  },
}

// GET /payload-api/analytics-summary — the dashboard that replaces the
// Analytics collection's raw per-event list view (see Analytics.ts's
// admin.components.views.list). A developer sees an aggregate across their
// own portfolio (every project their company owns); an admin sees the
// whole platform plus a by-developer breakdown, gated by the same
// isAdmin() check everywhere else in this file uses.
export const analyticsSummaryEndpoint: Endpoint = {
  path: '/analytics-summary',
  method: 'get',
  handler: async (req: PayloadRequest) => {
    if (!req.user) {
      return Response.json({ error: 'Not signed in.' }, { status: 401 })
    }

    const url = new URL(req.url ?? '', 'http://localhost')
    const { startDate, endDate } = parseRange(url)
    const admin = isAdmin(req)

    const projectIds = admin ? undefined : await getOwnedProjectIds(req)
    if (!admin && (!projectIds || projectIds.length === 0)) {
      return Response.json({
        range: { startDate, endDate },
        totalEvents: 0,
        byType: [],
        trafficSources: [],
        adSources: [],
        deviceTypes: [],
        byListing: [],
        trend: [],
      })
    }

    const [summary, leads] = await Promise.all([
      buildAnalyticsSummary(req.payload, {
        projectIds,
        startDate,
        endDate,
        includeByDeveloper: admin,
      }),
      // Pipeline + response times are all-time (a lead's stage is where it
      // stands today), scoped to the same projects as the event summary.
      buildLeadPipelineSummary(req.payload, projectIds),
    ])

    return Response.json({ ...summary, leads })
  },
}

// GET /payload-api/site-report/:kind?startDate=&endDate= — the whole-site GA4 reports behind the Analytics sub-pages (events, traffic,
// pages, keywords). Admin only: GA4 numbers cover every listing, and a developer must only ever see their own. Days are GA4's own days.
// kind: events | traffic | pages | geo | on-site-search | google-queries | google-pages | bots
export const siteReportEndpoint: Endpoint = {
  path: '/site-report/:kind',
  method: 'get',
  handler: async (req: PayloadRequest) => {
    if (!req.user) return Response.json({ error: 'Not signed in.' }, { status: 401 })
    if (!isAdmin(req)) return Response.json({ error: 'Only the site admin can see site-wide reports.' }, { status: 403 })

    const kind = String(req.routeParams?.kind ?? '')
    const url = new URL(req.url ?? '', 'http://localhost')
    const { startDate, endDate } = parseRange(url)

    if (kind === 'google-queries' || kind === 'google-pages') {
      const result = await getSearchConsoleRows({ startDate, endDate, dimension: kind === 'google-queries' ? 'query' : 'page', limit: 1000 })
      return Response.json({ range: { startDate, endDate }, ...result })
    }

    // Bot visits counted by middleware.ts (table bot_daily_stats, Sri Lanka days) — see src/lib/bots.ts.
    if (kind === 'bots') {
      const { supabaseAdmin } = await import('@/lib/supabase')
      const [rows, googlebot] = await Promise.all([
        supabaseAdmin.from('bot_daily_stats').select('date, bot_name, category, action, hits, last_path, last_seen').gte('date', startDate).lte('date', endDate).limit(20000),
        supabaseAdmin.from('bot_daily_stats').select('last_seen').eq('bot_name', 'Googlebot').order('last_seen', { ascending: false }).limit(1),
      ])
      if (rows.error) return Response.json({ error: `Could not read bot visits: ${rows.error.message}` }, { status: 500 })
      return Response.json({ range: { startDate, endDate }, configured: true, rows: rows.data ?? [], googlebotLastSeen: googlebot.data?.[0]?.last_seen ?? null })
    }

    if (!isGa4DataApiConfigured()) return Response.json({ range: { startDate, endDate }, configured: false, rows: [] })
    const report = (dimensions: string[], metrics: string[], extra: { filters?: { field: string; value: string }[]; limit?: number } = {}) =>
      runGa4Report({ startDate, endDate, dimensions, metrics, orderByMetric: metrics[0], limit: extra.limit ?? 100, filters: extra.filters })

    let rows: { dimensionValues: string[]; metricValues: number[] }[] = []
    if (kind === 'events') rows = await report(['eventName'], ['eventCount', 'totalUsers'], { limit: 100 })
    else if (kind === 'traffic') rows = await report(['sessionDefaultChannelGroup', 'sessionSource', 'sessionMedium'], ['sessions', 'totalUsers', 'engagedSessions'], { limit: 100 })
    else if (kind === 'pages') rows = await report(['pagePath', 'pageTitle'], ['screenPageViews', 'activeUsers', 'userEngagementDuration'], { limit: 100 })
    else if (kind === 'geo') rows = await report(['country', 'city'], ['totalUsers', 'sessions'], { limit: 100 })
    else if (kind === 'on-site-search') rows = await report(['searchTerm'], ['eventCount', 'totalUsers'], { limit: 100 })
    else return Response.json({ error: 'Unknown report.' }, { status: 404 })

    return Response.json({ range: { startDate, endDate }, configured: true, rows })
  },
}
