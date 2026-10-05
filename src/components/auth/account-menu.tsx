"use client";

import { useState } from "react";
import Link from "next/link";
import { Bell, Building2, CircleUserRound, Heart, LayoutDashboard, LogOut, MessageSquare, Scale, Settings, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCurrentUser } from "@/lib/use-current-user";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import { useAuthModal } from "@/components/auth/auth-modal-provider";

// Owner, 2026-10-02: the header's account dropdown lists every account page, not just "My account" and
// "My Saved" — same pages and order as the account side menu (src/lib/account-nav.ts).
const BUYER_LINKS = [
  { href: "/account", label: "My account", Icon: LayoutDashboard },
  { href: "/account/saved", label: "Saved properties", Icon: Heart },
  { href: "/account/developments", label: "Saved developments", Icon: Building2 },
  { href: "/account/compare", label: "Compare", Icon: Scale },
  { href: "/account/alerts", label: "Saved searches & alerts", Icon: Bell },
  { href: "/account/enquiries", label: "My enquiries", Icon: MessageSquare },
  { href: "/account/profile", label: "Profile", Icon: UserRound },
  { href: "/account/settings", label: "Settings", Icon: Settings },
] as const;

export function AccountMenu({ loginLabel, signupLabel, showSignup = true }: { loginLabel: string; signupLabel: string; showSignup?: boolean }) {
  const { user, loading } = useCurrentUser();
  const [open, setOpen] = useState(false);
  const [avatarFailed, setAvatarFailed] = useState(false);
  const router = useRouter();
  const { openAuthModal } = useAuthModal();

  if (loading) return null;

  if (!user) {
    return (
      <>
        <button type="button" className="log-in header-link-button" onClick={() => openAuthModal({ mode: "login" })}>
          {loginLabel}
        </button>
        {showSignup ? (
          <button type="button" className="sign-up header-link-button" onClick={() => openAuthModal({ mode: "signup" })}>
            {signupLabel}
          </button>
        ) : null}
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
        {user.fullName ?? user.email?.split("@")[0] ?? "Account"}
        {user.avatarUrl && !avatarFailed ? (
          // eslint-disable-next-line @next/next/no-img-element -- user-supplied URL from any host; next/image would need every host allow-listed
          <img src={user.avatarUrl} alt="" className="header-account-avatar" onError={() => setAvatarFailed(true)} />
        ) : (
          <CircleUserRound className="h-7 w-7" strokeWidth={1} aria-hidden="true" />
        )}
      </button>
      {open && (
        <div className="header-account-menu">
          {user.fullName ? <p className="header-account-name">{user.fullName}</p> : null}
          <p className="header-account-email">{user.email}</p>
          {user.role === "developer" ? (
            <Link href="/account" onClick={() => setOpen(false)}>
              <LayoutDashboard className="header-account-menu-icon" aria-hidden="true" /> My account
            </Link>
          ) : (
            BUYER_LINKS.map(({ href, label, Icon }) => (
              <Link key={href} href={href} onClick={() => setOpen(false)}>
                <Icon className="header-account-menu-icon" aria-hidden="true" /> {label}
              </Link>
            ))
          )}
          <button type="button" onClick={onLogout} className="header-account-logout">
            <LogOut className="header-account-menu-icon" aria-hidden="true" /> Log out
          </button>
        </div>
      )}
    </div>
  );
}
