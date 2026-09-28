import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Gauge, LayoutTemplate, MessageCircle, Search, Smartphone, Globe } from "lucide-react";
import { ScrollReveal } from "@/components/marketplace/scroll-reveal";
import { SampleDevices } from "@/components/marketplace/web-design-frames";
import { SampleSiteSwitcher } from "@/components/marketplace/web-design-sample-switcher";
import { SAMPLE_IMAGES } from "@/components/web-design-sample/sample-data";
import { getAllProjects } from "@/lib/project-store";

export const revalidate = 300;

// Real, published LankaNewHomes listings, picked for visual variety across
// property type and location — used only to illustrate that a dedicated
// site's design changes with the project, never presented as an actual
// delivered website for that developer (owner, 2026-09-27: "get the
// content or video, photos, from my website. not soemwher else" — every
// image on this page has to be real, not stock).
const STYLE_SAMPLE_SLUGS = [
  "rush-court-5-colombo-14",
  "rudra-wellness-retreat-kalkudah",
  "waterfall-residencies-malabe",
  "viva-la-vida",
  "imaarat-bambalapitiya",
  "magna-mattegoda",
] as const;

// Dropped the editorial Fraunces serif this page used to share with
// /for-developers (owner, 2026-09-27: "all the content thats realted to
// lankanewhomes or LNH the fonts needs to be consistent") — every heading
// here now uses the site's default sans stack instead, matching
// docs/design.md's "no serif anywhere on the site" rule. The `fdv-page`
// wrapper class stays for this page's colour tokens and ScrollReveal
// fade-in, neither of which depend on the font variable that used to be
// loaded here.

export const metadata: Metadata = {
  title: "Website Design for Property Developers | LankaNewHomes",
  description:
    "Beyond your LankaNewHomes listing — we design and build dedicated project websites for developers, or redesign an existing one, from scratch. See a sample homepage.",
  alternates: { canonical: "/web-design" },
  openGraph: {
    title: "Website Design for Property Developers | LankaNewHomes",
    description:
      "Beyond your LankaNewHomes listing — we design and build dedicated project websites for developers, or redesign an existing one, from scratch.",
    url: "/web-design",
    type: "website",
  },
};

const INCLUDED = [
  { icon: LayoutTemplate, title: "Designed for your project", body: "A dedicated site built from the ground up around your brand, your renders and your floor plans — not a template with your logo dropped in." },
  { icon: Smartphone, title: "Mobile-first", body: "Most buyers browse on their phone first. Every site is designed for a phone, then scaled up — not the other way around." },
  { icon: Search, title: "SEO from day one", body: "Page structure, metadata and site speed are part of the build, not bolted on afterward — so the site is actually findable once it's live." },
  { icon: MessageCircle, title: "Lead capture built in", body: "Contact forms, WhatsApp click-to-chat and brochure downloads — whatever gets a genuine enquiry from a visitor to your team, wired in from the start." },
  { icon: Gauge, title: "Fast, and built to stay that way", body: "Modern tooling and optimised images, no bloat — a site that loads quickly on an average connection, not just on a fast office Wi-Fi." },
  { icon: Globe, title: "Your own domain", body: "Your address, your brand. For a redesign we keep your existing domain and any content that's still working." },
] as const;

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

const PROCESS = [
  { title: "Tell us about the project", body: "Send over what you have — renders, floor plans, brand guidelines, an existing site if there is one — and what you want the new site to do." },
  { title: "We design it", body: "A look and structure built around your project specifically, not a generic template with your logo dropped in." },
  { title: "You review, we refine", body: "You see it before it's built — changes at this stage are quick, not a rebuild." },
  { title: "We build and launch it", body: "Live on your domain, connected to your forms and contact channels, ready for traffic." },
] as const;

