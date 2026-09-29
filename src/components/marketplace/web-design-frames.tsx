"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";

export const DESKTOP = { width: 1280, height: 800 };
const PHONE = { width: 390, height: 800 };
/** Auto-scroll speed inside a preview, in the sample page's own CSS px per second. */
const AUTO_SCROLL_PX_PER_SECOND = 90;

/** The sample sites, for the browse switcher on /web-design's live-sample
 * band (web-design-sample-switcher.tsx) — one real, live site each, not a
 * mockup. Adding another sample means adding one line here plus its own
 * theme file + routes (see theme-meridian.ts's comment).
 *
 * heroImage: a real screenshot of that sample site's own hero (nav, headline,
 * photo — not a bare stock photo) for the hero marquee — owner, 2026-09-28:
 * "the images needs to be of a websites. like you had the website before"
 * (after an earlier pass used the theme's raw Unsplash photo instead, which
 * read as generic property photography rather than "a website"). Captured
 * at public/web-design/marquee-<id>.jpg — regenerate if a sample's hero
 * design changes. */
export const SAMPLE_SITES = [
  { id: "halcyon", label: "Halcyon Residences", propertyType: "Garden villas", browserUrl: "halcyonresidences.lk", embedSrc: "/web-design/sample/embed", href: "/web-design/sample", heroImage: "/web-design/marquee-halcyon.jpg" },
  { id: "meridian", label: "Meridian Heights", propertyType: "Apartment tower", browserUrl: "meridianheights.lk", embedSrc: "/web-design/sample/meridian/embed", href: "/web-design/sample/meridian", heroImage: "/web-design/marquee-meridian.jpg" },
  { id: "azure-cove", label: "Azure Cove", propertyType: "Beachfront villas", browserUrl: "azurecove.lk", embedSrc: "/web-design/sample/azure-cove/embed", href: "/web-design/sample/azure-cove", heroImage: "/web-design/marquee-azure-cove.jpg" },
  { id: "obsidian", label: "Obsidian Villas", propertyType: "Architectural villas", browserUrl: "obsidianvillas.lk", embedSrc: "/web-design/sample/obsidian/embed", href: "/web-design/sample/obsidian", heroImage: "/web-design/marquee-obsidian.jpg" },
  { id: "highgrove", label: "Highgrove Estate", propertyType: "Hillside villas", browserUrl: "highgroveestate.lk", embedSrc: "/web-design/sample/highgrove/embed", href: "/web-design/sample/highgrove", heroImage: "/web-design/marquee-highgrove.jpg" },
  { id: "willow-court", label: "Willow Court", propertyType: "Townhouses", browserUrl: "willowcourt.lk", embedSrc: "/web-design/sample/willow-court/embed", href: "/web-design/sample/willow-court", heroImage: "/web-design/marquee-willow-court.jpg" },
] as const;

/** How many sites the hero marquee shows — capped so the hero stays light as
 * more samples get added (owner, 2026-09-28: "create more 10 sample
 * websites"); the full list above is always browsable in the Live Sample
 * band further down the page via SampleSiteSwitcher. */
const HERO_MARQUEE_COUNT = 4;

/**
 * A live, scaled-down preview of a real page: an iframe laid out at its true
 * desktop/phone width and shrunk with a CSS transform to fit whatever width
 * it is given. While it is on screen and nobody is hovering it, it drifts
 * down the page on its own (and jumps back to the top at the end), so a
 * visitor sees the whole design without touching anything; hovering hands
 * control back so they can scroll it themselves. Same-origin, so the parent
 * may drive the iframe's scroll. Skipped for reduced-motion.
 *
 * Exported — /for-developers reuses this for its "A better way to present
 * your developments" section (owner, 2026-09-29: "can you show the acutal
 * hero section and over section"), pointed at a real `/projects/{slug}`
 * page instead of a sample-site embed. That page carries the site's own
 * header/nav/footer, which is the point there: it's showing a developer
 * exactly what their listing looks like on LankaNewHomes, not a standalone
 * site design the way the /web-design samples are.
 */
export function ScaledPreview({ src, title, base, autoScroll = true }: { src: string; title: string; base: { width: number; height: number }; autoScroll?: boolean }) {
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

/** A single frame for the hero marquee — a plain static photo, not a live
 * iframe (owner, 2026-09-28: "just put the images, dont have the browser...
 * taking too much time to load and rendering issue" — six iframes each
 * loading a real page was heavy and made the slide look stuck rather than
 * moving). No browser chrome either, per the same note. */
function MarqueeFrame({ site }: { site: (typeof SAMPLE_SITES)[number] }) {
  return (
    <div className="wdx-marquee-frame" aria-hidden="true">
      <Image src={site.heroImage} alt="" fill sizes="(max-width: 760px) 220px, (max-width: 1000px) 280px, 420px" className="wdx-marquee-frame-img" />
    </div>
  );
}

/** Continuously slides a curated subset of the sample sites' hero photos right to left
 * in the hero, under the headline — owner, 2026-09-28, referencing a
 * Webflow template's hero. The track holds two copies of the same
 * three-frame set back to back so the CSS animation (wdx-marquee-slide,
 * translateX 0 -> -50%) loops seamlessly; @media (prefers-reduced-motion)
 * turns it off in globals.css. `aria-hidden` on the whole thing — it's
 * the same sample content already reachable (and properly labelled) from
 * the "Live sample" section below, not new information. */
export function HeroMarquee() {
  const featured = SAMPLE_SITES.slice(0, HERO_MARQUEE_COUNT);
  const frames = [...featured, ...featured];
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
