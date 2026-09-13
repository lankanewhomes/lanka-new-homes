"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentType } from "react";

// Client-only for active-state highlighting (usePathname) — everything
// else about AdminNav stays a server component.
export function NavLink({ href, label, icon: Icon }: { href: string; label: string; icon: ComponentType<{ size?: number; className?: string }> }) {
  const pathname = usePathname();
  // Exact match for the dashboard root; prefix match for everything else
  // so a filtered link (e.g. .../leads?where...) and its plain collection
  // link don't both light up at once — only the plain one does, since the
  // filtered variant is reached via its own explicit href, not pathname.
  const isActive = href === "/cms" ? pathname === "/cms" : pathname?.startsWith(href.split("?")[0]) && !href.includes("?");

  return (
    <Link href={href} className={`ln-nav-link${isActive ? " is-active" : ""}`}>
      <Icon size={16} className="ln-nav-link-icon" />
      <span>{label}</span>
    </Link>
  );
}
