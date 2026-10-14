"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowRight, Check, CalendarClock, Crown, Info, Sparkles, Star } from "lucide-react";
import { useDash } from "./DashProvider";
import { PageHero } from "./PageHero";
import { StatusChip } from "./StatusChip";
import { ApiError, apiFind, apiGet, apiUpdate, type Doc } from "../_data/api";
import { allOf } from "../_data/scope";
import { PACKAGE_LIST, formatPackagePrice, getPackage, maxFeaturedProjects } from "@/lib/packages";

// "My package": the developer's real plan (Developers.plan / featuredUntil / extra_featured_slots), which of their published projects
// fill the featured spots, the upgrade options from src/lib/packages.ts, and their latest payments. Nothing here charges anything.

const idStr = (v: unknown): string => String(v && typeof v === "object" ? (v as { id?: unknown }).id : v);
const idList = (v: unknown): string[] => (Array.isArray(v) ? v.map(idStr) : []);
const same = (a: string[], b: string[]) => a.length === b.length && a.every((x, i) => x === b[i]);
const fullDate = (dt: Date) => dt.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
function money(amount: unknown, currency: unknown): string {
  const n = Math.round(Number(amount) || 0).toLocaleString("en-US");
  return currency === "LKR" || !currency ? `Rs. ${n}` : `${String(currency)} ${n}`;
}

type Loaded = { at: number; devId: string; dev: Doc; projects: Doc[]; payments: Doc[] };
type DevOption = { id: string; name: string; plan: string };

