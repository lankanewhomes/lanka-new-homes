"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { LeadActivityResponse, LeadActivityRow } from "@/collections/endpoints/lead-activity";
import { formatMinutes } from "@/lib/format";

// /cms/lead-activity — admin-only. What's happening with leads: who was
// alerted (and whether it went to the developer or the test inbox), who
// answered, how (WhatsApp / call / email tap, or a status change in the
// CMS) and how fast, plus a per-developer scoreboard. Data from
// /payload-api/lead-activity (src/collections/endpoints/lead-activity.ts).

const RANGES = [
  { label: "Last 7 days", days: 7 },
  { label: "Last 30 days", days: 30 },
  { label: "Last 90 days", days: 90 },
];

const STATUS_LABEL: Record<string, string> = { new: "New", contacted: "Contacted", site_visit: "Site visit", closed: "Closed" };
const STATUS_COLOR: Record<string, string> = { new: "var(--theme-warning-500)", contacted: "#2563eb", site_visit: "var(--theme-success-500)", closed: "var(--theme-elevation-500)" };
const VIA_LABEL: Record<string, string> = { whatsapp: "WhatsApp tap", call: "Call tap", email: "Email tap", cms: "Status changed in CMS" };
const SOURCE_LABEL: Record<string, string> = { request_info: "Request info", brochure_request: "Brochure request", manual: "Added manually" };

