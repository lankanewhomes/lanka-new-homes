"use client";

import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { SAMPLE_NAV } from "./sample-data";

// The sample site's own header: transparent over the hero, solid cream once the
// page has scrolled, with a slide-down menu on phones.
export function SampleHeader({ hasBanner }: { hasBanner: boolean }) {
  const [solid, setSolid] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setSolid(window.scrollY > 48);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className={`smp-header${hasBanner ? " smp-header-below-banner" : ""}${solid || open ? " is-solid" : ""}`}>
      <div className="smp-header-inner">
        <a href="#top" className="smp-logo" aria-label="Halcyon Residences — home">
          <span className="smp-logo-mark">Halcyon</span>
          <span className="smp-logo-sub">Residences</span>
        </a>

        <nav className="smp-nav" aria-label="Main">
          {SAMPLE_NAV.map((item) => (
            <a key={item.href} href={item.href}>{item.label}</a>
          ))}
        </nav>

        <a href="#enquire" className="smp-btn smp-btn-brass smp-header-cta">Register interest</a>

        <button
          type="button"
          className="smp-menu-toggle"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
        >
          {open ? <X size={22} aria-hidden="true" /> : <Menu size={22} aria-hidden="true" />}
        </button>
      </div>

      {open ? (
        <nav className="smp-mobile-menu" aria-label="Mobile">
          {SAMPLE_NAV.map((item) => (
            <a key={item.href} href={item.href} onClick={() => setOpen(false)}>{item.label}</a>
          ))}
          <a href="#enquire" className="smp-btn smp-btn-brass" onClick={() => setOpen(false)}>Register interest</a>
        </nav>
      ) : null}
    </header>
  );
}
