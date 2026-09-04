import type { Payload } from "payload";
import { isGa4DataApiConfigured, runGa4Report } from "@/lib/ga4-data-client";
import { LEAD_STATUS_OPTIONS } from "@/collections/Leads";
import type { LeadStatusRow, ListingAnalyticsResponse, TrafficSourceRow, TrendPoint } from "@/lib/analytics-types";

const CHANNEL_LABELS: Record<string, string> = {
  "Organic Search": "Organic search",
  "Organic Social": "Organic social",
  "Paid Search": "Paid search / Google Ads",
  "Paid Social": "Paid social / Facebook Ads",
  Referral: "Referral",
  Direct: "Direct",
  Email: "Email",
  Unassigned: "Other",
};

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function parseGa4Date(value: string): Date {
  // GA4's `date` dimension returns "YYYYMMDD" with no separators.
  const year = Number(value.slice(0, 4));
  const month = Number(value.slice(4, 6)) - 1;
  const day = Number(value.slice(6, 8));
  return new Date(Date.UTC(year, month, day));
}

function getWeekKey(date: Date): string {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const isoDay = d.getUTCDay() || 7; // Sunday(0) -> 7, so weeks start Monday
  d.setUTCDate(d.getUTCDate() - isoDay + 1);
  return d.toISOString().slice(0, 10);
}

function getMonthKey(date: Date): string {
  return date.toISOString().slice(0, 7);
}

function bucketKey(date: Date, bucket: "week" | "month"): string {
  return bucket === "week" ? getWeekKey(date) : getMonthKey(date);
}

export type AnalyticsRange = { startDate: string; endDate: string; bucket: "week" | "month" };

export type AnalyticsSubjectProject = { id: string | number; slug: string; name: string; developer: string | number };

