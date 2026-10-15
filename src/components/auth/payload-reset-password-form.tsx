"use client";

import { useState, type FormEvent } from "react";

// Sets a new password through Payload's own reset endpoint (token from the emailed link), then goes to the new dashboard,
// so a reset never lands in /cms.
export function PayloadResetPasswordForm({ token }: { token: string }) {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!token) return <p className="auth-error">This link isn&apos;t valid. Request a new one from the forgot-password page.</p>;

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const response = await fetch("/payload-api/users/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ token, password }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.errors?.[0]?.message ?? body?.message ?? "This link has expired. Request a new one.");
      }
      window.location.href = "/dashboard/overview";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  return (
    <form className="static-page-form" onSubmit={onSubmit}>
      <label>
        New password
        <input type="password" placeholder="At least 8 characters" required minLength={8} autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
      </label>
      {error && <p className="auth-error">{error}</p>}
      <button type="submit" disabled={loading}>{loading ? "Saving…" : "Set new password"}</button>
    </form>
  );
}
