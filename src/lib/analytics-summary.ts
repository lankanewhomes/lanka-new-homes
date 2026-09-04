import type { Payload, Where } from 'payload'
import { ANALYTICS_EVENT_TYPES } from '@/collections/Analytics'

export type AnalyticsBreakdownRow = { key: string; label: string; count: number; percent: number }
export type ListingBreakdownRow = { projectId: string | number; projectName: string; projectSlug: string; total: number; byType: Record<string, number> }
export type DeveloperBreakdownRow = { developerId: string | number; developerName: string; total: number; byType: Record<string, number> }
export type TrendPoint = { date: string; count: number }

export type AnalyticsSummaryResponse = {
  range: { startDate: string; endDate: string }
  totalEvents: number
  byType: AnalyticsBreakdownRow[]
  trafficSources: AnalyticsBreakdownRow[]
  adSources: AnalyticsBreakdownRow[]
  deviceTypes: AnalyticsBreakdownRow[]
  byListing: ListingBreakdownRow[]
  byDeveloper?: DeveloperBreakdownRow[]
  trend: TrendPoint[]
}

const EVENT_TYPE_LABELS: Record<string, string> = Object.fromEntries(ANALYTICS_EVENT_TYPES.map((t) => [t.value, t.label]))

// getTrafficSource() (src/lib/ga4.ts) already distinguishes paid vs organic
// and Google vs Meta at collection time — paid_search only ever comes from
// a Google-tagged UTM (utm_source containing "google" + a paid medium),
// paid_social from a Facebook/Instagram/Meta-tagged one. Nothing new to
// collect, just a friendlier label for what's already stored.
const TRAFFIC_SOURCE_LABELS: Record<string, string> = {
  organic_search: 'Organic search',
  organic_social: 'Organic social (Facebook/Instagram, unpaid)',
  paid_search: 'Google Ads',
  paid_social: 'Facebook & Instagram Ads',
  referral: 'Referral',
  direct: 'Direct',
}

const AD_SOURCE_LABELS: Record<string, string> = {
  paid_search: 'Google Ads',
  paid_social: 'Facebook & Instagram Ads',
}

function relId(value: unknown): string | number | undefined {
  if (value && typeof value === 'object' && 'id' in value) return (value as { id: string | number }).id
  return value as string | number | undefined
}

function toRows(counts: Map<string, number>, total: number, labels?: Record<string, string>): AnalyticsBreakdownRow[] {
  return Array.from(counts.entries())
    .map(([key, count]) => ({ key, label: labels?.[key] ?? key, count, percent: total > 0 ? Math.round((count / total) * 1000) / 10 : 0 }))
    .sort((a, b) => b.count - a.count)
}

// Reads Payload's own `analytics` collection directly (not GA4) — real
// events, no reporting lag, and it's the same data already backing
// Projects' view_count/save_count/etc counters. Replaces the raw per-event
// table the /cms Analytics list used to show with an aggregated dashboard,
// same idea as ListingAnalyticsPanel but across a whole portfolio instead
// of one listing at a time.
export async function buildAnalyticsSummary(
  payload: Payload,
  opts: { projectIds?: (string | number)[]; startDate: string; endDate: string; includeByDeveloper?: boolean },
): Promise<AnalyticsSummaryResponse> {
  const { projectIds, startDate, endDate, includeByDeveloper } = opts

  const where: Where = {
    is_duplicate: { equals: false },
    is_bot: { equals: false },
    timestamp: { greater_than_equal: `${startDate}T00:00:00.000Z`, less_than_equal: `${endDate}T23:59:59.999Z` },
  }
  if (projectIds) where.project = { in: projectIds }

  const { docs } = await payload.find({
    collection: 'analytics',
    where,
    limit: 20000,
    depth: 1,
    overrideAccess: true,
    sort: '-timestamp',
  })

  const byTypeCounts = new Map<string, number>()
  const trafficSourceCounts = new Map<string, number>()
  const deviceTypeCounts = new Map<string, number>()
  const trendCounts = new Map<string, number>()
  const listingMap = new Map<string, ListingBreakdownRow>()
  const developerMap = new Map<string, DeveloperBreakdownRow>()

  for (const doc of docs) {
    const eventType = String(doc.event_type ?? 'unknown')
    byTypeCounts.set(eventType, (byTypeCounts.get(eventType) ?? 0) + 1)

    const source = (doc.traffic_source as string | null) || 'direct'
    trafficSourceCounts.set(source, (trafficSourceCounts.get(source) ?? 0) + 1)

    const device = (doc.device_type as string | null) || 'unknown'
    deviceTypeCounts.set(device, (deviceTypeCounts.get(device) ?? 0) + 1)

    const day = typeof doc.timestamp === 'string' ? doc.timestamp.slice(0, 10) : null
    if (day) trendCounts.set(day, (trendCounts.get(day) ?? 0) + 1)

    const project = doc.project as { id?: string | number; name?: string; slug?: string } | string | number | null
    const projectId = relId(project)
    if (projectId != null) {
      const key = String(projectId)
      const existing = listingMap.get(key) ?? {
        projectId,
        projectName: typeof project === 'object' && project ? (project.name ?? 'Untitled') : 'Untitled',
        projectSlug: typeof project === 'object' && project ? (project.slug ?? '') : '',
        total: 0,
        byType: {},
      }
      existing.total += 1
      existing.byType[eventType] = (existing.byType[eventType] ?? 0) + 1
      listingMap.set(key, existing)
    }

    if (includeByDeveloper) {
      const developer = doc.developer as { id?: string | number; name?: string } | string | number | null
      const developerId = relId(developer)
      if (developerId != null) {
        const key = String(developerId)
        const existing = developerMap.get(key) ?? {
          developerId,
          developerName: typeof developer === 'object' && developer ? (developer.name ?? 'Unknown') : 'Unknown',
          total: 0,
          byType: {},
        }
        existing.total += 1
        existing.byType[eventType] = (existing.byType[eventType] ?? 0) + 1
        developerMap.set(key, existing)
      }
    }
  }

  const totalEvents = docs.length
  const trend: TrendPoint[] = Array.from(trendCounts.entries())
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([date, count]) => ({ date, count }))

  const adSourceCounts = new Map<string, number>()
  for (const key of Object.keys(AD_SOURCE_LABELS)) {
    const count = trafficSourceCounts.get(key)
    if (count) adSourceCounts.set(key, count)
  }

  return {
    range: { startDate, endDate },
    totalEvents,
    byType: toRows(byTypeCounts, totalEvents, EVENT_TYPE_LABELS),
    trafficSources: toRows(trafficSourceCounts, totalEvents, TRAFFIC_SOURCE_LABELS),
    adSources: toRows(adSourceCounts, totalEvents, AD_SOURCE_LABELS),
    deviceTypes: toRows(deviceTypeCounts, totalEvents),
    byListing: Array.from(listingMap.values()).sort((a, b) => b.total - a.total),
    byDeveloper: includeByDeveloper ? Array.from(developerMap.values()).sort((a, b) => b.total - a.total) : undefined,
    trend,
  }
}
