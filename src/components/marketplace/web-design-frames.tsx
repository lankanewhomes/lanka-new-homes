"use client";

import { useEffect, useRef, useState } from "react";

const DESKTOP = { width: 1280, height: 800 };
const PHONE = { width: 390, height: 800 };
/** Auto-scroll speed inside a preview, in the sample page's own CSS px per second. */
const AUTO_SCROLL_PX_PER_SECOND = 90;

/** The three sample sites, for the browse switcher on /web-design's live-sample
 * band (web-design-sample-switcher.tsx) — one real, live site each, not a
 * mockup. Adding a 4th sample means adding one line here plus its own
 * theme file + routes (see theme-meridian.ts's comment). */
export const SAMPLE_SITES = [
  { id: "halcyon", label: "Halcyon Residences", propertyType: "Garden villas", browserUrl: "halcyonresidences.lk", embedSrc: "/web-design/sample/embed", href: "/web-design/sample" },
  { id: "meridian", label: "Meridian Heights", propertyType: "Apartment tower", browserUrl: "meridianheights.lk", embedSrc: "/web-design/sample/meridian/embed", href: "/web-design/sample/meridian" },
  { id: "azure-cove", label: "Azure Cove", propertyType: "Beachfront villas", browserUrl: "azurecove.lk", embedSrc: "/web-design/sample/azure-cove/embed", href: "/web-design/sample/azure-cove" },
] as const;

/**
 * A live, scaled-down preview of the sample site: an iframe of the real page,
 * laid out at its true desktop/phone width and shrunk with a CSS transform to
 * fit whatever width it is given. While it is on screen and nobody is hovering
 * it, it drifts down the page on its own (and jumps back to the top at the
 * end), so a visitor sees the whole design without touching anything;
 * hovering hands control back so they can scroll it themselves. Same-origin,
 * so the parent may drive the iframe's scroll. Skipped for reduced-motion.
 */
function ScaledPreview({ src, title, base, autoScroll = true }: { src: string; title: string; base: { width: number; height: number }; autoScroll?: boolean }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLIFrameElement>(null);
  const [scale, setScale] = useState<number | null>(null);

  // Fit the iframe's true width to the box it sits in. ResizeObserver fires once
  // when it starts observing, which gives the first measurement.
  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const observer = new ResizeObserver(() => setScale(wrap.clientWidth / base.width));
    observer.observe(wrap);
    return () => observer.disconnect();
  }, [base.width]);

  useEffect(() => {
    const wrap = wrapRef.current;
    const frame = frameRef.current;
    // autoScroll: false for the hero marquee (HeroMarquee below) — those
    // frames already slide horizontally via CSS; scrolling each one's own
    // content vertically at the same time would be two kinds of motion at
    // once, and IntersectionObserver-driven pausing gets unreliable for an
    // element that's constantly entering/leaving view horizontally anyway.
    if (!wrap || !frame || scale === null || !autoScroll) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let raf = 0;
    let last = 0;
    let visible = false;
    let hovering = false;
    let y = 0;
    let pausedUntil = 0;

    const intersection = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
    }, { threshold: 0.25 });
    intersection.observe(wrap);

    const onEnter = () => {
      hovering = true;
    };
    const onLeave = () => {
      hovering = false;
      try {
        y = frame.contentWindow?.scrollY ?? y;
      } catch {
        // Cross-origin would throw; the preview is same-origin, so this is only a guard.
      }
    };
    wrap.addEventListener("pointerenter", onEnter);
    wrap.addEventListener("pointerleave", onLeave);

    const step = (now: number) => {
      raf = requestAnimationFrame(step);
      const elapsed = now - last;
      last = now;
      if (!visible || hovering || now < pausedUntil || elapsed > 200) return;
      try {
        const win = frame.contentWindow;
        const root = win?.document.documentElement;
        if (!win || !root) return;
        const max = root.scrollHeight - win.innerHeight;
        if (max <= 0) return;
        y += (AUTO_SCROLL_PX_PER_SECOND * elapsed) / 1000;
        if (y >= max) {
          y = 0;
          pausedUntil = now + 2500;
        }
        win.scrollTo({ top: y, behavior: "instant" });
      } catch {
        // Not loaded yet (or blocked) — try again next frame.
      }
    };
    raf = requestAnimationFrame(step);

    return () => {
      cancelAnimationFrame(raf);
      intersection.disconnect();
      wrap.removeEventListener("pointerenter", onEnter);
      wrap.removeEventListener("pointerleave", onLeave);
    };
    // `src` in the deps: switching which sample is loaded (the browse
    // switcher on /web-design) must restart `y` at 0 — otherwise the newly
    // navigated iframe would jump straight to whatever scroll position the
    // PREVIOUS sample had reached, since the iframe element (and its
    // `contentWindow`) is reused across a plain `src` change, not remounted.
  }, [scale, src, autoScroll]);

  return (
    <div ref={wrapRef} className="wdx-preview" style={{ aspectRatio: `${base.width} / ${base.height}` }}>
      {scale !== null ? (
        <iframe
          ref={frameRef}
          src={src}
          title={title}
          loading="lazy"
          tabIndex={-1}
          style={{ width: base.width, height: base.height, transform: `scale(${scale})` }}
        />
      ) : null}
    </div>
  );
}

