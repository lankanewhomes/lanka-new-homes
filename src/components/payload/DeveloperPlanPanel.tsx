"use client";

import { useEffect, useMemo, useState } from "react";
import { useDocumentInfo } from "@payloadcms/ui";
import { PACKAGE_LIST, formatPackagePrice, maxFeaturedProjects, type PackageTier } from "@/lib/packages";

type ProjectRow = { id: string | number; name: string; package?: string | null };
type DeveloperDoc = {
  id: string | number;
  plan?: PackageTier | null;
  featuredUntil?: string | null;
  extra_featured_slots?: number | null;
  featuredProjectIds?: (string | number | { id: string | number })[] | null;
};

function projectId(entry: string | number | { id: string | number }): string | number {
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
      const [devRes, projectsRes] = await Promise.all([
        fetch(`/payload-api/developers/${id}?depth=0`, { credentials: "include" }),
        fetch(`/payload-api/projects?where[developer][equals]=${id}&depth=0&limit=500&sort=name`, { credentials: "include" }),
      ]);
      const devBody = await devRes.json();
      const projectsBody = await projectsRes.json();
      setDeveloper(devBody);
      setProjects(Array.isArray(projectsBody?.docs) ? projectsBody.docs : []);
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
  const featuredIds = useMemo(() => new Set((developer?.featuredProjectIds ?? []).map((e) => String(projectId(e)))), [developer]);
  const maxSlots = maxFeaturedProjects(plan, developer?.extra_featured_slots ?? 0);
  const spotsUsed = featuredIds.size;
  const atCap = maxSlots !== "custom" && spotsUsed >= maxSlots;
  const isActive = plan !== "free" && developer?.featuredUntil;
  const nearingEnd = isActive && developer?.featuredUntil ? daysRemaining(developer.featuredUntil) <= 14 : false;

  const toggleProject = async (projectIdValue: string | number, on: boolean) => {
    if (!developer) return;
    const current = new Set(featuredIds);
    if (on) {
      if (atCap) return;
      current.add(String(projectIdValue));
    } else {
      current.delete(String(projectIdValue));
    }
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/payload-api/developers/${developer.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ featuredProjectIds: [...current] }),
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
  // (Subscriptions list) today, no live gateway yet.
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
        body: JSON.stringify({ developer: developer.id, package: targetPlan, extra_featured_slots: extraSlots }),
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
        {isActive && developer.featuredUntil && (
          <p style={{ margin: "6px 0 0", fontSize: 13, opacity: 0.75 }}>
            Ends {new Date(developer.featuredUntil).toLocaleDateString()} — {daysRemaining(developer.featuredUntil)} days remaining
          </p>
        )}
        {isActive && developer.featuredUntil && (
          <p style={{ margin: "4px 0 0", fontSize: 12, opacity: 0.65 }}>Swaps allowed until {new Date(developer.featuredUntil).toLocaleDateString()}</p>
        )}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 14 }}>
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
            const isOn = featuredIds.has(String(project.id));
            const disabled = saving || plan === "free" || (!isOn && atCap);
            return (
              <li
                key={project.id}
                style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "10px 14px", border: "1px solid var(--theme-elevation-150)", borderRadius: 4 }}
              >
                <span style={{ fontSize: 13.5 }}>{project.name}</span>
                <label style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 12, opacity: disabled && !isOn ? 0.5 : 1, cursor: disabled ? "not-allowed" : "pointer" }}>
                  {isOn ? "On" : "Off"}
                  <input type="checkbox" checked={isOn} disabled={disabled} onChange={(e) => toggleProject(project.id, e.target.checked)} />
                </label>
              </li>
            );
          })}
        </ul>
      )}
      {plan === "free" && <p style={{ fontSize: 12.5, opacity: 0.65, marginTop: 10 }}>Pick a plan above to start featuring projects.</p>}
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
