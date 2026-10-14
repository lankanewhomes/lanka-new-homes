"use client";

import Link from "next/link";
import { useEffect, useMemo } from "react";
import { ArrowUpRight, CalendarClock, Eye, MessageCircle, Star, Building2 } from "lucide-react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useDash } from "./DashProvider";
import { StatusChip } from "./StatusChip";
import { PageHero, heroBtn } from "./PageHero";
import { NOW, daysAgo, makeRng } from "../_mock/seeds";
import { MOCK_DEVELOPER } from "../_mock/types";

const ago = (iso: string) => {
  const h = Math.max(1, Math.round((NOW.getTime() - new Date(iso).getTime()) / 3600000));
  return h < 24 ? `${h} h ago` : `${Math.round(h / 24)} d ago`;
};

function Stat({ icon: Icon, label, value, sub, tone }: { icon: typeof Eye; label: string; value: string; sub?: string; tone?: "accent" }) {
  return (
    <div className="rounded-xl border border-line bg-panel p-4 shadow-card">
      <div className="flex items-center justify-between text-sm text-muted"><span>{label}</span><span className={`grid h-8 w-8 place-items-center rounded-lg ${tone === "accent" ? "bg-accent-soft text-accent" : "bg-subtle"}`}><Icon size={16} /></span></div>
      <p className="mt-2 text-2xl font-semibold tabular-nums tracking-tight">{value}</p>
      {sub ? <p className="mt-0.5 text-xs text-muted">{sub}</p> : null}
    </div>
  );
}

