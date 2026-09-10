import type { Metadata } from "next";
import Link from "next/link";
import {
  Gauge,
  LayoutTemplate,
  MessageCircle,
  RefreshCcw,
  Rocket,
  Search,
  Smartphone,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Website Design for Property Developers | LankaNewHomes",
  description:
    "Beyond your LankaNewHomes listing — we design and build dedicated project websites for developers, or redesign an existing one, from scratch.",
  alternates: { canonical: "/web-design" },
  openGraph: {
    title: "Website Design for Property Developers | LankaNewHomes",
    description:
      "Beyond your LankaNewHomes listing — we design and build dedicated project websites for developers, or redesign an existing one, from scratch.",
    url: "/web-design",
    type: "website",
  },
};

const SERVICES = [
  {
    icon: LayoutTemplate,
    title: "Brand new project websites",
    body: "A dedicated site for a single development or your whole company — built from the ground up around your brand, your renders, and your floor plans.",
  },
  {
    icon: RefreshCcw,
    title: "Redesigns",
    body: "Already have a site that's dated, slow, or doesn't convert? We rebuild it — same domain, same content where it's still good, everything else improved.",
  },
  {
    icon: Smartphone,
    title: "Built to work on every device",
    body: "Most buyers browse on their phone first. Every site we build is designed mobile-first, then scaled up — not the other way around.",
  },
  {
    icon: Search,
    title: "SEO from day one",
    body: "Page structure, metadata, and site speed are handled as part of the build, not bolted on afterward — so the site is actually findable once it's live.",
  },
  {
    icon: MessageCircle,
    title: "Lead capture built in",
    body: "Contact forms, WhatsApp click-to-chat, brochure downloads — whatever gets a genuine inquiry from a visitor to your team, wired in from the start.",
  },
  {
    icon: Gauge,
    title: "Fast, and built to stay that way",
    body: "Modern tooling, optimized images, no bloat — a site that loads quickly on an average connection, not just on a fast office Wi-Fi.",
  },
];

const PROCESS = [
  { title: "Tell us about the project", body: "Send over what you have — renders, floor plans, brand guidelines, an existing site if there is one — and what you want the new site to do." },
  { title: "We design it", body: "A look and structure built around your project specifically, not a generic template with your logo dropped in." },
  { title: "You review, we refine", body: "You see it before it's built — changes at this stage are quick, not a rebuild." },
  { title: "We build and launch it", body: "Live on your domain, connected to your forms and contact channels, ready for traffic." },
];

