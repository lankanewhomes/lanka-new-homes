"use client";

import { X } from "lucide-react";
import { useEffect } from "react";
import { ContactForm } from "./contact-form";

/**
 * The /contact form in a popup — used from /web-design's bottom quickjump
 * bar (owner, 2026-09-28: clicking "Contact" there "should be a pop-up",
 * not a link to the /contact page). Same `.contact-form-panel`/
 * `.contact-form` styling the real /contact page uses, just wrapped in an
 * overlay instead of sitting on the page.
 */
export function ContactModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="contact-modal-overlay" role="dialog" aria-modal="true" aria-label="Contact us" onClick={onClose}>
      <div className="contact-modal-dialog" onClick={(event) => event.stopPropagation()}>
        <div className="contact-modal-head">
          <h2>Get in touch</h2>
          <button type="button" className="contact-modal-close" aria-label="Close" onClick={onClose}>
            <X size={18} aria-hidden="true" />
          </button>
        </div>
        <ContactForm />
      </div>
    </div>
  );
}
