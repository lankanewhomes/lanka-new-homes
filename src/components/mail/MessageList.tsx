"use client";

import { Archive, Mail, MailOpen, Paperclip, Star, Trash2 } from "lucide-react";
import { useEffect, useRef } from "react";
import type { Account, MailAction, MailMessage } from "./types";
import { listDate, nameOf } from "./utils";

export function MessageList({ messages, loading, hasMore, accounts, showTag, selected, activeId, onToggle, onOpen, onAction, onDelete, onLoadMore }: {
  messages: MailMessage[];
  loading: boolean;
  hasMore: boolean;
  accounts: Account[];
  showTag: boolean;
  selected: Set<number>;
  activeId: number | null;
  onToggle: (id: number) => void;
  onOpen: (m: MailMessage) => void;
  onAction: (ids: number[], action: MailAction) => void;
  onDelete: (ids: number[]) => void;
  onLoadMore: () => void;
}) {
  const sentinel = useRef<HTMLDivElement>(null);

  // Infinite scroll: load the next page when the bottom of the list comes into view.
  useEffect(() => {
    const el = sentinel.current;
    if (!el || !hasMore || loading) return;
    const io = new IntersectionObserver((entries) => { if (entries[0]?.isIntersecting) onLoadMore(); }, { rootMargin: "300px" });
    io.observe(el);
    return () => io.disconnect();
  }, [hasMore, loading, onLoadMore, messages.length]);

  if (loading && !messages.length) {
    return (
      <div aria-busy="true" aria-label="Loading messages">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="lnh-mail-skel"><i style={{ width: 18 }} /><i style={{ width: 150 }} /><i style={{ flex: 1, maxWidth: 520 }} /><i style={{ width: 54 }} /></div>
        ))}
      </div>
    );
  }
  if (!messages.length) {
    return (
      <div className="lnh-mail-empty">
        <Mail size={44} strokeWidth={1.2} />
        <strong>Nothing here</strong>
        <span>No messages match this view.</span>
      </div>
    );
  }

  return (
    <div role="list">
      {messages.map((m) => {
        const acct = accounts.find((a) => a.id === m.accountId);
        const sentLike = m.folderType === "sent" || m.folderType === "drafts";
        const who = sentLike ? `To: ${m.to.map(nameOf).join(", ") || "(no recipient)"}` : nameOf(m.from);
        return (
          <div
            key={m.id}
            role="listitem"
            className={`lnh-mail-row${m.isRead ? "" : " is-unread"}${selected.has(m.id) ? " is-selected" : ""}${activeId === m.id ? " is-selected" : ""}`}
            onClick={() => onOpen(m)}
          >
            <input type="checkbox" className="lnh-mail-check" checked={selected.has(m.id)} onClick={(e) => e.stopPropagation()} onChange={() => onToggle(m.id)} aria-label="Select message" />
            <button type="button" className={`lnh-mail-star${m.isStarred ? " on" : ""}`} aria-label={m.isStarred ? "Unstar" : "Star"} onClick={(e) => { e.stopPropagation(); onAction([m.id], { type: m.isStarred ? "unstar" : "star" }); }}>
              <Star size={17} fill={m.isStarred ? "currentColor" : "none"} />
            </button>
            <span className="from">{m.folderType === "drafts" ? <span style={{ color: "#dc2626" }}>Draft</span> : who}</span>
            <span className="body">
              {showTag && acct ? <span className="lnh-mail-tag" style={{ background: acct.color }}>{acct.email.split("@")[0]}</span> : null}
              <span className="subj">{m.subject}</span>
              <span className="snip">– {m.snippet}</span>
            </span>
            {m.hasAttachments ? <Paperclip size={15} style={{ color: "var(--m-muted)" }} /> : null}
            <span className="date">{listDate(m.receivedAt)}</span>
            <span className="hover" onClick={(e) => e.stopPropagation()}>
              <button type="button" className="lnh-mail-iconbtn" title="Archive" aria-label="Archive" onClick={() => onAction([m.id], { type: "archive" })}><Archive size={16} /></button>
              <button type="button" className="lnh-mail-iconbtn" title="Delete" aria-label="Delete" onClick={() => onDelete([m.id])}><Trash2 size={16} /></button>
              <button type="button" className="lnh-mail-iconbtn" title={m.isRead ? "Mark as unread" : "Mark as read"} aria-label="Toggle read" onClick={() => onAction([m.id], { type: m.isRead ? "markUnread" : "markRead" })}>
                {m.isRead ? <Mail size={16} /> : <MailOpen size={16} />}
              </button>
            </span>
          </div>
        );
      })}
      <div ref={sentinel} style={{ height: 1 }} />
      {loading ? <div className="lnh-mail-skel"><i style={{ width: 18 }} /><i style={{ width: 150 }} /><i style={{ flex: 1, maxWidth: 520 }} /></div> : null}
    </div>
  );
}
