"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AlertCircle, ArrowUpRight, Building2, CalendarClock, Eye, MessageCircle, Star } from "lucide-react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useDash } from "./DashProvider";
import { PageHero, heroBtn } from "./PageHero";
import { StatusChip } from "./StatusChip";
import { allOf } from "../_data/scope";
import { apiCount, apiFind, apiGet, apiGetJson, type Doc } from "../_data/api";

// Overview: every number here is read live from Payload (leads, projects, subscriptions) and from the same analytics summary
// endpoint that /cms uses, scoped to what this login may see. Nothing is estimated.

type Summary = { totalEvents: number; byType: { key: string; count: number }[]; trend: { date: string; count: number }[] };

const DAY = 86400000;
const ago = (iso: string, now: number) => {
  const h = Math.max(1, Math.round((now - new Date(iso).getTime()) / 3600000));
  return h < 24 ? `${h} h ago` : `${Math.round(h / 24)} d ago`;
};
const idOf = (v: unknown) => (v && typeof v === "object" ? (v as { id?: unknown }).id : v);

function Stat({ icon: Icon, label, value, sub }: { icon: typeof Eye; label: string; value: string; sub?: string }) {
  return (
    <div className="border border-line bg-panel p-4">
      <div className="flex items-center justify-between text-sm text-muted"><span>{label}</span><span className="grid h-8 w-8 place-items-center bg-subtle"><Icon size={16} /></span></div>
      <p className="mt-2 text-2xl font-semibold tabular-nums tracking-tight">{value}</p>
      {sub ? <p className="mt-0.5 text-xs text-muted">{sub}</p> : null}
    </div>
  );
}

type Data = {
  summary: Summary | null;
  leadsMonth: number;
  newLeads: number;
  active: number;
  drafts: number;
  subs: number;
  company: Doc | null;
  recent: Doc[];
  featured: Doc[];
  /** When the numbers were read, so the page never needs the clock while rendering. */
  at: number;
};

