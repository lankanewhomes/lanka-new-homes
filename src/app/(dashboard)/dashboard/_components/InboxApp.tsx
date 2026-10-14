"use client";

import { useMemo, useState } from "react";
import { ArrowLeft, Eye, FilePen, Forward, Inbox, MailOpen, MailPlus, MousePointerClick, Octagon, Paperclip, Reply, Send, Star, Tag, Trash2, X, Mail } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useDash } from "./DashProvider";
import { NOW } from "../_mock/seeds";
import { MAILBOXES, cloneMail, type FolderId, type MailMessage, type MailboxAddress } from "../_mock/mail";

// State transitions are plain functions over the message array so they can be replaced by /api/mail/* calls later.
const patch = (list: MailMessage[], ids: Set<string>, change: Partial<MailMessage>) => list.map((x) => (ids.has(x.id) ? { ...x, ...change } : x));
const trash = (list: MailMessage[], ids: Set<string>) => list.flatMap((x) => (!ids.has(x.id) ? [x] : x.folder === "trash" ? [] : [{ ...x, folder: "trash" as const, unread: false }]));
const inFolder = (x: MailMessage, mailbox: MailboxAddress, folder: FolderId) =>
  x.mailbox === mailbox && (folder === "starred" ? x.starred && x.folder !== "trash" : x.folder === folder);
const EMAIL_RE = /[^\s,;<>]+@[^\s,;<>]+\.[^\s,;<>]+/;
const splitAddrs = (s: string) => s.split(/[,;]/).map((x) => x.trim()).filter(Boolean);

function relDate(iso: string): string {
  const d = new Date(iso);
  const mins = Math.round((NOW.getTime() - d.getTime()) / 60000);
  if (mins < 60) return `${Math.max(mins, 1)}m ago`;
  if (mins < 60 * 24) return `${Math.round(mins / 60)}h ago`;
  if (mins < 60 * 24 * 7) return `${Math.round(mins / 1440)}d ago`;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}
const fullDate = (iso: string) => new Date(iso).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

const FOLDERS: { id: FolderId; label: string; icon: LucideIcon }[] = [
  { id: "inbox", label: "Inbox", icon: Inbox },
  { id: "starred", label: "Starred", icon: Star },
  { id: "sent", label: "Sent", icon: Send },
  { id: "drafts", label: "Drafts", icon: FilePen },
  { id: "spam", label: "Spam", icon: Octagon },
  { id: "trash", label: "Trash", icon: Trash2 },
  { id: "custom", label: "", icon: Tag },
];

type Draft = { from: MailboxAddress; to: string; cc: string; subject: string; body: string; track: boolean };
const quote = (x: MailMessage) => `\n\n--- Original message ---\nFrom: ${x.from.name} <${x.from.email}>\nDate: ${fullDate(x.date)}\nSubject: ${x.subject}\n\n${x.body}`;

function TrackingBadge({ x }: { x: MailMessage }) {
  if (!x.tracking) return null;
  const { opened, clicks } = x.tracking;
  return (
    <span className="flex shrink-0 items-center gap-2 text-xs">
      {opened > 0 ? (
        <span title={`Recipient opened this email ${opened} time${opened === 1 ? "" : "s"}`} className="flex items-center gap-1 text-ok"><Eye size={13} />Opened {opened}x</span>
      ) : (
        <span title="No open recorded yet" className="flex items-center gap-1 text-muted"><Eye size={13} />Not opened yet</span>
      )}
      {clicks > 0 ? <span title={`${clicks} link click${clicks === 1 ? "" : "s"}`} className="flex items-center gap-1 text-accent"><MousePointerClick size={13} />{clicks}</span> : null}
    </span>
  );
}

const field = "w-full rounded-lg border border-line bg-bg px-3 py-2 text-sm outline-none focus:border-accent";

