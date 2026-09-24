"use client";

import { useEffect, useMemo, useState } from "react";
import { useDocumentInfo } from "@payloadcms/ui";
import { PACKAGE_LIST, PACKAGE_FEATURE_ROWS, PACKAGE_ALWAYS_INCLUDED, PACKAGE_ANNUAL_BILLING_NOTE, formatPackagePrice, formatAnnualPrice, type PackageTier } from "@/lib/packages";
import { InfoTooltip } from "./InfoTooltip";

type ProjectDoc = { id: string | number; package?: PackageTier | null; developer?: { id: string | number } | string | number | null };

type SubscriptionDoc = {
  id: string | number;
  package: string;
  status: string;
  amount: number;
  currency: string;
  current_period_start?: string | null;
  current_period_end?: string | null;
  cancel_at_period_end?: boolean;
  createdAt: string;
};

const STATUS_LABEL: Record<string, string> = {
  active: "Active",
  past_due: "Payment past due",
  canceled: "Canceled",
  incomplete: "Pending admin confirmation",
  unpaid: "Unpaid",
};
const STATUS_COLOR: Record<string, string> = {
  active: "var(--theme-success-500)",
  past_due: "var(--theme-warning-500)",
  canceled: "var(--theme-elevation-500)",
  incomplete: "var(--theme-warning-500)",
  unpaid: "var(--theme-error-500)",
};

const cardStyle: React.CSSProperties = { border: "1px solid var(--theme-elevation-150)", borderRadius: 6, padding: 18, background: "var(--theme-elevation-0)" };
const cardCurrentStyle: React.CSSProperties = { ...cardStyle, border: "2px solid #f47b36" };

function relatedId(value: unknown): string | number | undefined {
  if (value && typeof value === "object" && "id" in value) return (value as { id: string | number }).id;
  return value as string | number | undefined;
}

// Real badge-pill previews (matching the actual .badge-featured/
// .badge-premium colors used on live project cards) instead of a plain
// checkmark/text, so a developer sees exactly what they'd get — owner,
// 2026-09-24: "include a feature badge" / "do they same thing for Priority
// slot? Fixed premium slot?". /cms doesn't load the public site's
// globals.css, so these are inline styles rather than the real CSS
// classes, tuned to match them.
const REAL_BADGE_SHAPE: React.CSSProperties = {
  display: "inline-block",
  borderRadius: 3,
  fontSize: 10,
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  padding: "3px 7px",
  fontWeight: 700,
};
const FEATURED_BADGE_STYLE: React.CSSProperties = { ...REAL_BADGE_SHAPE, background: "#fdf3e0", border: "1px solid #f2d38a", color: "#92670c" };
const PREMIUM_BADGE_STYLE: React.CSSProperties = { ...REAL_BADGE_SHAPE, background: "#fef1e8", border: "1px solid #f4b48a", color: "#c65a1e" };

function realBadgeFor(rowKey: string, value: string | boolean): { style: React.CSSProperties; label: string } | null {
  if (rowKey === "featured-badge" && value === true) return { style: FEATURED_BADGE_STYLE, label: "Featured" };
  if (value === "Priority slot") return { style: FEATURED_BADGE_STYLE, label: value };
  if (value === "Fixed premium slot") return { style: PREMIUM_BADGE_STYLE, label: value };
  return null;
}

