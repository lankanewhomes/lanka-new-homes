"use client";

import { useState, type FormEvent } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    const supabase = createSupabaseBrowserClient();
    const redirectTo = new URL("/auth/callback", window.location.origin);
    redirectTo.searchParams.set("next", "/reset-password");
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectTo.toString(),
    });
    setLoading(false);
    if (resetError) {
      setError(resetError.message);
      return;
    }
    setSent(true);
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
