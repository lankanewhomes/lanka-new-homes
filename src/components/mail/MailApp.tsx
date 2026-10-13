"use client";

import "./mail.css";
import { Archive, MailOpen, Mail as MailIcon, OctagonAlert, Trash2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { mailApi } from "./api";
import { ComposeWindow } from "./Compose";
import { sanitizeEmailHtml } from "./HtmlBody";
import { MessageList } from "./MessageList";
import { Sidebar } from "./Sidebar";
import { ThreadView } from "./ThreadView";
import { TopBar } from "./TopBar";
import { EMPTY_FILTERS, type Account, type ComposeInit, type Filters, type MailAction, type MailAddress, type MailMessage, type View } from "./types";
import { escapeHtml, fullDate, label } from "./utils";

// The Gmail-style inbox at /cms/mail. All data comes from /api/mail/* (admin only); nothing here talks to Zoho directly.

type Toast = { id: number; text: string; kind: "ok" | "err" };
type ComposeWin = { key: number; init: ComposeInit };

const PAGE = 50;
const isSearching = (f: Filters) => Boolean(f.q || f.from || f.to || f.subject || f.hasAttachment || f.unread || f.dateFrom || f.dateTo);

function replySubject(prefix: "Re" | "Fwd", subject: string) {
  return new RegExp(`^${prefix}:\\s`, "i").test(subject) ? subject : `${prefix}: ${subject}`;
}

function buildCompose(mode: "reply" | "replyAll" | "forward", msg: MailMessage, accounts: Account[]): ComposeInit {
  const account = accounts.find((a) => a.id === msg.accountId) ?? accounts[0];
  const mine = new Set(accounts.map((a) => a.email.toLowerCase()));
  const own = mine.has(msg.from.email.toLowerCase());
  const uniq = (list: MailAddress[]) => list.filter((a, i) => !mine.has(a.email.toLowerCase()) && list.findIndex((b) => b.email.toLowerCase() === a.email.toLowerCase()) === i);
  const body = sanitizeEmailHtml(msg.htmlBody || `<p>${escapeHtml(msg.snippet)}</p>`, false).html;
  const when = fullDate(msg.receivedAt);
  if (mode === "forward") {
    return {
      accountId: account.id, to: [], cc: [], bcc: [], subject: replySubject("Fwd", msg.subject), inReplyToId: msg.id, replyMode: "forward",
      quoteHtml: `<div class="gmail_quote"><br>---------- Forwarded message ---------<br>From: ${escapeHtml(label(msg.from))}<br>Date: ${escapeHtml(when)}<br>Subject: ${escapeHtml(msg.subject)}<br>To: ${escapeHtml(msg.to.map(label).join(", "))}<br><br>${body}</div>`,
    };
  }
  const to = own ? msg.to : [msg.from];
  const cc = mode === "replyAll" ? uniq([...(own ? [] : msg.to), ...msg.cc]).filter((a) => !to.some((t) => t.email.toLowerCase() === a.email.toLowerCase())) : [];
  return {
    accountId: account.id, to, cc, bcc: [], subject: replySubject("Re", msg.subject), inReplyToId: msg.id, replyMode: mode,
    quoteHtml: `<div class="gmail_quote"><br>On ${escapeHtml(when)}, ${escapeHtml(label(msg.from))} wrote:<blockquote>${body}</blockquote></div>`,
  };
}

export function MailApp() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [mock, setMock] = useState(false);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [booting, setBooting] = useState(true);
  const [view, setView] = useState<View>({ kind: "all-inbox" });
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [list, setList] = useState<MailMessage[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [open, setOpen] = useState<MailMessage | null>(null);
  const [composes, setComposes] = useState<ComposeWin[]>([]);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [importing, setImporting] = useState<{ imported: number; total: number } | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [kbd, setKbd] = useState(false);
  const [scope, setScope] = useState<number | null>(null);
  const scopeRef = useRef<number | null>(null);
  const req = useRef(0);
  const importRef = useRef<() => Promise<void>>(async () => undefined);
  const viewRef = useRef<View>(view);
  const filtersRef = useRef<Filters>(filters);
  const openRef = useRef<MailMessage | null>(open);
  useEffect(() => {
    viewRef.current = view;
    filtersRef.current = filters;
    openRef.current = open;
  });
  const composeKey = useRef(1);
  const importRunning = useRef(false);

  const toast = useCallback((text: string, kind: "ok" | "err" = "ok") => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, text, kind }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), kind === "err" ? 6000 : 3500);
  }, []);

  const loadAccounts = useCallback(async (refresh = false) => {
    const r = await mailApi.accounts(refresh);
    setAccounts(r.accounts);
    setMock(r.mock);
    setWarnings(r.warnings);
    return r;
  }, []);

  const queryParams = useCallback((v: View, f: Filters, p: number) => {
    const base: Record<string, string | number | boolean | null | undefined> = { page: p, limit: PAGE };
    if (isSearching(f)) {
      Object.assign(base, { q: f.q, from: f.from, to: f.to, subject: f.subject, hasAttachment: f.hasAttachment, unread: f.unread, dateFrom: f.dateFrom, dateTo: f.dateTo, accountId: f.accountId });
    } else if (v.kind === "folder") Object.assign(base, { folderId: v.folderId });
    else if (v.kind === "starred") Object.assign(base, { view: "starred", accountId: v.accountId ?? scopeRef.current });
    else Object.assign(base, { view: "all-inbox", accountId: scopeRef.current });
    if (isSearching(f) && !base.accountId && scopeRef.current) base.accountId = scopeRef.current;
    return base;
  }, []);

  const loadList = useCallback(async (v: View, f: Filters, p: number, replace: boolean) => {
    const id = ++req.current;
    setLoading(true);
    try {
      const r = await mailApi.messages(queryParams(v, f, p));
      if (id !== req.current) return;
      setList((cur) => (replace ? r.messages : [...cur, ...r.messages.filter((m) => !cur.some((c) => c.id === m.id))]));
      setHasMore(r.hasMore);
      setPage(p);
    } catch (error) {
      if (id === req.current) toast(error instanceof Error ? error.message : "Could not load messages.", "err");
    } finally {
      if (id === req.current) setLoading(false);
    }
  }, [queryParams, toast]);

  /** Switch view and/or search: clears the selection and the open message, then loads page 1. */
  const reset = useCallback((v: View, f: Filters) => {
    viewRef.current = v;
    filtersRef.current = f;
    setView(v);
    setFilters(f);
    setOpen(null);
    setSelected(new Set());
    setActive(0);
    void loadList(v, f, 1, true);
  }, [loadList]);

  // First load.
  useEffect(() => {
    void (async () => {
      try {
        const r = await loadAccounts();
        setBooting(false);
        reset({ kind: "all-inbox" }, EMPTY_FILTERS);
        if (r.pendingImport) void importRef.current();
      } catch (e) {
        setBooting(false);
        setLoading(false);
        toast(e instanceof Error ? e.message : "Could not load your mailboxes.", "err");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Resumable full import: keeps calling the import endpoint (each call imports a batch) until every folder is complete.
  const runImport = useCallback(async () => {
    if (importRunning.current) return;
    importRunning.current = true;
    try {
      for (let i = 0; i < 400; i += 1) {
        const status = await mailApi.status();
        const imported = status.sync.accounts.reduce((n, a) => n + a.imported, 0);
        const total = status.sync.accounts.reduce((n, a) => n + a.total, 0);
        setImporting({ imported, total });
        const r = await mailApi.importBatch();
        await loadAccounts();
        if (i % 2 === 0) void loadList(viewRef.current, filtersRef.current, 1, true);
        if (r.done) break;
      }
    } catch (error) {
      toast(error instanceof Error ? error.message : "The import stopped. It will continue next time.", "err");
    } finally {
      importRunning.current = false;
      setImporting(null);
      await loadAccounts().catch(() => undefined);
      void loadList(viewRef.current, filtersRef.current, 1, true);
    }
  }, [loadAccounts, loadList, toast]);
  useEffect(() => { importRef.current = runImport; });


  const refresh = useCallback(async (quiet = false) => {
    setRefreshing(true);
    try {
      await mailApi.sync();
      await loadAccounts();
      if (!openRef.current) await loadList(viewRef.current, filtersRef.current, 1, true);
      if (!quiet) toast("Mail is up to date.");
    } catch (error) {
      if (!quiet) toast(error instanceof Error ? error.message : "Could not sync with Zoho.", "err");
    } finally {
      setRefreshing(false);
    }
  }, [loadAccounts, loadList, toast]);

  // Pick up changes made in Zoho every 2 minutes.
  useEffect(() => {
    if (booting) return;
    const t = setInterval(() => { if (document.visibilityState === "visible") void refresh(true); }, 120_000);
    return () => clearInterval(t);
  }, [booting, refresh]);


  // ---- actions (Zoho first on the server; here we update the screen right away and undo it if the server refuses)
  const act = useCallback(async (ids: number[], action: MailAction) => {
    const before = list;
    const removing = action.type === "archive" || action.type === "spam" || action.type === "move";
    setList((cur) => cur
      .filter((m) => !(removing && ids.includes(m.id)))
      .map((m) => (ids.includes(m.id) ? { ...m, ...(action.type === "markRead" ? { isRead: true } : action.type === "markUnread" ? { isRead: false } : action.type === "star" ? { isStarred: true } : action.type === "unstar" ? { isStarred: false } : {}) } : m)));
    setOpen((cur) => (cur && ids.includes(cur.id) ? { ...cur, ...(action.type === "markRead" ? { isRead: true } : action.type === "markUnread" ? { isRead: false } : action.type === "star" ? { isStarred: true } : action.type === "unstar" ? { isStarred: false } : {}) } : cur));
    try {
      await mailApi.act(ids, action);
      if (removing) { setSelected(new Set()); toast(action.type === "archive" ? "Archived." : action.type === "spam" ? "Reported as spam." : "Moved."); if (openRef.current && ids.includes(openRef.current.id)) setOpen(null); }
      void loadAccounts();
    } catch (error) {
      setList(before);
      toast(error instanceof Error ? error.message : "Zoho did not accept that change.", "err");
    }
  }, [list, loadAccounts, toast]);

  const del = useCallback(async (ids: number[]) => {
    const before = list;
    setList((cur) => cur.filter((m) => !ids.includes(m.id)));
    try {
      await mailApi.remove(ids);
      setSelected(new Set());
      if (openRef.current && ids.includes(openRef.current.id)) setOpen(null);
      toast("Deleted.");
      void loadAccounts();
    } catch (error) {
      setList(before);
      toast(error instanceof Error ? error.message : "Could not delete.", "err");
    }
  }, [list, loadAccounts, toast]);

  const startCompose = useCallback((init?: ComposeInit) => {
    const v = viewRef.current;
    const accountId = v.kind === "folder" ? v.accountId : v.kind === "starred" && v.accountId ? v.accountId : (accounts.find((a) => a.email.startsWith("support"))?.id ?? accounts[0]?.id);
    if (!accountId && !init) return toast("No mailbox is connected yet.", "err");
    setComposes((c) => [...c.slice(-2), { key: composeKey.current++, init: init ?? { accountId: accountId!, to: [], cc: [], bcc: [], subject: "" } }]);
  }, [accounts, toast]);

  const openMessage = useCallback(async (m: MailMessage) => {
    if (m.folderType === "drafts") {
      try {
        const { message } = await mailApi.message(m.id);
        startCompose({ accountId: message.accountId, to: message.to, cc: message.cc, bcc: message.bcc, subject: message.subject === "(no subject)" ? "" : message.subject, draftHtml: message.htmlBody ?? "", draftId: message.id });
      } catch (error) {
        toast(error instanceof Error ? error.message : "Could not open the draft.", "err");
      }
      return;
    }
    setOpen(m);
    if (!m.isRead) void act([m.id], { type: "markRead" });
  }, [act, startCompose, toast]);

  const reply = useCallback((mode: "reply" | "replyAll" | "forward", msg: MailMessage) => {
    startCompose(buildCompose(mode, msg, accounts));
  }, [accounts, startCompose]);

  const toggle = useCallback((id: number) => setSelected((cur) => { const n = new Set(cur); if (n.has(id)) n.delete(id); else n.add(id); return n; }), []);
  const idx = open ? list.findIndex((m) => m.id === open.id) : -1;

  // ---- keyboard shortcuts (Gmail style)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT" || t.isContentEditable)) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const cur = openRef.current;
      const k = e.key;
      if (k === "c") { e.preventDefault(); startCompose(); }
      else if (k === "/") { e.preventDefault(); document.getElementById("lnh-mail-search-input")?.focus(); }
      else if (cur && k === "r") { e.preventDefault(); reply("reply", cur); }
      else if (cur && k === "a") { e.preventDefault(); reply("replyAll", cur); }
      else if (cur && k === "f") { e.preventDefault(); reply("forward", cur); }
      else if (k === "e") { const ids = cur ? [cur.id] : [...selected]; if (ids.length) { e.preventDefault(); void act(ids, { type: "archive" }); } }
      else if (k === "#") { const ids = cur ? [cur.id] : [...selected]; if (ids.length) { e.preventDefault(); void del(ids); } }
      else if (k === "s") { const m = cur ?? list[active]; if (m) { e.preventDefault(); void act([m.id], { type: m.isStarred ? "unstar" : "star" }); } }
      else if (k === "u" && cur) { e.preventDefault(); setOpen(null); }
      else if (k === "Escape" && cur) setOpen(null);
      else if (k === "j") { e.preventDefault(); if (cur) { const n = list[list.findIndex((m) => m.id === cur.id) + 1]; if (n) void openMessage(n); } else { setKbd(true); setActive((a) => Math.min(a + 1, list.length - 1)); } }
      else if (k === "k") { e.preventDefault(); if (cur) { const n = list[list.findIndex((m) => m.id === cur.id) - 1]; if (n) void openMessage(n); } else { setKbd(true); setActive((a) => Math.max(a - 1, 0)); } }
      else if (k === "Enter" && !cur && list[active]) { e.preventDefault(); void openMessage(list[active]); }
      else if (k === "x" && !cur && list[active]) { e.preventDefault(); toggle(list[active].id); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [list, active, selected, accounts, act, del, reply, openMessage, startCompose]);

  const allSelected = list.length > 0 && selected.size === list.length;

  const viewTitle = useMemo(() => {
    if (isSearching(filters)) return "Search results";
    if (view.kind === "all-inbox") return scope ? `Inbox · ${accounts.find((a) => a.id === scope)?.email ?? ""}` : "All inboxes";
    if (view.kind === "starred") return view.accountId ? `Starred · ${accounts.find((a) => a.id === view.accountId)?.email ?? ""}` : "Starred";
    const a = accounts.find((x) => x.id === view.accountId);
    return `${a?.folders.find((f) => f.id === view.folderId)?.name ?? "Folder"} · ${a?.email ?? ""}`;
  }, [view, filters, accounts, scope]);

  const showTag = view.kind !== "folder" || isSearching(filters);
  const selectedIds = [...selected];
  const progress = importing && importing.total > 0 ? Math.min(100, Math.round((importing.imported / importing.total) * 100)) : 0;

  return (
    <div className={`lnh-mail${navOpen ? " nav-open" : ""}`} onClick={() => navOpen && setNavOpen(false)}>
      <div style={{ gridColumn: "1 / -1", gridRow: 1 }}>
        {mock ? <div className="lnh-mail-banner">Mock mode — not connected to Zoho. You are looking at sample mail; every action works on the sample data only.</div> : null}
        {warnings.map((w) => <div key={w} className="lnh-mail-banner">{w}</div>)}
        {importing ? (
          <div className="lnh-mail-banner is-import">
            Importing your mail from Zoho{importing.total ? `: ${importing.imported.toLocaleString()} / ${importing.total.toLocaleString()} messages` : "…"}
            <span className="lnh-mail-bar"><span style={{ width: `${progress}%` }} /></span>
            <span style={{ opacity: 0.7 }}>You can keep using the inbox while this runs.</span>
          </div>
        ) : null}
      </div>
      <div style={{ gridColumn: "1 / -1", gridRow: 2 }}>
        <TopBar accounts={accounts} scope={scope} onScope={(id) => { scopeRef.current = id; setScope(id); reset(viewRef.current, filtersRef.current); }} filters={filters} onFilters={(f) => reset(viewRef.current, f)} onRefresh={() => void refresh()} refreshing={refreshing} onMenu={() => setNavOpen((o) => !o)} />
      </div>
      <Sidebar accounts={accounts} view={view} onView={(v) => { reset(v, EMPTY_FILTERS); setNavOpen(false); }} onCompose={() => startCompose()} />
      <main className="lnh-mail-main">
        {open ? (
          <ThreadView
            key={open.id}
            message={open}
            accounts={accounts}
            onBack={() => setOpen(null)}
            onAction={(ids, a) => void act(ids, a)}
            onDelete={(ids) => void del(ids)}
            onReply={reply}
            onPrev={idx > 0 ? () => void openMessage(list[idx - 1]) : null}
            onNext={idx >= 0 && idx < list.length - 1 ? () => void openMessage(list[idx + 1]) : null}
            toast={toast}
          />
        ) : (
          <>
            <div className="lnh-mail-toolbar">
              <input type="checkbox" className="lnh-mail-check" checked={allSelected} onChange={() => setSelected(allSelected ? new Set() : new Set(list.map((m) => m.id)))} aria-label="Select all" />
              {selectedIds.length ? (
                <>
                  <button type="button" className="lnh-mail-iconbtn" title="Archive (e)" aria-label="Archive" onClick={() => void act(selectedIds, { type: "archive" })}><Archive size={18} /></button>
                  <button type="button" className="lnh-mail-iconbtn" title="Report spam" aria-label="Spam" onClick={() => void act(selectedIds, { type: "spam" })}><OctagonAlert size={18} /></button>
                  <button type="button" className="lnh-mail-iconbtn" title="Delete (#)" aria-label="Delete" onClick={() => void del(selectedIds)}><Trash2 size={18} /></button>
                  <button type="button" className="lnh-mail-iconbtn" title="Mark as read" aria-label="Mark read" onClick={() => void act(selectedIds, { type: "markRead" })}><MailOpen size={18} /></button>
                  <button type="button" className="lnh-mail-iconbtn" title="Mark as unread" aria-label="Mark unread" onClick={() => void act(selectedIds, { type: "markUnread" })}><MailIcon size={18} /></button>
                  <span className="meta">{selectedIds.length} selected</span>
                </>
              ) : <strong style={{ padding: "0 8px" }}>{viewTitle}</strong>}
              <span className="sp" />
              <span className="meta">{list.length ? `${list.length.toLocaleString()}${hasMore ? "+" : ""} shown` : ""}</span>
            </div>
            <div className="lnh-mail-listwrap">
              <MessageList
                messages={list}
                loading={loading || booting}
                hasMore={hasMore}
                accounts={accounts}
                showTag={showTag}
                selected={selected}
                activeId={kbd ? list[active]?.id ?? null : null}
                onToggle={toggle}
                onOpen={(m) => void openMessage(m)}
                onAction={(ids, a) => void act(ids, a)}
                onDelete={(ids) => void del(ids)}
                onLoadMore={() => void loadList(view, filters, page + 1, false)}
              />
            </div>
          </>
        )}
      </main>
      <div className="lnh-mail-composes">
        {composes.map((c) => (
          <ComposeWindow
            key={c.key}
            init={c.init}
            accounts={accounts}
            toast={toast}
            onClose={() => setComposes((cur) => cur.filter((x) => x.key !== c.key))}
            onSent={() => { void loadAccounts(); if (viewRef.current.kind === "folder") void loadList(viewRef.current, filtersRef.current, 1, true); }}
            onDraftSaved={() => { void loadAccounts(); }}
          />
        ))}
      </div>
      <div className="lnh-toasts" role="status" aria-live="polite">
        {toasts.map((t) => <div key={t.id} className={`lnh-toast${t.kind === "err" ? " err" : ""}`}>{t.text}</div>)}
      </div>
    </div>
  );
}
