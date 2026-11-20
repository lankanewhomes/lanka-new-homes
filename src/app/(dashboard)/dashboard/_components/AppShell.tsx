"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { BarChart3, Bell, Building, ChevronDown, ChevronUp, CreditCard, ListChecks, LogOut, Mail, Megaphone, Menu, MessageCircle, Moon, Newspaper, Package, PanelLeftClose, PanelLeftOpen, Search, Settings, Sun, Users, X, type LucideIcon } from "lucide-react";
import { useDash } from "./DashProvider";
import { apiCount, apiFind, apiLogout } from "../_data/api";
import { allOf } from "../_data/scope";
import { buildSidebar } from "./nav";


export function AppShell({ children }: { children: ReactNode }) {
  const d = useDash();
  const pathname = usePathname();
  const router = useRouter();
  const [drawer, setDrawer] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  const [menu, setMenu] = useState<"" | "user" | "bell">("");
  const [q, setQ] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  // The clicked page (`to`) counts as open only while we are still on the page it was clicked from (`from`), so no effect is needed to clear it.
  const [going, setGoing] = useState<{ from: string; to: string } | null>(null);

  useEffect(() => {
    if (!menu) return;
    const close = (e: MouseEvent) => { if (!menuRef.current?.contains(e.target as Node)) setMenu(""); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [menu]);

  // Live numbers from Payload: the "new leads" badge and the bell (latest enquiries), refreshed on every page change.
  const [newLeads, setNewLeads] = useState(0);
  const [recent, setRecent] = useState<{ id: number | string; name: string; project: unknown; at: string }[]>([]);
  const leadsFetchedAt = useRef(0);
  useEffect(() => {
    // Refreshed when a page opens, but at most once a minute, so moving around the menu does not fire two requests per click.
    if (Date.now() - leadsFetchedAt.current < 60_000) return;
    leadsFetchedAt.current = Date.now();
    let alive = true;
    (async () => {
      try {
        const scope = d.scope("leads");
        const [count, page] = await Promise.all([
          apiCount("leads", allOf(scope, { status: { equals: "new" } })),
          apiFind("leads", { limit: 5, sort: "-createdAt", where: scope, select: { name: true, project: true, createdAt: true } }),
        ]);
        if (!alive) return;
        setNewLeads(count);
        setRecent(page.docs.map((l) => ({ id: l.id, name: String(l.name ?? "Someone"), project: l.project, at: String(l.createdAt ?? "") })));
        d.ensureLabels("projects", page.docs.map((l) => l.project));
      } catch { /* the badge is optional */ }
    })();
    return () => { alive = false; };
  }, [d, pathname]);
  const side = useMemo(() => buildSidebar(d.role, newLeads, d.session.developerIds[0]), [d.role, newLeads, d.session.developerIds]);

  // Global search: matches titles in Projects, Land, Developers and Leads, within what this login may see.
  const [hits, setHits] = useState<{ href: string; title: string; kind: string }[]>([]);
  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) return;
    let alive = true;
    const t = setTimeout(async () => {
      const found: { href: string; title: string; kind: string }[] = [];
      await Promise.all([["projects", "name"], ["lands", "title"], ["developers", "name"], ["leads", "name"]].map(async ([slug, field]) => {
        try {
          const page = await apiFind(slug, { limit: 3, where: allOf(d.scope(slug), { [field]: { like: term } }), select: { [field]: true } });
          page.docs.forEach((r) => found.push({ href: `/dashboard/${slug}/${r.id}`, title: String(r[field] ?? ""), kind: slug }));
        } catch { /* skip a collection this login cannot read */ }
      }));
      if (alive) setHits(found.slice(0, 10));
    }, 300);
    return () => { alive = false; clearTimeout(t); };
  }, [q, d]);

  // Sidebar (owner, 2026-10-18): a soft grey panel with square corners (no radius anywhere in the sidebar); every group is a collapsible row with an icon and a chevron, its pages sit under it as
  // plain text, and the open page is a white pill. The group that holds the open page is open by default.
  const GROUP_ICON: Record<string, LucideIcon> = { Listings: Building, "Companies & Professionals": Users, Leads: MessageCircle, Content: Newspaper, Marketing: Megaphone, Mail, Billing: CreditCard, Analytics: BarChart3, Users, Settings, Other: Package };
  // Speed (owner, 2026-11-16, "make it fast"): the clicked page lights up at once (`going`), before the new page has arrived.
  const here = going && going.from === pathname ? going.to : pathname;
  const isActive = (href: string) => { const base = href.split("?")[0]; return here === base || (base !== "/dashboard" && here.startsWith(`${base}/`)); };
  const go = (href: string) => { setDrawer(false); const base = href.split("?")[0]; if (base !== pathname) setGoing({ from: pathname, to: base }); };
  const holdsActive = (items: { href: string }[]) => items.some((it) => isActive(it.href));
  const groupOpen = (label: string, items: { href: string }[]) => (label in openGroups ? openGroups[label] : holdsActive(items));
  // Restyle (owner, 2026-11-16, "give me a different design and make it fast. change the logo also"): dark ink panel running full height, the real
  // lowercase logo in white at the top, the open page as a solid orange rounded pill, groups as plain rows with their pages on a thin guide line.
  const pill = (active: boolean) => `mx-3 flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] ${active ? "bg-brand font-semibold text-white shadow-[0_4px_14px_rgba(244,123,54,0.35)]" : "text-side-text hover:bg-side-active hover:text-white"}`;
  const groupCls = (holds: boolean) => `mx-3 flex w-[calc(100%-1.5rem)] items-center gap-3 rounded-lg px-3 py-2 text-[13px] hover:bg-side-active hover:text-white ${holds ? "font-semibold text-white" : "text-side-text"}`;
  const caption = "px-6 pb-1.5 pt-3 text-[10.5px] font-semibold uppercase tracking-[0.09em] text-side-text/60";
  const badgeCls = "rounded-full bg-white px-2 py-0.5 text-[10px] font-bold text-ink";
  const nav = (
    <nav className="d-scroll flex-1 overflow-y-auto pb-4">
      {collapsed ? null : <p className={caption}>Work</p>}
      <ul className="space-y-0.5 pt-1">
        {side.top.map((it) => (
          <li key={it.key}>
            <Link href={it.href} title={it.label} onClick={() => go(it.href)} className={pill(isActive(it.href))}>
              <it.icon size={17} strokeWidth={1.6} className="shrink-0" />{collapsed ? null : <span className="flex-1 truncate">{it.label}</span>}
            </Link>
          </li>
        ))}
      </ul>
      {collapsed ? <div className="mx-3 mt-3 border-t border-white/10" /> : <p className={`${caption} mt-2`}>Manage</p>}
      <div className="mt-1 space-y-0.5">
        {side.sections.map((s) => {
          const GroupIcon = GROUP_ICON[s.label] ?? ListChecks;
          const open = groupOpen(s.label, s.items);
          const holds = holdsActive(s.items);
          if (collapsed) return <Link key={s.label} href={s.items[0].href} title={s.label} className={pill(holds)}><GroupIcon size={17} strokeWidth={1.6} className="shrink-0" /></Link>;
          const groupBadge = s.items.reduce((sum, it) => sum + (it.badge ?? 0), 0);
          return (
            <div key={s.label}>
              <button type="button" aria-expanded={open} onClick={() => setOpenGroups({ ...openGroups, [s.label]: !open })} className={groupCls(holds)}>
                <GroupIcon size={17} strokeWidth={1.6} className="shrink-0" /><span className="flex-1 truncate text-left">{s.label}</span>
                {!open && groupBadge ? <span className={badgeCls}>{groupBadge}</span> : null}
                {open ? <ChevronUp size={14} className="shrink-0" /> : <ChevronDown size={14} className="shrink-0" />}
              </button>
              {open ? (
                <ul className="mb-1 ml-[30px] mt-0.5 space-y-0.5 border-l border-white/10">
                  {s.items.map((it) => (
                    <li key={it.key}>
                      <Link href={it.href} title={it.label} onClick={() => go(it.href)} className={`${pill((it.exact ? here === it.href : isActive(it.href)) && !(it.href.includes("?") && !pathname.includes("?")))} ml-2 py-1.5 text-[12.5px]`}>
                        <span className="flex-1 truncate">{it.label}</span>
                        {it.badge ? <span className={badgeCls}>{it.badge}</span> : null}
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          );
        })}
      </div>
    </nav>
  );

  const brand = (
    <div className="flex h-[76px] shrink-0 items-center gap-2.5 px-6">
      <Link href="/dashboard/overview" aria-label="LankaNewHomes dashboard" onClick={() => go("/dashboard/overview")} className="flex items-center">
        {collapsed
          ? <span className="grid h-9 w-9 place-items-center rounded-lg bg-brand text-[19px] font-bold lowercase leading-none text-white">l</span>
          // eslint-disable-next-line @next/next/no-img-element -- a small static PNG from /public; no image optimiser needed (the Cloudflare image quota is tight)
          : <img src="/brand/lankanewhomes-logo-white.png" alt="LankaNewHomes" width={640} height={287} className="h-[42px] w-auto" />}
      </Link>
      {collapsed ? null : <span className="ml-auto rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-white/75">{d.role}</span>}
    </div>
  );

  return (
    <div className="flex min-h-screen bg-bg text-fg">
      <aside className={`sticky top-0 hidden h-screen shrink-0 transition-[width] lg:block ${collapsed ? "w-[84px]" : "w-[272px]"}`}>
        <div className="flex h-full flex-col overflow-hidden border-r border-white/5 bg-side">
          {brand}
          {nav}
          <button type="button" onClick={() => setCollapsed(!collapsed)} className="flex items-center gap-2 border-t border-white/10 px-6 py-3 text-xs text-side-text hover:text-white">
            {collapsed ? <PanelLeftOpen size={16} /> : <><PanelLeftClose size={16} /> Collapse</>}
          </button>
        </div>
      </aside>

      {drawer ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setDrawer(false)} />
          <aside className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col bg-side">
            <div className="flex items-center justify-between pr-3">{brand}<button type="button" aria-label="Close menu" onClick={() => setDrawer(false)} className="text-white"><X size={18} /></button></div>
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
                <input value={q} onChange={(e) => { setQ(e.target.value); setSearchOpen(true); }} onFocus={() => setSearchOpen(true)} onBlur={() => setTimeout(() => setSearchOpen(false), 150)} placeholder="Search projects, land, developers, leads…" className="h-10 w-full border border-line bg-panel pl-9 pr-3 text-sm outline-none focus:border-ink" />
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
                  <div className="border-b border-line px-3 py-2 text-sm font-semibold">Latest enquiries</div>
                  {recent.length === 0 ? <p className="px-3 py-4 text-sm text-muted">No enquiries yet.</p> : recent.map((n) => (
                    <Link key={String(n.id)} href={`/dashboard/leads/${n.id}`} onClick={() => setMenu("")} className="flex gap-2 border-b border-line px-3 py-2.5 text-sm last:border-0 hover:bg-subtle">
                      <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand" />
                      <div><p>{n.name} asked about {d.labelOf("projects", typeof n.project === "object" && n.project ? (n.project as { id?: unknown }).id : n.project)}</p><p className="text-xs text-muted">{n.at ? new Date(n.at).toLocaleDateString("en-GB", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }) : ""}</p></div>
                    </Link>
                  ))}
                </div>
              ) : null}
            </div>
            <div className="relative">
              <button type="button" aria-label="Account menu" onClick={() => setMenu(menu === "user" ? "" : "user")} className="flex items-center gap-2 rounded-md p-1 pr-2 hover:bg-subtle">
                <span className="grid h-8 w-8 place-items-center rounded-full bg-ink text-xs font-semibold text-white">{d.session.name.split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase() || "U"}</span>
                <ChevronDown size={14} className="hidden text-muted sm:block" />
              </button>
              {menu === "user" ? (
                <div className="absolute right-0 mt-2 w-64 overflow-hidden rounded-lg border border-line bg-panel shadow-card">
                  <div className="border-b border-line px-3 py-2.5">
                    <p className="text-sm font-semibold">{d.session.name}</p>
                    <p className="text-xs text-muted">{d.session.email}</p>
                    <p className="d-label mt-1.5">{d.role === "admin" ? "Admin" : "Developer"}</p>
                  </div>
                  <button type="button" onClick={async () => { await apiLogout(); setMenu(""); router.replace("/developers/login"); router.refresh(); }} className="flex w-full items-center gap-2 border-t border-line px-3 py-2.5 text-left text-sm text-muted hover:bg-subtle hover:text-fg"><LogOut size={15} /> Sign out</button>
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
