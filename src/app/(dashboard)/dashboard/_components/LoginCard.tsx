"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { ApiError, apiLogin } from "../_data/api";

/** Sign in with the same account as /cms (Payload login). Only admin and developer accounts can open the dashboard. */
function Card({ title, lede }: { title: string; lede: string }) {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const user = await apiLogin(email.trim(), password);
      if (user.role !== "admin" && user.role !== "developer") {
        setError("This dashboard is for developers and admins. Buyers can use their account page.");
        setBusy(false);
        return;
      }
      const next = params.get("next");
      router.replace(next && next.startsWith("/dashboard") ? next : "/dashboard/overview");
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiError && err.status !== 0 ? "That email and password do not match, or the email has not been confirmed yet." : err instanceof Error ? err.message : "Could not sign in.");
      setBusy(false);
    }
  };
  return (
    <div className="d-box grid min-h-screen place-items-center !p-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex justify-center">
          <Link href="/" aria-label="LankaNewHomes home">
            {/* eslint-disable-next-line @next/next/no-img-element -- static brand SVG */}
            <img src="/logo-wordmark.svg" alt="LankaNewHomes" className="-my-2 block h-14 w-auto" />
          </Link>
        </div>
        <form onSubmit={submit} className="border border-line bg-panel p-7">
          <h1 className="text-[28px] font-normal leading-tight">{title}</h1>
          <p className="mt-0.5 text-sm text-muted">{lede}</p>
          <label className="mt-5 block text-[13px] font-medium" htmlFor="dash-email">Email</label>
          <input id="dash-email" type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1.5 w-full border border-line bg-bg px-3 py-2 text-sm outline-none focus:border-ink" />
          <label className="mt-4 block text-[13px] font-medium" htmlFor="dash-password">Password</label>
          <div className="relative mt-1.5">
            <input id="dash-password" type={show ? "text" : "password"} autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full border border-line bg-bg px-3 py-2 pr-10 text-sm outline-none focus:border-ink" />
            <button type="button" aria-label={show ? "Hide password" : "Show password"} onClick={() => setShow(!show)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted hover:text-fg">{show ? <EyeOff size={16} /> : <Eye size={16} />}</button>
          </div>
          {error ? <p role="alert" className="mt-3 text-sm text-bad">{error}</p> : null}
          <button type="submit" disabled={busy} className="mt-5 flex w-full items-center justify-center gap-2 bg-ink py-2.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-70">{busy ? <Loader2 size={15} className="animate-spin" /> : null}{busy ? "Signing in" : "Sign in"}</button>
          <p className="mt-4 text-center text-xs text-muted">Forgot your password? <Link href="/developers/forgot-password" className="text-fg underline">Reset it</Link></p>
        </form>
      </div>
    </div>
  );
}

export function LoginCard({ title = "Sign in.", lede = "Use your LankaNewHomes developer or admin account." }: { title?: string; lede?: string }) {
  return <Suspense><Card title={title} lede={lede} /></Suspense>;
}
