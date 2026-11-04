"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { AlertCircle, AlertTriangle, CheckCircle2, ExternalLink } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ANALYTICS_TZ, ANALYTICS_TZ_LABEL, addDays, dayKey, shortDay } from "@/lib/analytics-time";
import { useDash } from "./DashProvider";
import { PageHero } from "./PageHero";
import { RangePicker, describeRange, lastDays, sinceStart, type Range } from "./RangePicker";
import { apiGetJson } from "../_data/api";

// The whole-site reports (admin only): what GA4 sees, in the dashboard's own design. Each page has the same date picker as Analytics,
// so any earlier period can be opened. Every number here comes from the Google Analytics Data API or Search Console, read on the server.

type Ga4Row = { dimensionValues: string[]; metricValues: number[] };
type Ga4Report = { configured: boolean; rows: Ga4Row[] };
type ConsoleReport =
  | { status: "ready"; site: string; rows: { key: string; clicks: number; impressions: number; ctr: number; position: number }[] }
  | { status: "not_configured" | "api_disabled" | "no_access" | "error"; message: string; serviceAccount?: string; enableUrl?: string };

const n = (v: number) => Math.round(v).toLocaleString("en-LK");
const duration = (seconds: number) => (seconds >= 60 ? `${Math.floor(seconds / 60)}m ${Math.round(seconds % 60)}s` : `${Math.round(seconds)}s`);

/** Friendly names for the events GA4 receives from this site. Anything not listed shows its raw name. */
const EVENT_LABELS: Record<string, [string, string]> = {
  page_view: ["Page views", "Someone opened any page"],
  view_listing: ["Listing page views", "Someone opened a project page"],
  view_floor_plan: ["Floor plan views", "Someone opened a floor plan"],
  generate_lead: ["Enquiries sent", "Someone sent a contact form"],
  click_whatsapp: ["WhatsApp clicks", "Someone tapped WhatsApp"],
  click_email: ["Email clicks", "Someone tapped an email address"],
  click_phone_profile: ["Phone taps (profile)", "Someone tapped a developer's number"],
  download_brochure: ["Brochure downloads", "Someone downloaded a brochure"],
  search: ["Searches", "Someone searched the site"],
  view_search_results: ["Search results viewed", "A search results page was shown"],
  filter_listings: ["Filters used", "Someone changed a listing filter"],
  view_map: ["Map opened", "Someone opened the map view"],
  map_pin_click: ["Map pins tapped", "Someone tapped a pin on the map"],
  save_listing: ["Listings saved", "Someone saved a listing"],
  unsave_listing: ["Listings un-saved", "Someone removed a saved listing"],
  follow_developer: ["Developers followed", "Someone tapped Get updates"],
  unfollow_developer: ["Developers un-followed", "Someone stopped following"],
  compare_add: ["Added to compare", "Someone added a listing to compare"],
  compare_remove: ["Removed from compare", "Someone removed a listing from compare"],
  click_social: ["Social link clicks", "Someone tapped a social media link"],
  form_field_focus: ["Form fields tapped", "Someone tapped a field in a contact form"],
  form_start: ["Forms started", "Someone began filling in a form"],
  form_submit: ["Forms submitted", "A form was sent (GA4's own count)"],
  session_start: ["Visits started", "A new visit began"],
  first_visit: ["New visitors", "A first-time visitor"],
  user_engagement: ["Engaged time", "Time spent actively on a page"],
  scroll: ["Scrolled to the bottom", "Someone scrolled 90% down a page"],
  click: ["Outbound clicks", "Someone left the site through a link"],
  file_download: ["File downloads", "Someone downloaded a file"],
};

function useRange(): [Range, (r: Range) => void] { const [r, setR] = useState<Range>(sinceStart); return [r, setR]; }

