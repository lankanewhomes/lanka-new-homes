"use client";

import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Camera, Mail, MessageCircle, Phone, StickyNote } from "lucide-react";
import { apiFind, apiGet, type Doc } from "../_data/api";

// Everything we have sent to, or heard from, one developer, on one timeline (owner, 2026-11-18: "for each developer I want to see what email
// I have sent, and also messages, WhatsApp, etc. on the phone"). Sources: the automatic emails the site sent (email log), emails typed by
// hand in the mailbox and logged in Outreach, WhatsApp messages, and the manual "Other contact" notes (Instagram, phone, in person…).

type Kind = "email" | "whatsapp" | "other";
type Item = {
  key: string;
  kind: Kind;
  label: string;
  incoming: boolean;
  title: string;
  detail: string;
  at: string;
  opens?: number;
  clicks?: number;
  html?: string;
  text?: string;
  clickList?: unknown;
  link?: string;
};

const OTHER_LABEL: Record<string, string> = { instagram: "Instagram", whatsapp: "WhatsApp (note)", phone: "Phone call", facebook: "Facebook", linkedin: "LinkedIn", in_person: "In person", other: "Other" };
const when = (iso: string) => (iso ? new Date(iso).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" }) : "");
const str = (v: unknown) => (typeof v === "string" ? v : v == null ? "" : String(v));
const FILTERS: { key: "all" | Kind; label: string }[] = [{ key: "all", label: "All" }, { key: "email", label: "Emails" }, { key: "whatsapp", label: "WhatsApp" }, { key: "other", label: "Instagram, phone, other" }];

/** Contact history tab of a developer: emails, WhatsApp and every other kind of contact, newest first. */
export function DeveloperEmailLog() {
  const { id } = useParams<{ id: string }>();
  const [items, setItems] = useState<Item[] | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | Kind>("all");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id || id === "new") return;
    let alive = true;
    const dev = { developer: { equals: Number(id) } };
    Promise.all([
      apiFind("email-log", { limit: 300, sort: "-sentAt", where: dev }),
      apiFind("outreach", { limit: 300, sort: "-sentAt", where: dev }),
      apiFind("whatsapp-messages", { limit: 300, sort: "-sentAt", where: dev }).catch(() => ({ docs: [] as Doc[] })),
      apiGet("developers", id),
    ])
      .then(([emails, outreach, whatsapp, developer]) => {
        if (!alive) return;
        const list: Item[] = [];
        for (const r of emails.docs) {
          list.push({ key: `e${r.id}`, kind: "email", label: str(r.kind) || "Automatic email", incoming: false, title: str(r.subject), detail: `to ${str(r.toEmail)}${r.bccEmail ? ` · bcc ${str(r.bccEmail)}` : ""}`, at: str(r.sentAt || r.createdAt), opens: Number(r.openCount) || 0, clicks: Number(r.clickCount) || 0, html: str(r.htmlBody), text: str(r.textBody), clickList: r.clicks });
        }
        for (const r of outreach.docs) {
          if (r.status === "draft") continue;
          const incoming = r.status === "replied" && /^Received/i.test(str(r.notes));
          list.push({ key: `o${r.id}`, kind: "email", label: r.channel === "zoho" ? (incoming ? "Reply received" : "Email typed by hand") : "Outreach email", incoming, title: str(r.subject) || "(no subject)", detail: `${incoming ? "from" : "to"} ${str(r.recipient || r.toEmail)}${str(r.fromAddress) && !incoming ? ` · from ${str(r.fromAddress)}` : ""}`, at: str(r.sentAt || r.createdAt), clicks: Number(r.clickCount) || 0, html: str(r.sentHtml), text: str(r.notes) });
        }
        for (const r of whatsapp.docs) {
          const incoming = r.direction === "inbound";
          list.push({ key: `w${r.id}`, kind: "whatsapp", label: incoming ? "WhatsApp received" : "WhatsApp sent", incoming, title: str(r.text) || (r.templateName ? `Template: ${str(r.templateName)}` : "(no text)"), detail: `${incoming ? "from" : "to"} ${str(r.phone)} · ${str(r.status)}${r.error ? ` · ${str(r.error)}` : ""}`, at: str(r.sentAt || r.createdAt), text: str(r.text) });
        }
        const log = Array.isArray(developer.contactLog) ? (developer.contactLog as Doc[]) : [];
        log.forEach((r, i) => {
          const channel = str(r.channel);
          list.push({ key: `c${i}`, kind: channel === "whatsapp" ? "whatsapp" : "other", label: OTHER_LABEL[channel] ?? "Contact", incoming: false, title: str(r.summary), detail: "noted by hand", at: str(r.date), link: str(r.link) });
        });
        setItems(list.sort((a, b) => b.at.localeCompare(a.at)));
      })
      .catch((e) => alive && setError(e instanceof Error ? e.message : "Could not load the contact history."));
    return () => { alive = false; };
  }, [id]);

  const shown = useMemo(() => (items ?? []).filter((i) => filter === "all" || i.kind === filter), [items, filter]);
  const count = (k: "all" | Kind) => (items ?? []).filter((i) => k === "all" || i.kind === k).length;

  if (!id || id === "new") return <p className="text-sm text-muted">Save the developer first, then every email and message with them appears here.</p>;
  if (error) return <p className="text-sm text-bad">{error}</p>;
  if (!items) return <div className="d-skeleton h-24 w-full" />;
  return (
    <div className="border border-line bg-panel">
      <div className="flex flex-wrap items-center gap-2 border-b border-line px-4 py-3 text-sm">
        <Mail size={15} /><span className="mr-2 font-semibold">Contact history</span>
        {FILTERS.map((f) => (
          <button key={f.key} type="button" onClick={() => setFilter(f.key)} className={`border px-3 py-1 text-xs ${filter === f.key ? "border-ink bg-ink font-medium text-white" : "border-line bg-panel hover:border-fg/40"}`}>{f.label} <span className="tabular-nums opacity-70">{count(f.key)}</span></button>
        ))}
      </div>
      {shown.length === 0 ? <p className="px-4 py-8 text-center text-sm text-muted">Nothing here yet. Emails from the site, emails you typed, WhatsApp messages and your notes appear on this list.</p> : null}
      {shown.map((r) => {
        const Icon = r.kind === "email" ? Mail : r.kind === "whatsapp" ? MessageCircle : r.label === "Phone call" ? Phone : r.label === "Instagram" ? Camera : StickyNote;
        const expandable = Boolean(r.html || r.text || r.link || r.clickList);
        return (
          <div key={r.key} className="border-b border-line last:border-0">
            <button type="button" disabled={!expandable} onClick={() => setOpen(open === r.key ? null : r.key)} className="flex w-full items-start gap-3 px-4 py-3 text-left enabled:hover:bg-subtle/60">
              <Icon size={15} className="mt-1 shrink-0 text-muted" />
              <span className={`mt-0.5 shrink-0 border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${r.incoming ? "border-[#cfe6cf] bg-[#e8f4e8] text-[#1a6b2f]" : "border-line bg-subtle"}`}>{r.label}</span>
              <span className="min-w-0 flex-1"><b className="block truncate text-sm font-medium">{r.title}</b><i className="block truncate text-xs not-italic text-muted">{r.detail}</i></span>
              {r.opens ? <span className="shrink-0 border border-line bg-subtle px-2 py-0.5 text-[11px] font-semibold">Opened{r.opens > 1 ? ` ${r.opens}×` : ""}</span> : null}
              {r.clicks ? <span className="shrink-0 border border-line bg-subtle px-2 py-0.5 text-[11px] font-semibold">{r.clicks} {r.clicks === 1 ? "click" : "clicks"}</span> : null}
              <span className="shrink-0 whitespace-nowrap text-xs text-muted">{when(r.at)}</span>
            </button>
            {open === r.key ? (
              <>
                {r.clickList ? <Clicks clicks={r.clickList} /> : null}
                {r.link ? <p className="border-t border-line px-4 py-2 text-xs"><a className="underline" href={r.link} target="_blank" rel="noreferrer">{r.link}</a></p> : null}
                {r.html ? <iframe title="Email" sandbox="" srcDoc={r.html} className="h-96 w-full border-t border-line bg-white" /> : r.text ? <pre className="whitespace-pre-wrap border-t border-line px-4 py-3 text-sm">{r.text}</pre> : null}
              </>
            ) : null}
          </div>
        );
      })}
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
        <li key={i} className="flex gap-3 py-0.5"><b className="w-40 shrink-0 truncate">{c.button || "Link"}</b><span className="text-muted">{c.at ? when(c.at) : ""}{c.device ? ` · ${c.device}` : ""}</span></li>
      ))}
    </ul>
  );
}