const FAQS = [
  { q: "Do I need a website if I already have a LankaNewHomes listing?", a: "Most developers end up with both. A listing gets your project discovered by buyers already searching; a website is where every other lead lands — a Facebook ad, a signboard QR code, a referral, a business card." },
  { q: "Can you redesign the website I already have?", a: "Yes. We rebuild it on the same domain, keep the content that's still good and improve the rest." },
  { q: "Will it work well on a phone?", a: "Every site is designed mobile-first, then scaled up for larger screens." },
  { q: "How do buyers get in touch?", a: "Through the enquiry form, WhatsApp click-to-chat and brochure downloads — wired in from the start so an enquiry reaches your team." },
  { q: "Will I see it before it's built?", a: "Yes. You review the design first, and changes at that stage are quick." },
  { q: "How much does it cost?", a: "It depends on the size of the project and what you need, so we quote for each one. Tell us about it and we'll come back to you." },
] as const;

export default async function WebDesignPage() {
  const allProjects = await getAllProjects();
  const styleSamples = STYLE_SAMPLE_SLUGS.map((slug) => allProjects.find((p) => p.slug === slug)).filter((p): p is NonNullable<typeof p> => Boolean(p?.heroImage));

  return (
    <div className="fdv-page wdx-page">
      <ScrollReveal />

      {/* 1 — HERO */}
      <section className="wdx-hero" aria-label="Website design for developers">
        <div className="wdx-hero-media">
          <Image src={SAMPLE_IMAGES.hero} alt="" fill priority sizes="100vw" className="wdx-hero-img" />
          <div className="wdx-hero-overlay" />
        </div>
        <div className="wdx-hero-content wdx-hero-content-split">
          <div>
            <h1 className="wdx-hero-headline">Your project deserves a website of its own.</h1>
            <p className="wdx-hero-sub">
              We design and build dedicated websites for property developments — a brand new site for a project that
              doesn&apos;t have one yet, or a redesign of one that isn&apos;t working anymore.
            </p>
            <div className="wdx-hero-ctas">
              <Link href="/contact" className="fdv-cta-primary">Talk to us about a site</Link>
              <a href="#sample" className="fdv-cta-secondary">See a sample homepage</a>
            </div>
          </div>
          <div className="wdx-hero-preview" aria-hidden="true">
            <SampleDevices />
          </div>
        </div>
      </section>

      {/* 2 — INTRODUCTION */}
      <section className="wdx-intro" aria-label="Why a dedicated site">
        <div className="wdx-intro-grid">
          <h2 className="wdx-statement" data-reveal>A listing gets you found. A website tells your story.</h2>
          <div className="wdx-intro-copy" data-reveal>
            <p>
              Your LankaNewHomes listing puts your project in front of buyers actively searching right now. A dedicated
              website is different — it&apos;s where you send every other lead: a Facebook ad, a signboard QR code, a
              referral, a business card. It&apos;s the version of your project that&apos;s entirely yours.
            </p>
            <Link href="/contact" className="fdv-text-link">Talk to us about a site →</Link>
          </div>
        </div>
      </section>

      {/* 3 — LIVE SAMPLE */}
      <section className="wdx-sample" id="sample" aria-label="Sample homepage">
        <div className="wdx-sample-head" data-reveal>
          <h2>See what your site could look like.</h2>
          <p>
            We built three complete sample homepages for three fictional developments, each with its own look — pick
            one below. Every section is something we can build for your project — watch it scroll, or open the full page.
          </p>
        </div>
        <div data-reveal>
          <SampleSiteSwitcher />
        </div>
      </section>

      {/* 3B — STYLE VARIETY (real LankaNewHomes listings, not delivered sites) */}
      {styleSamples.length > 0 ? (
        <section className="wdx-styles" aria-label="Design styles">
          <div className="wdx-section-head" data-reveal>
            <h2>Every project looks different. Yours will too.</h2>
            <p>
              The three samples above show how much the design itself can change. These are real projects listed on
              LankaNewHomes, shown here to illustrate range too — not sites we&apos;ve built for them.
            </p>
          </div>
          <div className="wdx-styles-grid">
            {styleSamples.map((project) => (
              <div className="wdx-styles-card" key={project.slug} data-reveal>
                <div className="wdx-styles-card-media">
                  <Image src={project.heroImage} alt="" fill sizes="(max-width: 760px) 100vw, 33vw" className="wdx-styles-card-img" />
                </div>
                <p className="wdx-styles-card-caption">{project.type} &middot; {project.city}</p>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {/* 4 — WHAT'S INCLUDED */}
      <section className="wdx-included" aria-label="What every site includes">
        <div className="wdx-section-head" data-reveal>
          <h2>Built properly, from the first line.</h2>
        </div>
        <div className="wdx-included-grid">
          {INCLUDED.map((item) => (
            <div className="wdx-included-item" key={item.title} data-reveal>
              <item.icon className="wdx-included-icon" strokeWidth={1.4} aria-hidden="true" />
              <h3>{item.title}</h3>
              <p>{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 5 — WHAT GOES ON A HOMEPAGE */}
      <section className="wdx-sections" aria-label="What we can put on your homepage">
        <div className="wdx-sections-inner">
          <div className="wdx-section-head" data-reveal>
            <h2>Everything a buyer looks for, in one place.</h2>
            <p>The sample shows what a typical development site can carry. We choose the sections that suit your project.</p>
          </div>
          <ul className="wdx-chip-list" data-reveal>
            {HOMEPAGE_SECTIONS.map((label) => (
              <li key={label}>{label}</li>
            ))}
          </ul>
        </div>
      </section>

      {/* 6 — LISTING VS WEBSITE */}
      <section className="wdx-compare" aria-label="A listing or a website">
        <div className="wdx-section-head" data-reveal>
          <h2>A listing to get discovered. A site to close the sale.</h2>
        </div>
        <div className="wdx-compare-grid">
          <div className="wdx-compare-card" data-reveal>
            <Search size={26} strokeWidth={1.4} aria-hidden="true" />
            <h3>A LankaNewHomes listing</h3>
            <p>Puts your project in front of buyers already searching. Free to list, live in minutes — no design work needed from you.</p>
            <Link href="/for-developers" className="fdv-text-link">Why developers list with us →</Link>
          </div>
          <div className="wdx-compare-card wdx-compare-card-dark" data-reveal>
            <LayoutTemplate size={26} strokeWidth={1.4} aria-hidden="true" />
            <h3>A dedicated project website</h3>
            <p>Your own domain and brand, built around this project specifically — where every other lead you generate (ads, signboards, referrals) ends up.</p>
            <Link href="/contact" className="fdv-text-link">Talk to us about a site →</Link>
          </div>
        </div>
      </section>

      {/* 7 — PROCESS */}
      <section className="wdx-process" aria-label="How it works">
        <div className="wdx-section-head" data-reveal>
          <h2>Four steps from &ldquo;we need a site&rdquo; to a live one.</h2>
        </div>
        <ol className="wdx-process-list">
          {PROCESS.map((step, index) => (
            <li className="wdx-process-item" key={step.title} data-reveal>
              <span className="wdx-process-step-label">Step {index + 1}</span>
              <h3>{step.title}</h3>
              <p>{step.body}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* 8 — FAQ */}
      <section className="wdx-faq" aria-label="Questions">
        <div className="wdx-section-head" data-reveal>
          <h2>What developers ask us.</h2>
        </div>
        <div className="wdx-faq-list" data-reveal>
          {FAQS.map((item) => (
            <details className="wdx-faq-item" key={item.q}>
              <summary>{item.q}</summary>
              <p>{item.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* 9 — CTA */}
      <section className="wdx-cta" aria-label="Get started">
        <div className="wdx-cta-inner" data-reveal>
          <h2>Have a project that needs a website?</h2>
          <p>Tell us about it — new site or redesign, we&apos;ll take it from there.</p>
          <div className="wdx-hero-ctas">
            <Link href="/contact" className="fdv-cta-primary">Get in touch</Link>
            <Link href="/for-developers" className="fdv-cta-secondary">List your project instead</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
