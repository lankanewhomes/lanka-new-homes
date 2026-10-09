"use client";

import { useEffect, useMemo, useState } from "react";
import { useDocumentInfo } from "@payloadcms/ui";
import { PACKAGE_LIST, formatPackagePrice, maxFeaturedProjects, type BillingInterval, type PackageTier } from "@/lib/packages";

type ProjectRow = { id: string | number; name: string; package?: string | null };
type LandRow = { id: string | number; title: string; package?: string | null };
type DeveloperDoc = {
  id: string | number;
  plan?: PackageTier | null;
  featuredUntil?: string | null;
  extra_featured_slots?: number | null;
  featuredProjectIds?: (string | number | { id: string | number })[] | null;
  // Land packages (2026-09-25) — shares the same plan/slot pool as
  // featuredProjectIds above, just a separate relationship since land is a
  // different collection. See Developers.ts's field comment.
  featuredLandIds?: (string | number | { id: string | number })[] | null;
  // Founding-developer discount (2026-09-25) — see Developers.ts's field
  // comment. Read-only here; only Subscriptions.ts's activation hook ever
  // sets this.
  is_founding_developer?: boolean | null;
};

const BILLING_INTERVAL_OPTIONS: { value: BillingInterval; label: string; hint: string }[] = [
  { value: "monthly", label: "Every month", hint: "" },
  { value: "quarterly", label: "Every 3 months", hint: "" },
  { value: "annual", label: "Once a year", hint: "2 months free" },
];

function entryId(entry: string | number | { id: string | number }): string | number {
  return typeof entry === "object" ? entry.id : entry;
}

function daysRemaining(dateIso: string): number {
  return Math.max(0, Math.ceil((new Date(dateIso).getTime() - Date.now()) / (24 * 60 * 60 * 1000)));
}

