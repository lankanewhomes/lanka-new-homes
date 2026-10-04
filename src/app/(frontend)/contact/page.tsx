import type { Metadata } from "next";
import Link from "next/link";
import { ContactForm } from "@/components/marketplace/contact-form";

export const metadata: Metadata = {
  title: "Contact Us – New Home & Developer Enquiries",
  description: "Get in touch with the LankaNewHomes team.",
  alternates: { canonical: "/contact" },
};

// Owner, 2026-09-28: shared a second reference screenshot (a centred
// eyebrow/heading/subhead, a white rounded form card, a dark "Book a Demo"
// CTA card below it) and asked for the form built to match it closely,
// "even the button" — the field set, the two-part arrow-circle + pill
// Submit button, and the rounded cards all follow that reference. Colours
// are LankaNewHomes' own (#f47b36 orange, #1f1f1f ink) and headings are
// NOT bold (owner, same session: "I don't want bold" on these headings),
// unlike the reference's bold heading and maroon eyebrow (also dropped —
// owner separately said they don't like orange/accent colour on eyebrow
// labels either, so this one is plain ink, not even orange).
//
// The dark CTA card has no equivalent on the reference (a SaaS demo
// booking) — repurposed as the one thing on this page it genuinely maps
// to: driving a developer to register, reusing the real /developers/register
// route and the "Developer partnerships" content this page already had.
export default function ContactPage() {
  return (
    <div className="fdv-page contact-page">
      {/* Owner, 2026-09-30: "redesign this also like the other pages
          (for-developers, press)" — same contained-box system as /about,
          /press and /for-developers (docs/design.md "Page section style:
          contained boxes"): dark hero box, then tinted textured boxes. */}
      <section className="fdv-hero fdv-hero--split" aria-label="Contact">
        <div className="fdv-hero-split-inner">
          <div className="fdv-hero-content">
            <h1 className="fdv-hero-headline">Get in touch with our team.</h1>
            <p className="fdv-hero-sub">
              Have a question about a listing, a developer partnership, or the platform itself? Tell us more below
              and we&apos;ll get back to you within one business day.
            </p>
            <p className="contact-hero-email">
              Prefer email? <a href="mailto:support@lankanewhomes.com" className="press-contact-email">support@lankanewhomes.com</a>
            </p>
            <div className="contact-hero-list">
              <h2>List your project.</h2>
              <p>
                Looking to list a project, advertise on the homepage, or explore placements? Register as a
                developer to get started.
              </p>
              <Link href="/developers/register" className="fdv-cta-final-button">Register as a developer</Link>
            </div>
          </div>
          <div className="contact-form-panel contact-hero-form">
            {/* Owner, 2026-10-03: the developer login link sits on top of the contact form. */}
            <Link href="/developers/login" className="contact-developer-login">
              <span>Already a developer on LankaNewHomes?</span>
              <span className="contact-developer-login-cta">Developer login &rarr;</span>
            </Link>
            <div className="contact-form-head">
              <h2>Send us a message.</h2>
              <p>Tell us what you need and the team will reply within one business day.</p>
            </div>
            <ContactForm />
          </div>
        </div>
      </section>

      {/* Owner, 2026-09-30: "any section you need to add" — routes to the
          real pages for each kind of enquiry. */}
      <section className="fdv-box fdv-box--gray" id="reach" aria-label="Who to contact">
        <div className="wdx-section-head" data-reveal>
          <h2>Where to go.</h2>
          <p>The quickest route for each kind of question.</p>
        </div>
        <div className="fdv-box-grid fdv-box-grid--3" data-reveal>
          <Link href="/projects" className="fdv-box-card fdv-box-card-link">
            <h3>Looking for a home or land</h3>
            <p>Browse new homes and land, and enquire directly with the developer.</p>
          </Link>
          <Link href="/for-developers" className="fdv-box-card fdv-box-card-link">
            <h3>Listing a project</h3>
            <p>See how listing works and what every developer gets for free.</p>
          </Link>
          <Link href="/press" className="fdv-box-card fdv-box-card-link">
            <h3>Press and media</h3>
            <p>Brand assets and key facts for media use.</p>
          </Link>
        </div>
      </section>
    </div>
  );
}
