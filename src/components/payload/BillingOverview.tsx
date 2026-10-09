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
// Subscriptions collection (one row per developer's plan, not per project —
// see src/lib/packages.ts). No "Failed Payments" card: there's no
// failed-charge event log to derive it from (only a status enum), so it's
// omitted rather than faked. "Plans" reads straight from packages.ts —
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
    <div className="ln-dash ln-dash-v2">
      <div className="ln-dash-top">
        <div>
          <p className="ln-dash-greeting">Billing</p>
          <h1 className="ln-dash-title">Subscriptions overview</h1>
        </div>
        <div className="ln-dash-top-actions">
          <Link href="/cms/collections/subscriptions" className="ln-quick-action">All subscriptions</Link>
          <Link href="/cms/collections/payments" className="ln-quick-action">Payments</Link>
        </div>
      </div>

      <div className="ln-listsum ln-dash-sum">
        {stats.map((stat) => (
          <div key={stat.label}>
            <strong>{stat.value}</strong>
            <span>{stat.label}</span>
          </div>
        ))}
      </div>

      <section className="ln-an-card">
        <div className="ln-dash-section-head">
          <h3 className="ln-an-h">Active subscriptions</h3>
          <Link href="/cms/collections/subscriptions">View all</Link>
        </div>
        {activeRes.docs.length === 0 ? (
          <div className="ln-empty">No active subscriptions yet.</div>
        ) : (
          <table className="ln-table">
            <thead>
              <tr>
                <th>Developer</th>
                <th>Plan</th>
                <th>Extra slots</th>
                <th>Renewal</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              {activeRes.docs.slice(0, 10).map((sub) => (
                <tr key={sub.id}>
                  <td><strong>{relatedName(sub.developer)}</strong></td>
                  <td><span className="ln-badge ln-badge-info" style={{ textTransform: "capitalize" }}>{String(sub.package).replace("-", " ")}</span></td>
                  <td>{sub.extra_featured_slots ?? 0}</td>
                  <td>{sub.current_period_end ? new Date(sub.current_period_end).toLocaleDateString() : "—"}</td>
                  <td>{formatLkr(sub.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className="ln-an-card" style={{ marginTop: 16 }}>
        <h3 className="ln-an-h">Plans</h3>
        <p className="ln-an-note">
          Configured in src/lib/packages.ts — there is no separate editable Plans table today. Change a price there to update it
          everywhere (this page, the picker, and /for-developers).
        </p>
        <div className="ln-plan-cards">
          {PACKAGE_LIST.map((pkg) => (
            <div className="ln-plan-card" key={pkg.tier}>
              <p className="ln-plan-card-name">{pkg.name}</p>
              <p className="ln-plan-card-price">{formatPackagePrice(pkg)}</p>
              <ul className="ln-plan-card-features">
                {pkg.features.slice(0, 4).map((f) => <li key={f}>{f}</li>)}
              </ul>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
