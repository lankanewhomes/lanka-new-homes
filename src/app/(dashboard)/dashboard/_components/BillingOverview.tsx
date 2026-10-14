"use client";

import { useEffect, useMemo } from "react";
import { Banknote, CreditCard, Repeat, TrendingUp } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useDash } from "./DashProvider";
import { StatusChip } from "./StatusChip";

/** Admin billing overview (Payload: the /cms/billing view over Subscriptions and Payments). */
export function BillingOverview() {
  const d = useDash();
  useEffect(() => { ["subscriptions", "payments", "developers"].forEach((s) => d.ensure(s)); }, [d]);
  const subs = d.scoped("subscriptions") ?? [];
  const pays = d.scoped("payments") ?? [];
  const mrr = subs.filter((s) => s.status === "active").reduce((n, s) => n + Number(s.amount ?? 0), 0);
  const collected = pays.filter((p) => p.status === "completed").reduce((n, p) => n + Number(p.amount ?? 0), 0);
  const months = useMemo(() => ["May", "Jun", "Jul", "Aug", "Sep", "Oct"].map((m, i) => ({ month: m, revenue: Math.round((collected / 6) * (0.6 + i * 0.12)) })), [collected]);
  const name = (id: unknown) => String(d.rowsOf("developers")?.find((x) => x.id === (typeof id === "object" && id ? (id as { value: unknown }).value : id))?.name ?? `Developer #${String(id)}`);
  const stat = (Icon: typeof Banknote, label: string, value: string) => (
    <div className="rounded-xl border border-line bg-panel p-4 shadow-card"><div className="flex items-center justify-between text-sm text-muted">{label}<span className="grid h-8 w-8 place-items-center rounded-lg bg-subtle"><Icon size={16} /></span></div><p className="mt-2 text-2xl font-semibold tabular-nums tracking-tight">{value}</p></div>
  );
  return (
    <div>
      <div className="mb-5"><h1 className="text-xl font-semibold tracking-tight">Billing overview</h1><p className="mt-0.5 text-sm text-muted">Subscriptions and payments across all developers. Sample figures.</p></div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stat(Repeat, "Monthly recurring", `Rs. ${mrr.toLocaleString("en-LK")}`)}
        {stat(Banknote, "Collected (6 months)", `Rs. ${collected.toLocaleString("en-LK")}`)}
        {stat(CreditCard, "Active subscriptions", String(subs.filter((s) => s.status === "active").length))}
        {stat(TrendingUp, "Past due", String(subs.filter((s) => s.status === "past_due").length))}
      </div>
      <section className="mt-5 rounded-xl border border-line bg-panel p-4 shadow-card">
        <h2 className="mb-3 font-semibold">Revenue by month</h2>
        <div className="h-56"><ResponsiveContainer width="100%" height="100%"><BarChart data={months} margin={{ top: 4, right: 8, left: 8, bottom: 0 }}><CartesianGrid stroke="var(--d-line)" strokeDasharray="3 3" vertical={false} /><XAxis dataKey="month" tick={{ fill: "var(--d-muted)", fontSize: 11 }} tickLine={false} axisLine={false} /><YAxis tick={{ fill: "var(--d-muted)", fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={(v: number) => `${Math.round(v / 1000)}k`} /><Tooltip contentStyle={{ background: "var(--d-panel)", border: "1px solid var(--d-line)", borderRadius: 8, fontSize: 12 }} /><Bar dataKey="revenue" fill="var(--d-accent)" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></div>
      </section>
      <section className="mt-5 overflow-x-auto rounded-xl border border-line bg-panel shadow-card">
        <div className="border-b border-line px-4 py-3 font-semibold">Subscriptions</div>
        <table className="w-full min-w-[560px] text-sm">
          <thead><tr className="border-b border-line text-left text-xs font-semibold uppercase tracking-wide text-muted"><th className="px-4 py-2.5">Developer</th><th className="px-4 py-2.5">Package</th><th className="px-4 py-2.5">Status</th><th className="px-4 py-2.5 text-right">Amount</th></tr></thead>
          <tbody>{subs.map((s) => <tr key={String(s.id)} className="border-b border-line last:border-0"><td className="px-4 py-2.5 font-medium">{name(s.developer)}</td><td className="px-4 py-2.5">{String(s.package).replace(/-/g, " ")}</td><td className="px-4 py-2.5"><StatusChip value={String(s.status)} /></td><td className="px-4 py-2.5 text-right tabular-nums">Rs. {Number(s.amount ?? 0).toLocaleString("en-LK")}</td></tr>)}</tbody>
        </table>
      </section>
    </div>
  );
}
