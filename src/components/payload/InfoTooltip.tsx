"use client";

import { useState } from "react";

// A "?" info-circle that reveals an explanation on hover/focus/tap — used
// on the admin/developer-facing Package tab (PackagePicker) so every
// feature row can explain exactly what it does and, where relevant, where
// on the site it actually shows up (owner, 2026-09-24: "for each feature
// create ? with a circle say what is it doing... also what search
// priority does, where it would show on the website"). Plain inline
// styles + CSS vars to match PackagePicker's own style, since this is a
// Payload admin UI component, not a public-site one.
export function InfoTooltip({ text }: { text: string[] }) {
  const [open, setOpen] = useState(false);
  return (
    <span style={{ position: "relative", display: "inline-flex", verticalAlign: "middle", marginLeft: 6 }}>
      <button
        type="button"
        aria-label="More info"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onClick={() => setOpen((v) => !v)}
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: 16,
          height: 16,
          borderRadius: "50%",
          border: "1px solid var(--theme-elevation-300)",
          background: "var(--theme-elevation-100)",
          color: "var(--theme-elevation-600)",
          fontSize: 10,
          fontWeight: 700,
          lineHeight: 1,
          cursor: "help",
          padding: 0,
        }}
      >
        ?
      </button>
      {open && (
        <span
          role="tooltip"
          style={{
            position: "absolute",
            zIndex: 20,
            bottom: "calc(100% + 6px)",
            left: "50%",
            transform: "translateX(-50%)",
            width: 260,
            padding: "8px 10px",
            borderRadius: 6,
            background: "var(--theme-elevation-900)",
            color: "var(--theme-elevation-0)",
            fontSize: 12,
            fontWeight: 400,
            lineHeight: 1.5,
            textTransform: "none",
            letterSpacing: "normal",
            boxShadow: "0 8px 20px rgba(0,0,0,0.25)",
          }}
        >
          <ul style={{ margin: 0, padding: "0 0 0 14px" }}>
            {text.map((bullet) => (
              <li key={bullet} style={{ marginBottom: 4 }}>
                {bullet}
              </li>
            ))}
          </ul>
        </span>
      )}
    </span>
  );
}