function useReport<T>(path: string, range: Range): { data: T | null; error: string } {
  const [state, setState] = useState<{ key: string; data: T | null; error: string }>({ key: "", data: null, error: "" });
  const key = `${path}|${range.start}|${range.end}`;
  useEffect(() => {
    let alive = true;
    apiGetJson<T>(`/site-report/${path}?startDate=${range.start}&endDate=${range.end}`)
      .then((data) => { if (alive) setState({ key, data, error: "" }); })
      .catch((e) => { if (alive) setState({ key, data: null, error: e instanceof Error ? e.message : "Could not load this report." }); });
    return () => { alive = false; };
  }, [path, range.start, range.end, key]);
  return state.key === key ? { data: state.data, error: state.error } : { data: null, error: "" };
}

function Shell({ title, description, range, setRange, children }: { title: string; description: string; range: Range; setRange: (r: Range) => void; children: ReactNode }) {
  const d = useDash();
  if (d.role !== "admin") return <div className="mx-auto max-w-md py-20 text-center"><h1 className="text-lg font-semibold">Only the site admin can see this page</h1><p className="mt-1.5 text-sm text-muted">These reports cover the whole website.</p></div>;
  return (
    <div>
      <PageHero title={title} description={description} stat={{ label: "Period", value: describeRange(range) }} actions={<RangePicker light value={range} onChange={setRange} />} />
      <div className="d-box space-y-5">{children}</div>
    </div>
  );
}

function Card({ title, note, children }: { title: string; note?: string; children: ReactNode }) {
  return (
    <section className="border border-line bg-panel">
      <div className="border-b border-line px-4 py-3"><h2 className="font-semibold">{title}</h2>{note ? <p className="text-xs text-muted">{note}</p> : null}</div>
      <div className="overflow-x-auto">{children}</div>
    </section>
  );
}

const LEFT = new Set(["Where", "City"]);
const th = "px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-muted";
const td = "px-4 py-2.5";

function Message({ icon, children }: { icon?: boolean; children: ReactNode }) {
  return <p className="flex items-start gap-2 px-4 py-8 text-sm text-muted">{icon ? <AlertCircle size={16} className="mt-0.5 shrink-0 text-bad" /> : null}<span>{children}</span></p>;
}

function Ga4Table({ report, error, head, row, empty }: { report: Ga4Report | null; error: string; head: string[]; row: (r: Ga4Row) => ReactNode[]; empty: string }) {
  if (error) return <Message icon>{error}</Message>;
  if (!report) return <div className="d-skeleton m-4 h-32" />;
  if (!report.configured) return <Message icon>Google Analytics is not connected on this server (GA4_PROPERTY_ID and the service account are missing).</Message>;
  if (report.rows.length === 0) return <Message>{empty}</Message>;
  return (
    <table className="w-full min-w-[560px] text-sm">
      <thead><tr className="border-b border-line text-left">{head.map((h, i) => <th key={h} className={`${th} ${i > 0 && !LEFT.has(h) ? "text-right" : ""}`}>{h}</th>)}</tr></thead>
      <tbody>{report.rows.map((r, i) => <tr key={i} className="border-b border-line last:border-0 hover:bg-subtle/60">{row(r).map((c, j) => <td key={j} className={`${td} ${j > 0 && !LEFT.has(head[j]) ? "text-right tabular-nums" : ""}`}>{c}</td>)}</tr>)}</tbody>
    </table>
  );
}

export function Ga4EventsPage() {
  const [range, setRange] = useRange();
  const { data, error } = useReport<Ga4Report>("events", range);
  return (
    <Shell title="Events." description="Every event Google Analytics (GA4) receives from the site, for any period you pick." range={range} setRange={setRange}>
      <Card title="All events" note="Total is how many times it happened; Visitors is how many different people did it. GA4 hides nothing here, but ad blockers hide some visitors from it.">
        <Ga4Table report={data} error={error} head={["Event", "Total", "Visitors"]} empty="No events in this period." row={(r) => {
          const [label, what] = EVENT_LABELS[r.dimensionValues[0]] ?? [r.dimensionValues[0], ""];
          return [<span key="e"><span className="font-medium">{label}</span><span className="block text-xs text-muted">{what ? `${what} · ` : ""}{r.dimensionValues[0]}</span></span>, n(r.metricValues[0]), n(r.metricValues[1])];
        }} />
      </Card>
    </Shell>
  );
}

