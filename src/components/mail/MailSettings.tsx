"use client";

import "./mail.css";
import { CheckCircle2, Loader2, PlugZap, RefreshCw, Inbox } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { mailApi, type StatusResponse } from "./api";

// /cms/mail/settings: connection status. Shows which env keys are set (never the values), tests the Zoho connection, lists the
// detected account ids and the import / sync progress per mailbox, and can run the import and a sync by hand.

export function MailSettings() {
  const [status, setStatus] = useState<StatusResponse | null>(null);
  const [connection, setConnection] = useState<StatusResponse["connection"]>(null);
  const [error, setError] = useState("");
  const [testing, setTesting] = useState(false);
  const [running, setRunning] = useState<"" | "import" | "sync">("");
  const [log, setLog] = useState("");
  const stop = useRef(false);

  const load = useCallback(async (test = false) => {
    try {
      const next = await mailApi.status(test);
      setStatus(next);
      if (next.connection) setConnection(next.connection);
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load the status.");
    }
  }, []);

  useEffect(() => {
    void (async () => { await load(); })();
    const t = setInterval(() => void load(), 5000);
    return () => clearInterval(t);
  }, [load]);

  const runImport = async () => {
    setRunning("import");
    stop.current = false;
    try {
      for (let i = 0; i < 500 && !stop.current; i += 1) {
        const r = await mailApi.importBatch();
        setLog(`Batch ${i + 1} finished${r.done ? ": import complete." : "…"}`);
        await load();
        if (r.done) break;
      }
    } catch (e) {
      setLog(e instanceof Error ? e.message : "Import stopped.");
    } finally {
      setRunning("");
    }
  };

  const syncNow = async () => {
    setRunning("sync");
    try {
      await mailApi.sync();
      setLog("Sync finished.");
      await load();
    } catch (e) {
      setLog(e instanceof Error ? e.message : "Sync failed.");
    } finally {
      setRunning("");
    }
  };

  if (error && !status) return <div className="lnh-mail-settings"><p>{error}</p></div>;
  if (!status) return <div className="lnh-mail-settings"><p><Loader2 size={16} className="lnh-spin" /> Loading…</p></div>;

  return (
    <div className="lnh-mail-settings">
      <h1 style={{ margin: "0 0 4px" }}>Mail connection status</h1>
      <p style={{ margin: 0, color: "var(--theme-elevation-600, #6b7280)" }}>
        Mode: {status.mock ? <span className="lnh-pill mock">Mock mode, sample data (not connected to Zoho)</span> : <span className="lnh-pill ok">Live, connected to Zoho</span>}
        {" "}<Link href="/cms/mail" style={{ marginLeft: 12 }}><Inbox size={14} style={{ verticalAlign: "-2px" }} /> Open the inbox</Link>
      </p>

      <h2>Environment keys</h2>
      <table>
        <tbody>
          {status.env.map((e) => (
            <tr key={e.key}><td><code>{e.key}</code></td><td>{e.set ? <span className="lnh-pill ok">set</span> : <span className="lnh-pill no">not set</span>}</td></tr>
          ))}
        </tbody>
      </table>
      <p style={{ fontSize: 13, color: "var(--theme-elevation-600, #6b7280)" }}>Values are never shown here. {status.credentialsPresent ? "Zoho credentials are present." : "Zoho credentials are missing, so the mock client is used."}</p>

      <h2>Zoho connection</h2>
      <p>
        <button type="button" className="lnh-mail-btn" disabled={testing} onClick={async () => { setTesting(true); await load(true); setTesting(false); }}>
          <PlugZap size={15} /> {testing ? "Testing…" : "Test connection"}
        </button>
      </p>
      {connection ? (
        <>
          <p>{connection.ok ? <CheckCircle2 size={16} style={{ color: "#16a34a", verticalAlign: "-3px" }} /> : null} {connection.message}</p>
          {connection.accounts.length ? (
            <table>
              <thead><tr><th>Detected mailbox</th><th>Zoho accountId</th></tr></thead>
              <tbody>{connection.accounts.map((a) => <tr key={a.email}><td>{a.email}</td><td><code>{a.zohoAccountId}</code></td></tr>)}</tbody>
            </table>
          ) : null}
        </>
      ) : <p style={{ color: "var(--theme-elevation-600, #6b7280)" }}>Press “Test connection” to check the credentials and detect the account ids.</p>}

      <h2>Import and sync progress</h2>
      <table>
        <thead><tr><th>Mailbox</th><th>Imported</th><th>Folders</th><th>Last sync</th><th /></tr></thead>
        <tbody>
          {status.sync.accounts.map((a) => {
            const pct = a.total ? Math.min(100, Math.round((a.imported / a.total) * 100)) : 0;
            return (
              <tr key={a.id}>
                <td>{a.email}<br /><small style={{ color: "var(--theme-elevation-500, #6b7280)" }}>accountId {a.zohoAccountId || "—"}</small></td>
                <td style={{ minWidth: 220 }}>{a.imported.toLocaleString()} / {a.total.toLocaleString()} messages<div className="lnh-mail-bar" style={{ width: 200, marginTop: 4 }}><span style={{ width: `${pct}%` }} /></div></td>
                <td>{a.foldersComplete} / {a.foldersTotal} complete</td>
                <td>{a.lastSyncedAt ? new Date(a.lastSyncedAt).toLocaleString("en-GB") : "never"}{a.running ? " (running)" : ""}{a.lastError ? <><br /><small style={{ color: "#b91c1c" }}>{a.lastError}</small></> : null}</td>
                <td />
              </tr>
            );
          })}
          {!status.sync.accounts.length ? <tr><td colSpan={5}>No mailbox has been set up yet. Press “Start / resume import”.</td></tr> : null}
        </tbody>
      </table>
      <p style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
        <button type="button" className="lnh-mail-btn primary" disabled={running !== ""} onClick={() => void runImport()}>{running === "import" ? "Importing…" : "Start / resume full import"}</button>
        {running === "import" ? <button type="button" className="lnh-mail-btn" onClick={() => { stop.current = true; }}>Pause</button> : null}
        <button type="button" className="lnh-mail-btn" disabled={running !== ""} onClick={() => void syncNow()}><RefreshCw size={15} /> Sync now</button>
        <small>{log}</small>
      </p>
      <p style={{ fontSize: 13, color: "var(--theme-elevation-600, #6b7280)" }}>
        The import is resumable: it saves progress per folder and carries on where it stopped. A cron calls <code>/api/mail/sync</code> every few minutes to pick up changes made in Zoho.
      </p>
    </div>
  );
}
