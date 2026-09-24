"use client";

import { useRef, useState } from "react";
import { createPortal } from "react-dom";

// Public-site sibling of src/components/payload/InfoTooltip.tsx — same "?"
// info-circle + hover/tap explanation pattern, but styled with the site's
// own design system (.pricing-table-info*) instead of Payload's admin
// theme vars, since this renders on /pricing and /for-developers, not
// inside /cms.
//
// Rendered via a portal into document.body instead of inline, positioned
// with the button's own getBoundingClientRect() — the table's sticky
// feature-name column (tbody th, position:sticky + z-index) creates its
// own stacking context per row, so an inline absolutely-positioned bubble
// could never paint above a LATER row's sticky header no matter how high
// its own z-index was (owner report, 2026-09-24: "it needs be on top, its
// behind the features"). Escaping to document.body sidesteps that
// entirely.
export function FeatureInfoTooltip({ text }: { text: string[] }) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const show = () => {
    const rect = buttonRef.current?.getBoundingClientRect();
    if (rect) {
      const bubbleWidth = 260;
      const left = Math.min(rect.left, window.innerWidth - bubbleWidth - 12);
      setCoords({ top: rect.bottom + 8, left: Math.max(12, left) });
    }
    setOpen(true);
  };
  const hide = () => setOpen(false);

  return (
    <span className="pricing-table-info-wrap">
      <button
        ref={buttonRef}
        type="button"
        aria-label="More info"
        className="pricing-table-info"
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={hide}
        onClick={() => (open ? hide() : show())}
      >
        ?
      </button>
      {open && coords && typeof document !== "undefined"
        ? createPortal(
            <span role="tooltip" className="pricing-table-info-bubble" style={{ top: coords.top, left: coords.left }}>
              <ul className="pricing-table-info-bubble-list">
                {text.map((bullet) => (
                  <li key={bullet}>{bullet}</li>
                ))}
              </ul>
            </span>,
            document.body,
          )
        : null}
    </span>
  );
}