/** Just the laptop (browser bar + live scaled preview), no phone — the
 * building block SampleDevices below adds the phone to. Defaults to
 * Halcyon's own embed/URL so the hero's fixed (never-switched) preview needs
 * no props. */
function HeroLaptopPreview({ embedSrc = SAMPLE_SITES[0].embedSrc, browserUrl = SAMPLE_SITES[0].browserUrl, title = "Sample developer website on a desktop screen" }: { embedSrc?: string; browserUrl?: string; title?: string }) {
  return (
    <div className="wdx-laptop">
      <div className="wdx-browser-bar" aria-hidden="true">
        <span className="wdx-browser-dots"><i /><i /><i /></span>
        <span className="wdx-browser-url">{browserUrl}</span>
      </div>
      <ScaledPreview src={embedSrc} title={title} base={DESKTOP} />
    </div>
  );
}

/** A single browser-chrome frame for the hero marquee — a smaller, static
 * (no internal auto-scroll) version of HeroLaptopPreview, since the whole
 * frame is already in continuous horizontal motion. */
function MarqueeFrame({ site }: { site: (typeof SAMPLE_SITES)[number] }) {
  return (
    <div className="wdx-marquee-frame" aria-hidden="true">
      <div className="wdx-browser-bar">
        <span className="wdx-browser-dots"><i /><i /><i /></span>
        <span className="wdx-browser-url">{site.browserUrl}</span>
      </div>
      <ScaledPreview src={site.embedSrc} title={`${site.label} preview`} base={DESKTOP} autoScroll={false} />
    </div>
  );
}

/** Continuously slides all three sample sites' browser frames right to
 * left in the hero, next to the headline — owner, 2026-09-28, referencing
 * a Webflow template's hero. The track holds two copies of the same
 * three-frame set back to back so the CSS animation (wdx-marquee-slide,
 * translateX 0 -> -50%) loops seamlessly; @media (prefers-reduced-motion)
 * turns it off in globals.css. `aria-hidden` on the whole thing — it's
 * the same sample content already reachable (and properly labelled) from
 * the "Live sample" section below, not new information. */
export function HeroMarquee() {
  const frames = [...SAMPLE_SITES, ...SAMPLE_SITES];
  return (
    <div className="wdx-marquee" aria-hidden="true">
      <div className="wdx-marquee-track">
        {frames.map((site, index) => (
          <MarqueeFrame site={site} key={`${site.id}-${index}`} />
        ))}
      </div>
    </div>
  );
}

/** The laptop + phone pair, both live previews of the sample homepage —
 * shown in the hero (next to the headline, always Halcyon's) and again in
 * the full sample band below it, where SampleSwitcher (below) drives which
 * one shows via `embedSrc`/`browserUrl`/`label`. */
export function SampleDevices({ embedSrc = SAMPLE_SITES[0].embedSrc, browserUrl = SAMPLE_SITES[0].browserUrl, label = SAMPLE_SITES[0].label }: { embedSrc?: string; browserUrl?: string; label?: string }) {
  return (
    <div className="wdx-devices">
      <HeroLaptopPreview embedSrc={embedSrc} browserUrl={browserUrl} title={`${label} — desktop preview`} />
      <div className="wdx-phone">
        <div className="wdx-phone-notch" aria-hidden="true" />
        <ScaledPreview src={embedSrc} title={`${label} — phone preview`} base={PHONE} />
      </div>
    </div>
  );
}
