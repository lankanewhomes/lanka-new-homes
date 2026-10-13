"use client";

import { Maximize2, Minimize2, Minus, Paperclip, Send, Trash2, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { mailApi } from "./api";
import { RecipientInput } from "./RecipientInput";
import { RichEditor, type RichEditorHandle } from "./RichEditor";
import type { Account, ComposeInit, MailAddress } from "./types";
import { fileSize, isEmail } from "./utils";

// Floating compose window (bottom right) like Gmail: minimise / maximise / close, From picker, To/Cc/Bcc chips, subject, rich text
// body with the selected mailbox's signature, attachments, and drafts autosaved to Zoho's Drafts folder.

type Attached = { filename: string; contentType: string; contentBase64: string; size: number };
const MAX_TOTAL = 20 * 1024 * 1024;

export function ComposeWindow({ init, accounts, onClose, onSent, onDraftSaved, toast }: {
  init: ComposeInit;
  accounts: Account[];
  onClose: () => void;
  onSent: () => void;
  onDraftSaved: () => void;
  toast: (message: string, kind?: "ok" | "err") => void;
}) {
  const [accountId, setAccountId] = useState(init.accountId);
  const [to, setTo] = useState<MailAddress[]>(init.to);
  const [cc, setCc] = useState<MailAddress[]>(init.cc);
  const [bcc, setBcc] = useState<MailAddress[]>(init.bcc);
  const [showCc, setShowCc] = useState(init.cc.length > 0);
  const [showBcc, setShowBcc] = useState(init.bcc.length > 0);
  const [subject, setSubject] = useState(init.subject);
  const [files, setFiles] = useState<Attached[]>([]);
  const [mode, setMode] = useState<"normal" | "min" | "max">("normal");
  const [busy, setBusy] = useState<"" | "sending" | "saving">("");
  const [draftId, setDraftId] = useState<number | undefined>(init.draftId);
  const draftRef = useRef<number | undefined>(init.draftId);
  const queue = useRef<Promise<unknown>>(Promise.resolve());
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [dirty, setDirty] = useState(false);
  const editor = useRef<RichEditorHandle>(null);
  const sent = useRef(false);
  const account = accounts.find((a) => a.id === accountId) ?? accounts[0];

  const initialHtml = init.draftHtml ?? `<div><br></div><div data-lnh-signature>${account?.signature ?? ""}</div>${init.quoteHtml ?? ""}`;
  const markDirty = () => setDirty(true);

  const payload = () => ({ accountId, to, cc, bcc, subject, htmlBody: editor.current?.getHtml() ?? "", attachments: files.map(({ filename, contentType, contentBase64 }) => ({ filename, contentType, contentBase64 })), inReplyToId: init.inReplyToId, replyMode: init.replyMode });
  const hasContent = () => Boolean(to.length || subject.trim() || (editor.current?.getText() ?? "").replace(init.draftHtml ? "" : (account?.signature ?? "").replace(/<[^>]+>/g, ""), "").trim());

  // Saves are queued one after another and always reuse the latest draft id, so a fast close can never create a second draft.
  const saveDraft = (quiet: boolean) => {
    const run = async () => {
      if (sent.current || !hasContent()) return;
      setBusy("saving");
      try {
        const res = await mailApi.saveDraft({ ...payload(), draftId: draftRef.current });
        if (res.draftId) { draftRef.current = res.draftId; setDraftId(res.draftId); }
        setSavedAt(new Date());
        setDirty(false);
        if (!quiet) toast("Draft saved.");
        onDraftSaved();
      } catch (error) {
        if (!quiet) toast(error instanceof Error ? error.message : "Could not save the draft.", "err");
      } finally {
        setBusy("");
      }
    };
    queue.current = queue.current.then(run, run);
    return queue.current;
  };

  // Autosave 4 seconds after the last change.
  useEffect(() => {
    if (!dirty) return;
    const t = setTimeout(() => void saveDraft(true), 4000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dirty, to, cc, bcc, subject, files]);

  const close = async () => {
    if (dirty && !sent.current) await saveDraft(true);
    else await queue.current;
    onClose();
  };

  const send = async () => {
    const all = [...to, ...cc, ...bcc];
    if (!to.length) return toast("Add at least one recipient.", "err");
    const bad = all.find((a) => !isEmail(a.email));
    if (bad) return toast(`"${bad.email}" is not a valid email address.`, "err");
    if (!subject.trim() && !window.confirm("Send this message without a subject?")) return;
    setBusy("sending");
    try {
      await queue.current;
      await mailApi.send({ ...payload(), draftId: draftRef.current });
      sent.current = true;
      toast("Message sent.");
      onSent();
      onClose();
    } catch (error) {
      toast(error instanceof Error ? error.message : "Could not send the message.", "err");
      setBusy("");
    }
  };

  const addFiles = async (list: FileList | null) => {
    if (!list) return;
    const next: Attached[] = [];
    let total = files.reduce((n, f) => n + f.size, 0);
    for (const f of Array.from(list)) {
      total += f.size;
      if (total > MAX_TOTAL) { toast("Attachments are limited to 20 MB in total.", "err"); break; }
      const base64 = await new Promise<string>((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(String(r.result).split(",")[1] ?? "");
        r.onerror = () => reject(r.error);
        r.readAsDataURL(f);
      });
      next.push({ filename: f.name, contentType: f.type || "application/octet-stream", contentBase64: base64, size: f.size });
    }
    if (next.length) { setFiles((cur) => [...cur, ...next]); markDirty(); }
  };

  const title = subject.trim() || (init.replyMode === "forward" ? "Forward" : init.inReplyToId ? "Reply" : "New message");

  return (
    <div className={`lnh-compose${mode === "min" ? " is-min" : ""}${mode === "max" ? " is-max" : ""}`} role="dialog" aria-label="Compose" onKeyDown={(e) => { if ((e.metaKey || e.ctrlKey) && e.key === "Enter") { e.preventDefault(); void send(); } }}>
      <div className="lnh-compose-head" onClick={() => setMode(mode === "min" ? "normal" : "min")}>
        <span className="t">{title}</span>
        <button type="button" title="Minimise" aria-label="Minimise" onClick={(e) => { e.stopPropagation(); setMode(mode === "min" ? "normal" : "min"); }}><Minus size={16} /></button>
        <button type="button" title={mode === "max" ? "Restore" : "Full screen"} aria-label="Maximise" onClick={(e) => { e.stopPropagation(); setMode(mode === "max" ? "normal" : "max"); }}>{mode === "max" ? <Minimize2 size={15} /> : <Maximize2 size={15} />}</button>
        <button type="button" title="Save and close" aria-label="Close" onClick={(e) => { e.stopPropagation(); void close(); }}><X size={16} /></button>
      </div>
      {mode === "min" ? null : (
        <>
          <div className="lnh-compose-field">
            <span>From</span>
            <select value={accountId} onChange={(e) => { const id = Number(e.target.value); setAccountId(id); editor.current?.setSignature(accounts.find((a) => a.id === id)?.signature ?? ""); markDirty(); }} aria-label="From">
              {accounts.map((a) => <option key={a.id} value={a.id}>{a.displayName} &lt;{a.email}&gt;</option>)}
            </select>
          </div>
          <div className="lnh-compose-field">
            <span>To</span>
            <RecipientInput value={to} onChange={(v) => { setTo(v); markDirty(); }} autoFocus={!to.length} />
            <div className="links">
              {!showCc ? <button type="button" onClick={() => setShowCc(true)}>Cc</button> : null}
              {!showBcc ? <button type="button" onClick={() => setShowBcc(true)}>Bcc</button> : null}
            </div>
          </div>
          {showCc ? <div className="lnh-compose-field"><span>Cc</span><RecipientInput value={cc} onChange={(v) => { setCc(v); markDirty(); }} /></div> : null}
          {showBcc ? <div className="lnh-compose-field"><span>Bcc</span><RecipientInput value={bcc} onChange={(v) => { setBcc(v); markDirty(); }} /></div> : null}
          <div className="lnh-compose-field">
            <input className="plain" placeholder="Subject" value={subject} onChange={(e) => { setSubject(e.target.value); markDirty(); }} aria-label="Subject" />
          </div>
          <RichEditor ref={editor} initialHtml={initialHtml} onChange={markDirty} />
          {files.length ? (
            <div className="lnh-attach">
              {files.map((f, i) => (
                <span key={`${f.filename}-${i}`} className="lnh-chip"><Paperclip size={12} /> {f.filename} <small>{fileSize(f.size)}</small>
                  <button type="button" aria-label={`Remove ${f.filename}`} onClick={() => { setFiles(files.filter((_, n) => n !== i)); markDirty(); }}><X size={12} /></button>
                </span>
              ))}
            </div>
          ) : null}
          <div className="lnh-compose-foot">
            <button type="button" className="lnh-mail-btn primary" disabled={busy !== ""} onClick={() => void send()}><Send size={15} /> {busy === "sending" ? "Sending…" : "Send"}</button>
            <label className="lnh-mail-iconbtn" title="Attach files" style={{ cursor: "pointer" }}>
              <Paperclip size={17} />
              <input type="file" multiple hidden onChange={(e) => { void addFiles(e.target.files); e.target.value = ""; }} />
            </label>
            <small>{busy === "saving" ? "Saving draft…" : savedAt ? `Draft saved ${savedAt.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}` : ""}</small>
            <span className="sp" />
            <button type="button" className="lnh-mail-iconbtn" title="Discard draft" aria-label="Discard draft" onClick={() => { sent.current = true; const id = draftRef.current ?? draftId; if (id) void queue.current.then(() => mailApi.remove([draftRef.current ?? id])).then(onDraftSaved).catch(() => undefined); onClose(); }}><Trash2 size={17} /></button>
          </div>
        </>
      )}
    </div>
  );
}
