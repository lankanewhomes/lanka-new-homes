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

const GUIDE_EYEBROWS: Record<string, string> = {
  "foreigners-buying-property": "Buyer's Guide",
  "investment-property": "Investor's Guide",
  "golden-visa": "Residency Guide",
};

export function GuidePageShell({ guide }: { guide: Guide }) {
  const breadcrumbJsonLd = buildBreadcrumbJsonLd(guide.breadcrumbs);
  const faqJsonLd = buildFaqJsonLd(guide.faqs);

  return (
    <article className="guide-page">
      <script {...jsonLdScriptProps(breadcrumbJsonLd)} />
      {guide.faqs.length > 0 ? <script {...jsonLdScriptProps(faqJsonLd)} /> : null}

      <div className="guide-page-intro">
        <p className="guide-page-eyebrow">{GUIDE_EYEBROWS[guide.slug] ?? "Guide"}</p>
        <h1>{guide.h1}</h1>
        <div className="guide-page-answer">
          <p>{guide.intro}</p>
        </div>
      </div>

      <div className="guide-page-sections">
        {guide.sections.map((section, index) => (
          <section key={section.heading} className="guide-page-section">
            <span className="guide-page-section-number">{String(index + 1).padStart(2, "0")}</span>
            <div>
              <h2>{section.heading}</h2>
              <p>{section.body}</p>
            </div>
          </section>
        ))}
      </div>

      {guide.faqs.length > 0 ? (
        <section className="guide-page-faq" aria-label="Frequently asked questions">
          <h2>Frequently Asked Questions</h2>
          {guide.faqs.map((faq) => (
            <details key={faq.question} className="guide-page-faq-item">
              <summary>{faq.question}</summary>
              <p>{faq.answer}</p>
            </details>
          ))}
        </section>
      ) : null}

      {guide.relatedPaths.length > 0 ? (
        <nav className="guide-page-related" aria-label="Related pages">
          <p>Keep exploring</p>
          <ul>
            {guide.relatedPaths.map((path) => (
              <li key={path}>
                <Link href={path}>{PAGE_LABELS[path] ?? path}</Link>
              </li>
            ))}
          </ul>
        </nav>
      ) : null}
    </article>
  );
}
