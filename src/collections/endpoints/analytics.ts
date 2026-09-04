import type { Endpoint, PayloadRequest } from 'payload'
import { getOwnedDeveloperIds, isAdmin } from '../access'
import { buildListingAnalyticsReport, type AnalyticsRange } from '@/lib/analytics-report'

const DAY_MS = 24 * 60 * 60 * 1000

function defaultRange(): { startDate: string; endDate: string } {
  const end = new Date()
  const start = new Date(end.getTime() - 28 * DAY_MS)
  return { startDate: start.toISOString().slice(0, 10), endDate: end.toISOString().slice(0, 10) }
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
