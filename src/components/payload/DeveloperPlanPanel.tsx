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

const BILLING_INTERVAL_OPTIONS: { value: BillingInterval; label: string }[] = [
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "Quarterly (3x)" },
  { value: "annual", label: "Annual (2 months free)" },
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
      setNotice(`Request sent — we'll confirm your ${label.toLowerCase()} shortly.`);
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

  return (
    <div style={{ maxWidth: 760 }}>
      <div style={{ border: "1px solid var(--theme-elevation-150)", borderRadius: 6, padding: 18, marginBottom: 20, background: "var(--theme-elevation-0)" }}>
        <p style={{ margin: 0, fontWeight: 600, fontSize: 15 }}>
          Current plan: {pkg.name}
          {maxSlots !== "custom" && `, ${spotsUsed} of ${maxSlots} spot${maxSlots === 1 ? "" : "s"} used`}
        </p>
        {developer.is_founding_developer && (
          <p style={{ margin: "6px 0 0", fontSize: 12.5, fontWeight: 600, color: "#c65a1e" }}>🎉 Founding developer — 40% off every payment, for as long as you stay subscribed.</p>
        )}
        {isActive && developer.featuredUntil && (
          <p style={{ margin: "6px 0 0", fontSize: 13, opacity: 0.75 }}>
            Ends {new Date(developer.featuredUntil).toLocaleDateString()} — {daysRemaining(developer.featuredUntil)} days remaining
          </p>
        )}
        {isActive && developer.featuredUntil && (
          <p style={{ margin: "4px 0 0", fontSize: 12, opacity: 0.65 }}>Swaps allowed until {new Date(developer.featuredUntil).toLocaleDateString()}</p>
        )}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 14 }}>
          <label style={{ fontSize: 12.5, opacity: 0.75 }}>
            Billing:{" "}
            <select value={billingInterval} onChange={(e) => setBillingInterval(e.target.value as BillingInterval)} disabled={requesting !== null} style={{ fontSize: 12.5, padding: "4px 6px" }}>
              {BILLING_INTERVAL_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </label>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
          {plan !== "free" && pkg.extraFeaturedSlotPrice != null && (
            <button
              type="button"
              disabled={requesting !== null}
              onClick={() => requestSubscription(plan, (developer.extra_featured_slots ?? 0) + 1, "Add extra spot")}
              style={actionButtonStyle}
            >
              {requesting === "Add extra spot" ? "Submitting…" : `Add extra spot (${formatPackagePrice({ ...pkg, price: pkg.extraFeaturedSlotPrice })})`}
            </button>
          )}
          <button
            type="button"
            disabled={requesting !== null}
            onClick={() => requestSubscription(plan === "campaign" ? plan : (PACKAGE_LIST[PACKAGE_LIST.findIndex((p) => p.tier === plan) + 1]?.tier ?? "campaign"), 0, "Upgrade plan")}
            style={actionButtonStyle}
          >
            {requesting === "Upgrade plan" ? "Submitting…" : "Upgrade plan"}
          </button>
          {nearingEnd && (
            <button
              type="button"
              disabled={requesting !== null}
              onClick={() => requestSubscription(plan, developer.extra_featured_slots ?? 0, "Renew package")}
              style={{ ...actionButtonStyle, border: "1px solid #f47b36", background: "#f47b36", color: "#1f1f1f" }}
            >
              {requesting === "Renew package" ? "Submitting…" : "Renew package"}
            </button>
          )}
        </div>
        {notice && <p style={{ margin: "10px 0 0", fontSize: 12.5, color: "var(--theme-success-500)" }}>{notice}</p>}
        {error && <p style={{ margin: "10px 0 0", fontSize: 12.5, color: "var(--theme-error-500)" }}>{error}</p>}
      </div>

      <p style={{ fontSize: 13, fontWeight: 600, margin: "0 0 8px" }}>Your projects</p>
      {projects.length === 0 ? (
        <p style={{ fontSize: 13, opacity: 0.7 }}>No projects yet.</p>
      ) : (
        <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 6 }}>
          {projects.map((project) => {
            const isOn = featuredProjectIds.has(String(project.id));
            const disabled = saving || plan === "free" || (!isOn && atCap);
            return (
              <li
                key={project.id}
                style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "10px 14px", border: "1px solid var(--theme-elevation-150)", borderRadius: 4 }}
              >
                <span style={{ fontSize: 13.5 }}>{project.name}</span>
                <label style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 12, opacity: disabled && !isOn ? 0.5 : 1, cursor: disabled ? "not-allowed" : "pointer" }}>
                  {isOn ? "On" : "Off"}
                  <input type="checkbox" checked={isOn} disabled={disabled} onChange={(e) => toggleEntry("project", project.id, e.target.checked)} />
                </label>
              </li>
            );
          })}
        </ul>
      )}

      {/* Land packages (2026-09-25) — only shown when this developer
          actually has land listings of their own, so a developer with none
          doesn't see an empty section. Same shared slot pool as projects
          above (spotsUsed/atCap already combine both). */}
      {lands.length > 0 && (
        <>
          <p style={{ fontSize: 13, fontWeight: 600, margin: "18px 0 8px" }}>Your land listings</p>
          <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 6 }}>
            {lands.map((land) => {
              const isOn = featuredLandIds.has(String(land.id));
              const disabled = saving || plan === "free" || (!isOn && atCap);
              return (
                <li
                  key={land.id}
                  style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "10px 14px", border: "1px solid var(--theme-elevation-150)", borderRadius: 4 }}
                >
                  <span style={{ fontSize: 13.5 }}>{land.title}</span>
                  <label style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 12, opacity: disabled && !isOn ? 0.5 : 1, cursor: disabled ? "not-allowed" : "pointer" }}>
                    {isOn ? "On" : "Off"}
                    <input type="checkbox" checked={isOn} disabled={disabled} onChange={(e) => toggleEntry("land", land.id, e.target.checked)} />
                  </label>
                </li>
              );
            })}
          </ul>
        </>
      )}

      {plan === "free" && <p style={{ fontSize: 12.5, opacity: 0.65, marginTop: 10 }}>Pick a plan above to start featuring projects{lands.length > 0 ? " or land listings" : ""}.</p>}
    </div>
  );
}

const actionButtonStyle: React.CSSProperties = {
  fontSize: 12.5,
  fontWeight: 600,
  padding: "8px 16px",
  borderRadius: 999,
  border: "1px solid var(--theme-elevation-200)",
  background: "transparent",
  color: "inherit",
  cursor: "pointer",
};