// Mounted as the "Plan" tab on the Developer edit form — this is where a
// company manages its ONE account-wide plan and picks which of its own
// projects use the plan's featured slots (billing moved from per-project
// to per-developer 2026-09-24: "they can choose which project"). Matches
// the owner's exact dashboard spec: current plan + spots used, end date +
// days remaining, an On/Off toggle per project (not a generic multi-
// select), a swap-deadline note, and Add extra spot / Upgrade plan /
// Renew package buttons. Selecting a paid tier or buying an extra slot
// creates a pending Subscriptions record (server sets the real price from
// src/lib/packages.ts) — an admin confirms it in /cms today, same
// manual-confirm step every other placement requires with no payment
// gateway wired yet.
export function DeveloperPlanPanel() {
  const { id, collectionSlug } = useDocumentInfo();
  const [developer, setDeveloper] = useState<DeveloperDoc | null>(null);
  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [lands, setLands] = useState<LandRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [requesting, setRequesting] = useState<string | null>(null);
  const [notice, setNotice] = useState("");

  const load = async () => {
    if (!id || collectionSlug !== "developers") return;
    setLoading(true);
    setError("");
    try {
      const [devRes, projectsRes, landsRes] = await Promise.all([
        fetch(`/payload-api/developers/${id}?depth=0`, { credentials: "include" }),
        fetch(`/payload-api/projects?where[developer][equals]=${id}&depth=0&limit=500&sort=name`, { credentials: "include" }),
        // Land packages (2026-09-25) — only land where this developer is
        // the seller ever counts against their plan; see Developers.ts's
        // featuredLandIds comment.
        fetch(`/payload-api/lands?where[seller][equals]=${id}&where[sellerType][equals]=developer&depth=0&limit=500&sort=title`, { credentials: "include" }),
      ]);
      const devBody = await devRes.json();
      const projectsBody = await projectsRes.json();
      const landsBody = await landsRes.json();
      setDeveloper(devBody);
      setProjects(Array.isArray(projectsBody?.docs) ? projectsBody.docs : []);
      setLands(Array.isArray(landsBody?.docs) ? landsBody.docs : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load.");
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps, react-hooks/set-state-in-effect
  useEffect(() => { load(); }, [id, collectionSlug]);

  const plan = developer?.plan ?? "free";
  const pkg = useMemo(() => PACKAGE_LIST.find((p) => p.tier === plan) ?? PACKAGE_LIST[0], [plan]);
  const featuredProjectIds = useMemo(() => new Set((developer?.featuredProjectIds ?? []).map((e) => String(entryId(e)))), [developer]);
  const featuredLandIds = useMemo(() => new Set((developer?.featuredLandIds ?? []).map((e) => String(entryId(e)))), [developer]);
  const maxSlots = maxFeaturedProjects(plan, developer?.extra_featured_slots ?? 0);
  // Shared slot pool — a featured project and a featured land listing spend
  // the same slots, not two separate pools (owner, 2026-09-25: "same plan/
  // slot system, but for land listings").
  const spotsUsed = featuredProjectIds.size + featuredLandIds.size;
  const atCap = maxSlots !== "custom" && spotsUsed >= maxSlots;
  const isActive = plan !== "free" && developer?.featuredUntil;
  const nearingEnd = isActive && developer?.featuredUntil ? daysRemaining(developer.featuredUntil) <= 14 : false;

  const toggleEntry = async (kind: "project" | "land", entryIdValue: string | number, on: boolean) => {
    if (!developer) return;
    const current = new Set(kind === "project" ? featuredProjectIds : featuredLandIds);
    if (on) {
      if (atCap) return;
      current.add(String(entryIdValue));
    } else {
      current.delete(String(entryIdValue));
    }
    setSaving(true);
    setError("");
    try {
      const field = kind === "project" ? "featuredProjectIds" : "featuredLandIds";
      const res = await fetch(`/payload-api/developers/${developer.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ [field]: [...current] }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.errors?.[0]?.message ?? "Couldn't update — check your plan's spot limit.");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't update.");
    } finally {
      setSaving(false);
    }
  };

  // "Add extra spot" / "Upgrade plan" / "Renew package" all create a
  // pending Subscription the same way — an admin confirms it in /cms
  // (Subscriptions list) today, no live gateway yet. billingInterval
  // (2026-09-25) is the developer's own choice of how often to be billed —
  // there's no live gateway to charge them differently by cycle yet, but
  // capturing their intent now means an admin doesn't have to find out
  // out-of-band during manual confirmation.
  const [billingInterval, setBillingInterval] = useState<BillingInterval>("monthly");
  const requestSubscription = async (targetPlan: PackageTier, extraSlots: number, label: string) => {
    if (!developer) return;
    setRequesting(label);
    setNotice("");
    setError("");
    try {
      const res = await fetch("/payload-api/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ developer: developer.id, package: targetPlan, extra_featured_slots: extraSlots, billing_interval: billingInterval }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.errors?.[0]?.message ?? "Couldn't submit this request.");
      setNotice(`Thanks! We received your request (${label.toLowerCase()}). We will confirm it with you shortly.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't submit this request.");
    } finally {
      setRequesting(null);
    }
  };

  if (collectionSlug !== "developers") return null;
  if (loading) return <p style={{ opacity: 0.7, fontSize: 13 }}>Loading…</p>;
  if (error && !developer) return <p style={{ color: "var(--theme-error-500)", fontSize: 13 }}>{error}</p>;
  if (!developer) return null;

  const currentIndex = PACKAGE_LIST.findIndex((p) => p.tier === plan);
  const usagePercent = maxSlots === "custom" ? 100 : maxSlots === 0 ? 0 : Math.min(100, Math.round((spotsUsed / maxSlots) * 100));
  const firstSubscribed = (developer as DeveloperDoc & { first_subscribed_at?: string | null }).first_subscribed_at;

  const Switch = ({ on, disabled, onChange, label }: { on: boolean; disabled: boolean; onChange: (next: boolean) => void; label: string }) => (
    <button type="button" role="switch" aria-checked={on} aria-label={label} disabled={disabled} className={`ln-switch${on ? " is-on" : ""}`} onClick={() => onChange(!on)}>
      <span />
    </button>
  );

  const listingRows = (kind: "project" | "land", rows: { id: string | number; name: string }[], featured: Set<string>) => (
    <ul className="ln-plan-list">
      {rows.map((row) => {
        const isOn = featured.has(String(row.id));
        const disabled = saving || plan === "free" || (!isOn && atCap);
        return (
          <li key={row.id}>
            <span className="ln-plan-list-name">{row.name}</span>
            <span className={`ln-plan-list-state${isOn ? " is-on" : ""}`}>{isOn ? "Featured" : plan === "free" ? "Needs a plan" : "Not featured"}</span>
            <Switch on={isOn} disabled={disabled} label={`Feature ${row.name}`} onChange={(next) => toggleEntry(kind, row.id, next)} />
          </li>
        );
      })}
    </ul>
  );

  return (
    <div className="ln-plan">
      <div className="ln-plan-summary">
        <div className="ln-plan-summary-main">
          <p className="ln-plan-kicker">You are on</p>
          <p className="ln-plan-name">
            {pkg.name} plan
            <span className={`ln-badge ${isActive ? "ln-badge-success" : "ln-badge-neutral"}`}>{isActive ? "Active" : "No paid plan"}</span>
            {developer.is_founding_developer ? <span className="ln-badge ln-badge-warning">Founding developer · 40% off</span> : null}
          </p>
          {maxSlots !== "custom" ? (
            <div className="ln-plan-usage">
              <div className="ln-plan-usage-bar"><span style={{ width: `${usagePercent}%` }} /></div>
              <span>
                {maxSlots === 0
                  ? "Free plans cannot feature listings. Pick a plan below to put your listings first."
                  : `${spotsUsed} of ${maxSlots} featured listing${maxSlots === 1 ? "" : "s"} in use`}
              </span>
            </div>
          ) : (
            <p className="ln-plan-note">Custom plan — the number of featured listings is agreed with you directly.</p>
          )}
        </div>
        <dl className="ln-plan-facts">
          <div><dt>Plan ends</dt><dd>{isActive && developer.featuredUntil ? new Date(developer.featuredUntil).toLocaleDateString() : "—"}</dd></div>
          <div><dt>Days left</dt><dd>{isActive && developer.featuredUntil ? daysRemaining(developer.featuredUntil) : "—"}</dd></div>
          <div><dt>Extra featured spots</dt><dd>{developer.extra_featured_slots ?? 0}</dd></div>
          <div><dt>Customer since</dt><dd>{firstSubscribed ? new Date(firstSubscribed).toLocaleDateString() : "—"}</dd></div>
        </dl>
      </div>

      <div className="ln-plan-actions">
        <div className="ln-plan-pay">
          <span>How would you like to pay?</span>
        <div className="ln-seg" role="group" aria-label="How often to pay">
          {BILLING_INTERVAL_OPTIONS.map((option) => (
            <button key={option.value} type="button" className={billingInterval === option.value ? "is-on" : ""} disabled={requesting !== null} onClick={() => setBillingInterval(option.value)}>
              {option.label}{option.hint ? <small> · {option.hint}</small> : null}
            </button>
          ))}
        </div>
        </div>
        <div className="ln-plan-buttons">
          {plan !== "free" && pkg.extraFeaturedSlotPrice != null && (
            <button type="button" className="ln-btn" disabled={requesting !== null} onClick={() => requestSubscription(plan, (developer.extra_featured_slots ?? 0) + 1, "Add extra spot")}>
              {requesting === "Add extra spot" ? "Submitting…" : `Add extra spot · ${formatPackagePrice({ ...pkg, price: pkg.extraFeaturedSlotPrice })}`}
            </button>
          )}
          {nearingEnd && (
            <button type="button" className="ln-btn ln-btn-solid" disabled={requesting !== null} onClick={() => requestSubscription(plan, developer.extra_featured_slots ?? 0, "Renew package")}>
              {requesting === "Renew package" ? "Submitting…" : "Renew package"}
            </button>
          )}
        </div>
      </div>
      {notice && <p className="ln-plan-ok">{notice}</p>}
      {error && <p className="ln-plan-err">{error}</p>}

      <h3 className="ln-plan-h">1. Choose a plan</h3>
      <div className="ln-plan-cards">
        {PACKAGE_LIST.map((candidate, index) => {
          const isCurrent = candidate.tier === plan;
          const isUpgrade = index > currentIndex;
          return (
            <div key={candidate.tier} className={`ln-plan-card${isCurrent ? " is-current" : ""}`}>
              <p className="ln-plan-card-name">{candidate.name}</p>
              <p className="ln-plan-card-price">{formatPackagePrice(candidate)}</p>
              <p className="ln-plan-card-spots">{candidate.featuredProjectLimit === "custom" ? "Custom number of featured spots" : candidate.featuredProjectLimit === 0 ? "No featured spots" : `${candidate.featuredProjectLimit} featured spot${candidate.featuredProjectLimit === 1 ? "" : "s"}`}</p>
              {isCurrent ? (
                <span className="ln-plan-card-current">Your plan</span>
              ) : isUpgrade ? (
                <button type="button" className="ln-btn" disabled={requesting !== null} onClick={() => requestSubscription(candidate.tier, 0, `Upgrade to ${candidate.name}`)}>
                  {requesting === `Upgrade to ${candidate.name}` ? "Submitting…" : "Upgrade"}
                </button>
              ) : null}
            </div>
          );
        })}
      </div>

      <h3 className="ln-plan-h">2. Choose which listings to feature</h3>
      <p className="ln-plan-note">Featured listings show higher in search and on the homepage. Switch a listing on or off any time before the plan ends.</p>
      <h4 className="ln-plan-h2">Projects</h4>
      {projects.length === 0 ? <p className="ln-plan-note">No projects yet.</p> : listingRows("project", projects.map((project) => ({ id: project.id, name: project.name })), featuredProjectIds)}

      {lands.length > 0 && (
        <>
          <h4 className="ln-plan-h2">Land listings</h4>
          {listingRows("land", lands.map((land) => ({ id: land.id, name: land.title })), featuredLandIds)}
        </>
      )}

      {plan === "free" && <p className="ln-plan-note">Step 1 first: once you have a plan, the switches above turn on.</p>}
    </div>
  );
}