export default function WebDesignPage() {
  return (
    <div className="fd-page">
      <section className="fd-hero" aria-label="Website design for developers">
        <div className="fd-hero-grid fd-hero-grid-single">
          <div className="fd-hero-copy">
            <p className="fd-eyebrow">Beyond your listing</p>
            <h1>Your listing lives on LankaNewHomes.<br />Your brand deserves its own home too.</h1>
            <p className="fd-hero-sub">
              We design and build dedicated websites for property developments — a brand new site for a project
              that doesn't have one yet, or a redesign of one that isn't working anymore.
            </p>
            <div className="fd-hero-ctas">
              <Link href="/contact" className="fd-cta-primary">Talk to us about a site</Link>
              <a href="#what-we-do" className="fd-cta-secondary">See what's included</a>
            </div>
          </div>
        </div>

        <div className="fd-hero-stats">
          <div className="listing-hero-stat-chip">
            <LayoutTemplate className="listing-hero-stat-chip-icon" aria-hidden="true" />
            <div className="listing-hero-stat-chip-content">
              <span className="listing-hero-stat-chip-value">Custom</span>
              <span className="listing-hero-stat-chip-label">designed for this project, not a template</span>
            </div>
          </div>
          <div className="listing-hero-stat-chip">
            <Smartphone className="listing-hero-stat-chip-icon" aria-hidden="true" />
            <div className="listing-hero-stat-chip-content">
              <span className="listing-hero-stat-chip-value">Mobile-first</span>
              <span className="listing-hero-stat-chip-label">designed for a phone, then scaled up</span>
            </div>
          </div>
          <div className="listing-hero-stat-chip">
            <Search className="listing-hero-stat-chip-icon" aria-hidden="true" />
            <div className="listing-hero-stat-chip-content">
              <span className="listing-hero-stat-chip-value">SEO-ready</span>
              <span className="listing-hero-stat-chip-label">built in from day one, not bolted on</span>
            </div>
          </div>
          <div className="listing-hero-stat-chip">
            <Gauge className="listing-hero-stat-chip-icon" aria-hidden="true" />
            <div className="listing-hero-stat-chip-content">
              <span className="listing-hero-stat-chip-value">Fast</span>
              <span className="listing-hero-stat-chip-label">loads quickly, even on an average connection</span>
            </div>
          </div>
        </div>
      </section>

      <section className="fd-section" aria-label="Why a dedicated site" id="what-we-do">
        <div className="fd-section-head">
          <h2>A listing gets you found. A site tells your story.</h2>
          <p>
            Your LankaNewHomes listing puts your project in front of buyers actively searching right now. A dedicated
            website is different — it's where you send every other lead: a Facebook ad, a signboard QR code, a
            referral, a business card. It's the version of your project that's entirely yours.
          </p>
        </div>

        <div className="fd-badge-preview" aria-hidden="true">
          <span className="fd-badge-preview-label">Every site includes:</span>
          {[
            "Custom design",
            "Mobile-first",
            "SEO-ready",
            "Lead capture",
            "Fast hosting",
            "Your own domain",
          ].map((label) => (
            <span className="listing-badge-pill badge-extra" key={label}>{label}</span>
          ))}
        </div>

        <div className="fd-feature-grid">
          {SERVICES.map((item) => (
            <div className="fd-feature-card" key={item.title}>
              <item.icon className="fd-feature-icon" aria-hidden="true" />
              <h3>{item.title}</h3>
              <p>{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="fd-how-section" aria-label="How it works">
        <div className="fd-section-head">
          <h2>How it works</h2>
          <p>Four steps from "we need a site" to a live one.</p>
        </div>
        <ol className="fd-how-list">
          {PROCESS.map((step, index) => (
            <li className="fd-how-item" key={step.title}>
              <span className="fd-how-number">{index + 1}</span>
              <div>
                <h3>{step.title}</h3>
                <p>{step.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="fd-section" aria-label="Not sure which one you need">
        <div className="fd-section-head">
          <h2>Not sure if you need a listing, a site, or both?</h2>
          <p>Most developers end up with both — a listing to get discovered, a site to close the sale.</p>
        </div>

        <div className="fd-feature-grid fd-compare-grid">
          <div className="fd-feature-card">
            <Search className="fd-feature-icon" aria-hidden="true" />
            <h3>A LankaNewHomes listing</h3>
            <p>Puts your project in front of buyers already searching. Free to list, live in minutes — no design work needed from you.</p>
          </div>
          <div className="fd-feature-card">
            <LayoutTemplate className="fd-feature-icon" aria-hidden="true" />
            <h3>A dedicated project website</h3>
            <p>Your own domain and brand, built around this project specifically — where every other lead you generate (ads, signboards, referrals) ends up.</p>
          </div>
        </div>

        <p style={{ textAlign: "center", marginTop: 24, fontSize: 14, color: "#57534e" }}>
          Not sure which fits? <Link href="/contact" style={{ color: "#f47b36", fontWeight: 600 }}>Talk it through with us</Link> — or see <Link href="/for-developers" style={{ color: "#f47b36", fontWeight: 600 }}>why developers list with us</Link>.
        </p>
      </section>

      <section className="fd-cta-band" aria-label="Get started">
        <Rocket className="fd-cta-band-icon" aria-hidden="true" />
        <h2>Have a project that needs a website?</h2>
        <p>Tell us about it — new site or redesign, we'll take it from there.</p>
        <div className="fd-hero-ctas">
          <Link href="/contact" className="fd-cta-primary">Get in touch</Link>
          <Link href="/for-developers" className="fd-cta-secondary">List your project instead</Link>
        </div>
      </section>
    </div>
  );
}