export function TrafficPage() {
  const [range, setRange] = useRange();
  const { data, error } = useReport<Ga4Report>("traffic", range);
  const total = data?.rows.reduce((sum, r) => sum + r.metricValues[0], 0) ?? 0;
  return (
    <Shell title="Traffic sources." description="Where visitors came from: Google, Facebook, Instagram, AI assistants, direct and more." range={range} setRange={setRange}>
      <Card title="Visits by channel and source" note={data?.configured ? `${n(total)} visits in this period. "Engaged" means they stayed 10 seconds, viewed 2 pages or took an action.` : undefined}>
        <Ga4Table report={data} error={error} head={["Channel", "Where", "Visits", "Visitors", "Engaged"]} empty="No visits in this period." row={(r) => [
          r.dimensionValues[0] || "Other",
          <span key="w">{r.dimensionValues[1]}<span className="text-muted"> / {r.dimensionValues[2]}</span></span>,
          n(r.metricValues[0]), n(r.metricValues[1]), `${n(r.metricValues[2])}${r.metricValues[0] ? ` (${Math.round((r.metricValues[2] / r.metricValues[0]) * 100)}%)` : ""}`,
        ]} />
      </Card>
    </Shell>
  );
}

export function PagesPage() {
  const [range, setRange] = useRange();
  const pages = useReport<Ga4Report>("pages", range);
  const geo = useReport<Ga4Report>("geo", range);
  return (
    <Shell title="Pages & countries." description="The pages people read most, and where in the world they are." range={range} setRange={setRange}>
      <Card title="Top pages">
        <Ga4Table report={pages.data} error={pages.error} head={["Page", "Views", "Visitors", "Time on page"]} empty="No page views in this period." row={(r) => [
          <span key="p"><span className="font-medium">{r.dimensionValues[1] || r.dimensionValues[0]}</span><span className="block text-xs text-muted">{r.dimensionValues[0]}</span></span>,
          n(r.metricValues[0]), n(r.metricValues[1]), r.metricValues[1] ? duration(r.metricValues[2] / r.metricValues[1]) : "-",
        ]} />
      </Card>
      <Card title="Countries and cities" note="Where visitors are. Colombo shows next to Toronto, Melbourne and Dubai: Sri Lankans abroad are a big part of the audience.">
        <Ga4Table report={geo.data} error={geo.error} head={["Country", "City", "Visitors", "Visits"]} empty="No visitors in this period." row={(r) => [r.dimensionValues[0], r.dimensionValues[1], n(r.metricValues[0]), n(r.metricValues[1])]} />
      </Card>
    </Shell>
  );
}

