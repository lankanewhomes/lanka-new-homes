import type { Metadata } from "next";
import Link from "next/link";
import { Check } from "lucide-react";
import { ScrollReveal } from "@/components/marketplace/scroll-reveal";
import { SampleSiteSwitcher } from "@/components/marketplace/web-design-sample-switcher";
import { WebDesignQuickjump } from "@/components/marketplace/web-design-quickjump";
import { withSocial } from "@/lib/seo";

// Dropped the editorial Fraunces serif this page used to share with
// /for-developers (owner, 2026-09-27: "all the content thats realted to
// lankanewhomes or LNH the fonts needs to be consistent") — every heading
// here now uses the site's default sans stack instead, matching
// docs/design.md's "no serif anywhere on the site" rule. The `fdv-page`
// wrapper class stays for this page's colour tokens and ScrollReveal
// fade-in, neither of which depend on the font variable that used to be
// loaded here.

export const metadata: Metadata = withSocial({
  title: "Website Design for Property Developers",
  description:
    "Beyond your LankaNewHomes listing — we design and build dedicated project websites for developers, or redesign an existing one, from scratch. See a sample homepage.",
  alternates: { canonical: "/web-design" },
  openGraph: {
    title: "Website Design for Property Developers",
    description:
      "Beyond your LankaNewHomes listing — we design and build dedicated project websites for developers, or redesign an existing one, from scratch.",
    url: "/web-design",
    type: "website",
  },
}, { path: "/web-design" });

const HOMEPAGE_SECTIONS = [
  "Hero and key facts",
  "Residences with plans and pricing",
  "Photo gallery",
  "Amenities",
  "Location and nearby places",
  "Construction progress",
  "Payment plan",
  "Enquiry form and WhatsApp",
  "Brochure download",
  "Buyers from any country",
] as const;

const BUILD_ITEMS = [
  { title: "Hero and key facts", body: "Your best render first, with the facts buyers look for." },
  { title: "Plans and pricing", body: "Every plan, size and price in one clear table." },
  { title: "Photo gallery", body: "Renders and site photos in a fast gallery." },
  { title: "Location and nearby places", body: "A map and real travel times." },
  { title: "Construction progress", body: "Show the build as it happens." },
  { title: "Enquiry form and WhatsApp", body: "Leads go straight to your team." },
] as const;

const FAQS = [
  { q: "Do I need a website if I already have a LankaNewHomes listing?", a: "Most developers end up with both. A listing gets your project discovered by buyers already searching; a website is where every other lead lands — a Facebook ad, a signboard QR code, a referral, a business card." },
  { q: "Can you redesign the website I already have?", a: "Yes. We rebuild it on the same domain, keep the content that's still good and improve the rest." },
  { q: "Will it work well on a phone?", a: "Every site is designed mobile-first, then scaled up for larger screens." },
  { q: "How do buyers get in touch?", a: "Through the enquiry form, WhatsApp click-to-chat and brochure downloads — wired in from the start so an enquiry reaches your team." },
  { q: "Will I see it before it's built?", a: "Yes. You review the design first, and changes at that stage are quick." },
  { q: "How much does it cost?", a: "It depends on the size of the project and what you need, so we quote for each one. Tell us about it and we'll come back to you." },
] as const;

