import type { Metadata } from "next";
import Link from "next/link";
import { guides } from "@/lib/guides";

export const metadata: Metadata = {
  title: "Buying Guides for Sri Lanka Real Estate",
  description: "Guides for buying new property in Sri Lanka, including foreign ownership rules, investment property advice, and the golden visa residency route.",
  alternates: {
    canonical: "/guides",
  },
};

// Owner, 2026-10-02: "re design this page" (/guides) — same contained-box
// system as /about, /press and /for-developers (docs/design.md "Page section
// style: contained boxes"): split hero, then tinted textured boxes with
// left-aligned headings. Everything shown comes from src/lib/guides.ts
// (real guide copy and FAQs) — nothing invented.
const WHO_FOR: Record<string, string> = {
  "foreigners-buying-property": "You live overseas, or are not a Sri Lankan citizen, and want to know what you can own.",
  "investment-property": "You are buying to rent out or to hold, and want to compare locations, developers and payment plans.",
  "golden-visa": "You are looking at residency through a qualifying property investment.",
};

const BROWSE = [
  { label: "All new projects", href: "/projects" },
  { label: "Pre-construction", href: "/projects/pre-construction" },
  { label: "Colombo", href: "/projects/colombo" },
  { label: "Luxury", href: "/projects/luxury" },
  { label: "Beachfront", href: "/projects/beachfront" },
  { label: "Land for sale", href: "/land" },
] as const;

// Owner, 2026-10-02: "if you need to add any sections please do". The steps
// restate the buying process already written in the foreign-ownership guide
// (reserve, agreement, funds, title) — nothing new or estimated.
const PROCESS = [
  { title: "Choose a project", body: "Browse new projects by area or type, and check the developer's profile and earlier work." },
  { title: "Reserve a unit", body: "Reserve with the developer, who confirms the unit, the price and the payment plan in writing." },
  { title: "Sign the agreement", body: "Sign the sale and purchase agreement. A lawyer should read it first." },
  { title: "Pay in stages", body: "Most new builds use a staged plan: a deposit, progress payments tied to construction, then a balance at handover. Overseas buyers remit funds through an Inward Investment Account." },
  { title: "Register the title", body: "The transfer of title is registered, and you receive your unit at handover." },
] as const;

export default function GuidesIndexPage() {
  const guideList = Object.values(guides);
  const quickAnswers = guideList
    .filter((guide) => guide.faqs.length > 0)
    .map((guide) => ({ guide, faq: guide.faqs[0] }));

  return (
    <div className="fdv-page guides-page">
      <section className="fdv-hero fdv-hero--split" aria-label="Buying guides">
        <div className="fdv-hero-split-inner">
          <div className="fdv-hero-content">
            <h1 className="fdv-hero-headline">Buying guides for Sri Lanka real estate.</h1>
            <p className="fdv-hero-sub">
              Practical guides for buying new-build property in Sri Lanka, written for local and overseas buyers.
            </p>
            <div className="fdv-hero-ctas">
              <Link href="/projects" className="fdv-cta-final-button">Browse new homes</Link>
              <Link href="/contact" className="fdv-cta-secondary fdv-hero-explore-link">Ask a question</Link>
            </div>
          </div>

          <div className="about-hero-panel">
            <ol className="guides-hero-list" aria-label="All guides">
              {guideList.map((guide, index) => (
                <li key={guide.slug}>
                  <Link href={guide.path}>
                    <span className="guides-hero-num">{index + 1}</span>
                    <span>{guide.h1}</span>
                  </Link>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <section className="fdv-box fdv-box--gray" id="all-guides" aria-label="All guides">
        <div className="wdx-section-head" data-reveal>
          <h2>Start with the question you have.</h2>
          <p>Each guide covers one topic in plain language and links to the homes it mentions.</p>
        </div>
        <div className="fdv-box-grid fdv-box-grid--3" data-reveal>
          {guideList.map((guide) => (
            <Link key={guide.slug} href={guide.path} className="fdv-box-card fdv-box-card-link">
              <h3>{guide.h1}</h3>
              <p>{guide.metaDescription}</p>
              <p className="guides-card-who">{WHO_FOR[guide.slug] ?? ""}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="fdv-box fdv-box--lilac" id="process" aria-label="The buying process">
        <div className="wdx-section-head" data-reveal>
          <h2>The buying process, step by step.</h2>
          <p>How a new-build purchase usually runs, from the first search to handover.</p>
        </div>
        <div className="fdv-box-grid fdv-box-grid--3" data-reveal>
          {PROCESS.map((step) => (
            <div className="fdv-box-card" key={step.title}>
              <h3>{step.title}</h3>
              <p>{step.body}</p>
            </div>
          ))}
        </div>
      </section>

      {quickAnswers.length > 0 ? (
        <section className="fdv-box fdv-box--cream" id="quick-answers" aria-label="Quick answers">
          <div className="wdx-section-head" data-reveal>
            <h2>Quick answers.</h2>
            <p>The question buyers ask most in each guide, answered in a line or two.</p>
          </div>
          <div className="fdv-box-grid fdv-box-grid--3" data-reveal>
            {quickAnswers.map(({ guide, faq }) => (
              <div className="fdv-box-card" key={guide.slug}>
                <h3>{faq.question}</h3>
                <p>{faq.answer}</p>
                <Link href={guide.path} className="guides-card-more">Read the full guide</Link>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section className="fdv-box fdv-box--sage" id="browse-homes" aria-label="Browse homes">
        <div className="wdx-section-head" data-reveal>
          <h2>Ready to look at homes?</h2>
          <p>Compare payment plans and floor plans on each listing, then send an enquiry straight to the developer.</p>
        </div>
        <ul className="about-areas" data-reveal>
          {BROWSE.map((link) => (
            <li key={link.href}>
              <Link href={link.href}>{link.label}</Link>
            </li>
          ))}
        </ul>
      </section>

      {/* Owner, 2026-10-02: shorten the "How to use these guides" text and put
          a box on its right — a "which guide first" picker built from the
          same guide list. */}
      <section className="fdv-box fdv-box--dark guides-howto" aria-label="How to use these guides">
        <div className="guides-howto-grid">
          <div className="guides-howto-text">
            <h2>How to use these guides.</h2>
            <p>
              These guides answer the questions buyers ask most about new-build property in Sri Lanka, in plain
              language for local and overseas buyers. Each one links to the projects, neighbourhoods and developers
              it mentions.
            </p>
            <p>
              Treat them as a starting point, not legal advice. Rules on ownership, taxes and residency can change,
              so confirm the current position with a qualified lawyer or the relevant authority before you buy.
            </p>
          </div>
          <div className="guides-howto-box">
            <h3>Which guide first?</h3>
            <ul>
              {guideList.map((guide) => (
                <li key={guide.slug}>
                  <Link href={guide.path}>
                    <strong>{guide.h1}</strong>
                    <span>{WHO_FOR[guide.slug] ?? ""}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}
