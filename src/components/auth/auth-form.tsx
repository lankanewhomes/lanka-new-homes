"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";

type Provider = "google" | "facebook" | "linkedin_oidc";

// Order matches the requested layout: Facebook, LinkedIn, Google (not
// alphabetical or "most popular first" — an explicit choice).
const PROVIDERS: { id: Provider; label: string; icon: ReactNode }[] = [
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
    id: "linkedin_oidc",
    label: "Continue with LinkedIn",
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
        <rect width="18" height="18" rx="2" fill="#0A66C2" />
        <path fill="#fff" d="M5.34 7.5H3.02V15h2.32V7.5ZM4.18 3.6a1.35 1.35 0 1 0 0 2.7 1.35 1.35 0 0 0 0-2.7ZM15 15h-2.32v-4.06c0-.97-.02-2.21-1.35-2.21-1.35 0-1.56 1.05-1.56 2.14V15H7.45V7.5h2.23v1.03h.03c.31-.58 1.06-1.2 2.19-1.2 2.34 0 2.77 1.54 2.77 3.54V15Z" />
      </svg>
    ),
  },
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
];

const PROVIDER_LABELS: Record<string, string> = {
  google: "Google",
  facebook: "Facebook",
  linkedin_oidc: "LinkedIn",
};

// Supabase returns a generic "Invalid login credentials" error whether the
// password was wrong or the account has no password at all (created via
// Google/Facebook/LinkedIn). This looks up which providers the email is
// actually registered with so we can point the person at the right button
// instead of leaving them stuck re-typing a password that was never set.
async function getOAuthOnlyHint(attemptedEmail: string): Promise<string | null> {
  try {
    const response = await fetch("/api/auth/account-providers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: attemptedEmail }),
    });
    if (!response.ok) return null;
    const { providers } = (await response.json()) as { providers: string[] };
    if (providers.length > 0 && !providers.includes("email")) {
      const names = providers.map((provider) => PROVIDER_LABELS[provider] ?? provider).join(" or ");
      return `This email is registered with ${names} sign-in — use "Continue with ${names}" above instead of a password.`;
    }
  } catch {
    // Fall back to the original Supabase error message.
  }
  return null;
}

type Mode = "login" | "signup";
// Neither the popup nor the standalone /login and /signup pages ask "log in
// or sign up" upfront anymore — one email field decides it, for both
// variants. "email" is always the first screen; submitting it looks the
// address up (via /api/auth/account-providers) and branches: no account →
// "signup" (name+password), a password-based account → "login" (password
// only), an OAuth-only account → "oauth-only" (no fields, just point at the
// right "Continue with X" button above).
export type ModalStep = "email" | "login" | "signup" | "oauth-only";

// Single source of truth for the heading shown at each step — shared by the
// popup (auth-modal-provider.tsx) and the standalone /login and /signup
// pages (page-auth-shell.tsx), so both surfaces genuinely show the same
// title at the same step instead of two hand-copied strings drifting apart.
export const AUTH_STEP_TITLES: Record<ModalStep, string> = {
  email: "Register/Sign In",
  login: "Log in to LankaNewHomes",
  signup: "Almost done — set a password",
  "oauth-only": "Log in to LankaNewHomes",
};

