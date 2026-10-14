"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Check, CalendarClock, Crown, Info, RefreshCw, Sparkles, Star } from "lucide-react";
import { useDash } from "./DashProvider";
import { NOW } from "../_mock/seeds";

// "My package": the current plan, which of the developer's projects fill the featured spots (swappable any time),
// the end date, and the upgrade options. The tiers mirror Payload's `package` options (free, featured, featured-plus,
// developer-pro, campaign); the spot counts and prices here are placeholders for the design, not the real price list.

const TIERS = [
  { id: "free", name: "Free", spots: 0, price: "Rs. 0", blurb: "Your listings, always free.", perks: ["Unlimited listings", "Lead alerts by email", "Verified Developer badge"] },
  { id: "featured", name: "Featured", spots: 1, price: "Sample Rs. 45,000", blurb: "One featured spot.", perks: ["1 featured spot", "Appears above free listings", "Monthly performance email"] },
  { id: "featured-plus", name: "Featured Plus", spots: 2, price: "Sample Rs. 95,000", blurb: "Two featured spots.", perks: ["2 featured spots", "Hero rotation slot", "Priority in search"] },
  { id: "developer-pro", name: "Developer Pro", spots: 3, price: "Sample Rs. 185,000", blurb: "Three spots and the Developer Spotlight.", perks: ["3 featured spots", "Developer Spotlight chip", "Hero + Featured rotation", "Quarterly strategy call"] },
  { id: "campaign", name: "Campaign", spots: 5, price: "Custom", blurb: "A launch campaign across the site.", perks: ["5 featured spots", "Homepage hero takeover", "Newsletter + social posts", "Dedicated manager"] },
];

