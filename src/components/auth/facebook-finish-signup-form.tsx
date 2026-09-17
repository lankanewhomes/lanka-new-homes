"use client";

import { useState, type FormEvent } from "react";

// Second half of a Facebook-started developer signup — the only field
// Facebook doesn't already give us. See
// /api/auth/admin-facebook/callback/route.ts for how someone lands here.
export function FacebookFinishSignupForm({ name }: { name: string }) {
  const [companyName, setCompanyName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const response = await fetch("/api/auth/admin-facebook/finish-signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ company_name: companyName }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body?.error ?? "Couldn't finish signing up. Please try again.");
      window.location.href = "/cms";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  return (
    <form className="static-page-form" onSubmit={onSubmit}>
      <p className="auth-page-lede" style={{ marginBottom: 16 }}>
        {name ? `Welcome, ${name}! ` : ""}One more thing — what&apos;s your company name?
      </p>
      <label>
        <span className="sr-only">Company name</span>
        <input type="text" placeholder="Company name" required autoFocus value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
      </label>
      {error && <p className="auth-error">{error}</p>}
      <button type="submit" disabled={loading}>
        {loading ? "Please wait…" : "Finish signing up"}
      </button>
    </form>
  );
}
