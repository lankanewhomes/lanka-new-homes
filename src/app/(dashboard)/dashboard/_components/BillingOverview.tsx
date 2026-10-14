"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Banknote, CreditCard, Repeat, TrendingUp } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useDash } from "./DashProvider";
import { StatusChip } from "./StatusChip";
import { PageHero } from "./PageHero";
import { apiFind, type Doc } from "../_data/api";

// Billing overview, live from Payload's Subscriptions and Payments. Amounts of different currencies are never added together:
// every total is shown per currency.

const num = (v: unknown): number => (typeof v === "number" && Number.isFinite(v) ? v : Number(v) || 0);
const idOf = (v: unknown): string => String(v && typeof v === "object" ? (v as { id?: unknown; value?: unknown }).id ?? (v as { value?: unknown }).value : v);
const cur = (v: unknown): string => (typeof v === "string" && v ? v : "LKR");

function money(amount: number, currency: string): string {
  const n = Math.round(amount).toLocaleString("en-US");
  return currency === "LKR" ? `Rs. ${n}` : `${currency} ${n}`;
}

const MONTHS_PER_INTERVAL: Record<string, number> = { monthly: 1, quarterly: 3, annual: 12 };

function addTo(map: Map<string, number>, currency: string, amount: number) {
  map.set(currency, (map.get(currency) ?? 0) + amount);
}
const lines = (map: Map<string, number>): string[] => [...map.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([c, a]) => money(a, c));

