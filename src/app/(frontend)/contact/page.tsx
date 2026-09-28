import type { Metadata } from "next";
import { Check } from "lucide-react";
import Link from "next/link";
import { ContactForm } from "@/components/marketplace/contact-form";

export const metadata: Metadata = {
  title: "Contact",
  description: "Get in touch with the LankaNewHomes team.",
  alternates: { canonical: "/contact" },
};

// Owner, 2026-09-28: shared a reference screenshot (a two-column contact
// panel — bordered box, dot-grid texture, a divider between a left info
// column and a right form card, corner-bracket accents, underline-style
// form fields) and asked for this structure "with the info you already
// have... use the brand's fonts and colors" — so the layout below follows
// that reference, but every colour is LankaNewHomes' own (#f47b36 orange,
// #1f1f1f ink) and every font is Archivo (var(--font-ref-sans)), not the
// reference's navy/monospace look. The 3-column mini-grid replaces the
// reference's 3 office locations with the 3 real ways to reach LNH
// (General / Founder / Developers) — no address is shown; one was added
// and removed twice earlier the same session, by the owner's own call.
export default function ContactPage() {
  return (
    <div className="contact-panel-wrap">
      <div className="contact-panel">
        <div className="contact-panel-left">
          <span className="contact-corner" aria-hidden="true" />
          <h1>We&apos;re here to help.</h1>
          <p>Have a question about a listing, a developer partnership, or the platform itself? Reach us directly — we usually reply within one business day.</p>

          <div className="contact-mini-grid">
            <div className="contact-mini-col">
              <p className="contact-mini-label">General</p>
              <p className="contact-mini-detail"><a href="mailto:support@lankanewhomes.com">support@lankanewhomes.com</a></p>
            </div>
            <div className="contact-mini-col">
              <p className="contact-mini-label">Founder</p>
              <p className="contact-mini-detail">Rupan<br /><a href="mailto:rupan@lankanewhomes.com">rupan@lankanewhomes.com</a><br /><a href="tel:+16477165155">+1 647 716 5155</a></p>
            </div>
            <div className="contact-mini-col">
              <p className="contact-mini-label">Developers</p>
              <p className="contact-mini-detail"><a href="mailto:support@lankanewhomes.com">support@lankanewhomes.com</a><br /><Link href="/developers/register">Register as a developer</Link></p>
            </div>
          </div>

          <p className="contact-panel-footnote">
            For anything else — a question, a suggestion, a specific request — email us directly. We&apos;re happy to help.
          </p>
          <a href="mailto:support@lankanewhomes.com" className="contact-panel-email-link">
            support@lankanewhomes.com <Check size={14} strokeWidth={3} aria-hidden="true" />
          </a>
        </div>

        <div className="contact-panel-right">
          <span className="contact-corner" aria-hidden="true" />
          <h2>Contact us</h2>
          <ContactForm />
        </div>
      </div>
    </div>
  );
}
