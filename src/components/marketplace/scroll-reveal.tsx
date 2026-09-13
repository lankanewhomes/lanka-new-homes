"use client";

import { useEffect } from "react";

// Arms [data-reveal] elements inside .fdv-page with a fade/rise-in as they
// scroll into view. Renders nothing itself — mounts once, tags the page
// root so the CSS transition only ever applies once JS is confirmed
// running, and reduced-motion users (via the CSS media query) never see
// the opacity:0 starting state at all. If IntersectionObserver isn't
// available, every target is revealed immediately rather than staying
// hidden.
export function ScrollReveal() {
  useEffect(() => {
    const root = document.querySelector(".fdv-page");
    if (!root) return;

    root.classList.add("fdv-reveal-armed");
    const targets = Array.from(root.querySelectorAll("[data-reveal]"));
    if (targets.length === 0) return;

    if (!("IntersectionObserver" in window)) {
      targets.forEach((el) => el.classList.add("fdv-in-view"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("fdv-in-view");
            observer.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -60px 0px" }
    );
    targets.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return null;
}