function dateText(v: unknown): string {
  if (typeof v !== "string" || !v) return "";
  const dt = new Date(v);
  return Number.isNaN(dt.getTime()) ? "" : dt.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

type Data = { subs: Doc[]; pays: Doc[] };

export function BillingOverview() {
  const d = useDash();
  const { scope, ensureLabels, labelOf } = d;
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [chartCur, setChartCur] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    (async () => {
      try {
        const [s, p] = await Promise.all([
          apiFind("subscriptions", { where: scope("subscriptions"), limit: 200, sort: "-current_period_end" }),
          apiFind("payments", { where: scope("payments"), limit: 500, sort: "-payment_date" }),
        ]);
        await ensureLabels("developers", s.docs.map((x) => idOf(x.developer)));
        if (live) { setData({ subs: s.docs, pays: p.docs }); setError(null); }
      } catch (e) {
        if (live) setError(e instanceof Error ? e.message : "Could not load billing data.");
      }
    })();
    return () => { live = false; };
  }, [scope, ensureLabels, attempt]);

  const retry = useCallback(() => { setError(null); setData(null); setAttempt((n) => n + 1); }, []);

  const calc = useMemo(() => {
    if (!data) return null;
    const mrr = new Map<string, number>();
    const collected = new Map<string, number>();
    const now = new Date();
    const buckets = Array.from({ length: 6 }, (_, i) => {
      const dt = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
      return { key: `${dt.getFullYear()}-${dt.getMonth()}`, month: dt.toLocaleDateString("en-GB", { month: "short" }), start: dt, byCur: new Map<string, number>() };
    });
    const start = buckets[0].start;
    for (const s of data.subs) {
      if (s.status !== "active") continue;
      addTo(mrr, cur(s.currency), num(s.amount) / (MONTHS_PER_INTERVAL[String(s.billing_interval ?? "monthly")] ?? 1));
    }
    for (const p of data.pays) {
      if (p.status !== "completed" || typeof p.payment_date !== "string") continue;
      const dt = new Date(p.payment_date);
      if (Number.isNaN(dt.getTime()) || dt < start) continue;
      addTo(collected, cur(p.currency), num(p.amount));
      const b = buckets.find((x) => x.key === `${dt.getFullYear()}-${dt.getMonth()}`);
      if (b) addTo(b.byCur, cur(p.currency), num(p.amount));
    }
    const currencies = [...collected.keys()].sort((a, b) => (collected.get(b) ?? 0) - (collected.get(a) ?? 0));
    return {
      mrr, collected, buckets, currencies,
      active: data.subs.filter((s) => s.status === "active").length,
      pastDue: data.subs.filter((s) => s.status === "past_due").length,
    };
  }, [data]);

  const selCur = chartCur && calc?.currencies.includes(chartCur) ? chartCur : (calc?.currencies[0] ?? "LKR");
  const chartData = calc ? calc.buckets.map((b) => ({ month: b.month, revenue: b.byCur.get(selCur) ?? 0 })) : [];

  const stat = (Icon: typeof Banknote, label: string, values: string[]) => (
    <div className="border border-line bg-panel p-4">
      <div className="flex items-center justify-between text-sm text-muted">{label}<span className="grid h-8 w-8 place-items-center bg-subtle"><Icon size={16} /></span></div>
      <div className="mt-2 text-2xl font-semibold tabular-nums tracking-tight">{values.length ? values.map((v) => <p key={v}>{v}</p>) : <p>0</p>}</div>
    </div>
  );

  const heroStat = calc ? { label: "Monthly recurring", value: calc.mrr.size ? lines(calc.mrr).join(" + ") : "0" } : { label: "Monthly recurring", value: "..." };
  const hero = <PageHero title="Billing overview." description="Subscriptions and payments across all developers, in each payment's own currency." stat={heroStat} />;

  if (error) {
    return (
      <div>{hero}<div className="d-box"><div className="border border-line bg-panel p-8 text-center">
        <p className="text-sm text-bad">{error}</p>
        <button type="button" onClick={retry} className="mt-3 border border-line px-3 py-1.5 text-sm font-medium hover:bg-subtle">Try again</button>
      </div></div></div>
    );
  }
  if (!data || !calc) {
    return (
      <div>{hero}<div className="d-box space-y-4">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[0, 1, 2, 3].map((i) => <div key={i} className="d-skeleton h-24" />)}</div>
        <div className="d-skeleton h-64" /><div className="d-skeleton h-48" />
      </div></div>
    );
  }

  return (
    <div>
      {hero}
      <div className="d-box">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stat(Repeat, "Monthly recurring", lines(calc.mrr))}
          {stat(Banknote, "Collected (6 months)", lines(calc.collected))}
          {stat(CreditCard, "Active subscriptions", [String(calc.active)])}
          {stat(TrendingUp, "Past due", [String(calc.pastDue)])}
        </div>

        <section className="mt-5 border border-line bg-panel p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-semibold">Completed payments by month ({selCur})</h2>
            {calc.currencies.length > 1 ? (
              <div className="flex gap-1">{calc.currencies.map((c) => (
                <button key={c} type="button" onClick={() => setChartCur(c)} className={`border px-2.5 py-1 text-xs font-medium ${c === selCur ? "border-ink bg-ink text-white" : "border-line hover:bg-subtle"}`}>{c}</button>
              ))}</div>
            ) : null}
          </div>
          {calc.currencies.length === 0 ? <p className="py-10 text-center text-sm text-muted">No completed payments in the last 6 months.</p> : (
            <div className="h-56"><ResponsiveContainer width="100%" height="100%"><BarChart data={chartData} margin={{ top: 4, right: 8, left: 8, bottom: 0 }}>
              <CartesianGrid stroke="var(--d-line)" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="month" tick={{ fill: "var(--d-muted)", fontSize: 11 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fill: "var(--d-muted)", fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={(v: number) => (v >= 1000 ? `${Math.round(v / 1000)}k` : String(v))} />
              <Tooltip formatter={(v) => money(Number(v), selCur)} contentStyle={{ background: "var(--d-panel)", border: "1px solid var(--d-line)", fontSize: 12 }} />
              <Bar dataKey="revenue" name="Collected" stroke="var(--d-brand)" fill="var(--d-brand)" />
            </BarChart></ResponsiveContainer></div>
          )}
        </section>

        <section className="mt-5 overflow-x-auto border border-line bg-panel">
          <div className="border-b border-line px-4 py-3 font-semibold">Subscriptions</div>
          <table className="w-full min-w-[640px] text-sm">
            <thead><tr className="border-b border-line text-left text-xs font-semibold uppercase tracking-wide text-muted"><th className="px-4 py-2.5">Developer</th><th className="px-4 py-2.5">Package</th><th className="px-4 py-2.5">Status</th><th className="px-4 py-2.5 text-right">Amount</th><th className="px-4 py-2.5">Period end</th></tr></thead>
            <tbody>
              {data.subs.length === 0 ? <tr><td colSpan={5} className="px-4 py-8 text-center text-muted">No subscriptions yet.</td></tr> : data.subs.map((s) => (
                <tr key={String(s.id)} className="border-b border-line last:border-0">
                  <td className="px-4 py-2.5 font-medium">{labelOf("developers", idOf(s.developer))}</td>
                  <td className="px-4 py-2.5 capitalize">{String(s.package ?? "").replace(/-/g, " ")}</td>
                  <td className="px-4 py-2.5"><StatusChip value={String(s.status ?? "")} /></td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{money(num(s.amount), cur(s.currency))}</td>
                  <td className="px-4 py-2.5 text-muted">{dateText(s.current_period_end) || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
    </div>
  );
}
