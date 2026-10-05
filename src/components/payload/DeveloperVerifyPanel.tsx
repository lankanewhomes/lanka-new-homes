"use client";

import { useEffect, useState } from "react";
import { useDocumentInfo } from "@payloadcms/ui";

type Status = { verified: boolean; verifiedDomain: string | null; websiteDomain: string | null; pending: boolean };

// "Verified Developer" panel (internal name: verified builder) on the Developer edit form: the company confirms an email on its own website domain.
export function DeveloperVerifyPanel() {
  const { id } = useDocumentInfo();
  const [status, setStatus] = useState<Status | null>(null);
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!id) return;
    fetch("/api/developers/verify-domain/request", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then(setStatus)
      .catch(() => setStatus(null));
  }, [id]);

  async function send() {
    setBusy(true); setMessage("");
    try {
      const res = await fetch("/api/developers/verify-domain/request", { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) });
      const body = await res.json().catch(() => ({}));
      setMessage(res.ok ? `Confirmation link sent to ${body.sentTo}. It expires in 24 hours.` : body.error ?? "Could not send the link.");
    } finally { setBusy(false); }
  }

  // Admins editing someone else's profile get no status (it is the signed-in developer's own); they use the checkbox below.
  if (!status) return null;
  const box = { border: "1px solid var(--theme-elevation-150)", padding: 16, marginBottom: 24 } as const;
  if (status.verified) return <div style={box}><p style={{ margin: 0 }}>Verified Developer{status.verifiedDomain ? `: confirmed on ${status.verifiedDomain}` : ""}.</p></div>;
  return (
    <div style={box}>
      <p style={{ margin: "0 0 8px" }}>Get the free Verified Developer badge: confirm an email address on your company website{status.websiteDomain ? ` (@${status.websiteDomain})` : ""}.</p>
      {status.websiteDomain ? (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={`info@${status.websiteDomain}`} style={{ flex: "1 1 240px", padding: 8 }} />
          <button type="button" className="btn btn--style-primary" disabled={busy || !email} onClick={send}>{busy ? "Sending…" : "Send confirmation link"}</button>
        </div>
      ) : <p style={{ margin: 0 }}>Add your company website to your profile and save, then come back here.</p>}
      {status.pending && !message ? <p style={{ margin: "8px 0 0" }}>A link is already waiting in your inbox.</p> : null}
      {message ? <p style={{ margin: "8px 0 0" }}>{message}</p> : null}
    </div>
  );
}
