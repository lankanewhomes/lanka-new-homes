import Link from "next/link";
import { buildBreadcrumbJsonLd, buildFaqJsonLd, jsonLdScriptProps } from "@/lib/seo";
import type { Guide } from "@/lib/guides";

const PAGE_LABELS: Record<string, string> = {
  "/projects": "All New Projects",
  "/projects/pre-construction": "Pre-Construction",
  "/projects/colombo": "Colombo",
  "/projects/luxury": "Luxury Projects",
  "/projects/branded-residences": "Branded Residences",
  "/projects/villas": "Villas",
  "/projects/beachfront": "Beachfront",
  "/projects/serviced-apartments": "Serviced Apartments",
  "/projects/port-city-colombo": "Port City Colombo",
  "/guides/foreigners-buying-property": "Foreign Buyer Guide",
  "/guides/investment-property": "Investment Property Guide",
  "/guides/golden-visa": "Golden Visa Guide",
};

export function GuidePageShell({ guide }: { guide: Guide }) {
  const breadcrumbJsonLd = buildBreadcrumbJsonLd(guide.breadcrumbs);
  const faqJsonLd = buildFaqJsonLd(guide.faqs);

  const TINTS = ["gray", "cream", "lilac"] as const;

  // Owner, 2026-10-02: "also this" (/guides/golden-visa and the other guide
  // pages) after redesigning /guides — same contained-box system as /guides,
  // /about and /press (docs/design.md "Page section style: contained
  // boxes"). Copy still comes from src/lib/guides.ts; no eyebrow label.
  return (
    <article className="fdv-page guides-page guide-detail">
      <script {...jsonLdScriptProps(breadcrumbJsonLd)} />
      {guide.faqs.length > 0 ? <script {...jsonLdScriptProps(faqJsonLd)} /> : null}

      <section className="fdv-hero fdv-hero--split" aria-label={guide.h1}>
        <div className="fdv-hero-split-inner">
          <div className="fdv-hero-content">
            <h1 className="fdv-hero-headline">{guide.h1}</h1>
            <p className="fdv-hero-sub">{guide.intro}</p>
            <div className="fdv-hero-ctas">
              <Link href="/projects" className="fdv-cta-final-button">Browse new homes</Link>
              <Link href="/guides" className="fdv-cta-secondary fdv-hero-explore-link">All guides</Link>
            </div>
          </div>

          <div className="about-hero-panel">
            <ol className="guides-hero-list" aria-label="In this guide">
              {guide.sections.map((section, index) => (
                <li key={section.heading}>
                  <a href={`#section-${index + 1}`}>
                    <span className="guides-hero-num">{index + 1}</span>
                    <span>{section.heading}</span>
                  </a>
                </li>
              ))}
              {guide.faqs.length > 0 ? (
                <li>
                  <a href="#faq">
                    <span className="guides-hero-num">?</span>
                    <span>Frequently asked questions</span>
                  </a>
                </li>
              ) : null}
            </ol>
          </div>
        </div>
      </section>

      {guide.sections.map((section, index) => (
        <section
          key={section.heading}
          className={`fdv-box fdv-box--${TINTS[index % TINTS.length]}`}
          id={`section-${index + 1}`}
          aria-label={section.heading}
        >
          <div className="wdx-section-head" data-reveal>
            <h2>{section.heading}</h2>
          </div>
          <div className="fdv-box-card guide-detail-card" data-reveal>
            <span className="fdv-box-card-num">{String(index + 1).padStart(2, "0")}</span>
            <p>{section.body}</p>
          </div>
        </section>
      ))}

      {guide.faqs.length > 0 ? (
        <section className="fdv-box fdv-box--sage" id="faq" aria-label="Frequently asked questions">
          <div className="wdx-section-head" data-reveal>
            <h2>Frequently asked questions.</h2>
          </div>
          <div className="guide-detail-faqs" data-reveal>
            {guide.faqs.map((faq) => (
              <details key={faq.question} className="fdv-box-card guide-detail-faq">
                <summary>{faq.question}</summary>
                <p>{faq.answer}</p>
              </details>
            ))}
          </div>
        </section>
      ) : null}

      {guide.relatedPaths.length > 0 ? (
        <section className="fdv-box fdv-box--gray" id="related" aria-label="Related pages">
          <div className="wdx-section-head" data-reveal>
            <h2>Keep exploring.</h2>
            <p>Related guides and the homes they point to.</p>
          </div>
          <ul className="about-areas" data-reveal>
            {guide.relatedPaths.map((path) => (
              <li key={path}>
                <Link href={path}>{PAGE_LABELS[path] ?? path}</Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="fdv-box fdv-box--dark guide-detail-note" aria-label="Before you decide">
        <h2>Before you decide.</h2>
        <p>
          This guide is a starting point, not legal advice. Rules on ownership, taxes and residency can change, so
          confirm the current position with a qualified lawyer or the relevant authority before you commit to a
          purchase.
        </p>
      </section>
    </article>
  );
}
