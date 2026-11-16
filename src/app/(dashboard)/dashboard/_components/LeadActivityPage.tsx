"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { AlertCircle } from "lucide-react";
import type { LeadActivityResponse, LeadActivityRow, DeveloperScoreRow } from "@/collections/endpoints/lead-activity";
import { PageHero, heroBtn, heroBtnSolid } from "./PageHero";
import { StatusChip } from "./StatusChip";
import { apiGetJson } from "../_data/api";

// Lead activity (admin): what happened to every enquiry. Was the developer emailed, did they open it, were reminders sent, did they
// answer. One table per developer and one row per lead, read live from /payload-api/lead-activity (leads + the email log's open and
// click tracking), so nothing here is typed in by hand. Owner, 2026-11-15: "developers are not responding… track if the email is opened".

const PERIODS = [7, 30, 90, 365];
const th = "whitespace-nowrap px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-muted";
const td = "px-4 py-2.5 align-top";
const SOURCE: Record<string, string> = { request_info: "Enquiry form", brochure_request: "Brochure request", manual: "Added by hand", whatsapp: "WhatsApp" };

const when = (iso: string | null) => (iso ? new Date(iso).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }) : "");

function minutes(m: number | null): string {
  if (m === null) return "";
  if (m < 60) return `${m} min`;
  if (m < 60 * 24) return `${Math.round(m / 60)} h`;
  return `${Math.round(m / (60 * 24))} d`;
}

/** How a developer treats the lead emails. Opens are counted by a tiny image some mail apps block, so clicks without opens still mean "read". */
function Reading({ sent, opened, clicks }: { sent: number; opened: number; clicks: number }) {
  if (!sent) return <span className="text-muted">No tracked email</span>;
  if (opened === sent) return <StatusChip value="ok" label={sent === 1 ? "Opened" : "Opens every one"} />;
  if (opened > 0) return <StatusChip value="pending" label="Opens some" />;
  if (clicks > 0) return <StatusChip value="pending" label="Opens hidden, links clicked" />;
  return <StatusChip value="failed" label="Never opened" />;
}

function Card({ title, note, children }: { title: string; note?: string; children: ReactNode }) {
  return (
    <section className="border border-line bg-panel">
      <div className="border-b border-line px-4 py-3"><h2 className="font-semibold">{title}</h2>{note ? <p className="text-xs text-muted">{note}</p> : null}</div>
      <div className="overflow-x-auto">{children}</div>
    </section>
  );
}

function Tile({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="border border-line bg-panel px-4 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">{label}</p>
      <p className="mt-1 text-2xl tabular-nums">{value}</p>
      {note ? <p className="mt-0.5 text-xs text-muted">{note}</p> : null}
    </div>
  );
}

function DeveloperRow({ d }: { d: DeveloperScoreRow }) {
  return (
    <tr className="border-b border-line last:border-0 hover:bg-subtle/60">
      <td className={`${td} font-medium`}>{d.id !== "none" ? <Link className="hover:underline" href={`/dashboard/developers/${d.id}`}>{d.name}</Link> : d.name}</td>
      <td className={`${td} text-right tabular-nums`}>{d.leads}</td>
      <td className={`${td} text-right tabular-nums`}>{d.awaiting}</td>
      <td className={`${td} text-right tabular-nums`}>{d.answered}</td>
      <td className={`${td} text-right tabular-nums`}>{d.emailsSent}</td>
      <td className={`${td} text-right tabular-nums`}>{d.emailsSent ? `${d.emailsOpened} of ${d.emailsSent}` : ""}</td>
      <td className={`${td} text-right tabular-nums`}>{d.emailClicks}</td>
      <td className={td}><Reading sent={d.emailsSent} opened={d.emailsOpened} clicks={d.emailClicks} /></td>
      <td className={`${td} text-right tabular-nums`}>{minutes(d.avgMinutes)}</td>
    </tr>
  );
}

function LeadRow({ r }: { r: LeadActivityRow }) {
  const emailed = r.alertLog.find((e) => e.channel === "email");
  const sent = emailed ? emailed.status === "sent" : /^Email sent/.test(r.alertSummary);
  const failed = emailed?.status === "failed";
  const test = (emailed?.routing && emailed.routing !== "live") || /TEST/.test(r.alertSummary);
  return (
    <tr className="border-b border-line last:border-0 hover:bg-subtle/60">
      <td className={`${td} whitespace-nowrap text-muted`}>{when(r.createdAt)}</td>
      <td className={td}>
        <Link className="font-medium hover:underline" href={`/dashboard/leads/${r.id}`}>{r.buyer.name || "No name"}</Link>
        <span className="block text-xs text-muted">{SOURCE[r.source] ?? r.source}{r.origin.country ? ` · ${[r.origin.city, r.origin.country].filter(Boolean).join(", ")}` : ""}</span>
      </td>
      <td className={td}>{r.project.name}<span className="block text-xs text-muted">{r.developer.name}</span></td>
      <td className={td}>
        {failed ? <StatusChip value="failed" label="Failed" /> : sent ? <StatusChip value={test ? "pending" : "ok"} label={test ? "Sent to test inbox" : "Sent"} /> : <StatusChip value="failed" label="Not sent" />}
        {emailed?.to ? <span className="mt-1 block max-w-56 truncate text-xs text-muted" title={emailed.to}>{emailed.to}</span> : null}
      </td>
      <td className={td}>
        <Reading sent={r.emails.sent} opened={r.emails.opened} clicks={r.emails.clicks} />
        {r.emails.sent ? <span className="mt-1 block text-xs text-muted">{r.emails.opened} of {r.emails.sent} {r.emails.sent === 1 ? "email" : "emails"}{r.emails.firstOpenedAt ? ` · first ${when(r.emails.firstOpenedAt)}` : ""}</span> : null}
      </td>
      <td className={`${td} whitespace-nowrap`}>{r.reminders ? `${r.reminders} of 2` : "None yet"}{r.lastReminderAt ? <span className="block text-xs text-muted">last {when(r.lastReminderAt)}</span> : null}</td>
      <td className={td}>
        {r.status === "new" ? <StatusChip value="failed" label="No reply" /> : <StatusChip value={r.status} label={r.status === "contacted" ? "Replied" : undefined} />}
        {r.firstReplyVia ? <span className="mt-1 block text-xs text-muted">by {r.firstReplyVia}{r.responseMinutes !== null ? ` after ${minutes(r.responseMinutes)}` : ""}</span> : null}
      </td>
    </tr>
  );
}