// Mounted as the "Package" tab on the Project edit form (same shape as
// ListingAnalyticsPanel/SocialPanel — a type:'ui' field reading the current
// document via useDocumentInfo). Lets a developer pick Free/Featured/
// Premium for *this* project. Selecting a paid tier creates a pending
// Subscriptions record (server sets the real price from src/lib/packages.ts,
// never trusts anything from this form) — an admin confirms it in /cms
// today, same manual-confirm step Payments already requires with no
// payment gateway wired yet. Once confirmed, Projects.package/featured
// update automatically (see hooks/sync-subscription-package.ts) and this
// panel reflects it on refresh.
export function PackagePicker() {
  const { id, collectionSlug } = useDocumentInfo();
  const [project, setProject] = useState<ProjectDoc | null>(null);
  const [subscriptions, setSubscriptions] = useState<SubscriptionDoc[]>([]);
  const [developerId, setDeveloperId] = useState<string | number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState<PackageTier | null>(null);
  const [submitError, setSubmitError] = useState("");
  const [canceling, setCanceling] = useState(false);

  const load = async () => {
    if (!id || collectionSlug !== "projects") return;
    setLoading(true);
    setError("");
    try {
      const [projectRes, subsRes] = await Promise.all([
        fetch(`/payload-api/projects/${id}?depth=0`, { credentials: "include" }),
        fetch(`/payload-api/subscriptions?where[project][equals]=${id}&depth=0&limit=10&sort=-createdAt`, { credentials: "include" }),
      ]);
      const projectBody = await projectRes.json();
      const subsBody = await subsRes.json();
      setProject(projectBody);
      setSubscriptions(Array.isArray(subsBody?.docs) ? subsBody.docs : []);
      setDeveloperId(relatedId(projectBody?.developer) ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load.");
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps, react-hooks/set-state-in-effect
  useEffect(() => { load(); }, [id, collectionSlug]);

  const currentTier: PackageTier = (project?.package as PackageTier) || "free";
  const activeSubscription = useMemo(() => subscriptions.find((s) => s.status === "active"), [subscriptions]);
  const pendingSubscription = useMemo(() => subscriptions.find((s) => s.status === "incomplete"), [subscriptions]);

  const requestPackage = async (tier: PackageTier) => {
    if (!id || !developerId) return;
    setSubmitting(tier);
    setSubmitError("");
    try {
      const res = await fetch("/payload-api/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ project: id, developer: developerId, package: tier }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.errors?.[0]?.message ?? "Couldn't submit this request.");
      await load();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Couldn't submit this request.");
    } finally {
      setSubmitting(null);
    }
  };

  const cancelSubscription = async () => {
    if (!activeSubscription) return;
    setCanceling(true);
    setSubmitError("");
    try {
      const res = await fetch(`/payload-api/subscriptions/${activeSubscription.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ cancel_at_period_end: true }),
      });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body?.errors?.[0]?.message ?? "Couldn't cancel.");
      }
      await load();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Couldn't cancel.");
    } finally {
      setCanceling(false);
    }
  };

  if (collectionSlug !== "projects") return null;
  if (loading) return <p style={{ opacity: 0.7, fontSize: 13 }}>Loading…</p>;
  if (error) return <p style={{ color: "var(--theme-error-500)", fontSize: 13 }}>{error}</p>;

  return (
    <div style={{ maxWidth: 760 }}>
      {(activeSubscription || pendingSubscription) && (
        <div style={{ ...cardStyle, marginBottom: 20, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <div>
            <p style={{ margin: 0, fontWeight: 600, fontSize: 14 }}>
              {PACKAGE_LIST.find((p) => p.tier === currentTier)?.name ?? "Free"} — {formatPackagePrice(PACKAGE_LIST.find((p) => p.tier === currentTier) ?? PACKAGE_LIST[0])}
            </p>
            <p style={{ margin: "4px 0 0", fontSize: 13 }}>
              Status: <span style={{ color: STATUS_COLOR[(activeSubscription ?? pendingSubscription)!.status], fontWeight: 600 }}>{STATUS_LABEL[(activeSubscription ?? pendingSubscription)!.status]}</span>
            </p>
            {activeSubscription?.current_period_start && (
              <p style={{ margin: "4px 0 0", fontSize: 12, opacity: 0.7 }}>
                Started {new Date(activeSubscription.current_period_start).toLocaleDateString()}
                {activeSubscription.current_period_end ? ` — renews ${new Date(activeSubscription.current_period_end).toLocaleDateString()}` : ""}
                {activeSubscription.cancel_at_period_end ? " (canceling at renewal)" : ""}
              </p>
            )}
          </div>
          {activeSubscription && !activeSubscription.cancel_at_period_end && (
            <button
              type="button"
              disabled={canceling}
              onClick={cancelSubscription}
              style={{ fontSize: 13, padding: "8px 16px", borderRadius: 999, border: "1px solid var(--theme-elevation-200)", background: "transparent", color: "inherit", cursor: canceling ? "not-allowed" : "pointer" }}
            >
              {canceling ? "Canceling…" : "Cancel subscription"}
            </button>
          )}
        </div>
      )}

      {submitError && <p style={{ color: "var(--theme-error-500)", fontSize: 13, marginBottom: 12 }}>{submitError}</p>}

      <p style={{ fontSize: 12.5, opacity: 0.75, margin: "0 0 14px", lineHeight: 1.6 }}>
        {PACKAGE_ALWAYS_INCLUDED} {PACKAGE_ANNUAL_BILLING_NOTE}
        <br />
        <em>(Annual billing isn&apos;t wired up yet — every subscription bills monthly today.)</em>
      </p>

      {!pendingSubscription && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 14 }}>
          {PACKAGE_LIST.map((pkg, pkgIndex) => {
            const isCurrent = pkg.tier === currentTier;
            const annualPrice = formatAnnualPrice(pkg);
            return (
              <div key={pkg.tier} style={isCurrent ? cardCurrentStyle : cardStyle}>
                <strong style={{ fontSize: 15 }}>{pkg.name}</strong>
                {/* Free's own price line would just repeat the tier name
                    ("Free" / "Free") — skip it there, same fix as the public
                    pricing table (owner report, 2026-09-24: "where is 2 free"). */}
                {pkg.tier !== "free" && <div style={{ fontSize: 18, fontWeight: 700, margin: "6px 0 2px" }}>{formatPackagePrice(pkg)}</div>}
                {annualPrice && <div style={{ fontSize: 11, opacity: 0.65, marginBottom: 8 }}>or {annualPrice} billed annually</div>}
                <ul style={{ margin: annualPrice || pkg.tier === "free" ? 0 : "8px 0 0", padding: 0, fontSize: 12, opacity: 0.85, lineHeight: 1.9, listStyle: "none" }}>
                  {PACKAGE_FEATURE_ROWS.map((row) => {
                    const value = row.values[pkgIndex];
                    const tooltip = row.notYetBuilt ? [...row.tooltip, "Planned — not built yet."] : row.tooltip;
                    const realBadge = realBadgeFor(row.key, value);
                    return (
                      <li key={row.key} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                        <span>
                          {row.label}
                          <InfoTooltip text={tooltip} />
                        </span>
                        {realBadge ? (
                          <span style={realBadge.style}>{realBadge.label}</span>
                        ) : (
                          <strong style={{ fontWeight: 600, textAlign: "right", whiteSpace: "nowrap", display: "inline-flex", alignItems: "center" }}>
                            {value === true ? "✓" : value === false ? "—" : value}
                            {typeof value === "string" && <InfoTooltip text={tooltip} />}
                          </strong>
                        )}
                      </li>
                    );
                  })}
                </ul>
                {isCurrent ? (
                  <p style={{ marginTop: 12, marginBottom: 0, fontSize: 12, fontWeight: 600, color: "#f47b36" }}>Current package</p>
                ) : pkg.tier === "free" ? null : (
                  <button
                    type="button"
                    disabled={submitting !== null}
                    onClick={() => requestPackage(pkg.tier)}
                    style={{
                      marginTop: 12,
                      fontSize: 13,
                      fontWeight: 600,
                      padding: "8px 18px",
                      borderRadius: 999,
                      border: "1px solid #f47b36",
                      background: "#f47b36",
                      color: "#1f1f1f",
                      cursor: submitting !== null ? "not-allowed" : "pointer",
                    }}
                  >
                    {submitting === pkg.tier ? "Submitting…" : `Switch to ${pkg.name}`}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
