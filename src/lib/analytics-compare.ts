// Side-by-side check between our own counts (Payload `analytics` collection) and Google Analytics (owner, 2026-11-03: "sync GA
// and my dashboard, same rules, side by side"). Both sides count listing page views with the same rules: one view per browser
// per listing per 30 minutes, bots and the owner's own visits left out, Sri Lanka days. Google still sees fewer, because ad
// blockers and declined cookies stop it, and our server never is. Pure helpers only, safe on the client and the server.

/** The source buckets both sides are sorted into, in display order. */
export const COMPARE_SOURCES = [
  { key: "organic_search", label: "Google and other search" },
  { key: "organic_social", label: "Facebook and Instagram (posts)" },
  { key: "paid_social", label: "Facebook and Instagram ads" },
  { key: "paid_search", label: "Google Ads" },
  { key: "referral", label: "Other websites and AI assistants" },
  { key: "email", label: "Email" },
  { key: "direct", label: "Direct (typed in, WhatsApp, apps)" },
  { key: "other", label: "Other" },
] as const;

export type CompareSourceKey = (typeof COMPARE_SOURCES)[number]["key"];

/** Our own traffic_source value -> comparison bucket. AI assistants go with referrals, because GA4 files them there. */
export function ourSourceBucket(source: string | null | undefined): CompareSourceKey {
  const s = (source || "direct").toLowerCase();
  if (s === "ai_assistant") return "referral";
  return (COMPARE_SOURCES.some((c) => c.key === s) ? s : "other") as CompareSourceKey;
}

/** GA4's Default Channel Group (sessionDefaultChannelGroup) -> comparison bucket. */
export function googleChannelBucket(channel: string | null | undefined): CompareSourceKey {
  switch ((channel || "").trim().toLowerCase()) {
    case "organic search": return "organic_search";
    case "organic social": return "organic_social";
    case "paid social": return "paid_social";
    case "paid search": return "paid_search";
    case "referral": return "referral";
    case "email": return "email";
    case "direct": return "direct";
    default: return "other"; // Unassigned, Organic Video, Display, Cross-network, ...
  }
}

export type CompareSide = { views: number; visitors: number; sources: Partial<Record<CompareSourceKey, number>> };

export type CompareRow = { key: string; label: string; ours: number; google: number | null; gapPercent: number | null };

/** How much lower (+) or higher (-) Google is than our count, in whole percent. Null when there is nothing to compare. */
export function gapPercent(ours: number, google: number | null): number | null {
  if (google === null || ours === 0) return null;
  return Math.round(((ours - google) / ours) * 100);
}

/** Rows for the side-by-side table: page views, visitors, then page views per source (sources with no views on either side are left out). */
export function buildCompareRows(ours: CompareSide, google: CompareSide | null): CompareRow[] {
  const row = (key: string, label: string, o: number, g: number | null): CompareRow => ({ key, label, ours: o, google: g, gapPercent: gapPercent(o, g) });
  const rows = [row("views", "Page views", ours.views, google?.views ?? null), row("visitors", "Visitors", ours.visitors, google?.visitors ?? null)];
  for (const s of COMPARE_SOURCES) {
    const o = ours.sources[s.key] ?? 0;
    const g = google ? (google.sources[s.key] ?? 0) : null;
    if (o === 0 && !g) continue;
    rows.push(row(`source:${s.key}`, s.label, o, g));
  }
  return rows;
}

/** Same 30-minute rule the server uses (src/collections/hooks/analytics-dedup.ts), for the browser-side GA4 / Meta view event. */
export const VIEW_REPEAT_WINDOW_MS = 30 * 60 * 1000;

/** True when a listing view should be sent to Google / Meta now, given when it was last sent from this browser (ms, or null). */
export function shouldSendBrowserView(lastSentAt: number | null, now: number): boolean {
  return lastSentAt === null || !Number.isFinite(lastSentAt) || now - lastSentAt >= VIEW_REPEAT_WINDOW_MS || now < lastSentAt;
}
