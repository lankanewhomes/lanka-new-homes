"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { ChevronDown, Search } from "lucide-react";

type Item = { href: string; label: string; icon: ReactNode; badge?: number };
type Section = { label: string; items: Item[] };

const STORAGE_KEY = "lnh-cms-nav-open";

// Does this link point at the page the user is on? A filtered link (…?where…) never
// claims the highlight, so "Leads" and "New leads" don't both light up.
function isActive(href: string, pathname: string | null) {
  if (!pathname || href.includes("?")) return false;
  return href === "/cms" ? pathname === "/cms" : pathname.startsWith(href);
}

// Collapsible groups + a "find a page" box. The group holding the current page is
// always open; the rest stay folded so the sidebar fits on one screen. What the user
// opened is remembered in this browser (best-effort — it works without it).
export function NavSections({ sections }: { sections: Section[] }) {
  const pathname = usePathname();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState<Record<string, boolean>>({});

  useEffect(() => {
    // Read after hydration (not during render) so server and browser markup match; deferred a tick.
    const timer = window.setTimeout(() => {
      try {
        const saved = window.localStorage.getItem(STORAGE_KEY);
        if (saved) setOpen(JSON.parse(saved));
      } catch {
        /* private window / blocked storage — fine */
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const toggle = (label: string, current: boolean) => {
    const next = { ...open, [label]: !current };
    setOpen(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  };

  const needle = query.trim().toLowerCase();
  const matches = useMemo(
    () => (needle ? sections.flatMap((section) => section.items.filter((item) => item.label.toLowerCase().includes(needle) || section.label.toLowerCase().includes(needle)).map((item) => ({ ...item, group: section.label }))) : []),
    [needle, sections],
  );

  return (
    <>
      <label className="ln-nav-search">
        <Search size={15} aria-hidden="true" />
        <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Find a page…" aria-label="Find a page" />
      </label>

      {needle ? (
        <div className="ln-nav-section">
          {matches.length === 0 ? <p className="ln-nav-none">Nothing matches “{query}”.</p> : null}
          {matches.map((item) => (
            <Link key={`${item.group}-${item.href}`} href={item.href} className={`ln-nav-link${isActive(item.href, pathname) ? " is-active" : ""}`}>
              {item.icon}
              <span>{item.label}</span>
              <small className="ln-nav-group-hint">{item.group}</small>
            </Link>
          ))}
        </div>
      ) : (
        sections.map((section) => {
          const holdsCurrentPage = section.items.some((item) => isActive(item.href, pathname));
          const defaultOpen = section.label === "Listings" || section.label === "Leads";
          const isOpen = holdsCurrentPage || (open[section.label] ?? defaultOpen);
          const badgeTotal = section.items.reduce((sum, item) => sum + (item.badge ?? 0), 0);
          return (
            <div className="ln-nav-section" key={section.label}>
              <button type="button" className="ln-nav-section-toggle" aria-expanded={isOpen} onClick={() => toggle(section.label, isOpen)}>
                <span>{section.label}</span>
                {!isOpen && badgeTotal > 0 ? <span className="ln-nav-badge">{badgeTotal}</span> : null}
                <ChevronDown size={14} className={`ln-nav-chevron${isOpen ? " is-open" : ""}`} aria-hidden="true" />
              </button>
              {isOpen
                ? section.items.map((item) => (
                    <Link key={item.href} href={item.href} className={`ln-nav-link${isActive(item.href, pathname) ? " is-active" : ""}`}>
                      {item.icon}
                      <span>{item.label}</span>
                      {item.badge ? <span className="ln-nav-badge">{item.badge}</span> : null}
                    </Link>
                  ))
                : null}
            </div>
          );
        })
      )}
    </>
  );
}
