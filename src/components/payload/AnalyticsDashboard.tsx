"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { AnalyticsSummaryResponse } from "@/lib/analytics-summary";

const RANGE_PRESETS = [
  { label: "Last 7 days", days: 7 },
  { label: "Last 28 days", days: 28 },
  { label: "Last 90 days", days: 90 },
];

function isoDateDaysAgo(days: number): string {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

function csvCell(value: string | number): string {
  const str = String(value);
  return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
}

// Assembles every section already loaded into one CSV, no extra server
// round-trip — the dashboard already has everything it needs in `data`.
function downloadAnalyticsCsv(data: AnalyticsSummaryResponse) {
  const lines: string[] = [];
  lines.push(`Analytics report,${data.range.startDate} to ${data.range.endDate}`);
  lines.push("");

  lines.push("Totals by event type");
  lines.push("Event type,Count,Share");
  for (const row of data.byType) lines.push([csvCell(row.label), row.count, `${row.percent}%`].join(","));
  lines.push(`Total events,${data.totalEvents},`);
  lines.push("");

  lines.push("Traffic source");
  lines.push("Source,Count,Share");
  for (const row of data.trafficSources) lines.push([csvCell(row.label), row.count, `${row.percent}%`].join(","));
  lines.push("");

  lines.push("Ad sources (Google / Facebook & Instagram)");
  lines.push("Source,Count,Share of all traffic");
  for (const row of data.adSources) lines.push([csvCell(row.label), row.count, `${row.percent}%`].join(","));
  if (data.adSources.length === 0) lines.push("No ad-attributed traffic in this period,,");
  lines.push("");

  lines.push("Device type");
  lines.push("Device,Count,Share");
  for (const row of data.deviceTypes) lines.push([csvCell(row.label), row.count, `${row.percent}%`].join(","));
  lines.push("");

  lines.push("By listing");
  lines.push("Listing,Views,Inquiries,Saves,Total events");
  for (const row of data.byListing) {
    lines.push([csvCell(row.projectName), row.byType.view ?? 0, row.byType.lead_submitted ?? 0, row.byType.save ?? 0, row.total].join(","));
  }

  if (data.byDeveloper) {
    lines.push("");
    lines.push("By developer (platform-wide)");
    lines.push("Developer,Views,Inquiries,Total events");
    for (const row of data.byDeveloper) {
      lines.push([csvCell(row.developerName), row.byType.view ?? 0, row.byType.lead_submitted ?? 0, row.total].join(","));
    }
  }

  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `lankanewhomes-analytics-${data.range.startDate}-to-${data.range.endDate}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ border: "1px solid var(--theme-elevation-150)", borderRadius: 6, padding: "16px 18px", background: "var(--theme-elevation-0)" }}>
      <div style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: 0.4, opacity: 0.65 }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 700, marginTop: 6 }}>{value}</div>
    </div>
  );
}

function BreakdownList({ title, rows, emptyLabel }: { title: string; rows: { key: string; label: string; count: number; percent: number }[]; emptyLabel?: string }) {
  return (
    <div style={{ border: "1px solid var(--theme-elevation-150)", borderRadius: 6, padding: 16, background: "var(--theme-elevation-0)" }}>
      <h5 style={{ margin: "0 0 12px" }}>{title}</h5>
      {rows.length === 0 ? (
        <p style={{ fontSize: 13, opacity: 0.65, margin: 0 }}>{emptyLabel ?? "No events yet for this period."}</p>
      ) : (
        <div style={{ display: "grid", gap: 8 }}>
          {rows.map((row) => (
            <div key={row.key}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
                <span style={{ textTransform: "capitalize" }}>{row.label.replace(/_/g, " ")}</span>
                <span style={{ opacity: 0.7 }}>{row.count.toLocaleString()} · {row.percent}%</span>
              </div>
              <div style={{ height: 6, borderRadius: 999, background: "var(--theme-elevation-100)", overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${row.percent}%`, background: "#f47b36", borderRadius: 999 }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Replaces the Analytics collection's raw per-event table (Payload's
// default list view) with an aggregated dashboard — registered via
// Analytics.ts's admin.components.views.list. Reads
// /payload-api/analytics-summary, which scopes itself server-side
// (a developer sees only their own portfolio; an admin sees everything
// plus a by-developer breakdown, signaled by byDeveloper being present in
// the response — no separate role check needed here).
export function AnalyticsDashboard() {
  const [presetIndex, setPresetIndex] = useState(1);
  const [data, setData] = useState<AnalyticsSummaryResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const preset = RANGE_PRESETS[presetIndex];

  useEffect(() => {
    const controller = new AbortController();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    setError(null);

    const params = new URLSearchParams({ startDate: isoDateDaysAgo(preset.days), endDate: isoDateDaysAgo(0) });

    fetch(`/payload-api/analytics-summary?${params.toString()}`, { credentials: "include", signal: controller.signal })
      .then(async (res) => {
        const body = await res.json();
        if (!res.ok) throw new Error(body?.error ?? "Failed to load analytics.");
        setData(body as AnalyticsSummaryResponse);
      })
      .catch((err) => {
        if (err.name !== "AbortError") setError(err.message ?? "Failed to load analytics.");
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [preset.days]);

  const chartData = useMemo(() => data?.trend.map((point) => ({ ...point })) ?? [], [data]);

  const byTypeMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const row of data?.byType ?? []) map.set(row.key, row.count);
    return map;
  }, [data]);

  return (
    <div style={{ padding: "24px 32px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8, marginBottom: 20 }}>
        <h1 style={{ margin: 0 }}>Analytics</h1>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          {RANGE_PRESETS.map((p, i) => (
            <button
              key={p.label}
              type="button"
              onClick={() => setPresetIndex(i)}
              style={{
                fontSize: 13,
                padding: "6px 14px",
                borderRadius: 999,
                border: "1px solid var(--theme-elevation-200)",
                background: i === presetIndex ? "var(--theme-elevation-800)" : "transparent",
                color: i === presetIndex ? "var(--theme-elevation-0)" : "inherit",
                cursor: "pointer",
              }}
            >
              {p.label}
            </button>
          ))}
          <button
            type="button"
            disabled={!data}
            onClick={() => data && downloadAnalyticsCsv(data)}
            style={{
              fontSize: 13,
              padding: "6px 14px",
              borderRadius: 999,
              border: "1px solid var(--theme-elevation-200)",
              background: "transparent",
              cursor: data ? "pointer" : "not-allowed",
              opacity: data ? 1 : 0.5,
              marginLeft: 6,
            }}
          >
            Download CSV
          </button>
        </div>
      </div>

      {loading && <p style={{ opacity: 0.7 }}>Loading…</p>}
      {error && <p style={{ color: "#c0392b" }}>{error}</p>}

      {!loading && !error && data && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginBottom: 24 }}>
            <StatCard label="Total events" value={data.totalEvents.toLocaleString()} />
            <StatCard label="Page views" value={(byTypeMap.get("view") ?? 0).toLocaleString()} />
            <StatCard label="Inquiries" value={(byTypeMap.get("lead_submitted") ?? 0).toLocaleString()} />
            <StatCard label="Saves" value={(byTypeMap.get("save") ?? 0).toLocaleString()} />
            <StatCard label="Brochure downloads" value={(byTypeMap.get("brochure_download") ?? 0).toLocaleString()} />
            <StatCard label="Phone clicks" value={(byTypeMap.get("phone_click") ?? 0).toLocaleString()} />
          </div>

          <div style={{ marginBottom: 24 }}>
            <h5 style={{ marginBottom: 8 }}>Activity over time</h5>
            {chartData.length === 0 ? (
              <p style={{ fontSize: 13, opacity: 0.65 }}>Not enough data yet for a chart.</p>
            ) : (
              <div style={{ width: "100%", height: 220, border: "1px solid var(--theme-elevation-150)", borderRadius: 6, padding: 12, background: "var(--theme-elevation-0)" }}>
                <ResponsiveContainer>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="count" name="Events" fill="#f47b36" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          <div style={{ marginBottom: 24 }}>
            <BreakdownList
              title="Ad Traffic (Google, Facebook & Instagram)"
              rows={data.adSources}
              emptyLabel="No ad-attributed traffic in this period — this only counts visits that arrived through a properly tagged ad link (utm_source/utm_medium)."
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16, marginBottom: 24 }}>
            <BreakdownList title="Traffic Source" rows={data.trafficSources} />
            <BreakdownList title="Device Type" rows={data.deviceTypes} />
          </div>

          <div style={{ marginBottom: data.byDeveloper ? 24 : 0 }}>
            <h5 style={{ marginBottom: 8 }}>By Listing</h5>
            {data.byListing.length === 0 ? (
              <p style={{ fontSize: 13, opacity: 0.65 }}>No listings with activity in this period yet.</p>
            ) : (
              <div style={{ border: "1px solid var(--theme-elevation-150)", borderRadius: 6, overflow: "hidden", background: "var(--theme-elevation-0)" }}>
                <table style={{ width: "100%", fontSize: 13, borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ textAlign: "left", opacity: 0.65, background: "var(--theme-elevation-50)" }}>
                      <th style={{ padding: "8px 14px" }}>Listing</th>
                      <th style={{ padding: "8px 14px" }}>Views</th>
                      <th style={{ padding: "8px 14px" }}>Inquiries</th>
                      <th style={{ padding: "8px 14px" }}>Saves</th>
                      <th style={{ padding: "8px 14px" }}>Total events</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.byListing.map((row) => (
                      <tr key={row.projectId} style={{ borderTop: "1px solid var(--theme-elevation-150)" }}>
                        <td style={{ padding: "8px 14px" }}>
                          {row.projectSlug ? (
                            <Link href={`/cms/collections/projects/${row.projectId}`}>{row.projectName}</Link>
                          ) : (
                            row.projectName
                          )}
                        </td>
                        <td style={{ padding: "8px 14px" }}>{(row.byType.view ?? 0).toLocaleString()}</td>
                        <td style={{ padding: "8px 14px" }}>{(row.byType.lead_submitted ?? 0).toLocaleString()}</td>
                        <td style={{ padding: "8px 14px" }}>{(row.byType.save ?? 0).toLocaleString()}</td>
                        <td style={{ padding: "8px 14px" }}><strong>{row.total.toLocaleString()}</strong></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {data.byDeveloper && (
            <div>
              <h5 style={{ marginBottom: 8 }}>By Developer (platform-wide)</h5>
              {data.byDeveloper.length === 0 ? (
                <p style={{ fontSize: 13, opacity: 0.65 }}>No developer activity in this period yet.</p>
              ) : (
                <div style={{ border: "1px solid var(--theme-elevation-150)", borderRadius: 6, overflow: "hidden", background: "var(--theme-elevation-0)" }}>
                  <table style={{ width: "100%", fontSize: 13, borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ textAlign: "left", opacity: 0.65, background: "var(--theme-elevation-50)" }}>
                        <th style={{ padding: "8px 14px" }}>Developer</th>
                        <th style={{ padding: "8px 14px" }}>Views</th>
                        <th style={{ padding: "8px 14px" }}>Inquiries</th>
                        <th style={{ padding: "8px 14px" }}>Total events</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.byDeveloper.map((row) => (
                        <tr key={row.developerId} style={{ borderTop: "1px solid var(--theme-elevation-150)" }}>
                          <td style={{ padding: "8px 14px" }}>
                            <Link href={`/cms/collections/developers/${row.developerId}`}>{row.developerName}</Link>
                          </td>
                          <td style={{ padding: "8px 14px" }}>{(row.byType.view ?? 0).toLocaleString()}</td>
                          <td style={{ padding: "8px 14px" }}>{(row.byType.lead_submitted ?? 0).toLocaleString()}</td>
                          <td style={{ padding: "8px 14px" }}><strong>{row.total.toLocaleString()}</strong></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