export function Overview() {
  const d = useDash();
  const admin = d.role === "admin";
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState("");
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const since = new Date(Date.now() - 30 * DAY);
        const start = since.toISOString().slice(0, 10);
        const end = new Date().toISOString().slice(0, 10);
        const leadsScope = d.scope("leads");
        const projScope = d.scope("projects");
        const companyId = d.session.developerIds[0];
        const [summary, leadsMonth, newLeads, active, drafts, subs, company, recent, featured] = await Promise.all([
          apiGetJson<Summary>(`/analytics-summary?startDate=${start}&endDate=${end}`).catch(() => null),
          apiCount("leads", allOf(leadsScope, { createdAt: { greater_than_equal: since.toISOString() } })),
          apiCount("leads", allOf(leadsScope, { status: { equals: "new" } })),
          apiCount("projects", allOf(projScope, { isPublished: { equals: true } })),
          apiCount("projects", allOf(projScope, { isPublished: { equals: false } })),
          apiCount("subscriptions", allOf(d.scope("subscriptions"), { status: { equals: "active" } })),
          !admin && companyId ? apiGet("developers", companyId) : Promise.resolve(null),
          apiFind("leads", { limit: 6, sort: "-createdAt", where: leadsScope, select: { name: true, phone: true, message: true, project: true, status: true, createdAt: true } }),
          apiFind("projects", { limit: 3, sort: "-updatedAt", where: allOf(projScope, { featured: { equals: true } }), select: { name: true } }),
        ]);
        if (!alive) return;
        d.ensureLabels("projects", recent.docs.map((l) => idOf(l.project)));
        setData({ summary, leadsMonth, newLeads, active, drafts, subs, company, recent: recent.docs, featured: featured.docs, at: Date.now() });
        setError("");
      } catch (e) {
        if (alive) setError(e instanceof Error ? e.message : "Could not load the overview.");
      }
    })();
    return () => { alive = false; };
  }, [d, admin, reload]);

  if (error) {
    return (
      <div className="mx-auto max-w-md py-20 text-center">
        <span className="mx-auto grid h-12 w-12 place-items-center bg-subtle text-bad"><AlertCircle size={22} /></span>
        <h1 className="mt-3 text-lg font-semibold">Could not load the overview</h1>
        <p className="mt-1.5 text-sm text-muted">{error}</p>
        <button type="button" onClick={() => { setError(""); setData(null); setReload((n) => n + 1); }} className="mt-4 border border-line px-3 py-1.5 text-sm hover:bg-subtle">Try again</button>
      </div>
    );
  }

  const views = data?.summary?.byType.find((t) => t.key === "view")?.count ?? 0;
  const now = data?.at ?? 0;
  const trend = (() => {
    const by = new Map((data?.summary?.trend ?? []).map((p) => [p.date, p.count]));
    return Array.from({ length: 30 }, (_, i) => {
      const day = new Date(now - (29 - i) * DAY);
      return { day: day.toLocaleDateString("en-GB", { day: "numeric", month: "short" }), count: by.get(day.toISOString().slice(0, 10)) ?? 0 };
    });
  })();
  const featuredUntil = data?.company?.featuredUntil ? new Date(String(data.company.featuredUntil)) : null;
  const daysLeft = featuredUntil ? Math.max(0, Math.round((featuredUntil.getTime() - now) / DAY)) : null;
  const name = d.session.name;

  return (
    <div>
      <PageHero
        title={admin ? "Overview." : "Welcome back."}
        description={admin ? "How LankaNewHomes is doing across every developer, live from Payload." : `${name}: how your listings are performing.`}
        stat={{ label: "Leads, last 30 days", value: data ? String(data.leadsMonth) : "…" }}
        actions={<><Link href="/dashboard/leads" className={heroBtn}>View leads</Link><Link href="/dashboard/projects" className={heroBtn}>Your projects</Link></>}
      />

      <div className="d-box">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Stat icon={Eye} label="Page views, last 30 days" value={data ? views.toLocaleString("en-LK") : "…"} sub={data?.summary ? "Real visits, bots and repeats removed" : data ? "No analytics yet" : undefined} />
          <Stat icon={MessageCircle} label="Leads, last 30 days" value={data ? String(data.leadsMonth) : "…"} sub={data ? `${data.newLeads} still new` : undefined} />
          <Stat icon={Building2} label="Published listings" value={data ? String(data.active) : "…"} sub={data ? `${data.drafts} ${data.drafts === 1 ? "draft" : "drafts"}` : undefined} />
          <Stat icon={CalendarClock} label={admin ? "Active subscriptions" : "Package days left"} value={!data ? "…" : admin ? String(data.subs) : daysLeft === null ? "—" : String(daysLeft)} sub={admin ? "paying developers" : featuredUntil ? `Ends ${featuredUntil.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}` : "No paid package"} />
        </div>

        <div className="mt-5 grid gap-5 xl:grid-cols-3">
          <section className="border border-line bg-panel p-4 xl:col-span-2">
            <div className="mb-3 flex items-center justify-between"><h2 className="font-semibold">Visitor activity, last 30 days</h2><span className="text-xs text-muted">Views, saves, clicks and enquiries</span></div>
            <div className="h-64">
              {data ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trend} margin={{ top: 4, right: 8, left: -12, bottom: 0 }}>
                    <defs><linearGradient id="viewsFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--d-brand)" stopOpacity={0.28} /><stop offset="100%" stopColor="var(--d-brand)" stopOpacity={0} /></linearGradient></defs>
                    <CartesianGrid stroke="var(--d-line)" strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="day" tick={{ fill: "var(--d-muted)", fontSize: 11 }} tickLine={false} axisLine={false} interval={4} />
                    <YAxis allowDecimals={false} tick={{ fill: "var(--d-muted)", fontSize: 11 }} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ background: "var(--d-panel)", border: "1px solid var(--d-line)", fontSize: 12 }} labelStyle={{ color: "var(--d-fg)" }} />
                    <Area type="monotone" dataKey="count" name="Events" stroke="var(--d-brand)" strokeWidth={2} fill="url(#viewsFill)" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : <div className="d-skeleton h-full w-full" />}
            </div>
          </section>

          <section className="border border-line bg-panel p-4">
            <div className="mb-3 flex items-center justify-between"><h2 className="font-semibold">Featured spots</h2><Link href="/dashboard/package" className="inline-flex items-center gap-0.5 text-xs underline">Manage <ArrowUpRight size={12} /></Link></div>
            <ul className="space-y-2">
              {(data ? [0, 1, 2] : []).map((i) => {
                const p = data?.featured[i];
                return (
                  <li key={i} className={`flex items-center gap-3 border px-3 py-2.5 ${p ? "border-line" : "border-dashed border-line"}`}>
                    <span className={`grid h-8 w-8 shrink-0 place-items-center text-xs font-semibold ${p ? "bg-subtle" : "bg-subtle text-muted"}`}>{i + 1}</span>
                    <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{p ? String(p.name) : "Empty spot"}</p>{p ? null : <p className="text-xs text-muted">Choose a project to feature</p>}</div>
                    {p ? <Star size={15} className="shrink-0 fill-brand text-brand" /> : null}
                  </li>
                );
              })}
              {data ? null : [0, 1, 2].map((i) => <li key={i} className="d-skeleton h-12" />)}
            </ul>
          </section>
        </div>

        <section className="mt-5 border border-line bg-panel">
          <div className="flex items-center justify-between border-b border-line px-4 py-3"><h2 className="font-semibold">Recent leads</h2><Link href="/dashboard/leads" className="inline-flex items-center gap-0.5 text-xs underline">View all <ArrowUpRight size={12} /></Link></div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-sm">
              <thead><tr className="border-b border-line text-left text-xs font-semibold uppercase tracking-wide text-muted"><th className="px-4 py-2.5">Buyer</th><th className="px-4 py-2.5">Project</th><th className="px-4 py-2.5">Message</th><th className="px-4 py-2.5">Status</th><th className="px-4 py-2.5 text-right">When</th></tr></thead>
              <tbody>
                {!data ? Array.from({ length: 4 }, (_, i) => <tr key={i}><td colSpan={5} className="px-4 py-3"><div className="d-skeleton h-5 w-full" /></td></tr>) : data.recent.length === 0 ? <tr><td colSpan={5} className="px-4 py-10 text-center text-muted">No leads yet.</td></tr> : data.recent.map((l) => (
                  <tr key={String(l.id)} className="border-b border-line last:border-0 hover:bg-subtle/60">
                    <td className="px-4 py-2.5"><Link href={`/dashboard/leads/${l.id}`} className="font-medium hover:underline">{String(l.name ?? "")}</Link><p className="text-xs text-muted">{String(l.phone ?? "")}</p></td>
                    <td className="px-4 py-2.5">{d.labelOf("projects", idOf(l.project))}</td>
                    <td className="max-w-xs truncate px-4 py-2.5 text-muted">{String(l.message ?? "")}</td>
                    <td className="px-4 py-2.5"><StatusChip value={String(l.status ?? "new")} /></td>
                    <td className="whitespace-nowrap px-4 py-2.5 text-right text-muted">{l.createdAt ? ago(String(l.createdAt), now) : ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
