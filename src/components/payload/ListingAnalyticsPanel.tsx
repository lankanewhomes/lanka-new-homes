"use client";

import { useEffect, useMemo, useState } from "react";
import { useDocumentInfo } from "@payloadcms/ui";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ListingAnalyticsResponse } from "@/lib/analytics-types";

const RANGE_PRESETS = [
  { label: "Last 7 days", days: 7, bucket: "week" as const },
  { label: "Last 28 days", days: 28, bucket: "week" as const },
  { label: "Last 90 days", days: 90, bucket: "month" as const },
];

function isoDateDaysAgo(days: number): string {
  const d = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  return d.toISOString().slice(0, 10);
}

function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ border: "1px solid var(--theme-elevation-150)", borderRadius: 4, padding: "12px 14px", background: "var(--theme-elevation-0)" }}>
      <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 0.4, opacity: 0.65 }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 600, marginTop: 4 }}>{value}</div>
    </div>
  );
}

export function ListingAnalyticsPanel() {
  const { id, collectionSlug } = useDocumentInfo();
  const [presetIndex, setPresetIndex] = useState(1);
  const [data, setData] = useState<ListingAnalyticsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const preset = RANGE_PRESETS[presetIndex];

  useEffect(() => {
    if (!id || collectionSlug !== "projects") return;

    const controller = new AbortController();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    setError(null);

    const params = new URLSearchParams({
      startDate: isoDateDaysAgo(preset.days),
      endDate: isoDateDaysAgo(0),
      bucket: preset.bucket,
    });

    fetch(`/payload-api/listing-analytics/${id}?${params.toString()}`, { credentials: "include", signal: controller.signal })
      .then(async (res) => {
        const body = await res.json();
        if (!res.ok) throw new Error(body?.error ?? "Failed to load analytics.");
        setData(body as ListingAnalyticsResponse);
      })
      .catch((err) => {
        if (err.name !== "AbortError") setError(err.message ?? "Failed to load analytics.");
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [id, collectionSlug, preset.days, preset.bucket]);

  const chartData = useMemo(() => data?.trend.map((point) => ({ ...point })) ?? [], [data]);

  if (!id || collectionSlug !== "projects") return null;

  return (
    <div style={{ margin: "16px 0", padding: 16, border: "1px solid var(--theme-elevation-150)", borderRadius: 4, background: "var(--theme-elevation-50)" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
        <h4 style={{ margin: 0 }}>Listing Analytics</h4>
        <div style={{ display: "flex", gap: 6 }}>
          {RANGE_PRESETS.map((p, i) => (
            <button
              key={p.label}
              type="button"
              onClick={() => setPresetIndex(i)}
              style={{
                fontSize: 12,
                padding: "4px 10px",
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
        </div>
      </div>

      {loading && <p style={{ fontSize: 13, opacity: 0.7 }}>Loading…</p>}
      {error && <p style={{ fontSize: 13, color: "#c0392b" }}>{error}</p>}

      {!loading && !error && data && !data.ga4Configured && (
        <p style={{ fontSize: 13, opacity: 0.75, marginBottom: 12 }}>
          GA4 isn&apos;t configured yet (view counts and traffic sources will show as 0 until it is) — inquiry counts and
          lead status below are still live, since those come from this collection directly. See docs/analytics.md.
        </p>
      )}

      {!loading && !error && data && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 10, marginBottom: 16 }}>
            <StatCard label="Views" value={data.summary.views.toLocaleString()} />
            <StatCard label="Inquiries" value={data.summary.inquiries.toLocaleString()} />
            <StatCard
              label="Inquiry rate"
              value={`${formatPercent(data.summary.inquiryRate)} · avg ${formatPercent(data.platformAverage.inquiryRate)}`}
            />
            <StatCard label="Avg. time on page" value={data.summary.avgTimeOnPageSeconds != null ? `${data.summary.avgTimeOnPageSeconds}s` : "—"} />
            <StatCard label="Pages / session" value={data.summary.pagesPerSession != null ? String(data.summary.pagesPerSession) : "—"} />
            <StatCard label="Top city" value={data.summary.topCity ?? "—"} />
          </div>

          {(data.insights.topTrafficSource || data.insights.bestDayOfWeek) && (
            <div style={{ display: "grid", gap: 8, marginBottom: 16 }}>
              {data.insights.topTrafficSource && (
                <div style={{ fontSize: 13, padding: "8px 12px", background: "var(--theme-success-100)", borderRadius: 4 }}>
                  📈 Most visitors this period came from <strong>{data.insights.topTrafficSource}</strong>.
                </div>
              )}
              {data.insights.bestDayOfWeek && (
                <div style={{ fontSize: 13, padding: "8px 12px", background: "var(--theme-success-100)", borderRadius: 4 }}>
                  🗓️ <strong>{data.insights.bestDayOfWeek}</strong> has produced the most inquiries this period.
                </div>
              )}
            </div>
          )}

          <div style={{ marginBottom: 16 }}>
            <h5 style={{ marginBottom: 8 }}>Traffic Source</h5>
            {data.trafficSources.length === 0 ? (
              <p style={{ fontSize: 13, opacity: 0.65 }}>No sessions recorded for this period yet.</p>
            ) : (
              <table style={{ width: "100%", fontSize: 13, borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ textAlign: "left", opacity: 0.65 }}>
                    <th style={{ padding: "4px 0" }}>Source</th>
                    <th style={{ padding: "4px 0" }}>Sessions</th>
                    <th style={{ padding: "4px 0" }}>Share</th>
                  </tr>
                </thead>
                <tbody>
                  {data.trafficSources.map((row) => (
                    <tr key={row.channel} style={{ borderTop: "1px solid var(--theme-elevation-150)" }}>
                      <td style={{ padding: "6px 0" }}>{row.label}</td>
                      <td style={{ padding: "6px 0" }}>{row.sessions.toLocaleString()}</td>
                      <td style={{ padding: "6px 0" }}>{row.percent}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div style={{ marginBottom: 16 }}>
            <h5 style={{ marginBottom: 8 }}>Lead Status</h5>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {data.leadStatus.map((row) => (
                <div key={row.status} style={{ fontSize: 13, padding: "6px 12px", border: "1px solid var(--theme-elevation-150)", borderRadius: 999 }}>
                  {row.label}: <strong>{row.count}</strong>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h5 style={{ marginBottom: 8 }}>Trend</h5>
            {chartData.length === 0 ? (
              <p style={{ fontSize: 13, opacity: 0.65 }}>Not enough data yet for a trend chart.</p>
            ) : (
              <div style={{ width: "100%", height: 220 }}>
                <ResponsiveContainer>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="period" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="views" stroke="#f47b36" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="inquiries" stroke="#1a6b2f" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
