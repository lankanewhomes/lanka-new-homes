"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Mail } from "lucide-react";
import { apiFind, type Doc } from "../_data/api";

/** Emails tab of a developer: every automatic email the platform sent them (lead alerts, Verified Developer, invites, reports). */
export function DeveloperEmailLog() {
  const { id } = useParams<{ id: string }>();
  const [rows, setRows] = useState<Doc[] | null>(null);
  const [open, setOpen] = useState<string | number | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id || id === "new") return;
    let alive = true;
    apiFind("email-log", { limit: 200, sort: "-sentAt", where: { developer: { equals: Number(id) } } })
      .then((r) => alive && setRows(r.docs))
      .catch((e) => alive && setError(e instanceof Error ? e.message : "Could not load the emails."));
    return () => { alive = false; };
  }, [id]);

  if (!id || id === "new") return <p className="text-sm text-muted">Save the developer first, then the emails we send them appear here.</p>;
  if (error) return <p className="text-sm text-bad">{error}</p>;
  if (!rows) return <div className="d-skeleton h-24 w-full" />;
  return (
    <div className="border border-line bg-panel">
      <div className="flex items-center gap-2 border-b border-line px-4 py-3 text-sm"><Mail size={15} /><span className="font-semibold">{rows.length} automatic {rows.length === 1 ? "email" : "emails"} sent to this developer</span></div>
      {rows.length === 0 ? <p className="px-4 py-8 text-center text-sm text-muted">No automatic emails yet. New ones (lead alerts, Verified Developer, invites, reports) are kept here.</p> : null}
      {rows.map((r) => (
        <div key={String(r.id)} className="border-b border-line last:border-0">
          <button type="button" onClick={() => setOpen(open === r.id ? null : (r.id as string | number))} className="flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-subtle/60">
            <span className="mt-0.5 shrink-0 border border-line bg-subtle px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide">{String(r.kind || "Email")}</span>
            <span className="min-w-0 flex-1"><b className="block truncate text-sm font-medium">{String(r.subject)}</b><i className="block truncate text-xs not-italic text-muted">to {String(r.toEmail ?? "")}{r.bccEmail ? `, copied to ${String(r.bccEmail)}` : ""}</i></span>
            {Number(r.clickCount) > 0 ? <span className="shrink-0 border border-line bg-subtle px-2 py-0.5 text-[11px] font-semibold">{Number(r.clickCount)} {Number(r.clickCount) === 1 ? "click" : "clicks"}</span> : null}
            <span className="shrink-0 whitespace-nowrap text-xs text-muted">{r.sentAt ? new Date(String(r.sentAt)).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" }) : ""}</span>
          </button>
          {open === r.id ? <Clicks clicks={r.clicks} /> : null}
          {open === r.id ? <iframe title="Email" sandbox="" srcDoc={String(r.htmlBody || `<pre style="white-space:pre-wrap;font-family:Arial">${String(r.textBody ?? "").replace(/</g, "&lt;")}</pre>`)} className="h-[520px] w-full border-t border-line bg-white" /> : null}
        </div>
      ))}
    </div>
  );
}

/** Which buttons in an email were tapped (WhatsApp, Call, Email, View listing…), newest first. */
function Clicks({ clicks }: { clicks: unknown }) {
  const list = (Array.isArray(clicks) ? clicks : []) as { button?: string; at?: string; device?: string }[];
  if (!list.length) return <p className="border-t border-line px-4 py-2 text-xs text-muted">No button clicked yet.</p>;
  return (
    <ul className="border-t border-line px-4 py-2 text-xs">
      {[...list].reverse().map((c, i) => (
        <li key={i} className="flex gap-3 py-0.5"><b className="w-40 shrink-0 truncate">{c.button || "Link"}</b><span className="text-muted">{c.at ? new Date(c.at).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }) : ""}{c.device ? ` · ${c.device}` : ""}</span></li>
      ))}
    </ul>
  );
}
