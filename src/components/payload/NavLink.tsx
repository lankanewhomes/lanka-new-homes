"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

// Client-only for active-state highlighting (usePathname) — everything
// else about AdminNav stays a server component. `icon` is a rendered
// element (e.g. `<LayoutDashboard size={16} />`), not a component
// reference — a server component can't pass a component/function as a
// prop across the client boundary (only already-rendered elements/nodes),
// so AdminNav renders the icon itself before handing it to this component.
export function NavLink({ href, label, icon }: { href: string; label: string; icon: ReactNode }) {
  const pathname = usePathname();
  // Exact match for the dashboard root; prefix match for everything else
  // so a filtered link (e.g. .../leads?where...) and its plain collection
  // link don't both light up at once — only the plain one does, since the
  // filtered variant is reached via its own explicit href, not pathname.
  const isActive = href === "/cms" ? pathname === "/cms" : pathname?.startsWith(href.split("?")[0]) && !href.includes("?");

  return (
    <Link href={href} className={`ln-nav-link${isActive ? " is-active" : ""}`}>
      {icon}
      <span>{label}</span>
    </Link>
  );
}
