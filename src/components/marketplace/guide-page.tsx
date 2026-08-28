import Link from "next/link";
import { buildBreadcrumbJsonLd, buildFaqJsonLd, jsonLdScriptProps } from "@/lib/seo";
import type { Guide } from "@/lib/guides";

const PAGE_LABELS: Record<string, string> = {
  "/projects": "All New Projects",
  "/projects/pre-construction": "Pre-Construction",
  "/projects/colombo": "Colombo",
  "/projects/colombo/luxury": "Colombo Luxury",
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

  return (
    <article className="guide-page space-y-6">
      <script {...jsonLdScriptProps(breadcrumbJsonLd)} />
      {guide.faqs.length > 0 ? <script {...jsonLdScriptProps(faqJsonLd)} /> : null}

      <div className="guide-page-intro">
        <h1>{guide.h1}</h1>
        <p>{guide.intro}</p>
      </div>

      <div className="guide-page-sections">
        {guide.sections.map((section) => (
          <section key={section.heading} className="guide-page-section">
            <h2>{section.heading}</h2>
            <p>{section.body}</p>
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
        <nav className="listing-related-links" aria-label="Related pages">
          <p>Related pages:</p>
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
