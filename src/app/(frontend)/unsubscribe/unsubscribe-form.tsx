"use client";

import { useState } from "react";

export function UnsubscribeForm({ email, token }: { email: string; token: string }) {
  const [state, setState] = useState<"idle" | "busy" | "done" | "error">("idle");
  if (!email || !token) return <p>This unsubscribe link is not complete. Please use the link in the email, or write to <a href="mailto:support@lankanewhomes.com">support@lankanewhomes.com</a>.</p>;
  if (state === "done") return <p>You are unsubscribed. <strong>{email}</strong> will not get any more newsletters or updates from LankaNewHomes.</p>;
  const submit = async () => {
    setState("busy");
    try {
      const res = await fetch("/api/unsubscribe", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, token }) });
      setState(res.ok ? "done" : "error");
    } catch {
      setState("error");
    }
  };
  return (
    <>
      <p>Stop all newsletters and updates from LankaNewHomes to <strong>{email}</strong>?</p>
      <button type="button" className="contact-form-submit" onClick={submit} disabled={state === "busy"}>{state === "busy" ? "Unsubscribing…" : "Unsubscribe from all emails"}</button>
      {state === "error" ? <p className="contact-form-error">Something went wrong. Please try again, or email support@lankanewhomes.com.</p> : null}
    </>
  );
}
