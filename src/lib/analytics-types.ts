// Shared between the Payload analytics endpoint (src/lib/analytics-report.ts)
// and the admin panel component that renders it
// (src/components/payload/ListingAnalyticsPanel.tsx) — safe for the client
// component to import since only types cross that boundary, never the
// GA4/Payload server code itself.

export type TrafficSourceRow = {
  channel: string;
  label: string;
  sessions: number;
  percent: number;
};

export type LeadStatusRow = {
  status: "new" | "contacted" | "toured" | "sold";
  label: string;
  count: number;
};

export type TrendPoint = {
  /** ISO week ("2026-W35") or month ("2026-08"), whichever `bucket` requested. */
  period: string;
  views: number;
  inquiries: number;
};

export type ListingAnalyticsResponse = {
  ga4Configured: boolean;
  listing: { id: string | number; slug: string; name: string };
  range: { startDate: string; endDate: string; bucket: "week" | "month" };
  summary: {
    views: number;
    inquiries: number;
    inquiryRate: number;
    avgTimeOnPageSeconds: number | null;
    pagesPerSession: number | null;
    topCity: string | null;
  };
  platformAverage: {
    views: number;
    inquiries: number;
    inquiryRate: number;
  };
  trafficSources: TrafficSourceRow[];
  leadStatus: LeadStatusRow[];
  trend: TrendPoint[];
  insights: {
    topTrafficSource: string | null;
    bestDayOfWeek: string | null;
  };
};

export type ListingAnalyticsError = { error: string };
