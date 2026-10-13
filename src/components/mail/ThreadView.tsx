"use client";

import { Archive, ArrowLeft, ChevronLeft, ChevronRight, Download, File as FileIcon, Forward, Mail, OctagonAlert, Reply, ReplyAll, Star, Trash2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { mailApi } from "./api";
import { HtmlBody } from "./HtmlBody";
import type { Account, MailAction, MailMessage } from "./types";
import { colorFor, fileSize, fullDate, initials, nameOf } from "./utils";

// Conversation view: every message of the thread (oldest first), older ones collapsed, full sanitised bodies, attachment chips,
// Reply / Reply all / Forward, plus a small card when the sender is also a lead, developer or user in the CMS.

export function ThreadView({ message, accounts, onBack, onAction, onDelete, onReply, onPrev, onNext, toast }: {
  message: MailMessage;
  accounts: Account[];
  onBack: () => void;
  onAction: (ids: number[], action: MailAction) => void;
  onDelete: (ids: number[]) => void;
  onReply: (mode: "reply" | "replyAll" | "forward", msg: MailMessage) => void;
  onPrev: (() => void) | null;
  onNext: (() => void) | null;
  toast: (m: string, k?: "ok" | "err") => void;
}) {
  const account = accounts.find((a) => a.id === message.accountId);
  const [thread, setThread] = useState<MailMessage[]>([message]);
  const [bodies, setBodies] = useState<Record<number, MailMessage>>({});
  const [expanded, setExpanded] = useState<Set<number>>(new Set([message.id]));
  const [match, setMatch] = useState<{ kind: string; label: string; href: string }[]>([]);
  const requested = useRef<Set<number>>(new Set());

  // Load the thread once per opened message (the parent re-mounts this view with key={message.id}).
  useEffect(() => {
    let alive = true;
    if (message.threadId) {
      mailApi.messages({ threadId: message.threadId, accountId: message.accountId, limit: 100 })
        .then((r) => {
          if (!alive || !r.messages.length) return;
          setThread(r.messages);
          // Open the message you clicked, plus anything unread, plus the newest.
          setExpanded(new Set([message.id, r.messages[r.messages.length - 1].id, ...r.messages.filter((m) => !m.isRead).map((m) => m.id)]));
        })
        .catch(() => undefined);
    }
    mailApi.contact(message.from.email).then((r) => alive && setMatch(r.matches)).catch(() => alive && setMatch([]));
    return () => { alive = false; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch the body of every expanded message that has not been loaded yet.
  useEffect(() => {
    for (const id of expanded) {
      if (requested.current.has(id)) continue;
      requested.current.add(id);
      mailApi.message(id)
        .then((r) => setBodies((b) => ({ ...b, [id]: r.message })))
        .catch((e) => { requested.current.delete(id); toast(e instanceof Error ? e.message : "Could not load the message.", "err"); });
    }
  }, [expanded]); // eslint-disable-line react-hooks/exhaustive-deps

  const subject = useMemo(() => thread[thread.length - 1]?.subject || message.subject, [thread, message.subject]);
  const moveTargets = account?.folders.filter((f) => f.id !== message.folderId && f.type !== "drafts") ?? [];

  return (
    <>
      <div className="lnh-mail-toolbar">
        <button type="button" className="lnh-mail-iconbtn" title="Back to list" aria-label="Back" onClick={onBack}><ArrowLeft size={18} /></button>
        <button type="button" className="lnh-mail-iconbtn" title="Archive (e)" aria-label="Archive" onClick={() => onAction([message.id], { type: "archive" })}><Archive size={18} /></button>
        <button type="button" className="lnh-mail-iconbtn" title="Report spam" aria-label="Spam" onClick={() => onAction([message.id], { type: "spam" })}><OctagonAlert size={18} /></button>
        <button type="button" className="lnh-mail-iconbtn" title="Delete (#)" aria-label="Delete" onClick={() => onDelete([message.id])}><Trash2 size={18} /></button>
        <button type="button" className="lnh-mail-iconbtn" title="Mark as unread" aria-label="Mark unread" onClick={() => { onAction([message.id], { type: "markUnread" }); onBack(); }}><Mail size={18} /></button>
        <select aria-label="Move to" value="" onChange={(e) => { if (e.target.value) { onAction([message.id], { type: "move", destFolderId: e.target.value }); onBack(); } }} style={{ height: 32, border: "1px solid var(--m-line)", borderRadius: 16, padding: "0 10px", background: "var(--m-bg)", marginLeft: 6 }}>
          <option value="">Move to…</option>
          {moveTargets.map((f) => <option key={f.id} value={f.zohoFolderId}>{f.name}</option>)}
        </select>
        <span className="sp" />
        <button type="button" className="lnh-mail-iconbtn" title="Newer (k)" aria-label="Newer" disabled={!onPrev} onClick={() => onPrev?.()}><ChevronLeft size={18} /></button>
        <button type="button" className="lnh-mail-iconbtn" title="Older (j)" aria-label="Older" disabled={!onNext} onClick={() => onNext?.()}><ChevronRight size={18} /></button>
      </div>
      <div className="lnh-mail-reader">
        <h1 className="lnh-mail-subject">
          {subject}
          <button type="button" className="lnh-mail-star" style={{ color: message.isStarred ? "#f59e0b" : undefined }} aria-label="Star" onClick={() => onAction([message.id], { type: message.isStarred ? "unstar" : "star" })}><Star size={18} fill={message.isStarred ? "currentColor" : "none"} /></button>
          {account ? <span className="lnh-mail-tag" style={{ background: account.color, fontSize: 12 }}>{account.email}</span> : null}
        </h1>
        {match.length ? (
          <div className="lnh-mail-card">
            <strong>Also in your CMS:</strong>
            {match.map((m) => <span key={m.href}>{m.kind}: <Link href={m.href}>{m.label}</Link></span>)}
          </div>
        ) : null}

        {thread.map((m) => {
          const open = expanded.has(m.id);
          const full = bodies[m.id];
          const toggle = () => setExpanded((s) => { const n = new Set(s); if (n.has(m.id)) n.delete(m.id); else n.add(m.id); return n; });
          return (
            <article key={m.id} className={`lnh-mail-msg${open ? "" : " is-collapsed"}`} onClick={open ? undefined : toggle}>
              <div className="lnh-mail-msghead" onClick={open ? toggle : undefined} style={open ? { cursor: "pointer" } : undefined}>
                <span className="lnh-mail-avatar" style={{ background: colorFor(m.from.email) }}>{initials(m.from)}</span>
                <div className="lnh-mail-who">
                  <b>{nameOf(m.from)}</b> <small style={{ display: "inline" }}>&lt;{m.from.email}&gt;</small>
                  <small>{open ? `to ${m.to.map(nameOf).join(", ") || "(no recipient)"}${m.cc.length ? `, cc ${m.cc.map(nameOf).join(", ")}` : ""}` : m.snippet}</small>
                </div>
                <small style={{ color: "var(--m-muted)", whiteSpace: "nowrap" }}>{fullDate(m.receivedAt)}</small>
                {open ? (
                  <button type="button" className="lnh-mail-iconbtn" title="Reply" aria-label="Reply" onClick={(e) => { e.stopPropagation(); onReply("reply", full ?? m); }}><Reply size={17} /></button>
                ) : null}
              </div>
              {open ? (
                <div className="lnh-mail-msgbody">
                  {full ? (
                    <>
                      <HtmlBody html={full.htmlBody ?? ""} />
                      {full.attachments?.length ? (
                        <div className="lnh-mail-files">
                          {full.attachments.map((a) => (
                            <a key={a.id} className="lnh-mail-file" href={mailApi.attachmentUrl(full.id, a.id)} download={a.filename}>
                              <FileIcon size={16} /> <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.filename}</span> <small>{fileSize(a.size)}</small> <Download size={14} />
                            </a>
                          ))}
                        </div>
                      ) : null}
                    </>
                  ) : (
                    <div className="lnh-mail-skel" style={{ border: 0 }}><i style={{ width: "70%" }} /></div>
                  )}
                </div>
              ) : null}
            </article>
          );
        })}

        <div className="lnh-mail-replybar">
          <button type="button" className="lnh-mail-btn" onClick={() => onReply("reply", bodies[thread[thread.length - 1].id] ?? thread[thread.length - 1])}><Reply size={16} /> Reply</button>
          <button type="button" className="lnh-mail-btn" onClick={() => onReply("replyAll", bodies[thread[thread.length - 1].id] ?? thread[thread.length - 1])}><ReplyAll size={16} /> Reply all</button>
          <button type="button" className="lnh-mail-btn" onClick={() => onReply("forward", bodies[thread[thread.length - 1].id] ?? thread[thread.length - 1])}><Forward size={16} /> Forward</button>
        </div>
      </div>
    </>
  );
}
