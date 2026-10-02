import Link from "next/link";
import { PartnerDirectoryCard } from "@/components/marketplace/partner-directory-card";

export type PartnerDirectoryEntry = {
  slug: string;
  name: string;
  logo: string;
  location: string;
  description: string;
  yearsInBusiness?: number;
  phone?: string;
};

// Owner, 2026-10-02: redesign the directory pages (/construction-companies
// and its sub-pages, /architects, /interior-designers, /marketing-companies,
// /sales-companies) in the contained-box system shared with /about, /guides
// and /neighborhoods (docs/design.md "Page section style: contained boxes").
// One shared view so all of them stay identical. Counts are live.
export function PartnerDirectoryPage({
  title,
  intro,
  noun,
  nounPlural,
  basePath,
  entries,
  about,
  related,
  children,
}: {
  title: string;
  intro: string;
  noun: string;
  nounPlural: string;
  basePath: string;
  entries: PartnerDirectoryEntry[];
  about: { title: string; paragraphs: string[] };
  related: { label: string; href: string; note?: string }[];
  children?: React.ReactNode;
}) {
  return (
    <div className="fdv-page directory-page">
      {children}
      <section className="fdv-hero fdv-hero--split" aria-label={title}>
        <div className="fdv-hero-split-inner">
          <div className="fdv-hero-content">
            <h1 className="fdv-hero-headline">{title}</h1>
            <p className="fdv-hero-sub">{intro}</p>
            <div className="fdv-hero-ctas">
              <Link href="/projects" className="fdv-cta-final-button">Browse new homes</Link>
              <Link href="/for-developers" className="fdv-cta-secondary fdv-hero-explore-link">List your business</Link>
            </div>
          </div>
          <div className="about-hero-panel">
            <dl className="about-hero-panel-grid directory-hero-stat" aria-label={`${title} by the numbers`}>
              <div className="about-hero-panel-stat">
                <dd>{entries.length}</dd>
                <dt>{entries.length === 1 ? noun : nounPlural} listed</dt>
              </div>
            </dl>
            <p className="fdv-hero-mock-caption">Live count from the platform.</p>
          </div>
        </div>
      </section>

      <section className="fdv-box fdv-box--gray" id="directory" aria-label={title}>
        <div className="wdx-section-head" data-reveal>
          <h2>All {nounPlural}, A to Z.</h2>
          <p>Open a profile to see their location, years in business and contact details.</p>
        </div>
        {entries.length > 0 ? (
          <div className="partner-directory-grid" data-reveal>
            {entries.map((entry) => (
              <PartnerDirectoryCard
                key={entry.slug}
                slug={entry.slug}
                basePath={basePath}
                name={entry.name}
                logo={entry.logo}
                location={entry.location}
                description={entry.description}
                yearsInBusiness={entry.yearsInBusiness}
                phone={entry.phone}
              />
            ))}
          </div>
        ) : (
          <p data-reveal>No {nounPlural} listed yet.</p>
        )}
      </section>

      <section className="fdv-box fdv-box--dark guides-howto" aria-label={about.title}>
        <div className="guides-howto-grid">
          <div className="guides-howto-text">
            <h2>{about.title}</h2>
            {about.paragraphs.map((text) => (
              <p key={text.slice(0, 40)}>{text}</p>
            ))}
          </div>
          {related.length > 0 ? (
            <div className="guides-howto-box">
              <h3>Keep exploring</h3>
              <ul>
                {related.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href}>
                      <strong>{link.label}</strong>
                      {link.note ? <span>{link.note}</span> : null}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