export function PackagePage() {
  const d = useDash();
  useEffect(() => { ["projects", "subscriptions", "payments"].forEach((s) => d.ensure(s)); }, [d]);
  const mine = (d.scoped("projects") ?? []).filter((p) => p.isPublished);
  const subs = d.scoped("subscriptions") ?? [];
  const sub = subs.find((s) => s.status === "active");
  const pkgId = sub ? String(sub.package) : "developer-pro";
  const tier = TIERS.find((t) => t.id === pkgId) ?? TIERS[3];
  const end = sub ? new Date(String(sub.current_period_end)) : new Date(NOW.getTime() + 62 * 86400000);
  const daysLeft = Math.max(0, Math.round((end.getTime() - NOW.getTime()) / 86400000));
  const initial = useMemo(() => mine.filter((p) => p.featured).slice(0, tier.spots).map((p) => p.id), [mine, tier.spots]);
  const [slots, setSlots] = useState<(number | string | "")[] | null>(null);
  const current = slots ?? Array.from({ length: tier.spots }, (_, i) => initial[i] ?? "");
  const dirty = slots !== null && JSON.stringify(slots) !== JSON.stringify(Array.from({ length: tier.spots }, (_, i) => initial[i] ?? ""));
  const payments = (d.scoped("payments") ?? []).slice(0, 5);

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-xl font-semibold tracking-tight">{d.role === "admin" ? "Packages" : "My package"}</h1>
        <p className="mt-0.5 text-sm text-muted">Your plan, your featured spots and your upgrade options.</p>
      </div>
      {d.role === "admin" ? <p className="mb-4 flex items-start gap-2 rounded-md border border-line bg-accent-soft px-3 py-2 text-sm text-accent"><Info size={15} className="mt-0.5 shrink-0" />This is what a developer sees (Prime Lands). Admins manage subscriptions and pricing under Billing.</p> : null}

      <div className="grid gap-5 xl:grid-cols-3">
        <section className="rounded-xl border border-line bg-panel p-5 shadow-card xl:col-span-1">
          <div className="flex items-center gap-2 text-sm text-muted"><Crown size={15} className="text-accent" /> Current package</div>
          <p className="mt-2 text-2xl font-semibold tracking-tight">{tier.name}</p>
          <p className="text-sm text-muted">{tier.blurb}</p>
          <div className="mt-4 rounded-lg bg-subtle p-3">
            <div className="flex items-center justify-between text-sm"><span className="inline-flex items-center gap-1.5 text-muted"><CalendarClock size={14} /> Ends</span><span className="font-medium">{end.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</span></div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-line"><div className="h-full rounded-full bg-accent" style={{ width: `${Math.min(100, Math.round((daysLeft / 90) * 100))}%` }} /></div>
            <p className="mt-1.5 text-xs text-muted">{daysLeft} days left</p>
          </div>
          <ul className="mt-4 space-y-1.5 text-sm">{tier.perks.map((p) => <li key={p} className="flex items-center gap-2"><Check size={14} className="text-ok" />{p}</li>)}</ul>
          <button type="button" onClick={() => d.toast("Renewal is a preview: no payment taken", "info")} className="mt-5 inline-flex w-full items-center justify-center gap-1.5 rounded-md border border-line px-3 py-2 text-sm font-medium hover:bg-subtle"><RefreshCw size={14} /> Renew early</button>
        </section>

        <section className="rounded-xl border border-line bg-panel p-5 shadow-card xl:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div><h2 className="font-semibold">Featured spots</h2><p className="text-sm text-muted">Pick which of your projects fill your {tier.spots} spot{tier.spots === 1 ? "" : "s"}. Swap any time.</p></div>
            <button type="button" disabled={!dirty} onClick={() => { d.toast("Featured spots updated (preview only)"); setSlots(null); }} className="rounded-md bg-accent px-3.5 py-1.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-40">Save spots</button>
          </div>
          {tier.spots === 0 ? <p className="mt-4 rounded-md border border-dashed border-line px-3 py-6 text-center text-sm text-muted">Your plan has no featured spots. Upgrade below to feature a project.</p> : (
            <ul className="mt-4 space-y-2.5">
              {current.map((v, i) => (
                <li key={i} className="flex flex-wrap items-center gap-3 rounded-lg border border-line px-3 py-2.5">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-accent-soft text-sm font-semibold text-accent">{i + 1}</span>
                  <select value={String(v)} onChange={(e) => { const next = [...current]; next[i] = e.target.value === "" ? "" : Number(e.target.value); setSlots(next); }} className="min-w-56 flex-1 rounded-md border border-line bg-panel px-2.5 py-2 text-sm">
                    <option value="">Empty: choose a project</option>
                    {mine.map((p) => <option key={String(p.id)} value={String(p.id)} disabled={current.includes(p.id) && v !== p.id}>{String(p.name)}</option>)}
                  </select>
                  <span className="text-xs text-muted">Until {end.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</span>
                  {v !== "" ? <Star size={15} className="fill-accent text-accent" /> : null}
                </li>
              ))}
            </ul>
          )}
          <p className="mt-3 text-xs text-muted">Only published projects can be featured. Changes take effect straight away on the live site.</p>
        </section>
      </div>

      <h2 className="mb-3 mt-7 font-semibold">Upgrade options</h2>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {TIERS.map((t) => {
          const isCurrent = t.id === tier.id;
          return (
            <div key={t.id} className={`flex flex-col rounded-xl border p-4 shadow-card ${isCurrent ? "border-accent bg-accent-soft/40" : "border-line bg-panel"}`}>
              <div className="flex items-center justify-between"><p className="font-semibold">{t.name}</p>{isCurrent ? <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-semibold text-white">Current</span> : t.id === "developer-pro" ? <Sparkles size={14} className="text-accent" /> : null}</div>
              <p className="mt-1 text-lg font-semibold tabular-nums">{t.price}</p>
              <p className="text-xs text-muted">{t.spots} featured spot{t.spots === 1 ? "" : "s"}</p>
              <ul className="my-3 flex-1 space-y-1 text-sm">{t.perks.map((p) => <li key={p} className="flex items-start gap-1.5"><Check size={13} className="mt-1 shrink-0 text-ok" /><span>{p}</span></li>)}</ul>
              <button type="button" disabled={isCurrent} onClick={() => d.toast(`Upgrade to ${t.name} is a preview: nothing is charged`, "info")} className="inline-flex items-center justify-center gap-1 rounded-md border border-line bg-panel px-3 py-1.5 text-sm font-medium hover:border-accent hover:text-accent disabled:opacity-40">{isCurrent ? "Your plan" : <>Choose <ArrowRight size={13} /></>}</button>
            </div>
          );
        })}
      </div>
      <p className="mt-2 text-xs text-muted">Spot counts and prices are placeholders for the design preview.</p>

      <h2 className="mb-3 mt-7 font-semibold">Recent payments</h2>
      <div className="overflow-x-auto rounded-xl border border-line bg-panel shadow-card">
        <table className="w-full min-w-[480px] text-sm">
          <thead><tr className="border-b border-line text-left text-xs font-semibold uppercase tracking-wide text-muted"><th className="px-4 py-2.5">Date</th><th className="px-4 py-2.5">Type</th><th className="px-4 py-2.5">Status</th><th className="px-4 py-2.5 text-right">Amount</th></tr></thead>
          <tbody>
            {payments.length === 0 ? <tr><td colSpan={4} className="px-4 py-8 text-center text-muted">No payments yet.</td></tr> : payments.map((p) => (
              <tr key={String(p.id)} className="border-b border-line last:border-0"><td className="px-4 py-2.5 text-muted">{new Date(String(p.payment_date ?? p.createdAt)).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</td><td className="px-4 py-2.5">{String(p.payment_type ?? "").replace(/_/g, " ")}</td><td className="px-4 py-2.5 capitalize">{String(p.status)}</td><td className="px-4 py-2.5 text-right tabular-nums">Rs. {Number(p.amount ?? 0).toLocaleString("en-LK")}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-sm text-muted">Need a custom plan? <Link href="/dashboard/inbox" className="text-accent hover:underline">Contact us</Link>.</p>
    </div>
  );
}
