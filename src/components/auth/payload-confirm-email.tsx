"use client";

import Link from "next/link";
import { useState } from "react";

// A button (POST) rather than confirming on page load, so mail scanners that pre-fetch links can't use the token up.
export function PayloadConfirmEmail({ token }: { token: string }) {
  const [state, setState] = useState<"idle" | "busy" | "done" | "error">("idle");

  if (!token) return <p className="auth-error">This link isn&apos;t valid.</p>;
  if (state === "done") return <p className="auth-success">Email confirmed. <Link href="/developers/login">Log in</Link>.</p>;

  const confirm = async () => {
    setState("busy");
    try {
      const res = await fetch(`/payload-api/users/verify/${encodeURIComponent(token)}`, { method: "POST", headers: { "Content-Type": "application/json" } });
      setState(res.ok ? "done" : "error");
    } catch { setState("error"); }
  };

  return (
    <div className="static-page-form">
      {state === "error" ? <p className="auth-error">This link has expired or was already used. Try logging in.</p> : null}
      <button type="button" onClick={confirm} disabled={state === "busy"}>{state === "busy" ? "Confirming…" : "Confirm my email"}</button>
    </div>
  );
}
