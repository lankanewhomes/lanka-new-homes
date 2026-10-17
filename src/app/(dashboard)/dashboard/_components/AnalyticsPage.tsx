"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AlertCircle, ArrowUpRight, Eye, Heart, Mail, MessageCircle, MessageSquare, Phone, FileDown, MousePointerClick } from "lucide-react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useDash } from "./DashProvider";
import { PageHero } from "./PageHero";
import { apiGetJson } from "../_data/api";
import { ANALYTICS_START } from "@/lib/analytics-start";

// Analytics: the same numbers as the /cms analytics screen (the analytics-summary endpoint), laid out in the dashboard design.
// An admin sees the whole platform; a developer sees only the listings they manage. Bots and repeat clicks are already removed
// by the endpoint, and counting starts at ANALYTICS_START (the owner's fresh start).

type Row = { key: string; label: string; count: number; percent: number };
type Listing = { projectId: number | string; projectName: string; projectSlug: string; total: number; byType: Record<string, number> };
type Dev = { developerId: number | string; developerName: string; total: number; byType: Record<string, number> };
type Summary = {
  range: { startDate: string; endDate: string };
  totalEvents: number;
  byType: Row[];
  trafficSources: Row[];
  adSources: Row[];
  deviceTypes: Row[];
  byListing: Listing[];
  byDeveloper?: Dev[];
  trend: { date: string; count: number }[];
  leads?: {
    total: number;
    stages: { status: string; label: string; count: number }[];
    awaitingReply: number;
    medianResponseMinutes: number | null;
    respondedWithinHourPercent: number | null;
    respondedCount: number;
  };
};

const DAY = 86400000;
const RANGES = [{ days: 7, label: "7 days" }, { days: 28, label: "28 days" }, { days: 90, label: "90 days" }];
const TILES = [
  { key: "view", label: "Page views", icon: Eye },
  { key: "save", label: "Saves", icon: Heart },
  { key: "lead_submitted", label: "Enquiries sent", icon: MessageCircle },
  { key: "whatsapp_click", label: "WhatsApp clicks", icon: MessageSquare },
  { key: "phone_click", label: "Phone clicks", icon: Phone },
  { key: "email_click", label: "Email clicks", icon: Mail },
  { key: "brochure_download", label: "Brochure downloads", icon: FileDown },
  { key: "hero_click", label: "Hero slide clicks", icon: MousePointerClick },
];
const n = (v: number) => v.toLocaleString("en-LK");
const minutes = (m: number | null) => (m === null ? "—" : m < 60 ? `${Math.round(m)} min` : m < 1440 ? `${(m / 60).toFixed(1)} h` : `${(m / 1440).toFixed(1)} days`);

function Bars({ rows, empty }: { rows: Row[]; empty: string }) {
  if (rows.length === 0) return <p className="py-6 text-center text-sm text-muted">{empty}</p>;
  const max = Math.max(...rows.map((r) => r.count), 1);
  return (
    <ul className="space-y-3">
      {rows.map((r) => (
        <li key={r.key}>
          <div className="mb-1 flex items-baseline justify-between gap-3 text-sm"><span className="truncate">{r.label}</span><span className="shrink-0 tabular-nums text-muted">{n(r.count)} <span className="text-xs">({Math.round(r.percent)}%)</span></span></div>
          <div className="h-2 bg-subtle"><div className="h-full bg-brand" style={{ width: `${Math.max(3, (r.count / max) * 100)}%` }} /></div>
        </li>
      ))}
    </ul>
  );
}

