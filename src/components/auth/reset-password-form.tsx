"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";

export function ResetPasswordForm() {
  const router = useRouter();
  const [ready, setReady] = useState<boolean | null>(null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    supabase.auth.getSession().then(({ data }) => {
      setReady(Boolean(data.session));
    });
  }, []);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }
    setLoading(true);
    const supabase = createSupabaseBrowserClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    setDone(true);
    setTimeout(() => {
      router.push("/account");
      router.refresh();
    }, 1500);
  };

  if (done) {
    return <p className="auth-success">Password updated — redirecting to your account…</p>;
  }

  if (ready === null) {
    return null;
  }

  if (!ready) {
    return (
      <p className="static-page-note">
        This link has expired or was already used. <a href="/forgot-password">Request a new one</a>.
      </p>
    );
  }

  return (
    <form className="static-page-form" onSubmit={onSubmit}>
      <label>
        New password
        <input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} />
      </label>
      <label>
        Confirm new password
        <input type="password" required minLength={6} value={confirm} onChange={(e) => setConfirm(e.target.value)} />
      </label>
      {error && <p className="auth-error">{error}</p>}
      <button type="submit" disabled={loading}>
        {loading ? "Updating…" : "Update password"}
      </button>
    </form>
  );
}