export function LeadActivityPage() {
  const [days, setDays] = useState(30);
  const [state, setState] = useState<{ days: number; data: LeadActivityResponse | null; error: string }>({ days: 0, data: null, error: "" });

  useEffect(() => {
    let alive = true;
    apiGetJson<LeadActivityResponse>(`/lead-activity?days=${days}`)
      .then((data) => { if (alive) setState({ days, data, error: "" }); })
      .catch((e) => { if (alive) setState({ days, data: null, error: e instanceof Error ? e.message : "Could not load lead activity." }); });
    return () => { alive = false; };
  }, [days]);

  const data = state.days === days ? state.data : null;
  const error = state.days === days ? state.error : "";
  const sent = data ? data.developers.reduce((n, d) => n + d.emailsSent, 0) : 0;
  const opened = data ? data.developers.reduce((n, d) => n + d.emailsOpened, 0) : 0;
  const reminders = data ? data.leads.reduce((n, l) => n + l.reminders, 0) : 0;

  return (
    <div>
      <PageHero
        title="Lead activity"
        description="Every enquiry: was the developer emailed, did they open it, were reminders sent, and did they reply."
        stat={{ label: "Leads", value: data ? String(data.totals.leads) : "…" }}
        extraStats={[{ label: "No reply yet", value: data ? String(data.totals.awaiting) : "…" }]}
        actions={PERIODS.map((p) => <button key={p} type="button" onClick={() => setDays(p)} className={p === days ? heroBtnSolid : heroBtn}>{p === 365 ? "1 year" : `${p} days`}</button>)}
      />
      <div className="d-box space-y-5">
        {error ? <p className="flex items-start gap-2 border border-line bg-panel px-4 py-8 text-sm text-muted"><AlertCircle size={16} className="mt-0.5 shrink-0 text-bad" /><span>{error}</span></p> : null}
        {!data && !error ? <div className="d-skeleton h-64 w-full" /> : null}
        {data ? (
          <>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <Tile label="Emails to developers" value={String(sent)} note="alerts, brochure requests, reminders" />
              <Tile label="Opened" value={sent ? `${opened} of ${sent}` : "0"} note={sent ? `${Math.round((opened / sent) * 100)}% of tracked emails` : undefined} />
              <Tile label="Reminders sent" value={String(reminders)} note="up to 2 for each lead" />
              <Tile label="Replied" value={`${data.totals.answered} of ${data.totals.leads}`} note={data.totals.avgMinutes !== null ? `average ${minutes(data.totals.avgMinutes)}` : undefined} />
            </div>

            <Card title="By developer" note="Do they open the lead emails? Some mail apps hide opens, so link clicks also count as read.">
              {data.developers.length === 0 ? <p className="px-4 py-8 text-sm text-muted">No leads in this period.</p> : (
                <table className="w-full min-w-[860px] text-sm">
                  <thead><tr className="border-b border-line text-left"><th className={th}>Developer</th><th className={`${th} text-right`}>Leads</th><th className={`${th} text-right`}>No reply</th><th className={`${th} text-right`}>Replied</th><th className={`${th} text-right`}>Emails sent</th><th className={`${th} text-right`}>Opened</th><th className={`${th} text-right`}>Link clicks</th><th className={th}>Email reading</th><th className={`${th} text-right`}>Avg reply</th></tr></thead>
                  <tbody>{data.developers.map((d) => <DeveloperRow key={String(d.id)} d={d} />)}</tbody>
                </table>
              )}
            </Card>

            <Card title="Every lead" note="Newest first. Reminders go out 12 and 48 hours after an unanswered enquiry, in Sri Lanka working hours.">
              {data.leads.length === 0 ? <p className="px-4 py-8 text-sm text-muted">No leads in this period.</p> : (
                <table className="w-full min-w-[980px] text-sm">
                  <thead><tr className="border-b border-line text-left"><th className={th}>Received</th><th className={th}>Buyer</th><th className={th}>Listing</th><th className={th}>Email to developer</th><th className={th}>Opened</th><th className={th}>Reminders</th><th className={th}>Reply</th></tr></thead>
                  <tbody>{data.leads.map((r) => <LeadRow key={String(r.id)} r={r} />)}</tbody>
                </table>
              )}
            </Card>
          </>
        ) : null}
      </div>
    </div>
  );
}
