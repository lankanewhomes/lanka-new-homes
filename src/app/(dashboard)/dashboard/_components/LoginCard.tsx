"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Eye, EyeOff, Loader2, ShieldCheck, User } from "lucide-react";
import { useDash } from "./DashProvider";

/** Centered sign-in card. Preview only: any input signs in, and the role picked here is the role previewed. */
export function LoginCard() {
  const d = useDash();
  const router = useRouter();
  const [role, setRole] = useState<"admin" | "developer">("admin");
  const [email, setEmail] = useState("rupan@lankanewhomes.com");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    d.setRole(role);
    setTimeout(() => router.push("/dashboard/overview"), 500);
  };
  return (
    <div className="grid min-h-screen place-items-center bg-bg px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex items-center justify-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-accent text-base font-bold text-white">L</span>
          <span className="text-lg font-semibold tracking-tight">LankaNewHomes</span>
        </div>
        <form onSubmit={submit} className="rounded-xl border border-line bg-panel p-6 shadow-card">
          <h1 className="text-lg font-semibold">Sign in</h1>
          <p className="mt-0.5 text-sm text-muted">Design preview: any details work.</p>
          <div className="mt-5 grid grid-cols-2 gap-1 rounded-lg bg-subtle p-1" role="radiogroup" aria-label="Preview as">
            {([["admin", "Admin", ShieldCheck], ["developer", "Developer", User]] as const).map(([v, label, Icon]) => (
              <button key={v} type="button" role="radio" aria-checked={role === v} onClick={() => { setRole(v); setEmail(v === "admin" ? "rupan@lankanewhomes.com" : "info@primelands.lk"); }} className={`flex items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-sm font-medium ${role === v ? "bg-panel shadow-sm" : "text-muted hover:text-fg"}`}><Icon size={14} />{label}</button>
            ))}
          </div>
          <label className="mt-4 block text-[13px] font-medium">Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1.5 w-full rounded-md border border-line bg-bg px-3 py-2 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20" />
          <label className="mt-4 block text-[13px] font-medium">Password</label>
          <div className="relative mt-1.5">
            <input type={show ? "text" : "password"} defaultValue="preview-only" className="w-full rounded-md border border-line bg-bg px-3 py-2 pr-10 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20" />
            <button type="button" aria-label={show ? "Hide password" : "Show password"} onClick={() => setShow(!show)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted hover:text-fg">{show ? <EyeOff size={16} /> : <Eye size={16} />}</button>
          </div>
          <button type="submit" disabled={busy} className="mt-5 flex w-full items-center justify-center gap-2 rounded-md bg-accent py-2.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-70">{busy ? <Loader2 size={15} className="animate-spin" /> : null}{busy ? "Signing in" : "Sign in"}</button>
          <p className="mt-4 text-center text-xs text-muted">Forgot your password? <span className="text-accent">Reset it</span></p>
        </form>
        <p className="mt-5 text-center text-xs text-muted">Mock data only. Nothing here is connected to Payload or the live site.</p>
      </div>
    </div>
  );
}
