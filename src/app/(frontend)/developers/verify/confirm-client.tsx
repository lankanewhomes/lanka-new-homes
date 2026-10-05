"use client";

import Link from "next/link";
import { useState } from "react";

// A button (POST) rather than confirming on page load, so mail scanners that pre-fetch links can't use the token up.
export function VerifyDomainConfirm({ token }: { token: string }) {
  const [state, setState] = useState<"idle" | "busy" | "done" | "error">("idle");
  const [message, setMessage] = useState("");

  async function confirm() {
    setState("busy");
    try {
      const res = await fetch("/api/developers/verify-domain/confirm", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token }) });
      const body = await res.json().catch(() => ({}));
      if (res.ok) { setMessage(body.name ? `${body.name} is now a Verified Developer.` : "You are now a Verified Developer."); setState("done"); }
      else { setMessage(body.error ?? "Something went wrong."); setState("error"); }
    } catch {
      setMessage("Something went wrong. Try again."); setState("error");
    }
  }

  if (!token) return <p>This link isn&apos;t valid. Ask for a new one from your company profile.</p>;
  if (state === "done") return <div><p>{message}</p><p><Link href="/developers/login">Go to your dashboard</Link></p></div>;
  return (
    <div>
      <p>Confirm that you own the email address this link was sent to.</p>
      {state === "error" ? <p role="alert">{message}</p> : null}
      <button type="button" className="fdv-cta-final-button" onClick={confirm} disabled={state === "busy"}>
        {state === "busy" ? "Confirming…" : "Confirm and become a Verified Developer"}
      </button>
    </div>
  );
}