export async function buildListingAnalyticsReport(
  payload: Payload,
  project: AnalyticsSubjectProject,
  range: AnalyticsRange,
): Promise<ListingAnalyticsResponse> {
  const ga4Configured = isGa4DataApiConfigured();
  const { startDate, endDate, bucket } = range;

  const [viewsRows, engagementRows, trafficRows, cityRows, viewTrendRows, platformViewsRows] = await Promise.all([
    runGa4Report({
      startDate,
      endDate,
      dimensions: [],
      metrics: ["eventCount"],
      filters: [
        { field: "customEvent:listing_id", value: project.slug },
        { field: "eventName", value: "view_listing" },
      ],
    }),
    runGa4Report({
      startDate,
      endDate,
      dimensions: [],
      metrics: ["averageSessionDuration", "screenPageViewsPerSession"],
      filters: [{ field: "customEvent:listing_id", value: project.slug }],
    }),
    runGa4Report({
      startDate,
      endDate,
      dimensions: ["sessionDefaultChannelGroup"],
      metrics: ["sessions"],
      filters: [{ field: "customEvent:listing_id", value: project.slug }],
    }),
    runGa4Report({
      startDate,
      endDate,
      dimensions: ["city"],
      metrics: ["activeUsers"],
      filters: [{ field: "customEvent:listing_id", value: project.slug }],
      orderByMetric: "activeUsers",
      limit: 1,
    }),
    runGa4Report({
      startDate,
      endDate,
      dimensions: ["date"],
      metrics: ["eventCount"],
      filters: [
        { field: "customEvent:listing_id", value: project.slug },
        { field: "eventName", value: "view_listing" },
      ],
    }),
    runGa4Report({
      startDate,
      endDate,
      dimensions: [],
      metrics: ["eventCount"],
      filters: [{ field: "eventName", value: "view_listing" }],
    }),
  ]);

  const views = Math.round(viewsRows[0]?.metricValues[0] ?? 0);
  const avgTimeOnPageSeconds = engagementRows[0] ? Math.round(engagementRows[0].metricValues[0] ?? 0) : null;
  const pagesPerSession = engagementRows[0] ? Number((engagementRows[0].metricValues[1] ?? 0).toFixed(2)) : null;
  const topCity = cityRows[0]?.dimensionValues[0] || null;
  const platformViews = Math.round(platformViewsRows[0]?.metricValues[0] ?? 0);

  const totalSessions = trafficRows.reduce((sum, row) => sum + row.metricValues[0], 0);
  const trafficSources: TrafficSourceRow[] = trafficRows
    .map((row) => {
      const channel = row.dimensionValues[0] || "Unassigned";
      const sessions = Math.round(row.metricValues[0] ?? 0);
      return {
        channel,
        label: CHANNEL_LABELS[channel] ?? channel,
        sessions,
        percent: totalSessions > 0 ? Math.round((sessions / totalSessions) * 1000) / 10 : 0,
      };
    })
    .sort((a, b) => b.sessions - a.sessions);

  // Leads (Payload's own collection is the authoritative count for
  // inquiries — GA4's client-side generate_lead event can undercount from
  // ad blockers/consent declines, so it's used only for traffic-source
  // attribution above, never as the inquiry total).
  const [leadsInRange, allLeadsForProject, platformLeadsInRange, listingCountResult] = await Promise.all([
    payload.count({
      collection: "leads",
      where: { project: { equals: project.id }, createdAt: { greater_than_equal: startDate, less_than_equal: endDate } },
      overrideAccess: true,
    }),
    payload.find({
      collection: "leads",
      where: { project: { equals: project.id } },
      limit: 2000,
      depth: 0,
      overrideAccess: true,
    }),
    payload.count({
      collection: "leads",
      where: { createdAt: { greater_than_equal: startDate, less_than_equal: endDate } },
      overrideAccess: true,
    }),
    payload.count({ collection: "projects", overrideAccess: true }),
  ]);

  const inquiries = leadsInRange.totalDocs;
  const inquiryRate = views > 0 ? inquiries / views : 0;
  const listingCount = Math.max(listingCountResult.totalDocs, 1);
  const platformInquiries = platformLeadsInRange.totalDocs;
  const platformInquiryRate = platformViews > 0 ? platformInquiries / platformViews : 0;

  // Lead status breakdown — all-time for this project (not date-range
  // scoped), since a lead's current status reflects where it stands today
  // regardless of when it originally came in.
  const statusCounts = new Map<string, number>();
  for (const option of LEAD_STATUS_OPTIONS) statusCounts.set(option.value, 0);
  for (const doc of allLeadsForProject.docs) {
    const status = typeof doc.status === "string" ? doc.status : "new";
    statusCounts.set(status, (statusCounts.get(status) ?? 0) + 1);
  }
  const leadStatus: LeadStatusRow[] = LEAD_STATUS_OPTIONS.map((option) => ({
    status: option.value as LeadStatusRow["status"],
    label: option.label,
    count: statusCounts.get(option.value) ?? 0,
  }));

  // Trend — merge GA4's view counts and Payload's inquiry counts (this
  // project's leads within range) into the same week/month buckets.
  const trendMap = new Map<string, { views: number; inquiries: number }>();
  for (const row of viewTrendRows) {
    const date = parseGa4Date(row.dimensionValues[0]);
    const key = bucketKey(date, bucket);
    const entry = trendMap.get(key) ?? { views: 0, inquiries: 0 };
    entry.views += Math.round(row.metricValues[0] ?? 0);
    trendMap.set(key, entry);
  }
  for (const doc of allLeadsForProject.docs) {
    const createdAt = typeof doc.createdAt === "string" ? new Date(doc.createdAt) : null;
    if (!createdAt || createdAt < new Date(startDate) || createdAt > new Date(endDate)) continue;
    const key = bucketKey(createdAt, bucket);
    const entry = trendMap.get(key) ?? { views: 0, inquiries: 0 };
    entry.inquiries += 1;
    trendMap.set(key, entry);
  }
  const trend: TrendPoint[] = Array.from(trendMap.entries())
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([period, values]) => ({ period, ...values }));

  // Insights.
  const topTrafficSource = trafficSources[0]?.label ?? null;
  const dayCounts = new Array(7).fill(0);
  for (const doc of allLeadsForProject.docs) {
    const createdAt = typeof doc.createdAt === "string" ? new Date(doc.createdAt) : null;
    if (!createdAt || createdAt < new Date(startDate) || createdAt > new Date(endDate)) continue;
    dayCounts[createdAt.getUTCDay()] += 1;
  }
  const maxDayCount = Math.max(...dayCounts);
  const bestDayOfWeek = maxDayCount > 0 ? DAY_NAMES[dayCounts.indexOf(maxDayCount)] : null;

  return {
    ga4Configured,
    listing: { id: project.id, slug: project.slug, name: project.name },
    range,
    summary: { views, inquiries, inquiryRate, avgTimeOnPageSeconds, pagesPerSession, topCity },
    platformAverage: {
      views: Math.round(platformViews / listingCount),
      inquiries: Math.round(platformInquiries / listingCount),
      inquiryRate: platformInquiryRate,
    },
    trafficSources,
    leadStatus,
    trend,
    insights: { topTrafficSource, bestDayOfWeek },
  };
}