export default function WebDesignPage() {
  return (
    <div className="fdv-page wdx-page">
      <ScrollReveal />

      {/* Owner, 2026-09-30: "redesign this page also" — same contained-box
          system as /for-developers, /about, /press and /contact
          (docs/design.md "Page section style: contained boxes"). */}
      {/* 1 — HERO */}
      <section className="fdv-hero fdv-hero--split" aria-label="Website design for developers">
        <div className="fdv-hero-split-inner">
          <div className="fdv-hero-content">
            <h1 className="fdv-hero-headline">A website as serious as your project.</h1>
            <p className="fdv-hero-sub">
              We design and build a dedicated website for your development — built around your renders, floor plans
              and brand, not a generic template. A new site if you don&apos;t have one, or a rebuild if the one you have
              isn&apos;t working.
            </p>
            <div className="fdv-hero-ctas">
              <Link href="/contact" className="fdv-cta-final-button">Talk to us about a site</Link>
              <a href="#sample" className="fdv-cta-secondary fdv-hero-explore-link">See examples</a>
            </div>
          </div>

          {/* The old hero chip list, as a card beside the copy. */}
          <div className="wdx-hero-checklist">
            <p className="wdx-hero-checklist-title">Everything we can put on your homepage</p>
            <ul aria-label="What we can put on your homepage">
              {HOMEPAGE_SECTIONS.map((label) => (
                <li key={label}>
                  <Check size={14} strokeWidth={2.5} aria-hidden="true" />
                  {label}
                </li>
              ))}
            </ul>
            <div className="wdx-hero-facts" aria-label="At a glance">
              <div><small>Sample sites</small><strong>6</strong></div>
              <div><small>Built for</small><strong>Mobile</strong></div>
              <div><small>Sign-off</small><strong>Yours</strong></div>
            </div>
          </div>
        </div>
      </section>

      {/* Redesign 2026-11-07 (owner): sample sites now come right after the hero, on a cream box with the site's grid lines;
          then listing-vs-website, what we can build, process (cream), FAQ (lilac). No two neighbours share a background. */}
      <section className="fdv-box fdv-box--cream wdx-sample wdx-sample--light" id="sample" aria-label="Sample homepage">
        <div className="wdx-section-head" data-reveal>
          <h2>See what your site could look like.</h2>
          <p>
            We built six complete sample homepages for six fictional developments, each with its own look. Pick one,
            then open the full page.
          </p>
        </div>
        <div data-reveal>
          <SampleSiteSwitcher />
        </div>
      </section>

      <section className="fdv-box fdv-box--gray" id="why-a-website" aria-label="Listing and website">
        <div className="wdx-section-head" data-reveal>
          <h2>A listing gets you found. A website tells your story.</h2>
          <p>Most developers end up with both, and each does a different job.</p>
        </div>
        <div className="fdv-box-grid fdv-box-grid--2" data-reveal>
          <div className="fdv-box-card">
            <h3>LankaNewHomes listing</h3>
            <ul className="wdx-tick-list">
              <li>Reaches buyers already searching</li>
              <li>Plans, prices and enquiries in one place</li>
              <li>Live in days, no build needed</li>
            </ul>
          </div>
          <div className="fdv-box-card">
            <h3>Your own website</h3>
            <ul className="wdx-tick-list">
              <li>Where Facebook ads, QR codes and referrals land</li>
              <li>Your brand, your look, your domain</li>
              <li>Room to tell the whole project story</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="fdv-box fdv-box--sage" id="built" aria-label="What we can build">
        <div className="wdx-section-head" data-reveal>
          <h2>What we can build.</h2>
          <p>Pick what your project needs. Nothing is forced on you.</p>
        </div>
        <div className="fdv-box-grid fdv-box-grid--3" data-reveal>
          {BUILD_ITEMS.map((item, index) => (
            <div className="fdv-box-card" key={item.title}>
              <span className="fdv-box-card-num">{String(index + 1).padStart(2, "0")}</span>
              <h3>{item.title}</h3>
              <p>{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Owner, 2026-09-30: "any section you need to add" — grounded in the
          FAQ's own answers (you review the design first; quoted per
          project). */}
      <section className="fdv-box fdv-box--cream" id="process" aria-label="How we work">
        <div className="wdx-section-head" data-reveal>
          <h2>How we work.</h2>
          <p>A simple process, with your sign-off before anything is built.</p>
        </div>
        <div className="fdv-box-grid fdv-box-grid--4" data-reveal>
          <div className="fdv-box-card">
            <span className="fdv-box-card-num">Step 1</span>
            <h3>Tell us about your project</h3>
            <p>Share the size of the project and what you need. We quote for each one.</p>
          </div>
          <div className="fdv-box-card">
            <span className="fdv-box-card-num">Step 2</span>
            <h3>Review the design</h3>
            <p>You see the design before it&apos;s built, and changes at that stage are quick.</p>
          </div>
          <div className="fdv-box-card">
            <span className="fdv-box-card-num">Step 3</span>
            <h3>We build it</h3>
            <p>Mobile-first, around your renders, floor plans and brand.</p>
          </div>
          <div className="fdv-box-card">
            <span className="fdv-box-card-num">Step 4</span>
            <h3>Launch with enquiries wired in</h3>
            <p>Enquiry form, WhatsApp click-to-chat and brochure downloads, so every lead reaches your team.</p>
          </div>
        </div>
      </section>

      {/* 8 — FAQ — same bordered-card accordion (.guide-page-faq-item) as
          /guides and /neighborhoods, not a bespoke dark-panel style (owner,
          2026-09-29: "faq needs to look this this faq [neighborhoods'] ...
          be constant please"). */}
      <section className="wdx-faq" id="faq" aria-label="Questions">
        <div className="wdx-section-head" data-reveal>
          <h2>What developers ask us.</h2>
          <p>The questions that come up most before someone commits to a site.</p>
        </div>
        <div className="wdx-faq-list" data-reveal>
          {FAQS.map((item) => (
            <details className="guide-page-faq-item" key={item.q}>
              <summary>{item.q}</summary>
              <p>{item.a}</p>
            </details>
          ))}
        </div>
      </section>

      <WebDesignQuickjump />
    </div>
  );
}
