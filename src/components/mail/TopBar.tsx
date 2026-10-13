"use client";

import { Menu, RefreshCw, Search, SlidersHorizontal, X } from "lucide-react";
import { useState } from "react";
import { EMPTY_FILTERS, type Account, type Filters } from "./types";

export function TopBar({ accounts, scope, onScope, filters, onFilters, onRefresh, refreshing, onMenu }: {
  accounts: Account[];
  scope: number | null;
  onScope: (id: number | null) => void;
  filters: Filters;
  onFilters: (f: Filters) => void;
  onRefresh: () => void;
  refreshing: boolean;
  onMenu: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Filters>(filters);
  const active = JSON.stringify({ ...filters, q: "" }) !== JSON.stringify({ ...EMPTY_FILTERS });
  const set = <K extends keyof Filters>(k: K, v: Filters[K]) => setDraft((d) => ({ ...d, [k]: v }));
  const apply = (next: Filters) => { onFilters(next); setOpen(false); };

  return (
    <header className="lnh-mail-top">
      <button type="button" className="lnh-mail-iconbtn lnh-mail-burger" aria-label="Menu" onClick={onMenu}><Menu size={20} /></button>
      <div className="lnh-mail-title"><span>Mail</span></div>
      <div className="lnh-mail-search">
        <div>
          <Search size={18} />
          <input
            id="lnh-mail-search-input"
            placeholder="Search all mail"
            value={draft.q}
            onChange={(e) => set("q", e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") apply(draft); if (e.key === "Escape") setOpen(false); }}
            aria-label="Search mail"
          />
          {draft.q || active ? <button type="button" className="lnh-mail-iconbtn" aria-label="Clear search" onClick={() => { setDraft(EMPTY_FILTERS); apply(EMPTY_FILTERS); }}><X size={16} /></button> : null}
          <button type="button" className="lnh-mail-iconbtn" aria-label="Search filters" aria-expanded={open} onClick={() => { setDraft(filters); setOpen(!open); }} style={active ? { color: "#2563eb" } : undefined}><SlidersHorizontal size={17} /></button>
        </div>
        {open ? (
          <div className="lnh-mail-pop" role="dialog" aria-label="Search filters">
            <label>From<input type="text" value={draft.from} onChange={(e) => set("from", e.target.value)} /></label>
            <label>To<input type="text" value={draft.to} onChange={(e) => set("to", e.target.value)} /></label>
            <label>Subject<input type="text" value={draft.subject} onChange={(e) => set("subject", e.target.value)} /></label>
            <label>Mailbox
              <select value={draft.accountId ?? ""} onChange={(e) => set("accountId", e.target.value ? Number(e.target.value) : null)}>
                <option value="">All mailboxes</option>
                {accounts.map((a) => <option key={a.id} value={a.id}>{a.email}</option>)}
              </select>
            </label>
            <label>Date from<input type="date" value={draft.dateFrom} onChange={(e) => set("dateFrom", e.target.value)} /></label>
            <label>Date to<input type="date" value={draft.dateTo} onChange={(e) => set("dateTo", e.target.value)} /></label>
            <div className="full">
              <span style={{ display: "flex", gap: 16 }}>
                <label className="lnh-mail-chk"><input type="checkbox" checked={draft.hasAttachment} onChange={(e) => set("hasAttachment", e.target.checked)} /> Has attachment</label>
                <label className="lnh-mail-chk"><input type="checkbox" checked={draft.unread} onChange={(e) => set("unread", e.target.checked)} /> Unread only</label>
              </span>
              <span style={{ display: "flex", gap: 8 }}>
                <button type="button" className="lnh-mail-btn" onClick={() => { setDraft(EMPTY_FILTERS); apply(EMPTY_FILTERS); }}>Reset</button>
                <button type="button" className="lnh-mail-btn primary" onClick={() => apply(draft)}>Search</button>
              </span>
            </div>
          </div>
        ) : null}
      </div>
      <select className="lnh-mail-scope" aria-label="Mailbox" value={scope ?? ""} onChange={(e) => onScope(e.target.value ? Number(e.target.value) : null)} title="Show one mailbox or all three">
        <option value="">All mailboxes</option>
        {accounts.map((a) => <option key={a.id} value={a.id}>{a.email}</option>)}
      </select>
      <button type="button" className="lnh-mail-iconbtn" title="Refresh (sync with Zoho)" aria-label="Refresh" onClick={onRefresh}><RefreshCw size={18} className={refreshing ? "lnh-spin" : ""} style={refreshing ? { animation: "lnh-spin 0.9s linear infinite" } : undefined} /></button>
      <style>{`@keyframes lnh-spin{to{transform:rotate(360deg)}}`}</style>
    </header>
  );
}
