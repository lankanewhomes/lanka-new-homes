import { BetaAnalyticsDataClient } from "@google-analytics/data";

// Lazily constructed (same reasoning as supabaseAdmin in src/lib/supabase.ts):
// Next's build-time "collect page data" step imports every route module just
// to inspect it, without invoking it — a top-level client construction would
// turn a missing GA4_* env var into a hard build failure even for routes
// that only need real credentials at request time.
let client: BetaAnalyticsDataClient | null = null;
let configWarned = false;

export function isGa4DataApiConfigured(): boolean {
  return Boolean(process.env.GA4_PROPERTY_ID && process.env.GA4_SERVICE_ACCOUNT_EMAIL && process.env.GA4_SERVICE_ACCOUNT_PRIVATE_KEY);
}

function getClient(): BetaAnalyticsDataClient {
  if (client) return client;

  const clientEmail = process.env.GA4_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GA4_SERVICE_ACCOUNT_PRIVATE_KEY;
  if (!clientEmail || !privateKey) {
    throw new Error("Missing GA4_SERVICE_ACCOUNT_EMAIL or GA4_SERVICE_ACCOUNT_PRIVATE_KEY — see docs/analytics.md");
  }

  client = new BetaAnalyticsDataClient({
    credentials: {
      client_email: clientEmail,
      // .env files can't hold real newlines in a value — the key is stored
      // with literal "\n" sequences and unescaped here, same convention as
      // most GA4/Firebase service-account env setups.
      private_key: privateKey.replace(/\\n/g, "\n"),
    },
  });
  return client;
}

function getPropertyPath(): string {
  const propertyId = process.env.GA4_PROPERTY_ID;
  if (!propertyId) throw new Error("Missing GA4_PROPERTY_ID — see docs/analytics.md");
  return propertyId.startsWith("properties/") ? propertyId : `properties/${propertyId}`;
}

function buildFilterExpression(filters: { field: string; value: string }[] | undefined) {
  if (!filters || filters.length === 0) return undefined;
  const expressions = filters.map((f) => ({
    filter: { fieldName: f.field, stringFilter: { matchType: "EXACT" as const, value: f.value } },
  }));
  return expressions.length === 1 ? expressions[0] : { andGroup: { expressions } };
}

export type RunReportArgs = {
  startDate: string;
  endDate: string;
  dimensions: string[];
  metrics: string[];
  /**
   * AND-combined exact-match filters, e.g. [{ field: "customEvent:listing_id", value: slug },
   * { field: "eventName", value: "view_listing" }]. Use "customEvent:<param>" for a custom
   * event parameter (must be registered as a GA4 custom dimension first — see docs/analytics.md)
   * or a bare GA4 dimension name (eventName, sessionDefaultChannelGroup, city, date, ...).
   */
  filters?: { field: string; value: string }[];
  limit?: number;
  orderByMetric?: string;
};

export type Ga4ReportRow = {
  dimensionValues: string[];
  metricValues: number[];
};

// Thin, typed wrapper around runReport — every caller in this codebase goes
// through this so the listing_id filter (the one thing every report in this
// feature needs) is built consistently in one place. Requires a GA4 event-
// scoped custom dimension named "listing_id" to already be registered in the
// property (Admin > Custom definitions) — see docs/analytics.md.
export async function runGa4Report(args: RunReportArgs): Promise<Ga4ReportRow[]> {
  if (!isGa4DataApiConfigured()) return [];

  try {
    const [response] = await getClient().runReport({
      property: getPropertyPath(),
      dateRanges: [{ startDate: args.startDate, endDate: args.endDate }],
      dimensions: args.dimensions.map((name) => ({ name })),
      metrics: args.metrics.map((name) => ({ name })),
      limit: args.limit,
      orderBys: args.orderByMetric
        ? [{ metric: { metricName: args.orderByMetric }, desc: true }]
        : undefined,
      dimensionFilter: buildFilterExpression(args.filters),
    });

    return (response.rows ?? []).map((row) => ({
      dimensionValues: (row.dimensionValues ?? []).map((v) => v.value ?? ""),
      metricValues: (row.metricValues ?? []).map((v) => Number(v.value ?? 0)),
    }));
  } catch (error) {
    if (!configWarned) {
      configWarned = true;
      console.error("GA4 Data API request failed — check GA4_PROPERTY_ID / service account access", error);
    }
    return [];
  }
}