export function AuthForm({
  intent,
  redirectTo,
  onDeveloperRoleCheck,
  variant = "page",
  onAuthenticated,
  onStepChange,
}: {
  intent?: "developer";
  redirectTo: string;
  /** Login only: reject the sign-in if the account isn't a developer account. */
  onDeveloperRoleCheck?: boolean;
  /** "modal" matches the popup styling (form fields first, pill buttons). */
  variant?: "page" | "modal";
  /** Modal only: called instead of a router redirect once signed in. */
  onAuthenticated?: () => void;
  /** Modal only: fires whenever the step changes, so the modal chrome
   * around this form (headline, tagline) can react to it. */
  onStepChange?: (step: ModalStep) => void;
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<Provider | null>(null);
  const [error, setError] = useState("");
  const [checkEmail, setCheckEmail] = useState(false);
  const [modalStep, setModalStepState] = useState<ModalStep>("email");
  const [existingProviders, setExistingProviders] = useState<string[]>([]);
  const setModalStep = (step: ModalStep) => {
    setModalStepState(step);
    onStepChange?.(step);
  };

  const callbackUrl = () => {
    const url = new URL("/auth/callback", window.location.origin);
    url.searchParams.set("next", redirectTo);
    if (intent) url.searchParams.set("intent", intent);
    return url.toString();
  };

  const onOAuth = async (provider: Provider) => {
    setError("");
    setOauthLoading(provider);
    const supabase = createSupabaseBrowserClient();
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: callbackUrl() },
    });
    if (oauthError) {
      setError(oauthError.message);
      setOauthLoading(null);
    }
    // On success the browser navigates away to the provider, so no further state change needed here.
  };

  // Modal only, step 1: the one field that decides everything. Looks up
  // which providers (if any) this email is already registered with via the
  // same endpoint getOAuthOnlyHint uses after a failed login — reused here
  // to make that determination up front instead of after a wasted password
  // attempt. No account found → signup step; a password-based account →
  // login step; an OAuth-only account → point at the right button instead
  // of showing a password field that can't work.
  const onEmailStepSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const response = await fetch("/api/auth/account-providers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const { providers } = response.ok ? ((await response.json()) as { providers: string[] }) : { providers: [] };
      setExistingProviders(providers);
      if (providers.length === 0) {
        setModalStep("signup");
      } else if (providers.includes("email")) {
        setModalStep("login");
      } else {
        setModalStep("oauth-only");
      }
    } catch {
      // Couldn't check — default to signup, the more common case for a
      // popup opened from a listing page; a real existing-account email
      // will just get a clear "already registered" error from signUp below.
      setModalStep("signup");
    } finally {
      setLoading(false);
    }
  };

  // The email-first flow now drives both variants (previously modal-only) —
  // the standalone /login and /signup pages used to keep the old fixed
  // mode/two-field form regardless of what the popup already did, which is
  // exactly the "why doesn't this look the same" gap reported 2026-09-18.
  const effectiveMode: Mode = modalStep === "login" ? "login" : "signup";

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    const supabase = createSupabaseBrowserClient();

    if (effectiveMode === "signup") {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: name, intended_role: intent === "developer" ? "developer" : "buyer" },
          emailRedirectTo: callbackUrl(),
        },
      });
      setLoading(false);
      if (signUpError) {
        setError(signUpError.message);
        return;
      }
      if (!data.session) {
        setCheckEmail(true);
        return;
      }
      finish();
      return;
    }

    const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError) {
      const hint = await getOAuthOnlyHint(email);
      setLoading(false);
      setError(hint ?? signInError.message);
      return;
    }
    setLoading(false);

    if (onDeveloperRoleCheck && data.user) {
      const { data: profile } = await supabase.from("profiles").select("role").eq("id", data.user.id).single();
      if (profile?.role !== "developer") {
        setError("This account isn't registered as a developer. Use the buyer login instead, or register your company.");
        await supabase.auth.signOut();
        return;
      }
    }

    finish();
  };

  const finish = () => {
    if (onAuthenticated) {
      onAuthenticated();
      return;
    }
    router.push(redirectTo);
    router.refresh();
  };

  if (checkEmail) {
    return <p className="auth-success">Almost there — check {email} for a confirmation link to finish creating your account.</p>;
  }

  const socialButtons = (
    <div className={variant === "modal" ? "auth-modal-social-buttons" : "auth-social-buttons"}>
      {PROVIDERS.map((provider) => (
        <button
          key={provider.id}
          type="button"
          className={variant === "modal" ? "auth-modal-social-button" : "auth-social-button"}
          disabled={oauthLoading !== null}
          onClick={() => onOAuth(provider.id)}
        >
          {provider.icon}
          <span>{oauthLoading === provider.id ? "Redirecting…" : variant === "modal" ? provider.label.replace("Continue with ", "") : provider.label}</span>
        </button>
      ))}
    </div>
  );

  const changeEmailButton = (
    <button
      type="button"
      onClick={() => {
        setError("");
        setModalStep("email");
      }}
    >
      Change
    </button>
  );

  // Step 1 (both variants): just the email, then Continue, then the social
  // buttons below it. Nothing here calls Supabase directly —
  // onEmailStepSubmit looks the email up first and decides what comes next.
  if (modalStep === "email") {
    return (
      <div>
        <form className={variant === "modal" ? "auth-modal-form" : "static-page-form"} onSubmit={onEmailStepSubmit}>
          <label>
            <span className="sr-only">Email</span>
            <input type="email" placeholder="Email address" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </label>
          <button type="submit" disabled={loading}>
            {loading ? "Checking…" : "Continue"}
          </button>
        </form>
        <div className="auth-divider">or continue with</div>
        {socialButtons}
      </div>
    );
  }

  // "oauth-only" step (both variants): this email only has Google/Facebook/
  // LinkedIn sign-in on file — no password to collect, so just point at the
  // right button instead of showing a form that can't work.
  if (modalStep === "oauth-only") {
    const names = existingProviders.map((provider) => PROVIDER_LABELS[provider] ?? provider).join(" or ");
    return (
      <div>
        <p className="auth-modal-email-step">
          {email} {changeEmailButton}
        </p>
        <p className="auth-error">This email uses {names} sign-in — use the button below.</p>
        {socialButtons}
      </div>
    );
  }

  // Steps "login"/"signup" (both variants): the email from step 1 is shown
  // (with a way back to change it) instead of asking for it again.
  const emailStepHeader = (
    <p className="auth-modal-email-step">
      {email} {changeEmailButton}
    </p>
  );

  const formFields = (
    <form className={variant === "modal" ? "auth-modal-form" : "static-page-form"} onSubmit={onSubmit}>
      {emailStepHeader}
      {effectiveMode === "signup" && (
        <label>
          <span className="sr-only">Full name</span>
          <input type="text" placeholder="Full name" required value={name} onChange={(e) => setName(e.target.value)} />
        </label>
      )}
      <label>
        <span className="sr-only">Password</span>
        <input
          type="password"
          placeholder="Password"
          required
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </label>
      {effectiveMode === "login" && (
        <p className="auth-forgot-password">
          <a href="/forgot-password">Forgot password?</a>
        </p>
      )}
      {error && <p className="auth-error">{error}</p>}
      <button type="submit" disabled={loading}>
        {loading ? "Please wait…" : effectiveMode === "signup" ? "Continue" : "Log in"}
      </button>
    </form>
  );

  // No social buttons repeated a second time here for either variant —
  // already shown once at the email step above.
  return <div>{formFields}</div>;
}
