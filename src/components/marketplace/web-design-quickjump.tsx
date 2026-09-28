"use client";

import { useState } from "react";
import { LayoutTemplate, MessageCircle } from "lucide-react";
import { ContactModal } from "./contact-modal";
import { QuickjumpBar } from "./quickjump-bar";

/**
 * /web-design's own floating bottom menu — just 2 items (owner, 2026-09-28:
 * "only two should be enough"): "Samples" jumps to the live-sample band,
 * "Contact" opens the /contact form as a popup right here instead of
 * navigating to the /contact page. Icons match the listing-page bar's own
 * style (owner, same day: "needs to look exactly like what you have it on
 * the project listing... it had icons") — `LayoutTemplate` for Samples
 * (this page already uses it for "Designed for your project"),
 * `MessageCircle` for Contact (the site's existing contact icon, see
 * profile-view.tsx's "Contact {developer}" button).
 */
export function WebDesignQuickjump() {
  const [contactOpen, setContactOpen] = useState(false);

  return (
    <>
      <QuickjumpBar
        items={[
          { href: "#sample", label: "Samples", icon: LayoutTemplate },
          { label: "Contact", icon: MessageCircle, onClick: () => setContactOpen(true) },
        ]}
        gateSelector=".wdx-hero"
      />
      <ContactModal open={contactOpen} onClose={() => setContactOpen(false)} />
    </>
  );
}
