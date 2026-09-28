"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export type QuickjumpItem = { label: string } & ({ href: string; onClick?: undefined } | { href?: undefined; onClick: () => void });

/**
 * A floating bottom section-jump menu — the same bar/behavior as a listing
 * page's own `.listing-hero-quickjump-bar` (reuses its exact CSS classes on
 * purpose, see globals.css, so this needed no new styling): on desktop a
 * pill fixed to the bottom of the viewport, hidden until the visitor scrolls
 * past `gateSelector` (so it doesn't sit on top of that element); on phones
 * it becomes the page's own bottom tab bar, always shown, sliding sideways
 * with a tap-to-scroll arrow + one-time "peek" nudge when the links don't
 * all fit. Owner, 2026-09-28: "add floating bottom sticky, like listings".
 * Each item is either a plain section link (`href`) or a button
 * (`onClick`) — used for a "Contact" item that opens a popup instead of
 * navigating (owner, same day: "when they click on it it should be a
 * pop-up", not the /contact page).
 */
export function QuickjumpBar({ items, gateSelector }: { items: readonly QuickjumpItem[]; gateSelector: string }) {
  const barRef = useRef<HTMLDivElement>(null);
  const [pastGate, setPastGate] = useState(false);
  const [scroll, setScroll] = useState({ overflowing: false, left: false, right: false });

  // Desktop-only scroll gating: hidden until the visitor has scrolled past
  // `gateSelector` (usually the hero), same reasoning as the listing hero's
  // own titlePanelRef observer — otherwise it would sit right on top of
  // that section. The mobile bottom tab bar ignores this (always shown).
  useEffect(() => {
    const target = document.querySelector(gateSelector);
    if (!target) return;
    const observer = new IntersectionObserver(([entry]) => setPastGate(!entry.isIntersecting), { threshold: 0 });
    observer.observe(target);
    return () => observer.disconnect();
  }, [gateSelector]);

  // Measured, not inferred from the item count — see the listing hero's own
  // version of this effect for why (five tabs already overflow a 390px
  // phone).
  useEffect(() => {
    const bar = barRef.current;
    if (!bar) return;
    const measure = () => {
      const max = bar.scrollWidth - bar.clientWidth;
      const next = { overflowing: max > 4, left: bar.scrollLeft > 4, right: bar.scrollLeft < max - 4 };
      setScroll((prev) => (prev.overflowing === next.overflowing && prev.left === next.left && prev.right === next.right ? prev : next));
    };
    bar.addEventListener("scroll", measure, { passive: true });
    const resizeObserver = new ResizeObserver(measure);
    resizeObserver.observe(bar);
    Array.from(bar.children).forEach((child) => resizeObserver.observe(child));
    return () => {
      bar.removeEventListener("scroll", measure);
      resizeObserver.disconnect();
    };
  }, [items.length]);

  // One-time "peek" shortly after load, phones only — see the listing hero's
  // own version of this effect.
  useEffect(() => {
    const bar = barRef.current;
    if (!bar) return;
    if (!window.matchMedia("(max-width: 760px)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let back: ReturnType<typeof setTimeout> | undefined;
    let touched = false;
    const markTouched = () => {
      touched = true;
    };
    bar.addEventListener("pointerdown", markTouched, { passive: true });
    bar.addEventListener("wheel", markTouched, { passive: true });
    const start = setTimeout(() => {
      const max = bar.scrollWidth - bar.clientWidth;
      if (max < 8 || bar.scrollLeft > 0 || touched) return;
      bar.scrollTo({ left: Math.min(56, max), behavior: "smooth" });
      back = setTimeout(() => {
        if (!touched) bar.scrollTo({ left: 0, behavior: "smooth" });
      }, 1000);
    }, 1200);
    return () => {
      clearTimeout(start);
      if (back) clearTimeout(back);
      bar.removeEventListener("pointerdown", markTouched);
      bar.removeEventListener("wheel", markTouched);
    };
  }, []);

  const scrollQuickjump = (direction: 1 | -1) => {
    const bar = barRef.current;
    if (!bar) return;
    bar.scrollBy({ left: direction * Math.max(bar.clientWidth * 0.6, 160), behavior: "smooth" });
  };

  if (items.length === 0) return null;

  return (
    <div
      ref={barRef}
      className={`listing-hero-quickjump-bar${items.length > 6 ? " is-scrollable" : ""}${scroll.overflowing ? " is-overflowing" : ""}${scroll.left ? " has-more-left" : ""}${scroll.right ? " has-more-right" : ""}${pastGate ? " is-visible" : ""}`}
      aria-label="Quick jump"
    >
      {items.map((item) =>
        item.href ? (
          <a key={item.label} href={item.href} className="listing-hero-quickjump-btn">
            <span className="listing-hero-quickjump-label">{item.label}</span>
          </a>
        ) : (
          <button key={item.label} type="button" onClick={item.onClick} className="listing-hero-quickjump-btn">
            <span className="listing-hero-quickjump-label">{item.label}</span>
          </button>
        )
      )}
      <button
        type="button"
        className="listing-hero-quickjump-more listing-hero-quickjump-more-left"
        aria-label="Scroll menu left"
        aria-hidden={!scroll.left}
        tabIndex={scroll.left ? 0 : -1}
        onClick={() => scrollQuickjump(-1)}
      >
        <ChevronLeft strokeWidth={2.5} aria-hidden="true" />
      </button>
      <button
        type="button"
        className="listing-hero-quickjump-more listing-hero-quickjump-more-right"
        aria-label="Scroll menu right"
        aria-hidden={!scroll.right}
        tabIndex={scroll.right ? 0 : -1}
        onClick={() => scrollQuickjump(1)}
      >
        <ChevronRight strokeWidth={2.5} aria-hidden="true" />
      </button>
    </div>
  );
}
