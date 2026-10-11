"use client";

import { useEffect, useRef } from "react";
import { ExternalLink, X } from "lucide-react";

// "Apartment Explorer": the developer's own live, clickable building view embedded in the listing (owner, 2026-10-10: "dont do
// screenshot, maybe embed"). It is the developer's page itself, so availability and unit details are always current.
// Opened from the hero pill on the listing page (see ProjectHero / APARTMENT_EXPLORERS there).
export function ApartmentExplorer({ projectName, url, onClose }: { projectName: string; url: string; onClose: () => void }) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose]);

  return (
    <div className="axp-modal" role="dialog" aria-modal="true" aria-label={`Apartment Explorer, ${projectName}`}>
      <div className="axp-bar">
        <div className="axp-title">
          <strong>Apartment Explorer</strong>
          <span>{projectName}</span>
        </div>
        <a className="axp-open" href={url} target="_blank" rel="noopener noreferrer">
          Open in a new tab <ExternalLink className="h-4 w-4" aria-hidden="true" />
        </a>
        <button ref={closeRef} type="button" className="axp-close" onClick={onClose} aria-label="Close Apartment Explorer">
          <X className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>
      <iframe className="axp-frame" src={url} title={`Apartment Explorer, ${projectName}`} loading="lazy" allow="fullscreen" />
    </div>
  );
}