export function InboxApp() {
  const { toast } = useDash();
  const [msgs, setMsgs] = useState<MailMessage[]>(() => cloneMail());
  const [mailbox, setMailbox] = useState<MailboxAddress>(MAILBOXES[0].address);
  const [folder, setFolder] = useState<FolderId>("inbox");
  const [q, setQ] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [draft, setDraft] = useState<Draft | null>(null);

  const box = MAILBOXES.find((b) => b.address === mailbox) ?? MAILBOXES[0];
  const unreadIn = (mb: MailboxAddress, f: FolderId) => msgs.filter((x) => x.unread && inFolder(x, mb, f)).length;
  const folderLabel = (id: FolderId) => (id === "custom" ? box.customFolder : FOLDERS.find((f) => f.id === id)?.label ?? "");

  const list = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return msgs
      .filter((x) => inFolder(x, mailbox, folder))
      .filter((x) => !needle || `${x.subject} ${x.body} ${x.from.name} ${x.from.email} ${x.to.join(" ")}`.toLowerCase().includes(needle))
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [msgs, mailbox, folder, q]);

  const open = openId ? msgs.find((x) => x.id === openId && x.mailbox === mailbox) ?? null : null;
  const outgoing = folder === "sent" || folder === "drafts";

  const go = (mb: MailboxAddress, f: FolderId) => { setMailbox(mb); setFolder(f); setOpenId(null); setChecked(new Set()); setQ(""); };
  const show = (x: MailMessage) => { setOpenId(x.id); if (x.unread) setMsgs((l) => patch(l, new Set([x.id]), { unread: false })); };
  const toggleStar = (id: string) => setMsgs((l) => l.map((x) => (x.id === id ? { ...x, starred: !x.starred } : x)));
  const toggleCheck = (id: string) => setChecked((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  const remove = (ids: Set<string>) => {
    const permanent = folder === "trash";
    setMsgs((l) => trash(l, ids));
    if (openId && ids.has(openId)) setOpenId(null);
    setChecked(new Set());
    toast(permanent ? "Deleted permanently" : `Moved ${ids.size} to Trash`, "info");
  };
  const bulk = (change: Partial<MailMessage>, text: string) => { setMsgs((l) => patch(l, checked, change)); setChecked(new Set()); toast(text, "info"); };

  const compose = (init?: Partial<Draft>) => setDraft({ from: mailbox, to: "", cc: "", subject: "", body: "", track: true, ...init });
  const reply = (x: MailMessage) => compose({ to: x.folder === "sent" ? x.to.join(", ") : x.from.email, subject: /^re:/i.test(x.subject) ? x.subject : `Re: ${x.subject}`, body: quote(x) });
  const forward = (x: MailMessage) => compose({ subject: /^fwd:/i.test(x.subject) ? x.subject : `Fwd: ${x.subject}`, body: quote(x) });

  const build = (d: Draft, target: "sent" | "drafts"): MailMessage => ({
    id: `new-${Date.now()}`, mailbox: d.from, folder: target, from: { name: MAILBOXES.find((b) => b.address === d.from)?.label ?? d.from, email: d.from },
    to: splitAddrs(d.to), cc: splitAddrs(d.cc), subject: d.subject.trim() || "(no subject)", date: new Date().toISOString(), body: d.body,
    unread: false, starred: false, hasAttachment: false, ...(target === "sent" && d.track ? { tracking: { opened: 0, clicks: 0 } } : {}),
  });
  const saveDraft = () => { if (!draft) return; setMsgs((l) => [build(draft, "drafts"), ...l]); setDraft(null); toast("Draft saved"); };
  const send = () => {
    if (!draft) return;
    if (!splitAddrs(draft.to).some((a) => EMAIL_RE.test(a))) { toast("Add at least one valid recipient in To", "warn"); return; }
    setMsgs((l) => [build(draft, "sent"), ...l]);
    setDraft(null);
    toast("Message sent (preview only)");
  };

  const rail = (
    <div className="flex flex-col gap-4 p-3">
      <button type="button" aria-label="Compose a new message" onClick={() => compose()} className="flex items-center justify-center gap-2 rounded-lg bg-accent px-3 py-2.5 text-sm font-medium text-white hover:opacity-90"><MailPlus size={16} />Compose</button>
      <div className="flex flex-col gap-1">
        {MAILBOXES.map((b) => {
          const n = unreadIn(b.address, "inbox");
          const on = b.address === mailbox;
          return (
            <button key={b.address} type="button" aria-label={`Open mailbox ${b.address}`} aria-pressed={on} onClick={() => go(b.address, "inbox")} className={`flex items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm ${on ? "bg-accent-soft font-medium text-accent" : "hover:bg-subtle"}`}>
              <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${b.dot}`} />
              <span className="min-w-0 flex-1 truncate">{b.address}</span>
              {n > 0 ? <span className="rounded-full bg-accent px-1.5 text-xs text-white">{n}</span> : null}
            </button>
          );
        })}
      </div>
      <div className="flex flex-col gap-0.5 border-t border-line pt-3">
        {FOLDERS.map(({ id, icon: Icon }) => {
          const n = id === "sent" || id === "drafts" || id === "trash" || id === "starred" ? 0 : unreadIn(mailbox, id);
          const on = id === folder;
          return (
            <button key={id} type="button" aria-label={`Open folder ${folderLabel(id)}`} aria-pressed={on} onClick={() => go(mailbox, id)} className={`flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-sm ${on ? "bg-accent-soft font-medium text-accent" : "text-muted hover:bg-subtle hover:text-fg"}`}>
              <Icon size={16} className="shrink-0" />
              <span className="flex-1 truncate text-left">{folderLabel(id)}</span>
              {n > 0 ? <span className="text-xs font-semibold">{n}</span> : null}
            </button>
          );
        })}
      </div>
    </div>
  );

  const detail = open ? (
    <div className="flex h-full flex-col">
      <div className="flex flex-wrap items-center gap-1 border-b border-line px-3 py-2">
        <button type="button" aria-label="Back to list" onClick={() => setOpenId(null)} className="mr-1 flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm hover:bg-subtle lg:hidden"><ArrowLeft size={16} />Back</button>
        <button type="button" aria-label="Reply" onClick={() => reply(open)} className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm hover:bg-subtle"><Reply size={15} />Reply</button>
        <button type="button" aria-label="Forward" onClick={() => forward(open)} className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm hover:bg-subtle"><Forward size={15} />Forward</button>
        <button type="button" aria-label={open.starred ? "Remove star" : "Star message"} onClick={() => toggleStar(open.id)} className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm hover:bg-subtle"><Star size={15} className={open.starred ? "fill-warn text-warn" : ""} />{open.starred ? "Starred" : "Star"}</button>
        <button type="button" aria-label="Mark as unread" onClick={() => { setMsgs((l) => patch(l, new Set([open.id]), { unread: true })); setOpenId(null); }} className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm hover:bg-subtle"><Mail size={15} />Mark unread</button>
        <button type="button" aria-label="Delete message" onClick={() => remove(new Set([open.id]))} className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm text-bad hover:bg-bad/10"><Trash2 size={15} />Delete</button>
      </div>
      <div className="flex-1 overflow-y-auto p-5">
        <h2 className="text-lg font-semibold">{open.subject}</h2>
        <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
          <dt className="text-muted">From</dt><dd>{open.from.name} <span className="text-muted">&lt;{open.from.email}&gt;</span></dd>
          <dt className="text-muted">To</dt><dd className="break-all">{open.to.join(", ") || "—"}</dd>
          {open.cc.length ? <><dt className="text-muted">Cc</dt><dd className="break-all">{open.cc.join(", ")}</dd></> : null}
          <dt className="text-muted">Date</dt><dd>{fullDate(open.date)}</dd>
        </dl>
        {open.tracking ? (
          <div className="mt-4 rounded-xl border border-line bg-subtle p-3 text-sm">
            <div className="mb-2 font-medium">Tracking</div>
            <div className="grid grid-cols-3 gap-3">
              <div><div className={`text-lg font-semibold ${open.tracking.opened ? "text-ok" : "text-muted"}`}>{open.tracking.opened}</div><div className="text-xs text-muted">Times opened</div></div>
              <div><div className="text-sm font-medium">{open.tracking.lastOpenedAt ? fullDate(open.tracking.lastOpenedAt) : "Not opened yet"}</div><div className="text-xs text-muted">Last opened</div></div>
              <div><div className="text-lg font-semibold">{open.tracking.clicks}</div><div className="text-xs text-muted">Link clicks</div></div>
            </div>
          </div>
        ) : null}
        {open.hasAttachment ? <div className="mt-4 inline-flex items-center gap-2 rounded-lg border border-line px-3 py-1.5 text-sm"><Paperclip size={14} />Attachment (preview only)</div> : null}
        <div className="mt-5 space-y-3 text-sm leading-relaxed">
          {open.body.split(/\n{2,}/).map((p, i) => <p key={i} className="whitespace-pre-line">{p}</p>)}
        </div>
      </div>
    </div>
  ) : (
    <div className="flex h-full flex-col items-center justify-center gap-2 text-muted"><MailOpen size={40} strokeWidth={1.3} /><p className="text-sm">Select a message to read it</p></div>
  );

  return (
    <div className="flex h-[calc(100vh-7.5rem)] min-h-[560px] overflow-hidden rounded-xl border border-line bg-panel shadow-card">
      <aside className="hidden w-60 shrink-0 overflow-y-auto border-r border-line lg:block">{rail}</aside>

      <section className={`min-w-0 flex-1 flex-col border-line lg:flex lg:max-w-[28rem] lg:border-r xl:max-w-[34rem] ${open ? "hidden" : "flex"}`}>
        <div className="flex flex-col gap-2 border-b border-line p-3 lg:hidden">
          <div className="flex gap-2">
            <select aria-label="Mailbox" value={mailbox} onChange={(e) => go(e.target.value as MailboxAddress, folder)} className={field}>
              {MAILBOXES.map((b) => <option key={b.address} value={b.address}>{b.address}</option>)}
            </select>
            <select aria-label="Folder" value={folder} onChange={(e) => go(mailbox, e.target.value as FolderId)} className={field}>
              {FOLDERS.map((f) => <option key={f.id} value={f.id}>{folderLabel(f.id)}</option>)}
            </select>
          </div>
          <button type="button" aria-label="Compose a new message" onClick={() => compose()} className="flex items-center justify-center gap-2 rounded-lg bg-accent px-3 py-2 text-sm font-medium text-white"><MailPlus size={16} />Compose</button>
        </div>
        <div className="flex items-center gap-2 border-b border-line p-3">
          <input aria-label="Search mail" value={q} onChange={(e) => setQ(e.target.value)} placeholder={`Search ${folderLabel(folder)}`} className={field} />
        </div>
        {checked.size > 0 ? (
          <div className="flex flex-wrap items-center gap-1 border-b border-line bg-accent-soft px-3 py-1.5 text-sm text-accent">
            <span className="mr-2 font-medium">{checked.size} selected</span>
            <button type="button" aria-label="Mark selected as read" onClick={() => bulk({ unread: false }, "Marked as read")} className="rounded-md px-2 py-1 hover:bg-panel">Read</button>
            <button type="button" aria-label="Mark selected as unread" onClick={() => bulk({ unread: true }, "Marked as unread")} className="rounded-md px-2 py-1 hover:bg-panel">Unread</button>
            <button type="button" aria-label="Star selected" onClick={() => bulk({ starred: true }, "Starred")} className="rounded-md px-2 py-1 hover:bg-panel">Star</button>
            <button type="button" aria-label="Archive selected to Trash" onClick={() => remove(checked)} className="rounded-md px-2 py-1 hover:bg-panel">Archive</button>
            <button type="button" aria-label="Delete selected" onClick={() => remove(checked)} className="rounded-md px-2 py-1 text-bad hover:bg-panel">Delete</button>
          </div>
        ) : null}
        <ul className="flex-1 overflow-y-auto">
          {list.length === 0 ? <li className="p-8 text-center text-sm text-muted">No messages here</li> : null}
          {list.map((x) => {
            const who = outgoing ? `To: ${x.to.join(", ") || "(no recipient)"}` : x.from.name;
            const snippet = x.body.replace(/\s+/g, " ").slice(0, 90);
            return (
              <li key={x.id} className={`border-b border-line ${openId === x.id ? "bg-accent-soft" : x.unread ? "bg-panel" : "bg-subtle/40"}`}>
                <div className="flex items-start gap-2 px-3 py-2.5">
                  <input type="checkbox" aria-label={`Select message ${x.subject}`} checked={checked.has(x.id)} onChange={() => toggleCheck(x.id)} className="mt-1 shrink-0" />
                  <button type="button" aria-label={x.starred ? "Remove star" : "Star message"} onClick={() => toggleStar(x.id)} className="mt-0.5 shrink-0"><Star size={15} className={x.starred ? "fill-warn text-warn" : "text-muted"} /></button>
                  <button type="button" aria-label={`Open message ${x.subject}`} onClick={() => show(x)} className="min-w-0 flex-1 text-left">
                    <span className="flex items-center gap-2">
                      {x.unread ? <span className="h-2 w-2 shrink-0 rounded-full bg-accent" /> : null}
                      <span className={`min-w-0 flex-1 truncate text-sm ${x.unread ? "font-semibold" : ""}`}>{who}</span>
                      {x.hasAttachment ? <Paperclip size={13} className="shrink-0 text-muted" /> : null}
                      <span className="shrink-0 text-xs text-muted">{relDate(x.date)}</span>
                    </span>
                    <span className={`block truncate text-sm ${x.unread ? "font-semibold" : ""}`}>{x.subject}</span>
                    <span className="block truncate text-xs text-muted">{snippet}</span>
                    {x.tracking ? <span className="mt-1 block"><TrackingBadge x={x} /></span> : null}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      <section className={`min-w-0 flex-[1.4] lg:block ${open ? "block" : "hidden"}`}>{detail}</section>

      {draft ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center" role="dialog" aria-modal="true" aria-label="Compose message" onKeyDown={(e) => { if (e.key === "Escape") setDraft(null); }}>
          <div className="flex max-h-full w-full max-w-2xl flex-col rounded-xl border border-line bg-panel shadow-card">
            <div className="flex items-center justify-between border-b border-line px-4 py-3">
              <h3 className="font-semibold">New message</h3>
              <button type="button" aria-label="Close composer" onClick={() => setDraft(null)} className="rounded-lg p-1 text-muted hover:bg-subtle hover:text-fg"><X size={18} /></button>
            </div>
            <div className="flex flex-col gap-3 overflow-y-auto p-4 text-sm">
              <label className="flex flex-col gap-1"><span className="text-muted">From</span>
                <select autoFocus value={draft.from} onChange={(e) => setDraft({ ...draft, from: e.target.value as MailboxAddress })} className={field}>
                  {MAILBOXES.map((b) => <option key={b.address} value={b.address}>{b.address}</option>)}
                </select></label>
              <label className="flex flex-col gap-1"><span className="text-muted">To (comma separated)</span><input value={draft.to} onChange={(e) => setDraft({ ...draft, to: e.target.value })} className={field} /></label>
              <label className="flex flex-col gap-1"><span className="text-muted">Cc</span><input value={draft.cc} onChange={(e) => setDraft({ ...draft, cc: e.target.value })} className={field} /></label>
              <label className="flex flex-col gap-1"><span className="text-muted">Subject</span><input value={draft.subject} onChange={(e) => setDraft({ ...draft, subject: e.target.value })} className={field} /></label>
              <label className="flex flex-col gap-1"><span className="text-muted">Message</span><textarea rows={10} value={draft.body} onChange={(e) => setDraft({ ...draft, body: e.target.value })} className={`${field} resize-y`} /></label>
              <label className="flex items-center gap-2"><input type="checkbox" checked={draft.track} onChange={(e) => setDraft({ ...draft, track: e.target.checked })} />Track opens and link clicks</label>
            </div>
            <div className="flex justify-end gap-2 border-t border-line px-4 py-3">
              <button type="button" onClick={saveDraft} className="rounded-lg border border-line px-3 py-2 text-sm hover:bg-subtle">Save draft</button>
              <button type="button" onClick={send} className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:opacity-90"><Send size={15} />Send</button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
