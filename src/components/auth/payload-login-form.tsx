"use client";

import { useState, type FormEvent } from "react";

const SOCIAL_PROVIDERS = [
  {
    id: "google",
    label: "Continue with Google",
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
        <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.9c1.7-1.57 2.7-3.88 2.7-6.62Z" />
        <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.9-2.26c-.8.54-1.84.86-3.06.86-2.35 0-4.34-1.59-5.05-3.72H.98v2.33A9 9 0 0 0 9 18Z" />
        <path fill="#FBBC05" d="M3.95 10.7A5.41 5.41 0 0 1 3.67 9c0-.59.1-1.17.28-1.7V4.97H.98A9 9 0 0 0 0 9c0 1.45.35 2.83.98 4.03l2.97-2.33Z" />
        <path fill="#EA4335" d="M9 3.58c1.32 0 2.51.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .98 4.97l2.97 2.33C4.66 5.17 6.65 3.58 9 3.58Z" />
      </svg>
    ),
  },
  {
    id: "facebook",
    label: "Continue with Facebook",
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
        <path fill="#1877F2" d="M18 9a9 9 0 1 0-10.4 8.89v-6.29H5.31V9h2.29V7.02c0-2.26 1.35-3.51 3.41-3.51.99 0 2.02.18 2.02.18v2.22h-1.14c-1.12 0-1.47.7-1.47 1.41V9h2.5l-.4 2.6h-2.1v6.29A9 9 0 0 0 18 9Z" />
      </svg>
    ),
  },
  {
    id: "linkedin",
    label: "Continue with LinkedIn",
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
        <rect width="18" height="18" rx="2" fill="#0A66C2" />
        <path fill="#fff" d="M5.34 7.5H3.02V15h2.32V7.5ZM4.18 3.6a1.35 1.35 0 1 0 0 2.7 1.35 1.35 0 0 0 0-2.7ZM15 15h-2.32v-4.06c0-.97-.02-2.21-1.35-2.21-1.35 0-1.56 1.05-1.56 2.14V15H7.45V7.5h2.23v1.03h.03c.31-.58 1.06-1.2 2.19-1.2 2.34 0 2.77 1.54 2.77 3.54V15Z" />
      </svg>
    ),
  },
];

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

// Same look as the buyer login/signup forms (AuthForm) on purpose — one
// consistent design across the whole site — but authenticates against
// Payload's own Users collection instead of Supabase, and lands in /cms
// rather than /account. Kept as a separate component (not a mode on
// AuthForm) so the buyer flow stays completely untouched.
export function PayloadLoginForm({ mode = "login" }: { mode?: "login" | "signup" }) {
  const [fullName, setFullName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [socialNotice, setSocialNotice] = useState(false);

  const onSubmitLogin = async () => {
    const response = await fetch("/payload-api/users/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email, password }),
    });
    const body = await response.json();
    if (!response.ok) {
      throw new Error(body?.errors?.[0]?.message ?? body?.message ?? "Invalid email or password.");
    }
  };

  const onSubmitSignup = async () => {
    // 1. Create the Payload account (role: developer). Public create, but
    //    doesn't establish a session on its own — log in right after.
    const createRes = await fetch("/payload-api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, full_name: fullName, role: "developer" }),
    });
    const createBody = await createRes.json();
    if (!createRes.ok) {
      throw new Error(createBody?.errors?.[0]?.message ?? createBody?.message ?? "Couldn't create your account.");
    }

    await onSubmitLogin();

    // 2. Create the company profile, linked to this account automatically
    //    (see Developers.ts's beforeChange hook — user/verification_status
    //    are forced server-side, never trusted from this request).
    const slug = slugify(companyName) || `developer-${Date.now()}`;
    const companyRes = await fetch("/payload-api/developers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ slug, name: companyName, contact_email: email }),
    });
    if (!companyRes.ok) {
      const companyBody = await companyRes.json().catch(() => null);
      throw new Error(companyBody?.errors?.[0]?.message ?? "Account created, but couldn't set up your company profile — contact us.");
    }
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (mode === "signup") {
        await onSubmitSignup();
      } else {
        await onSubmitLogin();
      }
      window.location.href = "/cms";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div>
      <form className="static-page-form" onSubmit={onSubmit}>
        {mode === "signup" && (
          <>
            <label>
              Your name
              <input type="text" placeholder="Full name" required value={fullName} onChange={(e) => setFullName(e.target.value)} />
            </label>
            <label>
              Company name
              <input type="text" placeholder="Company name" required value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
            </label>
          </>
        )}
        <label>
          Email
          <input type="email" placeholder="Email address" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label>
          Password
          <input type="password" placeholder="Password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} />
        </label>
        {error && <p className="auth-error">{error}</p>}
        <button type="submit" disabled={loading}>
          {loading ? "Please wait…" : mode === "signup" ? "Create account" : "Log in"}
        </button>
      </form>

      <div className="auth-divider">Or continue with</div>
      <div className="auth-social-buttons">
        {SOCIAL_PROVIDERS.map((provider) => (
          <button key={provider.id} type="button" className="auth-social-button" onClick={() => setSocialNotice(true)}>
            {provider.icon}
            <span>{provider.label}</span>
          </button>
        ))}
      </div>
      {socialNotice && <p className="auth-error">Social sign-in isn&apos;t set up for this login yet — use your email and password above.</p>}
    </div>
  );
}
