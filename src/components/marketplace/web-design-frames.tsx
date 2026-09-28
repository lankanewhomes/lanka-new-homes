"use client";

import { useEffect, useRef, useState } from "react";

const DESKTOP = { width: 1280, height: 800 };
const PHONE = { width: 390, height: 800 };
/** Auto-scroll speed inside a preview, in the sample page's own CSS px per second. */
const AUTO_SCROLL_PX_PER_SECOND = 90;

/**
 * A live, scaled-down preview of the sample site: an iframe of the real page,
 * laid out at its true desktop/phone width and shrunk with a CSS transform to
 * fit whatever width it is given. While it is on screen and nobody is hovering
 * it, it drifts down the page on its own (and jumps back to the top at the
 * end), so a visitor sees the whole design without touching anything;
 * hovering hands control back so they can scroll it themselves. Same-origin,
 * so the parent may drive the iframe's scroll. Skipped for reduced-motion.
 */
function ScaledPreview({ src, title, base }: { src: string; title: string; base: { width: number; height: number } }) {
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
    if (!wrap || !frame || scale === null) return;
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
  }, [scale]);

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

/** Just the laptop (browser bar + live scaled preview), no phone — used in
 * the hero, where there's only room for one device next to the headline.
 * Shares the same live preview as SampleDevices below. */
export function HeroLaptopPreview() {
  return (
    <div className="wdx-laptop">
      <div className="wdx-browser-bar" aria-hidden="true">
        <span className="wdx-browser-dots"><i /><i /><i /></span>
        <span className="wdx-browser-url">halcyonresidences.lk</span>
      </div>
      <ScaledPreview src="/web-design/sample/embed" title="Sample developer website on a desktop screen" base={DESKTOP} />
    </div>
  );
}

/** The laptop + phone pair shown on /web-design, both live previews of the sample homepage. */
export function SampleDevices() {
  return (
    <div className="wdx-devices">
      <HeroLaptopPreview />
      <div className="wdx-phone">
        <div className="wdx-phone-notch" aria-hidden="true" />
        <ScaledPreview src="/web-design/sample/embed" title="Sample developer website on a phone" base={PHONE} />
      </div>
    </div>
  );
}