export function KeywordsPage() {
  const [range, setRange] = useRange();
  const queries = useReport<ConsoleReport>("google-queries", range);
  const landing = useReport<ConsoleReport>("google-pages", range);
  const onSite = useReport<Ga4Report>("on-site-search", range);
  const [sortBy, setSortBy] = useState<"clicks" | "impressions">("impressions");

  const consoleTable = (report: { data: ConsoleReport | null; error: string }, first: string) => {
    if (report.error) return <Message icon>{report.error}</Message>;
    const r = report.data;
    if (!r) return <div className="d-skeleton m-4 h-32" />;
    if (r.status !== "ready") return null;
    if (r.rows.length === 0) return <Message>Google has no search data for this period yet. It runs 2 to 3 days behind.</Message>;
    const rows = [...r.rows].sort((a, b) => b[sortBy] - a[sortBy] || b.clicks - a.clicks);
    const sortBtn = (key: "clicks" | "impressions", text: string) => <button type="button" onClick={() => setSortBy(key)} className={`uppercase tracking-wide ${sortBy === key ? "text-fg underline" : ""}`} title="Sort by this column">{text}{sortBy === key ? " ↓" : ""}</button>;
    return (
      <table className="w-full min-w-[560px] text-sm">
        <thead><tr className="border-b border-line text-left"><th className={th}>{first}</th><th className={`${th} text-right`}>{sortBtn("clicks", "Clicks")}</th><th className={`${th} text-right`}>{sortBtn("impressions", "Search volume")}</th><th className={`${th} text-right`}>Click rate</th><th className={`${th} text-right`}>Avg. position</th></tr></thead>
        <tbody>{rows.map((x) => <tr key={x.key} className="border-b border-line last:border-0 hover:bg-subtle/60"><td className={`${td} font-medium`}>{x.key.replace(/^https?:\/\/(www\.)?lankanewhomes\.com/, "") || "/"}</td><td className={`${td} text-right tabular-nums`}>{n(x.clicks)}</td><td className={`${td} text-right tabular-nums`}>{n(x.impressions)}</td><td className={`${td} text-right tabular-nums`}>{(x.ctr * 100).toFixed(1)}%</td><td className={`${td} text-right tabular-nums`}>{x.position.toFixed(1)}</td></tr>)}</tbody>
      </table>
    );
  };

  const blocked = queries.data && queries.data.status !== "ready" ? queries.data : null;

  return (
    <Shell title="Keywords." description="The words people search for when they find LankaNewHomes, and what they type into our own search box." range={range} setRange={setRange}>
      {blocked ? (
        <section className="border border-ink bg-panel p-4 text-sm">
          <h2 className="font-semibold">Google search words need a one-time permission</h2>
          <p className="mt-1 text-muted">Google keeps the words people typed on Google private from Analytics. Search Console does have them. To show them here, two things must be switched on in Google (a read-only view, nothing can be changed):</p>
          <ol className="mt-3 list-decimal space-y-2 pl-5">
            <li>Turn on the <b>Google Search Console API</b> for the Google Cloud project that holds our reader account.{blocked.status === "api_disabled" && blocked.enableUrl ? <> <a href={blocked.enableUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-0.5 underline">Open it <ExternalLink size={12} /></a></> : null}</li>
            <li>In Search Console, open <b>Settings → Users and permissions → Add user</b> and add this email as a <b>Restricted</b> user: <code className="select-all bg-subtle px-1.5 py-0.5">{blocked.serviceAccount ?? "the GA4 reader service account"}</code></li>
          </ol>
          <p className="mt-3 text-xs text-muted">Status right now: {blocked.message} Once both are done, this page fills in by itself. Search Console data is 2 to 3 days behind.</p>
        </section>
      ) : (
        <>
          {queries.data?.status === "ready" ? (() => {
            const clicks = queries.data.rows.reduce((sum, x) => sum + x.clicks, 0);
            const shown = queries.data.rows.reduce((sum, x) => sum + x.impressions, 0);
            return (
              <div className="grid gap-3 sm:grid-cols-4">
                {[["Search words", n(queries.data.rows.length)], ["Search volume (times shown on Google)", n(shown)], ["Clicks to the site", n(clicks)], ["Click rate", shown ? `${((clicks / shown) * 100).toFixed(1)}%` : "-"]].map(([label, value]) => (
                  <div key={label} className="border border-line bg-panel px-4 py-3"><p className="d-label">{label}</p><p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p></div>
                ))}
              </div>
            );
          })() : null}
          <Card title="Words people searched on Google" note={queries.data?.status === "ready" ? `From Google Search Console for ${queries.data.site} (top ${queries.data.rows.length} words). Search volume is how many times the site appeared in Google results for that word, which is what real people searched. Clicks are visits to the site. Google reports 2 to 3 days late.` : undefined}>
            {consoleTable(queries, "Search words")}
          </Card>
        </>
      )}
      {!blocked ? <Card title="Pages people landed on from Google">{consoleTable(landing, "Page")}</Card> : null}
      <Card title="What people type into our own search box" note="Searches made on lankanewhomes.com (home page and listing pages). These show what buyers are looking for.">
        <Ga4Table report={onSite.data ? { ...onSite.data, rows: onSite.data.rows.filter((r) => r.dimensionValues[0] && r.dimensionValues[0] !== "(not set)") } : null} error={onSite.error} head={["Search", "Times", "Visitors"]} empty="No searches in this period." row={(r) => [<span key="s" className="font-medium">{r.dimensionValues[0]}</span>, n(r.metricValues[0]), n(r.metricValues[1])]} />
      </Card>
    </Shell>
  );
}


// ---- Bots (src/lib/bots.ts decides who is a bot; middleware.ts counts each visit into bot_daily_stats) -----------------------------

type BotRow = { date: string; bot_name: string; category: string; action: "allowed" | "blocked"; hits: number; last_path: string | null; last_seen: string };
type BotReport = { configured: boolean; rows: BotRow[]; googlebotLastSeen: string | null };

const BOT_COUNT_START = "2026-11-02";
const CATEGORIES: Record<string, { label: string; good: boolean; note: string }> = {
  "search-engine": { label: "Search engines", good: true, note: "Google, Bing and others. GOOD traffic: it is how buyers find the site. Never blocked." },
  "ai-search": { label: "AI search and assistants", good: true, note: "ChatGPT, Claude, Perplexity and others. GOOD traffic: it is how AI answers mention the site. Never blocked." },
  "social-preview": { label: "Social previews", good: true, note: "Facebook, WhatsApp, X and others loading a link someone shared. GOOD: it makes the shared card look right. Never blocked." },
  "seo-scraper": { label: "SEO tools and scrapers", good: false, note: "AhrefsBot, SemrushBot and similar. They bring nothing, so they get a 403 (blocked)." },
  monitor: { label: "Monitors and speed tests", good: false, note: "Uptime checkers and tools like Lighthouse. Allowed, only counted." },
  "unknown-bot": { label: "Other bots", good: false, note: "Scripts and crawlers we do not know, and visits with no name. Allowed, only counted." },
};

const stamp = (iso: string) => new Date(iso).toLocaleString("en-GB", { timeZone: ANALYTICS_TZ, day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit", hour12: true }).replace(/\s/g, " ");

export function BotsPage() {
  const [range, setRange] = useState<Range>(() => lastDays(7));
  const { data, error } = useReport<BotReport>("bots", range);

  const view = useMemo(() => {
    const rows = data?.rows ?? [];
    const total = rows.reduce((sum, r) => sum + r.hits, 0);
    const blocked = rows.filter((r) => r.action === "blocked").reduce((sum, r) => sum + r.hits, 0);
    const byCategory = new Map<string, number>();
    const byBot = new Map<string, { name: string; category: string; action: string; hits: number; lastSeen: string; lastPath: string }>();
    const byDay = new Map<string, { allowed: number; blocked: number }>();
    for (const r of rows) {
      byCategory.set(r.category, (byCategory.get(r.category) ?? 0) + r.hits);
      const key = `${r.bot_name}|${r.action}`;
      const prev = byBot.get(key);
      const newer = !prev || r.last_seen > prev.lastSeen;
      byBot.set(key, { name: r.bot_name, category: r.category, action: r.action, hits: (prev?.hits ?? 0) + r.hits, lastSeen: newer ? r.last_seen : prev!.lastSeen, lastPath: newer ? r.last_path ?? "" : prev!.lastPath });
      const day = byDay.get(r.date) ?? { allowed: 0, blocked: 0 };
      day[r.action] += r.hits;
      byDay.set(r.date, day);
    }
    const days: { day: string; allowed: number; blocked: number }[] = [];
    for (let d = range.start; d <= range.end && days.length < 400; d = addDays(d, 1)) days.push({ day: shortDay(d), ...(byDay.get(d) ?? { allowed: 0, blocked: 0 }) });
    return { total, blocked, allowed: total - blocked, distinct: new Set(rows.map((r) => r.bot_name)).size, byCategory, bots: [...byBot.values()], days };
  }, [data, range.start, range.end]);

  const [desc, setDesc] = useState(true);
  const bots = [...view.bots].sort((a, b) => (desc ? b.hits - a.hits : a.hits - b.hits));

  const googlebot = data?.googlebotLastSeen ?? null;
  const [now] = useState(() => Date.now()); // when the page was opened; fine for a banner measured in days
  const daysSince = googlebot && now ? Math.floor((now - new Date(googlebot).getTime()) / 86400000) : null;
  const countingDays = Math.floor((Date.parse(`${dayKey()}T00:00:00Z`) - Date.parse(`${BOT_COUNT_START}T00:00:00Z`)) / 86400000);

  const chip = (label: string, next: Range) => {
    const on = range.start === next.start && range.end === next.end;
    return <button key={label} type="button" onClick={() => setRange(next)} className={`border px-3 py-1.5 text-sm ${on ? "border-ink bg-ink text-white" : "border-line bg-panel hover:bg-subtle"}`}>{label}</button>;
  };

  return (
    <Shell title="Bots." description="Every automated visitor: which are welcome (search engines, AI assistants, link previews) and which are turned away." range={range} setRange={setRange}>
      <div className="flex flex-wrap items-center gap-2">
        {chip("Today", lastDays(1))}{chip("7 days", lastDays(7))}{chip("30 days", lastDays(30))}
        <span className="text-xs text-muted">or pick any dates with the date button above · {ANALYTICS_TZ_LABEL}</span>
      </div>

      {data ? (
        !now ? null : googlebot && daysSince !== null && daysSince < 7 ? (
          <div className="flex items-start gap-2 border border-line bg-panel px-4 py-3 text-sm" role="status"><CheckCircle2 size={18} className="mt-0.5 shrink-0 text-ok" /><span><strong>Googlebot last seen: {stamp(googlebot)}.</strong> Google is able to read the site.</span></div>
        ) : googlebot ? (
          <div className="flex items-start gap-2 border border-bad bg-panel px-4 py-3 text-sm" role="alert"><AlertTriangle size={18} className="mt-0.5 shrink-0 text-bad" /><span><strong>Googlebot was last seen {stamp(googlebot)} ({daysSince} days ago).</strong> This could mean search is being blocked. Check robots.txt and the Cloudflare bot settings.</span></div>
        ) : countingDays < 7 ? (
          <div className="flex items-start gap-2 border border-line bg-panel px-4 py-3 text-sm" role="status"><AlertCircle size={18} className="mt-0.5 shrink-0 text-muted" /><span>Googlebot has not been seen yet. Bot counting started on 2 Nov 2026, and Google does not visit every day, so give it a few days before worrying.</span></div>
        ) : (
          <div className="flex items-start gap-2 border border-bad bg-panel px-4 py-3 text-sm" role="alert"><AlertTriangle size={18} className="mt-0.5 shrink-0 text-bad" /><span><strong>Googlebot has not been seen in {countingDays} days.</strong> This could mean search is being blocked. Check robots.txt and the Cloudflare bot settings.</span></div>
        )
      ) : null}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[["Total bot visits", view.total, "all bots, allowed and blocked"], ["Allowed", view.allowed, "let in, as normal"], ["Blocked", view.blocked, "turned away with a 403"], ["Different bots", view.distinct, "names seen in this period"]].map(([label, value, note]) => (
          <div key={label as string} className="border border-line bg-panel px-4 py-3"><p className="d-label">{label}</p><p className="mt-1 text-2xl font-semibold tabular-nums">{data ? n(value as number) : "…"}</p><p className="text-[11px] text-muted">{note}</p></div>
        ))}
      </div>

      <Card title="Bot visits by day" note="Allowed against blocked, one bar per day.">
        <div className="h-64 p-4">
          {data ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={view.days} margin={{ top: 4, right: 8, left: -12, bottom: 0 }}>
                <CartesianGrid stroke="var(--d-line)" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="day" tick={{ fill: "var(--d-muted)", fontSize: 11 }} tickLine={false} axisLine={false} minTickGap={24} />
                <YAxis allowDecimals={false} tick={{ fill: "var(--d-muted)", fontSize: 11 }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: "var(--d-panel)", border: "1px solid var(--d-line)", fontSize: 12 }} labelStyle={{ color: "var(--d-fg)" }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="allowed" name="Allowed" stackId="a" fill="var(--d-brand)" />
                <Bar dataKey="blocked" name="Blocked" stackId="a" fill="#c0392b" />
              </BarChart>
            </ResponsiveContainer>
          ) : <div className="d-skeleton h-full w-full" />}
        </div>
      </Card>

      <Card title="By kind of bot" note="Search engines, AI assistants and social previews are GOOD traffic and are never blocked or limited.">
        {error ? <Message icon>{error}</Message> : !data ? <div className="d-skeleton m-4 h-32" /> : (
          <table className="w-full min-w-[560px] text-sm">
            <thead><tr className="border-b border-line text-left"><th className={th}>Kind</th><th className={th}>What it is</th><th className={`${th} text-right`}>Visits</th></tr></thead>
            <tbody>
              {Object.entries(CATEGORIES).map(([key, c]) => (
                <tr key={key} className="border-b border-line last:border-0">
                  <td className={td}><span className="font-medium">{c.label}</span>{c.good ? <span className="ml-2 border border-ok px-1.5 py-0.5 text-[10px] font-semibold uppercase text-ok">Good traffic</span> : null}</td>
                  <td className={`${td} text-muted`}>{c.note}</td>
                  <td className={`${td} text-right tabular-nums`}>{n(view.byCategory.get(key) ?? 0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      <Card title="Every bot" note="Click Visits to sort. A bot that was both allowed and blocked has one row for each.">
        {error ? <Message icon>{error}</Message> : !data ? <div className="d-skeleton m-4 h-32" /> : bots.length === 0 ? <Message>No bot visits in this period yet.</Message> : (
          <table className="w-full min-w-[720px] text-sm">
            <thead><tr className="border-b border-line text-left">
              <th className={th}>Bot</th><th className={th}>Kind</th><th className={th}>Result</th>
              <th className={`${th} text-right`}><button type="button" onClick={() => setDesc(!desc)} className="font-semibold uppercase tracking-wide">Visits {desc ? "↓" : "↑"}</button></th>
              <th className={th}>Last seen</th><th className={th}>Last page</th>
            </tr></thead>
            <tbody>
              {bots.map((b) => (
                <tr key={`${b.name}|${b.action}`} className="border-b border-line last:border-0 hover:bg-subtle/60">
                  <td className={`${td} font-medium`}>{b.name}</td>
                  <td className={td}>{CATEGORIES[b.category]?.label ?? b.category}</td>
                  <td className={td}><span className={b.action === "blocked" ? "text-bad" : "text-ok"}>{b.action === "blocked" ? "Blocked" : "Allowed"}</span></td>
                  <td className={`${td} text-right tabular-nums`}>{n(b.hits)}</td>
                  <td className={`${td} whitespace-nowrap`}>{stamp(b.lastSeen)}</td>
                  <td className={`${td} max-w-[240px] truncate text-muted`} title={b.lastPath}>{b.lastPath || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </Shell>
  );
}