export function AnalyticsPage() {
  const d = useDash();
  const admin = d.role === "admin";
  const [days, setDays] = useState(28);
  const [data, setData] = useState<Summary | null>(null);
  const [error, setError] = useState("");
  const [showAll, setShowAll] = useState(false);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const now = Date.now();
        const start = new Date(now - days * DAY).toISOString().slice(0, 10);
        const end = new Date(now).toISOString().slice(0, 10);
        const res = await apiGetJson<Summary>(`/analytics-summary?startDate=${start}&endDate=${end}`);
        if (alive) { setData(res); setError(""); }
      } catch (e) {
        if (alive) setError(e instanceof Error ? e.message : "Could not load analytics.");
      }
    })();
    return () => { alive = false; };
  }, [days, reload]);

  if (error) {
    return (
      <div className="mx-auto max-w-md py-20 text-center">
        <span className="mx-auto grid h-12 w-12 place-items-center bg-subtle text-bad"><AlertCircle size={22} /></span>
        <h1 className="mt-3 text-lg font-semibold">Could not load analytics</h1>
        <p className="mt-1.5 text-sm text-muted">{error}</p>
        <button type="button" onClick={() => { setError(""); setData(null); setReload((x) => x + 1); }} className="mt-4 border border-line px-3 py-1.5 text-sm hover:bg-subtle">Try again</button>
      </div>
    );
  }

  const count = (key: string) => data?.byType.find((t) => t.key === key)?.count ?? 0;
  const startFloor = new Date(ANALYTICS_START);
  const clipped = data ? new Date(`${data.range.startDate}T00:00:00Z`) < startFloor : false;
  const trend = (() => {
    if (!data) return [];
    const by = new Map(data.trend.map((p) => [p.date, p.count]));
    const end = new Date(`${data.range.endDate}T00:00:00Z`).getTime();
    const len = Math.round((end - new Date(`${data.range.startDate}T00:00:00Z`).getTime()) / DAY) + 1;
    return Array.from({ length: len }, (_, i) => {
      const day = new Date(end - (len - 1 - i) * DAY);
      return { day: day.toLocaleDateString("en-GB", { day: "numeric", month: "short" }), count: by.get(day.toISOString().slice(0, 10)) ?? 0 };
    });
  })();
  const listings = data ? (showAll ? data.byListing : data.byListing.slice(0, 12)) : [];
  const pipeline = data?.leads;

  return (
    <div>
      <PageHero
        title="Analytics."
        description={admin ? "Visits, clicks and enquiries across every listing, live from the site." : "How buyers find and react to your listings."}
        stat={{ label: `Activity, last ${days} days`, value: data ? n(data.totalEvents) : "…" }}
        actions={
          <div className="flex flex-wrap gap-2" role="group" aria-label="Date range">
            {RANGES.map((r) => (
              <button key={r.days} type="button" onClick={() => { setData(null); setDays(r.days); }} className={`rounded-full border px-5 py-2 text-sm font-medium transition ${days === r.days ? "border-white bg-white text-[#17171b]" : "border-white/70 text-white hover:bg-white hover:text-[#17171b]"}`}>{r.label}</button>
            ))}
          </div>
        }
      />

      <div className="d-box">
        <p className="mb-4 text-sm text-muted">
          Real visitors only: bots and repeat clicks are removed.{clipped ? ` Counting starts on ${startFloor.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })} (fresh start), so earlier days in this range are empty.` : ""}
        </p>

        <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))" }}>
          {TILES.map((t) => (
            <div key={t.key} className="border border-line bg-panel px-5 py-4">
              <div className="flex items-center justify-between text-muted"><span className="d-label">{t.label}</span><t.icon size={15} /></div>
              <p className="mt-2 text-[34px] font-normal leading-none tabular-nums">{data ? n(count(t.key)) : "…"}</p>
            </div>
          ))}
        </div>

        <section className="mt-5 border border-line bg-panel p-4" aria-label="Contact activity">
          <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2"><h2 className="font-semibold">Contact activity</h2><span className="text-xs text-muted">Every way a buyer reached out in this range</span></div>
          {(() => {
            const rows = [["Contact form enquiries", "lead_submitted"], ["WhatsApp clicks", "whatsapp_click"], ["Phone clicks", "phone_click"], ["Email clicks", "email_click"], ["Brochure downloads", "brochure_download"]] as const;
            const total = rows.slice(0, 4).reduce((sum, [, k]) => sum + (data ? count(k) : 0), 0);
            const views = data ? count("view") : 0;
            return (
              <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))" }}>
                {rows.map(([label, k]) => <div key={k} className="border border-line bg-subtle px-4 py-3"><p className="d-label">{label}</p><p className="mt-1 text-2xl font-semibold tabular-nums">{data ? n(count(k)) : "…"}</p></div>)}
                <div className="border border-ink bg-panel px-4 py-3"><p className="d-label">Contact actions</p><p className="mt-1 text-2xl font-semibold tabular-nums">{data ? n(total) : "…"}</p><p className="text-[11px] text-muted">{data && views > 0 ? `${(total / views * 100).toFixed(1)} per 100 page views` : "form + WhatsApp + phone + email"}</p></div>
              </div>
            );
          })()}
        </section>

        <section className="mt-5 border border-line bg-panel p-4">
          <div className="mb-3 flex items-center justify-between"><h2 className="font-semibold">Activity by day</h2><span className="text-xs text-muted">Views, saves, clicks and enquiries</span></div>
          <div className="h-64">
            {data ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trend} margin={{ top: 4, right: 8, left: -12, bottom: 0 }}>
                  <defs><linearGradient id="anFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--d-brand)" stopOpacity={0.28} /><stop offset="100%" stopColor="var(--d-brand)" stopOpacity={0} /></linearGradient></defs>
                  <CartesianGrid stroke="var(--d-line)" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="day" tick={{ fill: "var(--d-muted)", fontSize: 11 }} tickLine={false} axisLine={false} minTickGap={24} />
                  <YAxis allowDecimals={false} tick={{ fill: "var(--d-muted)", fontSize: 11 }} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ background: "var(--d-panel)", border: "1px solid var(--d-line)", fontSize: 12 }} labelStyle={{ color: "var(--d-fg)" }} />
                  <Area type="monotone" dataKey="count" name="Events" stroke="var(--d-brand)" strokeWidth={2} fill="url(#anFill)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : <div className="d-skeleton h-full w-full" />}
          </div>
        </section>

        <div className="mt-5 grid gap-5 lg:grid-cols-2">
          <section className="border border-line bg-panel p-4">
            <h2 className="mb-4 font-semibold">Where visitors come from</h2>
            {data ? <Bars rows={data.trafficSources} empty="No visits in this range yet." /> : <div className="d-skeleton h-40" />}
            {data && data.adSources.length ? (
              <div className="mt-5 border-t border-line pt-4"><p className="d-label mb-3">From paid ads</p><Bars rows={data.adSources} empty="" /></div>
            ) : null}
          </section>
          <section className="border border-line bg-panel p-4">
            <h2 className="mb-4 font-semibold">Devices</h2>
            {data ? <Bars rows={data.deviceTypes} empty="No visits in this range yet." /> : <div className="d-skeleton h-40" />}
          </section>
        </div>

        <section className="mt-5 border border-line bg-panel">
          <div className="flex items-center justify-between border-b border-line px-4 py-3"><h2 className="font-semibold">{admin ? "Top listings" : "Your listings"}</h2><Link href="/dashboard/analytics/events" className="inline-flex items-center gap-0.5 text-xs underline">Raw events <ArrowUpRight size={12} /></Link></div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead><tr className="border-b border-line text-left text-xs font-semibold uppercase tracking-wide text-muted"><th className="px-4 py-2.5">Listing</th><th className="px-3 py-2.5 text-right">Views</th><th className="px-3 py-2.5 text-right">Saves</th><th className="px-3 py-2.5 text-right">Enquiries</th><th className="px-3 py-2.5 text-right">WhatsApp</th><th className="px-3 py-2.5 text-right">Phone</th><th className="px-3 py-2.5 text-right">Email</th><th className="px-3 py-2.5 text-right">Brochure</th><th className="px-4 py-2.5 text-right">Total</th></tr></thead>
              <tbody>
                {!data ? Array.from({ length: 5 }, (_, i) => <tr key={i}><td colSpan={9} className="px-4 py-3"><div className="d-skeleton h-5 w-full" /></td></tr>) : listings.length === 0 ? <tr><td colSpan={9} className="px-4 py-10 text-center text-muted">No activity on any listing in this range yet.</td></tr> : listings.map((l) => (
                  <tr key={String(l.projectId)} className="border-b border-line last:border-0 hover:bg-subtle/60">
                    <td className="px-4 py-2.5 font-medium"><Link href={`/dashboard/projects/${l.projectId}`} className="hover:underline">{l.projectName}</Link></td>
                    {["view", "save", "lead_submitted", "whatsapp_click", "phone_click", "email_click", "brochure_download"].map((k) => <td key={k} className="px-3 py-2.5 text-right tabular-nums">{n(l.byType[k] ?? 0)}</td>)}
                    <td className="px-4 py-2.5 text-right font-medium tabular-nums">{n(l.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {data && data.byListing.length > 12 ? <button type="button" onClick={() => setShowAll(!showAll)} className="w-full border-t border-line px-4 py-2.5 text-sm text-muted hover:bg-subtle hover:text-fg">{showAll ? "Show fewer" : `Show all ${data.byListing.length} listings`}</button> : null}
        </section>

        {admin && data?.byDeveloper?.length ? (
          <section className="mt-5 border border-line bg-panel">
            <div className="border-b border-line px-4 py-3"><h2 className="font-semibold">By developer</h2></div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-sm">
                <thead><tr className="border-b border-line text-left text-xs font-semibold uppercase tracking-wide text-muted"><th className="px-4 py-2.5">Developer</th><th className="px-3 py-2.5 text-right">Views</th><th className="px-3 py-2.5 text-right">Enquiries</th><th className="px-3 py-2.5 text-right">WhatsApp</th><th className="px-3 py-2.5 text-right">Phone</th><th className="px-3 py-2.5 text-right">Email</th><th className="px-4 py-2.5 text-right">Total</th></tr></thead>
                <tbody>
                  {data.byDeveloper.slice(0, 15).map((x) => (
                    <tr key={String(x.developerId)} className="border-b border-line last:border-0 hover:bg-subtle/60">
                      <td className="px-4 py-2.5 font-medium"><Link href={`/dashboard/developers/${x.developerId}`} className="hover:underline">{x.developerName}</Link></td>
                      {["view", "lead_submitted", "whatsapp_click", "phone_click", "email_click"].map((k) => <td key={k} className="px-3 py-2.5 text-right tabular-nums">{n(x.byType[k] ?? 0)}</td>)}
                      <td className="px-4 py-2.5 text-right font-medium tabular-nums">{n(x.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ) : null}

        <section className="mt-5 border border-line bg-panel p-4">
          <div className="mb-4 flex items-center justify-between"><h2 className="font-semibold">Enquiries and replies</h2><Link href="/dashboard/leads" className="inline-flex items-center gap-0.5 text-xs underline">All leads <ArrowUpRight size={12} /></Link></div>
          {!pipeline ? <div className="d-skeleton h-24" /> : (
            <>
              <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))" }}>
                {pipeline.stages.map((s) => (
                  <div key={s.status} className="border border-line px-4 py-3"><p className="text-[28px] font-normal leading-none tabular-nums">{n(s.count)}</p><p className="d-label mt-2">{s.label}</p></div>
                ))}
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <div className="bg-subtle px-4 py-3"><p className="d-label">Waiting for a first reply</p><p className="mt-1 text-xl tabular-nums">{n(pipeline.awaitingReply)}</p></div>
                <div className="bg-subtle px-4 py-3"><p className="d-label">Median time to reply</p><p className="mt-1 text-xl tabular-nums">{minutes(pipeline.medianResponseMinutes)}</p></div>
                <div className="bg-subtle px-4 py-3"><p className="d-label">Answered within 24 hours</p><p className="mt-1 text-xl tabular-nums">{pipeline.respondedWithinHourPercent === null ? "—" : `${Math.round(pipeline.respondedWithinHourPercent)}%`}</p></div>
              </div>
              <p className="mt-3 text-xs text-muted">Enquiries keep their full history, even from before the analytics fresh start.</p>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
