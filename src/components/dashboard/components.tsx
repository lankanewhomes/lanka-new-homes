"use client";

import Link from "next/link";

// Single source of truth for the /account/* sidebar nav.
export const ACCOUNT_NAV_LINKS: { label: string; href: string }[] = [
  { label: "Dashboard", href: "/account" },
  { label: "Saved Properties", href: "/account/saved" },
  { label: "Saved Developments", href: "/account/developments" },
  { label: "Compare", href: "/account/compare" },
  { label: "Saved Searches & Alerts", href: "/account/alerts" },
  { label: "My Enquiries", href: "/account/enquiries" },
  { label: "Profile", href: "/account/profile" },
  { label: "Settings", href: "/account/settings" },
];

export function DashboardSidebar({ links }: { links: { label: string; href: string }[] }) {
  return (
    <aside className="sticky top-6 box-border min-w-0 w-full self-start border-r border-stone-200 bg-white p-4">
      <nav className="grid gap-2 text-sm">
        {links.map((l) => <Link key={`${l.href}-${l.label}`} href={l.href} className="min-w-0 wrap-break-word border border-stone-200 px-3 py-2">{l.label}</Link>)}
      </nav>
    </aside>
  );
}

export function DashboardHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return <div className="space-y-1"><h1 className="text-2xl font-semibold">{title}</h1><p className="text-sm text-stone-600">{subtitle}</p></div>;
}

export function StatCard({ label, value }: { label: string; value: string }) {
  return <article className="border border-stone-200 bg-white p-4"><p className="text-xs uppercase tracking-wide text-stone-500">{label}</p><p className="mt-1 text-2xl font-semibold">{value}</p></article>;
}
