import type { AdminViewServerProps } from "payload";
import Link from "next/link";
import { formatLkr } from "@/lib/format";

const STATUS_BADGE: Record<string, string> = {
  active: "ln-badge-success",
  past_due: "ln-badge-warning",
  canceled: "ln-badge-neutral",
  incomplete: "ln-badge-warning",
  unpaid: "ln-badge-danger",
};

function relatedId(value: unknown): string | number | undefined {
  if (value && typeof value === "object" && "id" in value) return (value as { id: string | number }).id;
  return typeof value === "string" || typeof value === "number" ? value : undefined;
}

// Developer-facing billing history — plans are per-*developer* (see
// src/collections/Subscriptions.ts, restructured 2026-09-24 from the old
// per-project model), so this is one company's plan history over time, not
// a list of per-project packages. Which of the developer's own projects
// actually use the plan's featured slots is managed on the Developer
// profile's own "Plan" tab (DeveloperPlanPanel), not here. Scoped the same
// way Leads/Analytics already scope a developer to their own data (see
// getOwnedDeveloperIds in access.ts) — inlined here rather than calling
// that helper directly since it expects a full PayloadRequest, which this
// view doesn't receive (only `payload` + `user` separately).
export async function MyBilling({ payload, user }: AdminViewServerProps) {
  const role = (user as { role?: string } | null)?.role;
  if (role !== "developer" || !user) {
    return (
      <div className="ln-dash ln-dash-v2">
        <p>This page is for developer accounts. Admins can see every subscription under Billing → Subscriptions.</p>
      </div>
    );
  }

  const developersRes = await payload.find({
    collection: "developers",
    where: { user: { equals: user.id } },
    limit: 10,
    depth: 0,
    overrideAccess: true,
  });
  const developerIds = developersRes.docs.map((d) => d.id);

  const subscriptionsRes = developerIds.length
    ? await payload.find({ collection: "subscriptions", where: { developer: { in: developerIds } }, sort: "-createdAt", limit: 100, depth: 1, overrideAccess: true })
    : { docs: [] };

  const active = subscriptionsRes.docs.find((sub) => sub.status === "active");
  const summary = [
    { value: active ? String(active.package).replace("-", " ").replace(/^./, (c: string) => c.toUpperCase()) : "Free", label: "Current plan" },
    { value: active?.current_period_end ? new Date(active.current_period_end).toLocaleDateString() : "—", label: "Renews / ends" },
    { value: String(active?.extra_featured_slots ?? 0), label: "Extra featured spots" },
    { value: String(subscriptionsRes.docs.length), label: "Subscriptions on record" },
  ];

  return (
    <div className="ln-dash ln-dash-v2">
      <div className="ln-dash-top">
        <div>
          <p className="ln-dash-greeting">Billing</p>
          <h1 className="ln-dash-title">My subscriptions</h1>
        </div>
      </div>

      <div className="ln-listsum ln-dash-sum">
        {summary.map((item) => (
          <div key={item.label}>
            <strong style={{ textTransform: "capitalize" }}>{item.value}</strong>
            <span>{item.label}</span>
          </div>
        ))}
      </div>

      <section className="ln-an-card">
        <h3 className="ln-an-h">Plan history</h3>
        {subscriptionsRes.docs.length === 0 ? (
          <div className="ln-empty">
            No paid plan yet. Open your company profile and choose a plan on the Plan &amp; billing tab to get started.
          </div>
        ) : (
          <table className="ln-table">
            <thead>
              <tr>
                <th>Plan</th>
                <th>Extra slots</th>
                <th>Status</th>
                <th>Renewal date</th>
                <th>Amount</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {subscriptionsRes.docs.map((sub) => {
                const developerId = relatedId(sub.developer);
                return (
                  <tr key={sub.id}>
                    <td style={{ textTransform: "capitalize" }}><strong>{String(sub.package).replace("-", " ")}</strong></td>
                    <td>{sub.extra_featured_slots ?? 0}</td>
                    <td><span className={`ln-badge ${STATUS_BADGE[sub.status as string] ?? "ln-badge-neutral"}`}>{String(sub.status).replace("_", " ")}</span></td>
                    <td>{sub.current_period_end ? new Date(sub.current_period_end).toLocaleDateString() : "—"}</td>
                    <td>{formatLkr(sub.amount)}</td>
                    <td>{developerId ? <Link href={`/cms/collections/developers/${developerId}`}>Manage</Link> : null}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
