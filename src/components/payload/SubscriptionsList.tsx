"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { formatLkr } from "@/lib/format";

type SubscriptionRow = {
  id: string | number;
  package: string;
  extra_featured_slots?: number | null;
  status: string;
  amount: number;
  current_period_start?: string | null;
  current_period_end?: string | null;
  developer?: { id: string | number; name?: string } | string | number | null;
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
  const [filter, setFilter] = useState("all");

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

  const counts = useMemo(() => {
    const map: Record<string, number> = {};
    for (const row of rows ?? []) map[row.status] = (map[row.status] ?? 0) + 1;
    return map;
  }, [rows]);
  const shown = (rows ?? []).filter((row) => filter === "all" || row.status === filter);
  const mrr = (rows ?? []).filter((row) => row.status === "active").reduce((sum, row) => sum + (typeof row.amount === "number" ? row.amount : 0), 0);
  const tabs: { key: string; label: string; count: number }[] = [
    { key: "all", label: "All", count: rows?.length ?? 0 },
    ...(["active", "past_due", "canceled", "incomplete", "unpaid"] as const).map((key) => ({ key, label: key.replace("_", " ").replace(/^./, (c) => c.toUpperCase()), count: counts[key] ?? 0 })),
  ];

  return (
    <div className="ln-dash ln-dash-v2">
      <div className="ln-dash-top">
        <div>
          <p className="ln-dash-greeting">Billing</p>
          <h1 className="ln-dash-title">Subscriptions</h1>
        </div>
        <div className="ln-dash-top-actions">
          <Link href="/cms/collections/subscriptions/create" className="ln-quick-action">Create new</Link>
        </div>
      </div>

      {error && <p className="ln-plan-err">{error}</p>}
      {!error && !rows && <p className="ln-an-empty">Loading…</p>}

      {!error && rows && (
        <>
          <div className="ln-listsum ln-dash-sum">
            <div><strong>{rows.length.toLocaleString()}</strong><span>Subscriptions</span></div>
            <div><strong>{(counts.active ?? 0).toLocaleString()}</strong><span>Active</span></div>
            <div><strong>{formatLkr(mrr)}</strong><span>Monthly recurring revenue</span></div>
            <div><strong>{((counts.past_due ?? 0) + (counts.unpaid ?? 0)).toLocaleString()}</strong><span>Past due or unpaid</span></div>
          </div>

          <div className="ln-listtabs" role="tablist">
            {tabs.map((tab) => (
              <button key={tab.key} type="button" role="tab" aria-selected={filter === tab.key} className={`ln-listtab${filter === tab.key ? " is-active" : ""}`} onClick={() => setFilter(tab.key)}>
                {tab.label}
                <span>{tab.count}</span>
              </button>
            ))}
          </div>

          {shown.length === 0 ? (
            <div className="ln-empty">No subscriptions here.</div>
          ) : (
            <table className="ln-table">
              <thead>
                <tr>
                  <th>Developer</th>
                  <th>Plan</th>
                  <th>Extra slots</th>
                  <th>Status</th>
                  <th>Start date</th>
                  <th>Renewal date</th>
                  <th>Amount</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {shown.map((row) => (
                  <tr key={row.id}>
                    <td><strong>{relatedName(row.developer)}</strong></td>
                    <td style={{ textTransform: "capitalize" }}>{row.package.replace("-", " ")}</td>
                    <td>{row.extra_featured_slots ?? 0}</td>
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
        </>
      )}
    </div>
  );
}
