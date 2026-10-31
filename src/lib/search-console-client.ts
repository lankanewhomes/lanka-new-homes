import { getGoogleAccessToken, isGa4DataApiConfigured } from "@/lib/ga4-data-client";

// Google Search Console (the real search words people typed on Google before they clicked through to the site). GA4 hides these.
// Uses the same read-only service account as the GA4 reports. It only works after two one-time steps on Google's side:
//   1. the "Google Search Console API" is switched on for the service account's Google Cloud project, and
//   2. the service account's email is added as a (restricted, read-only) user of the site in Search Console.
// Until then `status` says which step is missing, and the keywords page shows it in plain words.

const SCOPE = "https://www.googleapis.com/auth/webmasters.readonly";
const SITES = () => [process.env.SEARCH_CONSOLE_SITE, "sc-domain:lankanewhomes.com", "https://www.lankanewhomes.com/", "https://lankanewhomes.com/"].filter((s): s is string => Boolean(s));

export type SearchConsoleRow = { key: string; clicks: number; impressions: number; ctr: number; position: number };
export type SearchConsoleResult =
  | { status: "ready"; site: string; rows: SearchConsoleRow[] }
  | { status: "not_configured" | "api_disabled" | "no_access" | "error"; message: string; serviceAccount?: string; enableUrl?: string };

export async function getSearchConsoleRows(args: { startDate: string; endDate: string; dimension: "query" | "page" | "country" | "device"; limit?: number }): Promise<SearchConsoleResult> {
  if (!isGa4DataApiConfigured()) return { status: "not_configured", message: "The Google service account is not set up on this server." };
  const serviceAccount = process.env.GA4_SERVICE_ACCOUNT_EMAIL;
  try {
    const token = await getGoogleAccessToken(SCOPE);
    let lastDenied = "";
    for (const site of SITES()) {
      const response = await fetch(`https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(site)}/searchAnalytics/query`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ startDate: args.startDate, endDate: args.endDate, dimensions: [args.dimension], rowLimit: args.limit ?? 100, dataState: "all" }),
      });
      if (response.ok) {
        const json = (await response.json()) as { rows?: { keys: string[]; clicks: number; impressions: number; ctr: number; position: number }[] };
        return { status: "ready", site, rows: (json.rows ?? []).map((r) => ({ key: r.keys[0] ?? "", clicks: r.clicks, impressions: r.impressions, ctr: r.ctr, position: r.position })) };
      }
      const text = await response.text();
      if (response.status === 403 && /has not been used|is disabled|SERVICE_DISABLED/i.test(text)) {
        const enableUrl = text.match(/https:\/\/console\.developers\.google\.com\/apis\/api\/searchconsole[^\s"\\]*/)?.[0];
        return { status: "api_disabled", message: "The Google Search Console API is switched off for this Google Cloud project.", serviceAccount, enableUrl };
      }
      if (response.status === 403 || response.status === 404) { lastDenied = text; continue; }
      return { status: "error", message: `Google answered ${response.status}: ${text.slice(0, 200)}`, serviceAccount };
    }
    return { status: "no_access", message: lastDenied ? "Google does not let this service account see the site yet." : "No site found.", serviceAccount };
  } catch (error) {
    return { status: "error", message: error instanceof Error ? error.message : "Could not reach Google.", serviceAccount };
  }
}
