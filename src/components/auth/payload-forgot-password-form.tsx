"use client";

import { useState, type FormEvent } from "react";

// Same shape as the buyer's ForgotPasswordForm, but against Payload's own
// built-in forgot-password endpoint instead of Supabase — the reset link it
// emails points at Payload's own /cms/reset/:token page (see Users.ts's
// auth.forgotPassword), so there's no separate reset-password page to build
// here, just this request step.
export function PayloadForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const response = await fetch("/payload-api/users/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.errors?.[0]?.message ?? body?.message ?? "Something went wrong. Please try again.");
      }
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return <p className="auth-success">Check {email} for a link to reset your password.</p>;
  }

  return (
    <form className="static-page-form" onSubmit={onSubmit}>
      <label>
        Email
        <input type="email" placeholder="Email address" required value={email} onChange={(e) => setEmail(e.target.value)} />
      </label>
      {error && <p className="auth-error">{error}</p>}
      <button type="submit" disabled={loading}>
        {loading ? "Sending…" : "Send reset link"}
      </button>
    </form>
  );
}
