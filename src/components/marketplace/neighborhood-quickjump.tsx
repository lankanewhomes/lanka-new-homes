"use client";

import { useEffect, useState } from "react";
import { Building2, Camera, HelpCircle, Home, Landmark, Map as MapIcon } from "lucide-react";

// A resolved icon *component* can't itself cross the server->client prop boundary (same
// constraint as NEARBY_CATEGORY_ICON in components.tsx) — the server page passes a plain string
// key instead, and this "use client" module resolves it to a real icon locally.
const ICON: Record<string, typeof Home> = { overview: Home, photos: Camera, projects: Building2, landmarks: Landmark, map: MapIcon, faq: HelpCircle };

export type NeighborhoodQuickjumpItem = {
  key: keyof typeof ICON;
  href: string;
  label: string;
  show: boolean;
};

// Same floating pill (desktop, once the hero title has scrolled past) / bottom tab bar (mobile,
// always shown) as the project/floor-plan/land pages' ProjectHero — reusing its
// .listing-hero-quickjump-* classes so this doesn't drift into a second visual style. Unlike
// ProjectHero's version this only needs plain in-page anchors (no lightbox), so it's a small,
// self-contained client component instead of wiring the whole neighborhood page into one.
export function NeighborhoodQuickjumpBar({ titlePanelId, items }: { titlePanelId: string; items: NeighborhoodQuickjumpItem[] }) {
  const [scrolledPastTitle, setScrolledPastTitle] = useState(false);

  useEffect(() => {
    const target = document.getElementById(titlePanelId);
    if (!target) return;
    const observer = new IntersectionObserver(([entry]) => setScrolledPastTitle(!entry.isIntersecting), { threshold: 0 });
    observer.observe(target);
    return () => observer.disconnect();
  }, [titlePanelId]);

  const visible = items.filter((item) => item.show);
  if (!visible.length) return null;

  return (
    <div className={`listing-hero-quickjump-bar${scrolledPastTitle ? " is-visible" : ""}`} aria-label="Quick jump">
      {visible.map((item) => {
        const Icon = ICON[item.key];
        return (
          <a key={item.key} href={item.href} className="listing-hero-quickjump-btn">
            <Icon className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
            <span className="listing-hero-quickjump-label">{item.label}</span>
          </a>
        );
      })}
    </div>
  );
}