export function Overview() {
  const d = useDash();
  useEffect(() => { ["leads", "projects", "subscriptions", "analytics"].forEach((s) => d.ensure(s)); }, [d]);
  const admin = d.role === "admin";
  const leads = d.scoped("leads");
  const projects = d.scoped("projects");
  const subs = d.scoped("subscriptions");

  const series = useMemo(() => {
    const rng = makeRng(admin ? 11 : 7);
    const base = admin ? 760 : 180;
    return Array.from({ length: 30 }, (_, i) => {
      const day = new Date(NOW.getTime() - (29 - i) * 86400000);
      return { day: day.toLocaleDateString("en-GB", { day: "numeric", month: "short" }), views: Math.round(base * (0.7 + rng() * 0.7 + i * 0.012)) };
    });
  }, [admin]);
  const total = series.reduce((n, p) => n + p.views, 0);
  const month = (leads ?? []).filter((l) => NOW.getTime() - new Date(String(l.createdAt)).getTime() < 30 * 86400000);
  const active = (projects ?? []).filter((p) => p.isPublished);
  const mySub = (subs ?? []).find((s) => s.status === "active");
  const daysLeft = mySub ? Math.max(0, Math.round((new Date(String(mySub.current_period_end)).getTime() - NOW.getTime()) / 86400000)) : null;
  const recent = [...(leads ?? [])].sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt))).slice(0, 6);
  const featured = active.filter((p) => p.featured).slice(0, 3);
  const projName = (id: unknown) => String(d.rowsOf("projects")?.find((p) => p.id === id)?.name ?? `Project #${String(id)}`);

  return (
    <div>
      <PageHero
        title={admin ? "Overview." : "Welcome back."}
        description={admin ? "How LankaNewHomes is doing across every developer. Sample numbers for the design preview." : `How ${MOCK_DEVELOPER.name}'s listings are performing. Sample numbers for the design preview.`}
        stat={{ label: "Leads this month", value: String(month.length) }}
        actions={<><Link href="/dashboard/leads" className={heroBtn}>View leads</Link><Link href="/dashboard/projects" className={heroBtn}>Your projects</Link></>}
      />

      <div className="d-box">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat icon={Eye} label="Views, last 30 days" value={total.toLocaleString("en-LK")} sub="+12% on the 30 days before" tone="accent" />
        <Stat icon={MessageCircle} label="Leads this month" value={String(month.length)} sub={`${month.filter((l) => l.status === "new").length} still new`} />
        <Stat icon={Building2} label="Active listings" value={String(active.length)} sub={`${(projects ?? []).length - active.length} drafts`} />
        <Stat icon={CalendarClock} label={admin ? "Active subscriptions" : "Package days left"} value={admin ? String((subs ?? []).filter((s) => s.status === "active").length) : daysLeft === null ? "—" : String(daysLeft)} sub={admin ? "of all packages" : mySub ? `Renews ${new Date(String(mySub.current_period_end)).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}` : "No paid package"} />
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-3">
        <section className="rounded-xl border border-line bg-panel p-4 shadow-card xl:col-span-2">
          <div className="mb-3 flex items-center justify-between"><h2 className="font-semibold">Views, last 30 days</h2><span className="text-xs text-muted">All listing pages</span></div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={series} margin={{ top: 4, right: 8, left: -12, bottom: 0 }}>
                <defs><linearGradient id="viewsFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--d-brand)" stopOpacity={0.28} /><stop offset="100%" stopColor="var(--d-brand)" stopOpacity={0} /></linearGradient></defs>
                <CartesianGrid stroke="var(--d-line)" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="day" tick={{ fill: "var(--d-muted)", fontSize: 11 }} tickLine={false} axisLine={false} interval={4} />
                <YAxis tick={{ fill: "var(--d-muted)", fontSize: 11 }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: "var(--d-panel)", border: "1px solid var(--d-line)", borderRadius: 8, fontSize: 12 }} labelStyle={{ color: "var(--d-fg)" }} />
                <Area type="monotone" dataKey="views" stroke="var(--d-brand)" strokeWidth={2} fill="url(#viewsFill)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="rounded-xl border border-line bg-panel p-4 shadow-card">
          <div className="mb-3 flex items-center justify-between"><h2 className="font-semibold">Featured spots</h2><Link href="/dashboard/package" className="inline-flex items-center gap-0.5 text-xs text-accent hover:underline">Manage <ArrowUpRight size={12} /></Link></div>
          <ul className="space-y-2">
            {[0, 1, 2].map((i) => {
              const p = featured[i];
              return (
                <li key={i} className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 ${p ? "border-line" : "border-dashed border-line"}`}>
                  <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-md text-xs font-semibold ${p ? "bg-accent-soft text-accent" : "bg-subtle text-muted"}`}>{i + 1}</span>
                  <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{p ? String(p.name) : "Empty spot"}</p><p className="text-xs text-muted">{p ? "Colombo page, ends in 18 days" : "Choose a project to feature"}</p></div>
                  {p ? <Star size={15} className="shrink-0 fill-accent text-accent" /> : null}
                </li>
              );
            })}
          </ul>
        </section>
      </div>

      <section className="mt-5 rounded-xl border border-line bg-panel shadow-card">
        <div className="flex items-center justify-between border-b border-line px-4 py-3"><h2 className="font-semibold">Recent leads</h2><Link href="/dashboard/leads" className="inline-flex items-center gap-0.5 text-xs text-accent hover:underline">View all <ArrowUpRight size={12} /></Link></div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-sm">
            <thead><tr className="border-b border-line text-left text-xs font-semibold uppercase tracking-wide text-muted"><th className="px-4 py-2.5">Buyer</th><th className="px-4 py-2.5">Project</th><th className="px-4 py-2.5">Message</th><th className="px-4 py-2.5">Status</th><th className="px-4 py-2.5 text-right">When</th></tr></thead>
            <tbody>
              {recent.length === 0 ? <tr><td colSpan={5} className="px-4 py-10 text-center text-muted">No leads yet.</td></tr> : recent.map((l) => (
                <tr key={String(l.id)} className="border-b border-line last:border-0 hover:bg-subtle/60">
                  <td className="px-4 py-2.5"><Link href={`/dashboard/leads/${l.id}`} className="font-medium hover:text-accent">{String(l.name)}</Link><p className="text-xs text-muted">{String(l.phone ?? "")}</p></td>
                  <td className="px-4 py-2.5">{projName(l.project)}</td>
                  <td className="max-w-xs truncate px-4 py-2.5 text-muted">{String(l.message ?? "")}</td>
                  <td className="px-4 py-2.5"><StatusChip value={String(l.status)} /></td>
                  <td className="whitespace-nowrap px-4 py-2.5 text-right text-muted">{ago(String(l.createdAt ?? daysAgo(1)))}</td>
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
