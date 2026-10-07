// GA4 Data API over plain HTTPS (service-account JWT signed with Web Crypto + fetch) instead of the gRPC client library
// (@google-analytics/data). That library builds code at runtime (protobufjs codegen), which Cloudflare Workers forbid, and it
// crashed the /cms dashboard there. This version runs identically on Node (Vercel) and Workers.
let configWarned = false;
let cachedToken: { value: string; expiresAt: number } | null = null;

export function isGa4DataApiConfigured(): boolean {
  return Boolean(process.env.GA4_PROPERTY_ID && process.env.GA4_SERVICE_ACCOUNT_EMAIL && process.env.GA4_SERVICE_ACCOUNT_PRIVATE_KEY);
}

const base64Url = (input: ArrayBuffer | string): string => {
  const bytes = typeof input === "string" ? new TextEncoder().encode(input) : new Uint8Array(input);
  let binary = "";
  bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};

async function getAccessToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) return cachedToken.value;

  const clientEmail = process.env.GA4_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GA4_SERVICE_ACCOUNT_PRIVATE_KEY;
  if (!clientEmail || !privateKey) {
    throw new Error("Missing GA4_SERVICE_ACCOUNT_EMAIL or GA4_SERVICE_ACCOUNT_PRIVATE_KEY — see docs/analytics.md");
  }

  // .env files can't hold real newlines in a value — the key is stored with literal "\n" sequences and unescaped here.
  const pem = privateKey.replace(/\\n/g, "\n");
  const der = Uint8Array.from(atob(pem.replace(/-----[A-Z ]+-----/g, "").replace(/\s+/g, "")), (c) => c.charCodeAt(0));
  const key = await crypto.subtle.importKey("pkcs8", der, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["sign"]);

  const now = Math.floor(Date.now() / 1000);
  const unsigned = `${base64Url(JSON.stringify({ alg: "RS256", typ: "JWT" }))}.${base64Url(
    JSON.stringify({ iss: clientEmail, scope: "https://www.googleapis.com/auth/analytics.readonly", aud: "https://oauth2.googleapis.com/token", iat: now, exp: now + 3600 }),
  )}`;
  const signature = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, new TextEncoder().encode(unsigned));
  const assertion = `${unsigned}.${base64Url(signature)}`;

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion }),
  });
  if (!response.ok) throw new Error(`Google token request failed (${response.status})`);
  const json = (await response.json()) as { access_token: string; expires_in: number };
  cachedToken = { value: json.access_token, expiresAt: Date.now() + json.expires_in * 1000 };
  return cachedToken.value;
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
    const token = await getAccessToken();
    const httpResponse = await fetch(`https://analyticsdata.googleapis.com/v1beta/${getPropertyPath()}:runReport`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        dateRanges: [{ startDate: args.startDate, endDate: args.endDate }],
        dimensions: args.dimensions.map((name) => ({ name })),
        metrics: args.metrics.map((name) => ({ name })),
        limit: args.limit,
        orderBys: args.orderByMetric ? [{ metric: { metricName: args.orderByMetric }, desc: true }] : undefined,
        dimensionFilter: buildFilterExpression(args.filters),
      }),
    });
    if (!httpResponse.ok) throw new Error(`GA4 runReport failed (${httpResponse.status}): ${(await httpResponse.text()).slice(0, 300)}`);
    const response = (await httpResponse.json()) as {
      rows?: { dimensionValues?: { value?: string }[]; metricValues?: { value?: string }[] }[];
    };

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