export function PackagePage() {
  const d = useDash();
  const { session, scope, toast } = d;
  const isAdmin = session.role === "admin";

  const [options, setOptions] = useState<DevOption[]>([]);
  const [search, setSearch] = useState("");
  const [picked, setPicked] = useState<string | null>(null);
  const [optionsError, setOptionsError] = useState<string | null>(null);
  const [optionsReady, setOptionsReady] = useState(!isAdmin);

  const devId: string | null = isAdmin
    ? (picked ?? options.find((o) => o.plan !== "free")?.id ?? options[0]?.id ?? null)
    : (session.developerIds[0] !== undefined ? String(session.developerIds[0]) : null);

  useEffect(() => {
    if (!isAdmin) return;
    let live = true;
    (async () => {
      try {
        const page = await apiFind("developers", { limit: 200, sort: "name", select: { name: true, plan: true } });
        if (live) { setOptions(page.docs.map((x) => ({ id: String(x.id), name: String(x.name ?? `Developer #${x.id}`), plan: String(x.plan ?? "free") }))); setOptionsReady(true); }
      } catch (e) {
        if (live) { setOptionsError(e instanceof Error ? e.message : "Could not load developers."); setOptionsReady(true); }
      }
    })();
    return () => { live = false; };
  }, [isAdmin]);

  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [error, setError] = useState<{ devId: string; message: string } | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!devId) return;
    let live = true;
    (async () => {
      try {
        const [dev, projects, payments] = await Promise.all([
          apiGet("developers", devId),
          apiFind("projects", { where: allOf(scope("projects"), { developer: { equals: devId } }, { isPublished: { equals: true } }), limit: 100, sort: "name", select: { name: true } }),
          apiFind("payments", {
            where: allOf(scope("payments"), isAdmin ? { and: [{ "payer.relationTo": { equals: "developers" } }, { "payer.value": { equals: devId } }] } : null),
            sort: "-payment_date", limit: 5,
          }),
        ]);
        if (live) { setLoaded({ at: Date.now(), devId, dev, projects: projects.docs, payments: payments.docs }); setError(null); }
      } catch (e) {
        if (live) setError({ devId, message: e instanceof Error ? e.message : "Could not load this package." });
      }
    })();
    return () => { live = false; };
  }, [devId, scope, isAdmin, attempt]);

  const [draft, setDraft] = useState<{ key: string; ids: string[] } | null>(null);
  const [saving, setSaving] = useState(false);

  const view = loaded && loaded.devId === devId ? loaded : null;
  const viewError = error && error.devId === devId ? error.message : null;

  const info = useMemo(() => {
    if (!view) return null;
    const plan = String(view.dev.plan ?? "free");
    const pkg = getPackage(plan);
    const extra = Number(view.dev.extra_featured_slots ?? 0) || 0;
    const limit = maxFeaturedProjects(plan, extra);
    const saved = idList(view.dev.featuredProjectIds);
    const landIds = idList(view.dev.featuredLandIds);
    const until = typeof view.dev.featuredUntil === "string" ? new Date(view.dev.featuredUntil) : null;
    const end = until && !Number.isNaN(until.getTime()) ? until : null;
    const daysLeft = end ? Math.max(0, Math.ceil((end.getTime() - view.at) / 86400000)) : null;
    const projectCap = limit === "custom" ? Math.max(saved.length + 1, 5) : Math.max(0, limit - landIds.length);
    return { plan, pkg, extra, limit, saved, landIds, end, daysLeft, projectCap };
  }, [view]);

  const draftKey = view ? `${view.devId}:${(info?.saved ?? []).join(",")}` : "";
  const savedIds = info?.saved;
  const current = useMemo<string[]>(() => (draft && draft.key === draftKey ? draft.ids : (savedIds ?? [])), [draft, draftKey, savedIds]);
  const slotCount = info ? Math.max(info.projectCap, current.length) : 0;
  const slots = Array.from({ length: slotCount }, (_, i) => current[i] ?? "");
  const dirty = info ? !same(current.filter(Boolean), info.saved) : false;

  const setSlot = (i: number, v: string) => {
    const next = [...slots];
    next[i] = v;
    setDraft({ key: draftKey, ids: next.filter(Boolean) });
  };

  const save = useCallback(async () => {
    if (!view || !info) return;
    const ids = current.filter(Boolean);
    if (info.limit !== "custom" && ids.length + info.landIds.length > info.limit) { toast(`Your plan allows ${info.limit} featured spot${info.limit === 1 ? "" : "s"}.`, "warn"); return; }
    setSaving(true);
    try {
      const doc = await apiUpdate("developers", view.devId, { featuredProjectIds: ids.map((x) => (Number.isFinite(Number(x)) ? Number(x) : x)) });
      setLoaded({ ...view, dev: { ...view.dev, ...doc } });
      setDraft(null);
      toast("Featured spots saved");
    } catch (e) {
      toast(e instanceof ApiError || e instanceof Error ? e.message : "Could not save the featured spots.", "warn");
    } finally {
      setSaving(false);
    }
  }, [view, info, current, toast]);

  const upgrade = (name: string) => {
    if (!isAdmin) toast(`Contact us to change your plan to ${name}`, "info");
  };

  const hero = (
    <PageHero
      title={isAdmin ? "Packages." : "My package."}
      description="Your plan, your featured spots and your upgrade options."
      stat={{ label: "Days left", value: info?.daysLeft !== null && info?.daysLeft !== undefined ? String(info.daysLeft) : "-" }}
    />
  );

  const adminBar = isAdmin ? (
    <div className="mb-4 border border-line bg-panel p-4">
      <div className="flex flex-wrap items-center gap-3">
        <label className="text-sm font-medium" htmlFor="pkg-dev">Developer</label>
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name" className="min-w-40 border border-line bg-panel px-2.5 py-2 text-sm" />
        <select id="pkg-dev" value={devId ?? ""} onChange={(e) => setPicked(e.target.value)} className="min-w-56 flex-1 border border-line bg-panel px-2.5 py-2 text-sm">
          {options.filter((o) => o.id === devId || o.name.toLowerCase().includes(search.trim().toLowerCase())).map((o) => <option key={o.id} value={o.id}>{o.name} ({getPackage(o.plan).name})</option>)}
        </select>
      </div>
      <p className="mt-2 flex items-start gap-2 text-sm text-muted"><Info size={15} className="mt-0.5 shrink-0" />This is what the chosen developer sees. Admins manage subscriptions and pricing under <Link href="/dashboard/billing" className="text-brand hover:underline">Billing</Link>.</p>
    </div>
  ) : null;

  if (isAdmin && !optionsReady) return <div>{hero}<div className="d-box space-y-4"><div className="d-skeleton h-16" /><div className="d-skeleton h-64" /></div></div>;
  if (optionsError || viewError) {
    return (
      <div>{hero}<div className="d-box">{adminBar}<div className="border border-line bg-panel p-8 text-center">
        <p className="text-sm text-bad">{viewError ?? optionsError}</p>
        <button type="button" onClick={() => { setError(null); setOptionsError(null); setAttempt((n) => n + 1); }} className="mt-3 border border-line px-3 py-1.5 text-sm font-medium hover:bg-subtle">Try again</button>
      </div></div></div>
    );
  }
  if (!devId) {
    return <div>{hero}<div className="d-box">{adminBar}<p className="border border-dashed border-line bg-panel px-4 py-10 text-center text-sm text-muted">{isAdmin ? "No developers yet." : "No company is linked to your login yet."}</p></div></div>;
  }
  if (!view || !info) return <div>{hero}<div className="d-box space-y-4">{adminBar}<div className="d-skeleton h-72" /><div className="d-skeleton h-40" /></div></div>;

  const { pkg, end, daysLeft, limit, landIds } = info;
  const limitText = limit === "custom" ? "custom" : String(limit);
  const takenByLands = landIds.length;

  return (
    <div>
      {hero}
      <div className="d-box">
        {adminBar}
        <div className="grid gap-5 xl:grid-cols-3">
          <section className="border border-line bg-panel p-5 xl:col-span-1">
            <div className="flex items-center gap-2 text-sm text-muted"><Crown size={15} className="text-brand" /> Current package</div>
            <p className="mt-2 text-2xl font-semibold tracking-tight">{pkg.name}</p>
            <p className="text-sm text-muted">{formatPackagePrice(pkg)}{info.extra > 0 ? ` + ${info.extra} extra spot${info.extra === 1 ? "" : "s"}` : ""}</p>
            <div className="mt-4 bg-subtle p-3">
              {end ? (
                <>
                  <div className="flex items-center justify-between text-sm"><span className="inline-flex items-center gap-1.5 text-muted"><CalendarClock size={14} /> Ends</span><span className="font-medium">{fullDate(end)}</span></div>
                  <p className="mt-1.5 text-xs text-muted">{daysLeft} day{daysLeft === 1 ? "" : "s"} left</p>
                </>
              ) : <p className="text-sm text-muted">{info.plan === "free" ? "The Free plan has no end date." : "No end date recorded."}</p>}
            </div>
            <ul className="mt-4 space-y-1.5 text-sm">{pkg.features.map((p) => <li key={p} className="flex items-start gap-2"><Check size={14} className="mt-0.5 shrink-0 text-ok" />{p}</li>)}</ul>
          </section>

          <section className="border border-line bg-panel p-5 xl:col-span-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="font-semibold">Featured spots</h2>
                <p className="text-sm text-muted">{limit === "custom" ? "Your plan has custom spots." : `Your plan has ${limitText} spot${limit === 1 ? "" : "s"}.`} Swap any time.</p>
              </div>
              <button type="button" disabled={!dirty || saving} onClick={save} className="bg-ink px-3.5 py-1.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-40">{saving ? "Saving..." : "Save spots"}</button>
            </div>
            {limit === 0 ? <p className="mt-4 border border-dashed border-line px-3 py-6 text-center text-sm text-muted">Your plan has no featured spots. Upgrade below to feature a project.</p> : (
              <ul className="mt-4 space-y-2.5">
                {slots.map((v, i) => (
                  <li key={i} className="flex flex-wrap items-center gap-3 border border-line px-3 py-2.5">
                    <span className="grid h-8 w-8 shrink-0 place-items-center bg-subtle text-sm font-semibold">{i + 1}</span>
                    <select value={v} onChange={(e) => setSlot(i, e.target.value)} className="min-w-56 flex-1 border border-line bg-panel px-2.5 py-2 text-sm">
                      <option value="">Empty: choose a project</option>
                      {view.projects.map((p) => <option key={String(p.id)} value={String(p.id)} disabled={current.includes(String(p.id)) && v !== String(p.id)}>{String(p.name)}</option>)}
                      {v && !view.projects.some((p) => String(p.id) === v) ? <option value={v}>Project #{v} (not published)</option> : null}
                    </select>
                    {end ? <span className="text-xs text-muted">Until {end.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</span> : null}
                    {v ? <Star size={15} className="fill-brand text-brand" /> : null}
                  </li>
                ))}
                {landIds.map((lid, i) => (
                  <li key={`land-${lid}`} className="flex flex-wrap items-center gap-3 border border-line bg-subtle px-3 py-2.5">
                    <span className="grid h-8 w-8 shrink-0 place-items-center bg-panel text-sm font-semibold">{slots.length + i + 1}</span>
                    <span className="flex-1 text-sm">Land listing #{lid}</span>
                    <span className="text-xs text-muted">Shares your spots (change under Lands)</span>
                  </li>
                ))}
              </ul>
            )}
            {view.projects.length === 0 && limit !== 0 ? <p className="mt-3 text-sm text-muted">There are no published projects to feature yet.</p> : null}
            <p className="mt-3 text-xs text-muted">Only published projects can be featured{takenByLands ? `; ${takenByLands} spot${takenByLands === 1 ? " is" : "s are"} used by land listings` : ""}. Changes take effect straight away on the live site.</p>
          </section>
        </div>

        <h2 className="mb-3 mt-7 font-semibold">Upgrade options</h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {PACKAGE_LIST.map((t) => {
            const isCurrent = t.tier === pkg.tier;
            return (
              <div key={t.tier} className={`flex flex-col border p-4 ${isCurrent ? "border-ink bg-subtle" : "border-line bg-panel"}`}>
                <div className="flex items-center justify-between"><p className="font-semibold">{t.name}</p>{isCurrent ? <span className="bg-ink px-2 py-0.5 text-[10px] font-semibold text-white">Current</span> : t.tier === "developer-pro" ? <Sparkles size={14} className="text-brand" /> : null}</div>
                <p className="mt-1 text-lg font-semibold tabular-nums">{formatPackagePrice(t)}</p>
                <p className="text-xs text-muted">{t.featuredProjectLimit === "custom" ? "Custom featured spots" : `${t.featuredProjectLimit} featured spot${t.featuredProjectLimit === 1 ? "" : "s"}`}</p>
                <ul className="my-3 flex-1 space-y-1 text-sm">{t.features.map((p) => <li key={p} className="flex items-start gap-1.5"><Check size={13} className="mt-1 shrink-0 text-ok" /><span>{p}</span></li>)}</ul>
                {isAdmin ? (
                  <Link href="/dashboard/billing" aria-disabled={isCurrent} className={`inline-flex items-center justify-center gap-1 border border-line bg-panel px-3 py-1.5 text-sm font-medium hover:border-ink ${isCurrent ? "pointer-events-none opacity-40" : ""}`}>{isCurrent ? "Your plan" : <>Manage in Billing <ArrowRight size={13} /></>}</Link>
                ) : (
                  <button type="button" disabled={isCurrent} onClick={() => upgrade(t.name)} className="inline-flex items-center justify-center gap-1 border border-line bg-panel px-3 py-1.5 text-sm font-medium hover:border-ink disabled:opacity-40">{isCurrent ? "Your plan" : <>Choose <ArrowRight size={13} /></>}</button>
                )}
              </div>
            );
          })}
        </div>

        <h2 className="mb-3 mt-7 font-semibold">Recent payments</h2>
        <div className="overflow-x-auto border border-line bg-panel">
          <table className="w-full min-w-[480px] text-sm">
            <thead><tr className="border-b border-line text-left text-xs font-semibold uppercase tracking-wide text-muted"><th className="px-4 py-2.5">Date</th><th className="px-4 py-2.5">Type</th><th className="px-4 py-2.5">Status</th><th className="px-4 py-2.5 text-right">Amount</th></tr></thead>
            <tbody>
              {view.payments.length === 0 ? <tr><td colSpan={4} className="px-4 py-8 text-center text-muted">No payments yet.</td></tr> : view.payments.map((p) => (
                <tr key={String(p.id)} className="border-b border-line last:border-0">
                  <td className="px-4 py-2.5 text-muted">{typeof p.payment_date === "string" && p.payment_date ? new Date(p.payment_date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "-"}</td>
                  <td className="px-4 py-2.5 capitalize">{String(p.payment_type ?? "").replace(/_/g, " ")}</td>
                  <td className="px-4 py-2.5"><StatusChip value={String(p.status ?? "")} /></td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{money(p.amount, p.currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!isAdmin ? <p className="mt-3 text-sm text-muted">Need a custom plan? <Link href="/dashboard/inbox" className="text-brand hover:underline">Contact us</Link>.</p> : null}
      </div>
    </div>
  );
}