const when = (iso: string) => (iso ? new Date(iso).toLocaleString("en-GB", { timeZone: "Asia/Colombo", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "—");

const TRAFFIC_LABEL: Record<string, string> = { organic_search: "Google search", organic_social: "Facebook/Instagram", paid_search: "Google Ads", paid_social: "Facebook & Instagram Ads", referral: "Referral", direct: "Direct" };

// "LK" → "Sri Lanka"; falls back to the code.
function countryName(code: string): string {
  if (!code) return "";
  try {
    return new Intl.DisplayNames(["en"], { type: "region" }).of(code) ?? code;
  } catch {
    return code;
  }
}

// "Dubai, United Arab Emirates · mobile · Google Ads" — blanks drop out.
function describeOrigin(o: { country?: string; region?: string; city?: string; device?: string; trafficSource?: string } | null | undefined): string {
  if (!o) return "";
  const place = [o.city, o.region && o.region !== o.city ? o.region : "", countryName(o.country ?? "")].filter(Boolean).join(", ");
  const device = o.device && o.device !== "unknown" ? o.device : "";
  const via = o.trafficSource ? TRAFFIC_LABEL[o.trafficSource] ?? o.trafficSource : "";
  return [place, device, via].filter(Boolean).join(" · ");
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div style={{ border: "1px solid var(--theme-elevation-150)", borderRadius: 6, padding: "12px 14px", background: "var(--theme-elevation-0)" }}>
      <div style={{ fontSize: 11, opacity: 0.65, textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 700, color: tone ?? "inherit" }}>{value}</div>
    </div>
  );
}

function Pill({ label, color }: { label: string; color: string }) {
  return <span style={{ display: "inline-block", padding: "2px 9px", borderRadius: 999, border: `1px solid ${color}`, color, fontSize: 11, fontWeight: 700, whiteSpace: "nowrap" }}>{label}</span>;
}

function LeadRow({ row }: { row: LeadActivityRow }) {
  const [open, setOpen] = useState(false);
  const alertFailed = row.alertLog.some((e) => e.status === "failed");
  const alertTest = row.alertLog.some((e) => e.routing !== "live");
  const reply = row.responseMinutes !== null ? `${formatMinutes(row.responseMinutes)}${row.firstReplyVia ? ` · ${VIA_LABEL[row.firstReplyVia] ?? row.firstReplyVia}` : ""}` : row.status === "new" ? "Awaiting reply" : "—";
  const cell: React.CSSProperties = { padding: "8px 12px", verticalAlign: "top", fontSize: 13 };

  return (
    <>
      <tr style={{ borderTop: "1px solid var(--theme-elevation-150)", cursor: "pointer" }} onClick={() => setOpen((v) => !v)}>
        <td style={cell}>{when(row.createdAt)}</td>
        <td style={cell}>
          <strong>{row.buyer.name || "—"}</strong>
          <div style={{ opacity: 0.7, fontSize: 12 }}>{[row.buyer.phone, row.buyer.email].filter(Boolean).join(" · ")}</div>
          {describeOrigin(row.origin) ? <div style={{ fontSize: 12, marginTop: 2, color: row.origin.country && row.origin.country !== "LK" ? "#b45309" : "inherit", opacity: 0.85 }}>📍 {describeOrigin(row.origin)}</div> : null}
        </td>
        <td style={cell}>
          {row.project.id ? <Link href={`/cms/collections/projects/${row.project.id}`}>{row.project.name || "Project"}</Link> : "—"}
          {row.floorPlan ? <div style={{ opacity: 0.7, fontSize: 12 }}>{row.floorPlan}</div> : null}
          <div style={{ opacity: 0.7, fontSize: 12 }}>{SOURCE_LABEL[row.source] ?? row.source}</div>
        </td>
        <td style={cell}>{row.developer.id ? <Link href={`/cms/collections/developers/${row.developer.id}`}>{row.developer.name}</Link> : "—"}</td>
        <td style={cell}>
          {alertFailed ? <Pill label="Alert failed" color="var(--theme-error-500)" /> : alertTest ? <Pill label="Test routing" color="var(--theme-warning-500)" /> : row.alertLog.length ? <Pill label="Alerted" color="var(--theme-success-500)" /> : <Pill label="No alert" color="var(--theme-elevation-500)" />}
          <div style={{ opacity: 0.7, fontSize: 12, marginTop: 3 }}>{row.alertSummary}</div>
        </td>
        <td style={cell}><Pill label={STATUS_LABEL[row.status] ?? row.status} color={STATUS_COLOR[row.status] ?? "inherit"} /></td>
        <td style={{ ...cell, color: row.responseMinutes !== null && row.responseMinutes <= 60 ? "var(--theme-success-500)" : row.status === "new" ? "var(--theme-warning-500)" : "inherit", fontWeight: row.status === "new" ? 700 : 400 }}>{reply}</td>
        <td style={{ ...cell, textAlign: "right" }}><Link href={`/cms/collections/leads/${row.id}`} onClick={(e) => e.stopPropagation()}>Open</Link></td>
      </tr>
      {open ? (
        <tr style={{ background: "var(--theme-elevation-50)" }}>
          <td colSpan={8} style={{ padding: "10px 14px 14px", fontSize: 12 }}>
            {row.message ? <p style={{ margin: "0 0 8px" }}><strong>Message:</strong> {row.message}</p> : null}
            {describeOrigin(row.origin) || row.origin.referrer ? (
              <p style={{ margin: "0 0 8px" }}><strong>Buyer was in:</strong> {describeOrigin(row.origin) || "unknown"}{row.origin.referrer ? ` · came from ${row.origin.referrer}` : ""}</p>
            ) : null}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <strong>Alerts</strong>
                {row.alertLog.length === 0 ? <div style={{ opacity: 0.6 }}>None recorded.</div> : row.alertLog.map((e, i) => (
                  <div key={i}>{when(e.at)} · {e.channel} → {e.to} · <em>{e.status}</em>{e.routing !== "live" ? ` (${e.routing})` : ""}</div>
                ))}
              </div>
              <div>
                <strong>Replies</strong>
                {row.replyEvents.length === 0 ? <div style={{ opacity: 0.6 }}>No reply yet.</div> : row.replyEvents.map((e, i) => (
                  <div key={i}>{when(e.at)} · {VIA_LABEL[e.via] ?? e.via}{e.source === "alert-email" ? " (from alert email)" : ""}{describeOrigin({ country: e.country, city: e.city, device: e.device }) ? ` · from ${describeOrigin({ country: e.country, city: e.city, device: e.device })}` : ""}</div>
                ))}
                {row.firstResponseAt ? <div style={{ marginTop: 4, opacity: 0.8 }}>First response {when(row.firstResponseAt)} · {formatMinutes(row.responseMinutes)} after the lead came in</div> : null}
              </div>
            </div>
          </td>
        </tr>
      ) : null}
    </>
  );
}

export function LeadActivity() {
  const [rangeIndex, setRangeIndex] = useState(1);
  const [data, setData] = useState<LeadActivityResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const range = RANGES[rangeIndex];

  useEffect(() => {
    const controller = new AbortController();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    setError(null);
    fetch(`/payload-api/lead-activity?days=${range.days}`, { credentials: "include", signal: controller.signal })
      .then(async (res) => {
        const body = await res.json();
        if (!res.ok) throw new Error(body?.error ?? "Failed to load lead activity.");
        setData(body as LeadActivityResponse);
      })
      .catch((err) => {
        if (err.name !== "AbortError") setError(err.message ?? "Failed to load lead activity.");
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [range.days]);

  const th: React.CSSProperties = { padding: "8px 12px", textAlign: "left", fontSize: 12, opacity: 0.65 };

  return (
    <div style={{ padding: "24px 32px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8, marginBottom: 6 }}>
        <h1 style={{ margin: 0 }}>Lead activity</h1>
        <div style={{ display: "flex", gap: 6 }}>
          {RANGES.map((r, i) => (
            <button key={r.days} type="button" onClick={() => setRangeIndex(i)} style={{ fontSize: 13, padding: "6px 14px", borderRadius: 999, border: "1px solid var(--theme-elevation-200)", background: i === rangeIndex ? "var(--theme-elevation-800)" : "transparent", color: i === rangeIndex ? "var(--theme-elevation-0)" : "inherit", cursor: "pointer" }}>
              {r.label}
            </button>
          ))}
        </div>
      </div>
      <p style={{ margin: "0 0 18px", fontSize: 13, opacity: 0.7 }}>
        Every inquiry: who was alerted, whether they answered, how and how fast. A reply counts when the developer taps a button in the alert email or moves the lead off &ldquo;New&rdquo;. Click a row for the full trail.
      </p>

      {loading && <p style={{ opacity: 0.7 }}>Loading…</p>}
      {error && <p style={{ color: "var(--theme-error-500)" }}>{error}</p>}

      {!loading && !error && data ? (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12, marginBottom: 20 }}>
            <Stat label={`Leads (${range.label.toLowerCase()})`} value={data.totals.leads.toLocaleString()} />
            <Stat label="Awaiting reply" value={data.totals.awaiting.toLocaleString()} tone={data.totals.awaiting > 0 ? "var(--theme-warning-500)" : undefined} />
            <Stat label="Answered" value={data.totals.answered.toLocaleString()} />
            <Stat label="Avg first response" value={formatMinutes(data.totals.avgMinutes)} />
            <Stat label="Within 1 hour" value={data.totals.withinHourPercent === null ? "—" : `${data.totals.withinHourPercent}%`} />
            <Stat label="Alerts failed" value={data.totals.alertsFailed.toLocaleString()} tone={data.totals.alertsFailed > 0 ? "var(--theme-error-500)" : undefined} />
          </div>

          <h5 style={{ margin: "0 0 8px" }}>By developer</h5>
          <div style={{ border: "1px solid var(--theme-elevation-150)", borderRadius: 6, overflow: "hidden", background: "var(--theme-elevation-0)", marginBottom: 24 }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead><tr style={{ background: "var(--theme-elevation-50)" }}><th style={th}>Developer</th><th style={th}>Leads</th><th style={th}>Awaiting</th><th style={th}>Answered</th><th style={th}>Avg response</th><th style={th}>Within 1 h</th><th style={th}>Alerts failed</th><th style={th}>Badge</th></tr></thead>
              <tbody>
                {data.developers.length === 0 ? <tr><td colSpan={8} style={{ padding: 12, fontSize: 13, opacity: 0.65 }}>No leads in this period.</td></tr> : data.developers.map((d) => (
                  <tr key={String(d.id)} style={{ borderTop: "1px solid var(--theme-elevation-150)", fontSize: 13 }}>
                    <td style={{ padding: "8px 12px" }}>{d.id !== "none" ? <Link href={`/cms/collections/developers/${d.id}`}>{d.name}</Link> : d.name}</td>
                    <td style={{ padding: "8px 12px" }}>{d.leads}</td>
                    <td style={{ padding: "8px 12px", color: d.awaiting ? "var(--theme-warning-500)" : "inherit" }}>{d.awaiting}</td>
                    <td style={{ padding: "8px 12px" }}>{d.answered}</td>
                    <td style={{ padding: "8px 12px" }}>{formatMinutes(d.avgMinutes)}</td>
                    <td style={{ padding: "8px 12px" }}>{d.withinHourPercent === null ? "—" : `${d.withinHourPercent}%`}</td>
                    <td style={{ padding: "8px 12px", color: d.alertsFailed ? "var(--theme-error-500)" : "inherit" }}>{d.alertsFailed}</td>
                    <td style={{ padding: "8px 12px" }}>{d.badge ? <Pill label="Responds within 1 hour" color="#047857" /> : <span style={{ opacity: 0.5 }}>—</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h5 style={{ margin: "0 0 8px" }}>Leads</h5>
          <div style={{ border: "1px solid var(--theme-elevation-150)", borderRadius: 6, overflow: "auto", background: "var(--theme-elevation-0)" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 900 }}>
              <thead><tr style={{ background: "var(--theme-elevation-50)" }}><th style={th}>Received</th><th style={th}>Buyer</th><th style={th}>Project</th><th style={th}>Developer</th><th style={th}>Alert</th><th style={th}>Status</th><th style={th}>Reply</th><th style={th} /></tr></thead>
              <tbody>
                {data.leads.length === 0 ? <tr><td colSpan={8} style={{ padding: 12, fontSize: 13, opacity: 0.65 }}>No leads in this period.</td></tr> : data.leads.map((row) => <LeadRow key={String(row.id)} row={row} />)}
              </tbody>
            </table>
          </div>
        </>
      ) : null}
    </div>
  );
}
