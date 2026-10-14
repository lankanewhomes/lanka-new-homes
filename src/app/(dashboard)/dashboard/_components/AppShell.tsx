"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Bell, Check, ChevronDown, ChevronRight, LogOut, Menu, Moon, PanelLeftClose, PanelLeftOpen, Search, ShieldCheck, Sun, User, X } from "lucide-react";
import { useDash } from "./DashProvider";
import { buildSidebar } from "./nav";
import { MOCK_DEVELOPER } from "../_mock/types";

const NOTIFICATIONS = [
  { id: 1, text: "New lead: Nimal Perera asked about The Golf - Colombo 08", when: "12 min ago", unread: true },
  { id: 2, text: "Your featured spot on Colombo ends in 4 days", when: "2 h ago", unread: true },
  { id: 3, text: "Review pending approval: Prime Lands, 5 stars", when: "yesterday", unread: false },
];

export function AppShell({ children }: { children: ReactNode }) {
  const d = useDash();
  const pathname = usePathname();
  const router = useRouter();
  const [drawer, setDrawer] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [closed, setClosed] = useState<Record<string, boolean>>({});
  const [menu, setMenu] = useState<"" | "user" | "bell">("");
  const [q, setQ] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => { d.ensure("leads"); d.ensure("projects"); }, [d]);
  useEffect(() => {
    if (!menu) return;
    const close = (e: MouseEvent) => { if (!menuRef.current?.contains(e.target as Node)) setMenu(""); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [menu]);

  const newLeads = (d.scoped("leads") ?? []).filter((l) => l.status === "new").length;
  const side = useMemo(() => buildSidebar(d.role, newLeads), [d.role, newLeads]);

  // Global search: matches titles of the collections that are loaded in this session.
  const hits = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (s.length < 2) return [];
    const out: { href: string; title: string; kind: string }[] = [];
    for (const slug of ["projects", "lands", "developers", "leads"]) {
      const schema = d.schemaOf(slug);
      const rows = d.scoped(slug) ?? [];
      const title = schema && schema.kind === "collection" ? schema.useAsTitle : null;
      for (const r of rows) {
        const t = String((title ? r[title] : "") ?? "");
        if (t.toLowerCase().includes(s)) out.push({ href: `/dashboard/${slug}/${r.id}`, title: t, kind: slug });
        if (out.length >= 8) return out;
      }
    }
    return out;
  }, [q, d]);

  // Menu rows are flat bordered boxes like the account menu; the open page is a solid dark row with a tick.
  const rowCls = (active: boolean) => `flex items-center gap-2.5 border px-3 py-1.5 text-sm transition ${active ? "border-ink bg-ink font-medium text-white" : "border-line bg-panel text-fg hover:border-fg/40"}`;
  const isActive = (href: string) => { const base = href.split("?")[0]; return pathname === base || (base !== "/dashboard" && pathname.startsWith(`${base}/`)); };
  const nav = (
    <nav className="d-scroll flex-1 overflow-y-auto px-3 pb-6">
      <ul className="mb-2 space-y-1.5">
        {side.top.map((it) => (
          <li key={it.key}>
            <Link href={it.href} title={it.label} onClick={() => setDrawer(false)} className={rowCls(isActive(it.href))}>
              <it.icon size={16} className="shrink-0" />{collapsed ? null : <span className="flex-1 truncate">{it.label}</span>}
              {!collapsed && isActive(it.href) ? <Check size={14} className="shrink-0" /> : null}
            </Link>
          </li>
        ))}
      </ul>
      {side.sections.map((s) => (
        <div key={s.label} className="mt-4">
          {collapsed ? <div className="mx-2 mb-1 border-t border-line" /> : (
            <button type="button" onClick={() => setClosed({ ...closed, [s.label]: !closed[s.label] })} className="d-label flex w-full items-center gap-1 px-0.5 pb-1.5 hover:text-fg">
              {closed[s.label] ? <ChevronRight size={12} /> : <ChevronDown size={12} />}{s.label}
            </button>
          )}
          {closed[s.label] && !collapsed ? null : (
            <ul className="space-y-1.5">
              {s.items.map((it) => (
                <li key={it.key}>
                  <Link href={it.href} title={it.label} onClick={() => setDrawer(false)} className={rowCls(isActive(it.href) && !(it.href.includes("?") && !pathname.includes("?")))}>
                    <it.icon size={16} className="shrink-0" />
                    {collapsed ? null : <span className="flex-1 truncate">{it.label}</span>}
                    {!collapsed && it.badge ? <span className="bg-brand px-1.5 text-[10px] font-semibold text-white">{it.badge}</span> : null}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </nav>
  );

  const brand = (
    <div className="flex h-16 shrink-0 items-center gap-2.5 px-4">
      <span className="text-[17px] font-bold leading-[1.05] tracking-tight">{collapsed ? "L" : <>Lanka<br />NewHomes</>}</span>
      {collapsed ? null : <span className="ml-auto border border-line px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted">{d.role}</span>}
    </div>
  );

  return (
    <div className="flex min-h-screen bg-bg text-fg">
      <aside className={`sticky top-0 hidden h-screen shrink-0 flex-col border-r border-line bg-bg transition-[width] lg:flex ${collapsed ? "w-[64px]" : "w-72"}`}>
        {brand}
        {nav}
        <button type="button" onClick={() => setCollapsed(!collapsed)} className="flex items-center gap-2 border-t border-line px-4 py-3 text-xs text-muted hover:text-fg">
          {collapsed ? <PanelLeftOpen size={16} /> : <><PanelLeftClose size={16} /> Collapse</>}
        </button>
      </aside>

      {drawer ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setDrawer(false)} />
          <aside className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col bg-bg">
            <div className="flex items-center justify-between pr-3">{brand}<button type="button" aria-label="Close menu" onClick={() => setDrawer(false)}><X size={18} /></button></div>
            {nav}
          </aside>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-line bg-panel px-4">
          <button type="button" aria-label="Open menu" onClick={() => setDrawer(true)} className="rounded-md p-1.5 hover:bg-subtle lg:hidden"><Menu size={18} /></button>
          <div className="relative max-w-lg flex-1">
            <div className="flex">
              <div className="relative flex-1">
                <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                <input value={q} onChange={(e) => { setQ(e.target.value); setSearchOpen(true); }} onFocus={() => { setSearchOpen(true); ["lands", "developers"].forEach((s) => d.ensure(s)); }} onBlur={() => setTimeout(() => setSearchOpen(false), 150)} placeholder="Search projects, land, developers, leads…" className="h-10 w-full border border-line bg-panel pl-9 pr-3 text-sm outline-none focus:border-ink" />
              </div>
              <span className="grid h-10 w-10 shrink-0 place-items-center bg-brand text-white" aria-hidden="true"><Search size={17} /></span>
            </div>
            {searchOpen && q.trim().length >= 2 ? (
              <ul className="absolute left-0 right-0 top-full mt-1 overflow-hidden rounded-lg border border-line bg-panel shadow-card">
                {hits.length === 0 ? <li className="px-3 py-2 text-sm text-muted">No results</li> : hits.map((h) => (
                  <li key={h.href}><button type="button" onMouseDown={() => { setQ(""); router.push(h.href); }} className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm hover:bg-subtle"><span className="truncate">{h.title}</span><span className="shrink-0 text-xs text-muted">{h.kind}</span></button></li>
                ))}
              </ul>
            ) : null}
          </div>
          <div className="ml-auto flex items-center gap-1" ref={menuRef}>
            <button type="button" aria-label="Toggle theme" onClick={d.toggleTheme} className="rounded-md p-2 text-muted hover:bg-subtle hover:text-fg">{d.theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}</button>
            <div className="relative">
              <button type="button" aria-label="Notifications" onClick={() => setMenu(menu === "bell" ? "" : "bell")} className="relative rounded-md p-2 text-muted hover:bg-subtle hover:text-fg">
                <Bell size={17} /><span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-brand" />
              </button>
              {menu === "bell" ? (
                <div className="absolute right-0 mt-2 w-80 overflow-hidden rounded-lg border border-line bg-panel shadow-card">
                  <div className="border-b border-line px-3 py-2 text-sm font-semibold">Notifications</div>
                  {NOTIFICATIONS.map((n) => (
                    <div key={n.id} className="flex gap-2 border-b border-line px-3 py-2.5 text-sm last:border-0">
                      <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${n.unread ? "bg-brand" : "bg-line"}`} />
                      <div><p>{n.text}</p><p className="text-xs text-muted">{n.when}</p></div>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
            <div className="relative">
              <button type="button" aria-label="Account menu" onClick={() => setMenu(menu === "user" ? "" : "user")} className="flex items-center gap-2 rounded-md p-1 pr-2 hover:bg-subtle">
                <span className="grid h-8 w-8 place-items-center rounded-full bg-ink text-xs font-semibold text-white">{d.role === "admin" ? "RS" : "PL"}</span>
                <ChevronDown size={14} className="hidden text-muted sm:block" />
              </button>
              {menu === "user" ? (
                <div className="absolute right-0 mt-2 w-64 overflow-hidden rounded-lg border border-line bg-panel shadow-card">
                  <div className="border-b border-line px-3 py-2.5">
                    <p className="text-sm font-semibold">{d.role === "admin" ? "Rupan Sinnarajah" : MOCK_DEVELOPER.name}</p>
                    <p className="text-xs text-muted">{d.role === "admin" ? "rupan@lankanewhomes.com" : MOCK_DEVELOPER.email}</p>
                  </div>
                  <div className="p-2">
                    <p className="px-1 pb-1 text-[11px] font-semibold uppercase tracking-wide text-muted">Preview as</p>
                    <div className="grid grid-cols-2 gap-1 rounded-md bg-subtle p-1">
                      {(["admin", "developer"] as const).map((r) => (
                        <button key={r} type="button" onClick={() => { d.setRole(r); setMenu(""); d.toast(`Now previewing the ${r === "admin" ? "Admin" : "Developer"} view`, "info"); router.push("/dashboard/overview"); }} className={`flex items-center justify-center gap-1.5 rounded px-2 py-1.5 text-xs font-medium ${d.role === r ? "bg-panel shadow-sm" : "text-muted hover:text-fg"}`}>
                          {r === "admin" ? <ShieldCheck size={13} /> : <User size={13} />}{r === "admin" ? "Admin" : "Developer"}
                        </button>
                      ))}
                    </div>
                  </div>
                  <Link href="/dashboard/login" onClick={() => setMenu("")} className="flex items-center gap-2 border-t border-line px-3 py-2.5 text-sm text-muted hover:bg-subtle hover:text-fg"><LogOut size={15} /> Sign out</Link>
                </div>
              ) : null}
            </div>
          </div>
        </header>
        <main className="mx-auto w-full max-w-[1400px] flex-1 px-4 py-8 sm:px-8">{children}</main>
      </div>
    </div>
  );
}
