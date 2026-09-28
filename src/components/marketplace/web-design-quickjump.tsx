"use client";

import { useState } from "react";
import { ContactModal } from "./contact-modal";
import { QuickjumpBar } from "./quickjump-bar";

/**
 * /web-design's own floating bottom menu — just 2 items (owner, 2026-09-28:
 * "only two should be enough"): "Samples" jumps to the live-sample band,
 * "Contact" opens the /contact form as a popup right here instead of
 * navigating to the /contact page.
 */
export function WebDesignQuickjump() {
  const [contactOpen, setContactOpen] = useState(false);

  return (
    <>
      <QuickjumpBar
        items={[
          { href: "#sample", label: "Samples" },
          { label: "Contact", onClick: () => setContactOpen(true) },
        ]}
        gateSelector=".wdx-hero"
      />
      <ContactModal open={contactOpen} onClose={() => setContactOpen(false)} />
    </>
  );
}
