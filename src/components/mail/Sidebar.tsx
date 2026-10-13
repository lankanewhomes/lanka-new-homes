"use client";

import { Archive, ChevronDown, ChevronRight, File, Folder as FolderIcon, Inbox, Layers, Mail, OctagonAlert, Pencil, Send, Star, Trash2 } from "lucide-react";
import { useState } from "react";
import type { Account, Folder, FolderType, View } from "./types";

const ICONS: Record<FolderType, React.ComponentType<{ size?: number }>> = { inbox: Inbox, sent: Send, drafts: File, spam: OctagonAlert, trash: Trash2, archive: Archive, custom: FolderIcon };
const ORDER: FolderType[] = ["inbox", "sent", "drafts", "archive", "spam", "trash", "custom"];

export function Sidebar({ accounts, view, onView, onCompose }: { accounts: Account[]; view: View; onView: (v: View) => void; onCompose: () => void }) {
  const [closed, setClosed] = useState<Record<number, boolean>>({});
  const allInboxUnread = accounts.reduce((n, a) => n + (a.folders.find((f) => f.type === "inbox")?.unread ?? 0), 0);
  const isOn = (v: View) => JSON.stringify(v) === JSON.stringify(view);

  const folderRow = (a: Account, f: Folder) => {
    const Icon = ICONS[f.type] ?? Mail;
    const v: View = { kind: "folder", accountId: a.id, folderId: f.id };
    // Gmail shows unread counts for Inbox/Spam and the total for Drafts.
    const count = f.type === "drafts" ? f.total : f.type === "trash" || f.type === "sent" || f.type === "archive" ? 0 : f.unread;
    return (
      <button key={f.id} type="button" className={`lnh-mail-nav${isOn(v) ? " is-on" : ""}`} onClick={() => onView(v)}>
        <Icon size={16} />
        <span className="grow">{f.name}</span>
        {count > 0 ? <span className="count">{count.toLocaleString()}</span> : null}
      </button>
    );
  };

  return (
    <nav className="lnh-mail-side" aria-label="Mail folders">
      <button type="button" className="lnh-mail-compose" onClick={onCompose}><Pencil size={18} /> Compose</button>
      <button type="button" className={`lnh-mail-nav${isOn({ kind: "all-inbox" }) ? " is-on" : ""}`} onClick={() => onView({ kind: "all-inbox" })}>
        <Layers size={16} /><span className="grow">All inboxes</span>{allInboxUnread > 0 ? <span className="count">{allInboxUnread.toLocaleString()}</span> : null}
      </button>
      <button type="button" className={`lnh-mail-nav${isOn({ kind: "starred" }) ? " is-on" : ""}`} onClick={() => onView({ kind: "starred" })}>
        <Star size={16} /><span className="grow">Starred</span>
      </button>
      {accounts.map((a) => {
        const folders = [...a.folders].sort((x, y) => ORDER.indexOf(x.type) - ORDER.indexOf(y.type) || x.name.localeCompare(y.name));
        const shut = closed[a.id];
        return (
          <div key={a.id}>
            <button type="button" className="lnh-mail-acct" onClick={() => setClosed({ ...closed, [a.id]: !shut })} title={a.email}>
              {shut ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
              <span className="lnh-mail-dot" style={{ background: a.color }} />
              <span className="grow" style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis" }}>{a.email}</span>
            </button>
            {shut ? null : (
              <>
                {folders.filter((f) => f.type === "inbox").map((f) => folderRow(a, f))}
                <button type="button" className={`lnh-mail-nav${isOn({ kind: "starred", accountId: a.id }) ? " is-on" : ""}`} onClick={() => onView({ kind: "starred", accountId: a.id })}>
                  <Star size={16} /><span className="grow">Starred</span>
                </button>
                {folders.filter((f) => f.type !== "inbox").map((f) => folderRow(a, f))}
              </>
            )}
          </div>
        );
      })}
    </nav>
  );
}
