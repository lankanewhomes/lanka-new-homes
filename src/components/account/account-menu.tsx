"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bell, Building2, Check, ChevronDown, Heart, LayoutDashboard, MessageSquare, Scale, Settings, UserRound } from "lucide-react";
import { ACCOUNT_NAV_LINKS } from "@/lib/account-nav";

const ICONS: Record<string, React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>> = {
  "/account": LayoutDashboard,
  "/account/saved": Heart,
  "/account/developments": Building2,
  "/account/compare": Scale,
  "/account/alerts": Bell,
  "/account/enquiries": MessageSquare,
  "/account/profile": UserRound,
  "/account/settings": Settings,
};

// Owner, 2026-10-02: on mobile the account menu is a dropdown, so tapping
// "My Enquiries" lands straight on that page instead of on a stack of menu
// buttons ("redesign it better, more user friendly"): a bar showing where you
// are, and a panel that floats over the page with icons and large tap targets.
// It closes on selecting a page, tapping outside, or pressing Escape. Desktop
// (>900px) always shows the full list and the bar is hidden by CSS. Each page
// renders its own menu, so it starts closed after every navigation.
export function AccountMenu({ active }: { active: string }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLElement>(null);
  const currentLink = ACCOUNT_NAV_LINKS.find((link) => link.href === active);
  const CurrentIcon = ICONS[active] ?? LayoutDashboard;

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <aside ref={rootRef} className={`account-side${open ? " is-open" : ""}`}>
      <button type="button" className="account-side-toggle" aria-expanded={open} aria-controls="account-menu-list" onClick={() => setOpen((value) => !value)}>
        <CurrentIcon className="account-side-icon" aria-hidden />
        <span className="account-side-current">{currentLink?.label ?? "Account menu"}</span>
        <span className="account-side-hint">{open ? "Close" : "Menu"}</span>
        <ChevronDown className="account-side-chevron" aria-hidden />
      </button>
      <nav aria-label="Account menu">
        <ul id="account-menu-list">
          {ACCOUNT_NAV_LINKS.map((link) => {
            const Icon = ICONS[link.href] ?? LayoutDashboard;
            const isCurrent = link.href === active;
            return (
              <li key={link.href}>
                <Link href={link.href} aria-current={isCurrent ? "page" : undefined} onClick={() => setOpen(false)}>
                  <Icon className="account-side-icon" aria-hidden />
                  <span>{link.label}</span>
                  {isCurrent ? <Check className="account-side-check" aria-hidden /> : null}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
