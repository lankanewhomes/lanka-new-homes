import type { AdminViewServerProps } from "payload";
import Link from "next/link";
import { formatLkr } from "@/lib/format";
import { PACKAGE_LIST, formatPackagePrice } from "@/lib/packages";

const DAY_MS = 24 * 60 * 60 * 1000;

function relatedName(value: unknown, fallback = "—"): string {
  if (value && typeof value === "object" && "name" in value) return (value as { name?: string }).name || fallback;
  return fallback;
}

// Admin-only real billing summary — every number here is computed from the
// Subscriptions collection (built alongside the Free/Featured/Premium
// packages, see src/lib/packages.ts). No "Failed Payments" card: there's
// no failed-charge event log to derive it from (only a status enum), so
// it's omitted rather than faked. "Plans" reads straight from packages.ts —
// there is no separate database Plans collection.
export async function BillingOverview({ payload, user }: AdminViewServerProps) {
  const role = (user as { role?: string } | null)?.role;
  if (role !== "admin") {
    return <div className="ln-dash"><p>You don&apos;t have access to this page.</p></div>;
  }

  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * DAY_MS);
  const weekAhead = new Date(now.getTime() + 7 * DAY_MS);

  const [activeRes, startedThisWeek, expiringSoon] = await Promise.all([
    payload.find({ collection: "subscriptions", where: { status: { equals: "active" } }, limit: 500, depth: 1, overrideAccess: true }),
    payload.count({ collection: "subscriptions", where: { status: { equals: "active" }, current_period_start: { greater_than_equal: weekAgo.toISOString() } }, overrideAccess: true }),
    payload.count({ collection: "subscriptions", where: { status: { equals: "active" }, current_period_end: { less_than_equal: weekAhead.toISOString(), greater_than_equal: now.toISOString() } }, overrideAccess: true }),
  ]);

  const mrr = activeRes.docs.reduce((sum, sub) => sum + (typeof sub.amount === "number" ? sub.amount : 0), 0);

  const stats = [
    { label: "Active Subscriptions", value: activeRes.totalDocs.toLocaleString() },
    { label: "Monthly Recurring Revenue", value: formatLkr(mrr) },
    { label: "New This Week", value: startedThisWeek.totalDocs.toLocaleString() },
    { label: "Expiring Within 7 Days", value: expiringSoon.totalDocs.toLocaleString() },
  ];

  return (
    <div className="ln-dash">
      <p className="ln-dash-greeting">Billing</p>
      <h1 className="ln-dash-title">Subscriptions overview</h1>

      <div className="ln-stat-grid">
        {stats.map((stat) => (
          <div className="ln-stat-card" key={stat.label}>
            <div className="ln-stat-card-value">{stat.value}</div>
            <div className="ln-stat-card-label">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="ln-dash-section">
        <div className="ln-dash-section-head">
          <h2>Active subscriptions</h2>
          <Link href="/cms/collections/subscriptions">View all</Link>
        </div>
        {activeRes.docs.length === 0 ? (
          <div className="ln-empty">No active subscriptions yet.</div>
        ) : (
          <table className="ln-table">
            <thead>
              <tr>
                <th>Developer</th>
                <th>Project</th>
                <th>Package</th>
                <th>Renewal</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              {activeRes.docs.slice(0, 10).map((sub) => (
                <tr key={sub.id}>
                  <td>{relatedName(sub.developer)}</td>
                  <td>{relatedName(sub.project)}</td>
                  <td><span className="ln-badge ln-badge-warning" style={{ textTransform: "capitalize" }}>{String(sub.package)}</span></td>
                  <td>{sub.current_period_end ? new Date(sub.current_period_end).toLocaleDateString() : "—"}</td>
                  <td>{formatLkr(sub.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="ln-dash-section">
        <div className="ln-dash-section-head">
          <h2>Plans</h2>
        </div>
        <p style={{ fontSize: 12.5, color: "var(--theme-elevation-450)", margin: "0 0 12px" }}>
          Configured in src/lib/packages.ts — there is no separate editable Plans
          table today. Change a price there to update it everywhere (this page,
          the picker, and /for-developers).
        </p>
        <div className="ln-stat-grid">
          {PACKAGE_LIST.map((pkg) => (
            <div className="ln-stat-card" key={pkg.tier}>
              <div className="ln-stat-card-label" style={{ fontWeight: 700, textTransform: "none", fontSize: 14, color: "var(--theme-elevation-1000)" }}>{pkg.name}</div>
              <div className="ln-stat-card-value" style={{ fontSize: 18 }}>{formatPackagePrice(pkg)}</div>
              <ul style={{ margin: "10px 0 0", padding: "0 0 0 16px", fontSize: 12, color: "var(--theme-elevation-500)" }}>
                {pkg.features.slice(0, 4).map((f) => <li key={f}>{f}</li>)}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
