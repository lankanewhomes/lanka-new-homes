"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatLkr } from "@/lib/format";

type SubscriptionRow = {
  id: string | number;
  package: string;
  status: string;
  amount: number;
  current_period_start?: string | null;
  current_period_end?: string | null;
  developer?: { id: string | number; name?: string } | string | number | null;
  project?: { id: string | number; name?: string } | string | number | null;
  createdAt: string;
};

const STATUS_BADGE: Record<string, string> = {
  active: "ln-badge-success",
  past_due: "ln-badge-warning",
  canceled: "ln-badge-neutral",
  incomplete: "ln-badge-warning",
  unpaid: "ln-badge-danger",
};

function relatedName(value: SubscriptionRow["developer"], fallback = "—"): string {
  return value && typeof value === "object" ? value.name || fallback : fallback;
}

// Replaces the raw Subscriptions list view (admin.components.views.list on
// Subscriptions.ts, same pattern as Analytics -> AnalyticsDashboard) with a
// readable table — a plain document grid of amounts/dates/relationship IDs
// isn't useful to scan at a glance. Fetches the same REST endpoint the
// default list view would (no new API), just a simpler v1 without
// pagination/column-picker/bulk-actions — reasonable while subscription
// volume is low; can grow into a fuller list later if needed.
export function SubscriptionsList() {
  const [rows, setRows] = useState<SubscriptionRow[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    fetch("/payload-api/subscriptions?depth=1&limit=200&sort=-createdAt", { credentials: "include", signal: controller.signal })
      .then(async (res) => {
        const body = await res.json();
        if (!res.ok) throw new Error(body?.errors?.[0]?.message ?? "Failed to load subscriptions.");
        setRows(Array.isArray(body?.docs) ? body.docs : []);
      })
      .catch((err) => {
        if (err.name !== "AbortError") setError(err.message ?? "Failed to load subscriptions.");
      });
    return () => controller.abort();
  }, []);

  return (
    <div className="ln-dash">
      <div className="ln-dash-section-head" style={{ marginBottom: 20 }}>
        <div>
          <p className="ln-dash-greeting">Billing</p>
          <h1 className="ln-dash-title" style={{ marginBottom: 0 }}>Subscriptions</h1>
        </div>
        <Link href="/cms/collections/subscriptions/create" className="ln-quick-action">+ Create</Link>
      </div>

      {error && <p style={{ color: "var(--theme-error-500)" }}>{error}</p>}
      {!error && !rows && <p style={{ opacity: 0.7 }}>Loading…</p>}
      {!error && rows && rows.length === 0 && <div className="ln-empty">No subscriptions yet.</div>}

      {!error && rows && rows.length > 0 && (
        <table className="ln-table">
          <thead>
            <tr>
              <th>Developer</th>
              <th>Project</th>
              <th>Package</th>
              <th>Status</th>
              <th>Start date</th>
              <th>Renewal date</th>
              <th>Amount</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td>{relatedName(row.developer)}</td>
                <td>
                  {typeof row.project === "object" && row.project ? (
                    <Link href={`/cms/collections/projects/${row.project.id}`}>{row.project.name}</Link>
                  ) : (
                    "—"
                  )}
                </td>
                <td style={{ textTransform: "capitalize" }}>{row.package}</td>
                <td><span className={`ln-badge ${STATUS_BADGE[row.status] ?? "ln-badge-neutral"}`}>{row.status.replace("_", " ")}</span></td>
                <td>{row.current_period_start ? new Date(row.current_period_start).toLocaleDateString() : "—"}</td>
                <td>{row.current_period_end ? new Date(row.current_period_end).toLocaleDateString() : "—"}</td>
                <td>{formatLkr(row.amount)}</td>
                <td><Link href={`/cms/collections/subscriptions/${row.id}`}>Edit</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
