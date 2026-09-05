"use client";

import { useState } from "react";
import Link from "next/link";
import { CircleUserRound, Heart } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCurrentUser } from "@/lib/use-current-user";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import { useAuthModal } from "@/components/auth/auth-modal-provider";

export function AccountMenu({ loginLabel, signupLabel }: { loginLabel: string; signupLabel: string }) {
  const { user, loading } = useCurrentUser();
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { openAuthModal } = useAuthModal();

  if (loading) return null;

  if (!user) {
    return (
      <>
        <button type="button" className="log-in header-link-button" onClick={() => openAuthModal({ mode: "login" })}>
          {loginLabel}
        </button>
        <button type="button" className="sign-up header-link-button" onClick={() => openAuthModal({ mode: "signup" })}>
          {signupLabel}
        </button>
      </>
    );
  }

  const onLogout = async () => {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    setOpen(false);
    router.push("/");
    router.refresh();
  };

  return (
    <div className="header-account">
      <button type="button" className="header-account-trigger" onClick={() => setOpen((v) => !v)}>
        {user.email?.split("@")[0] ?? "Account"}
        <CircleUserRound className="h-5 w-5" aria-hidden="true" />
      </button>
      {open && (
        <div className="header-account-menu">
          <p className="header-account-email">{user.email}</p>
          {user.role === "developer" ? (
            <Link href="/account" onClick={() => setOpen(false)}>
              My account
            </Link>
          ) : (
            <>
              <Link href="/account" onClick={() => setOpen(false)}>
                My account
              </Link>
              <Link href="/account/saved" onClick={() => setOpen(false)}>
                <Heart className="h-5 w-5" strokeWidth={1.5} aria-hidden="true" /> My Saved
              </Link>
            </>
          )}
          <button type="button" onClick={onLogout}>
            Log out
          </button>
        </div>
      )}
    </div>
  );
}
