"use client";

import { useEffect, useState } from "react";
import { useDocumentInfo, useFormFields } from "@payloadcms/ui";

type Preview = { subject: string; html: string; live: boolean };

// Outreach log: shows the chosen email template and sends it (owner, 2026-10-12). The row must be saved first so its tracked links exist.
export function OutreachSendPanel() {
  const { id } = useDocumentInfo();
  const template = useFormFields(([f]) => f.template?.value as string | undefined);
  const contactName = useFormFields(([f]) => (f.contactName?.value as string | undefined) ?? "");
  const toEmail = useFormFields(([f]) => (f.toEmail?.value as string | undefined) ?? "");
  const fromAddress = useFormFields(([f]) => (f.fromAddress?.value as string | undefined) ?? "developers@lankanewhomes.com");
  const note = useFormFields(([f]) => (f.customNote?.value as string | undefined) ?? "");
  const [preview, setPreview] = useState<Preview | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!id || !template) return;
    const timer = setTimeout(() => {
      setError("");
      const query = new URLSearchParams({ template, contactName, note });
      fetch(`/api/outreach/${id}?${query}`, { credentials: "include" })
        .then(async (r) => { const body = await r.json().catch(() => ({})); if (!r.ok) throw new Error(body.error ?? "Could not load the preview."); return body as Preview; })
        .then(setPreview)
        .catch((e: Error) => { setPreview(null); setError(e.message); });
    }, 400);
    return () => clearTimeout(timer);
  }, [id, template, contactName, note]);

  async function send() {
    if (!window.confirm(`Send this email to ${toEmail}?${preview?.live === false ? "\n\n(Test mode: it will go to the test inbox, not to them.)" : ""}`)) return;
    setBusy(true); setMessage(""); setError("");
    try {
      const res = await fetch(`/api/outreach/${id}`, { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ template, contactName, toEmail, fromAddress, customNote: note }) });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) setError(body.error ?? "Could not send.");
      else setMessage(body.live ? `Sent to ${body.sentTo}. Reload this page to see the updated status.` : `Test mode: sent to ${body.sentTo} instead of the developer. Reload to see it.`);
    } finally { setBusy(false); }
  }

  const box = { border: "1px solid var(--theme-elevation-150)", padding: 16, marginBottom: 24 } as const;
  if (!id) return <div style={box}><p style={{ margin: 0 }}>Save this row first. Then the email preview and the Send button appear here.</p></div>;
  return (
    <div style={box}>
      <p style={{ margin: "0 0 8px", fontWeight: 600 }}>Email preview</p>
      {!template ? <p style={{ margin: 0 }}>Pick a template above to see the email.</p> : null}
      {template && error ? <p style={{ margin: "0 0 8px", color: "var(--theme-error-500)" }}>{error}</p> : null}
      {template && preview ? (
        <>
          <p style={{ margin: "0 0 8px" }}><strong>Subject:</strong> {preview.subject}</p>
          <iframe title="Email preview" srcDoc={preview.html} sandbox="" style={{ width: "100%", height: 480, border: "1px solid var(--theme-elevation-150)", background: "#fff" }} />
          <p style={{ margin: "8px 0", fontSize: 13 }}>
            Unsaved changes to the name or note show here as you type. Press <em>Save</em> to keep them. A copy goes to {fromAddress}.
          </p>
          <button type="button" className="btn btn--style-primary" disabled={busy || !toEmail} onClick={send}>{busy ? "Sending…" : "Send this email"}</button>
          {!toEmail ? <span style={{ marginLeft: 8, fontSize: 13 }}>Enter the email address to send to first.</span> : null}
          {preview.live === false ? <p style={{ margin: "8px 0 0", fontSize: 13 }}>This session is not production: sending goes to the test inbox only.</p> : null}
        </>
      ) : null}
      {message ? <p style={{ margin: "8px 0 0" }}>{message}</p> : null}
    </div>
  );
}
