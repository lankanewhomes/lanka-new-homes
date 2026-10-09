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
import { formatMinutes } from "@/lib/format";

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

function BreakdownList({ title, rows, emptyLabel }: { title: string; rows: { key: string; label: string; count: number; percent: number }[]; emptyLabel?: string }) {
  return (
    <section className="ln-an-card">
      <h3 className="ln-an-h">{title}</h3>
      {rows.length === 0 ? (
        <p className="ln-an-empty">{emptyLabel ?? "No events yet for this period."}</p>
      ) : (
        <div className="ln-an-bars">
          {rows.map((row) => (
            <div key={row.key}>
              <div className="ln-an-bar-head">
                <span>{row.label.replace(/_/g, " ")}</span>
                <span>{row.count.toLocaleString()} · {row.percent}%</span>
              </div>
              <div className="ln-an-bar"><span style={{ width: `${row.percent}%` }} /></div>
            </div>
          ))}
        </div>
      )}
    </section>
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
  const n = (key: string) => (byTypeMap.get(key) ?? 0).toLocaleString();

  return (
    <div className="ln-an">
      <div className="ln-an-head">
        <div>
          <h1>Analytics</h1>
          {data ? <p className="ln-an-sub">{data.range.startDate} to {data.range.endDate}</p> : null}
        </div>
        <div className="ln-an-tools">
          <div className="ln-seg" role="group" aria-label="Date range">
            {RANGE_PRESETS.map((p, i) => (
              <button key={p.label} type="button" className={i === presetIndex ? "is-on" : ""} onClick={() => setPresetIndex(i)}>
                {p.label}
              </button>
            ))}
          </div>
          <button type="button" className="ln-btn" disabled={!data} onClick={() => data && downloadAnalyticsCsv(data)}>
            Download CSV
          </button>
        </div>
      </div>

      {loading && <p className="ln-an-empty">Loading…</p>}
      {error && <p className="ln-plan-err">{error}</p>}

      {!loading && !error && data && (
        <div className="ln-an-grid">
          <div className="ln-an-main">
            <div className="ln-devstats-big">
              <div><strong>{n("view")}</strong><span>Page views</span></div>
              <div><strong>{n("lead_submitted")}</strong><span>Inquiries</span></div>
              <div><strong>{data.totalEvents.toLocaleString()}</strong><span>Total events</span></div>
            </div>

            <div className="ln-devstats-small">
              <div><strong>{n("save")}</strong><span>Saves</span></div>
              <div><strong>{n("brochure_download")}</strong><span>Brochure downloads</span></div>
              <div><strong>{n("phone_click")}</strong><span>Phone clicks</span></div>
              <div><strong>{n("whatsapp_click")}</strong><span>WhatsApp clicks</span></div>
            </div>

            <section className="ln-an-card">
              <h3 className="ln-an-h">Activity over time</h3>
              {chartData.length === 0 ? (
                <p className="ln-an-empty">Not enough data yet for a chart.</p>
              ) : (
                <div className="ln-an-chart">
                  <ResponsiveContainer>
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e4e2db" vertical={false} />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} />
                      <YAxis tick={{ fontSize: 11 }} allowDecimals={false} tickLine={false} axisLine={false} />
                      <Tooltip />
                      <Bar dataKey="count" name="Events" fill="#f47b36" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </section>

            <section className="ln-an-card">
              <h3 className="ln-an-h">By listing</h3>
              {data.byListing.length === 0 ? (
                <p className="ln-an-empty">No listings with activity in this period yet.</p>
              ) : (
                <table className="ln-table">
                  <thead>
                    <tr><th>Listing</th><th>Views</th><th>Inquiries</th><th>Saves</th><th>Total events</th></tr>
                  </thead>
                  <tbody>
                    {data.byListing.map((row) => (
                      <tr key={row.projectId}>
                        <td>{row.projectSlug ? <Link href={`/cms/collections/projects/${row.projectId}`}>{row.projectName}</Link> : row.projectName}</td>
                        <td>{(row.byType.view ?? 0).toLocaleString()}</td>
                        <td>{(row.byType.lead_submitted ?? 0).toLocaleString()}</td>
                        <td>{(row.byType.save ?? 0).toLocaleString()}</td>
                        <td><strong>{row.total.toLocaleString()}</strong></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </section>

            {data.byDeveloper && (
              <section className="ln-an-card">
                <h3 className="ln-an-h">By developer (platform-wide)</h3>
                {data.byDeveloper.length === 0 ? (
                  <p className="ln-an-empty">No developer activity in this period yet.</p>
                ) : (
                  <table className="ln-table">
                    <thead>
                      <tr><th>Developer</th><th>Views</th><th>Inquiries</th><th>Total events</th></tr>
                    </thead>
                    <tbody>
                      {data.byDeveloper.map((row) => (
                        <tr key={row.developerId}>
                          <td><Link href={`/cms/collections/developers/${row.developerId}`}>{row.developerName}</Link></td>
                          <td>{(row.byType.view ?? 0).toLocaleString()}</td>
                          <td>{(row.byType.lead_submitted ?? 0).toLocaleString()}</td>
                          <td><strong>{row.total.toLocaleString()}</strong></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </section>
            )}
          </div>

          <aside className="ln-an-side">
            {data.leads ? (
              <section className="ln-an-card">
                <h3 className="ln-an-h">Lead response</h3>
                <dl className="ln-an-facts">
                  <div><dt>Awaiting your reply</dt><dd>{data.leads.awaitingReply.toLocaleString()}</dd></div>
                  <div><dt>Average first response</dt><dd>{formatMinutes(data.leads.avgResponseMinutes)}</dd></div>
                  <div><dt>Median first response</dt><dd>{formatMinutes(data.leads.medianResponseMinutes)}</dd></div>
                  <div><dt>Answered within 24 hours</dt><dd>{data.leads.respondedWithinHourPercent === null ? "—" : `${data.leads.respondedWithinHourPercent}%`}</dd></div>
                </dl>
                <div className="ln-an-stages">
                  {data.leads.stages.map((stage, index) => (
                    <div key={stage.status}>
                      <strong>{stage.count.toLocaleString()}</strong>
                      <span>{index + 1}. {stage.label}</span>
                    </div>
                  ))}
                </div>
                <p className={`ln-an-badge ${data.leads.badge.earned ? "is-earned" : ""}`}>
                  {data.leads.badge.earned ? "✓ “Responds within 24 hours” badge earned" : "“Responds within 24 hours” badge: not yet"}
                </p>
                <p className="ln-an-note">
                  {data.leads.badge.sampleSize} of {data.leads.badge.minSample} leads judged in the last {data.leads.badge.windowDays} days
                  {data.leads.badge.withinHourRatePercent !== null ? ` · ${data.leads.badge.withinHourRatePercent}% answered within 24 hours (need ${data.leads.badge.minRatePercent}%)` : ""}.
                </p>
                <p className="ln-an-note">Measured from when a lead arrives to the first time you move it off &ldquo;New&rdquo; in <Link href="/cms/collections/leads">Leads</Link>.</p>
              </section>
            ) : null}

            <BreakdownList title="Traffic source" rows={data.trafficSources} />
            <BreakdownList title="Device type" rows={data.deviceTypes} />
            <BreakdownList
              title="Ad traffic (Google, Facebook & Instagram)"
              rows={data.adSources}
              emptyLabel="No ad-attributed traffic in this period. This only counts visits that arrived through a properly tagged ad link."
            />
          </aside>
        </div>
      )}
    </div>
  );
}
