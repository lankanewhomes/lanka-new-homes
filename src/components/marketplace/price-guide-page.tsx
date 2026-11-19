import Image from "next/image";
import Link from "next/link";
import { buildBreadcrumbJsonLd, buildFaqJsonLd, jsonLdScriptProps } from "@/lib/seo";
import { compactLkr } from "@/lib/format";
import type { Guide } from "@/lib/guides";
import type { Project } from "@/types";

// Data-driven price page (owner, 2026-11-19: redesign "Apartment prices in Colombo" like a market-report page:
// headline numbers, price by area, price bands with listing cards, FAQ). Numbers come from live listings, so the
// page stays right when prices change. Pass any set of projects plus a function that names each project's area.

export type PriceBand = { label: string; min: number; max: number };

const median = (values: number[]) => {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : Math.round((sorted[mid - 1] + sorted[mid]) / 2);
};

function PriceCard({ project }: { project: Project }) {
  return (
    <Link href={`/projects/${project.slug}`} className="pg-card">
      {project.heroImage ? (
        <Image src={project.heroImage} alt={`${project.name}, ${project.city}`} width={640} height={400} className="pg-card-img" />
      ) : null}
      <div className="pg-card-body">
        <span className="pg-card-price">From {compactLkr(project.startingPriceLkr)}</span>
        <strong>{project.name}</strong>
        <span className="pg-card-meta">{project.city} · {String(project.status)}</span>
      </div>
    </Link>
  );
}

export function PriceGuidePage({
  guide,
  projects,
  areaOf,
  bands,
  areaNoun = "area",
  listingsHref,
  updated,
}: {
  guide: Guide;
  projects: Project[];
  areaOf: (project: Project) => string;
  bands: PriceBand[];
  areaNoun?: string;
  listingsHref: string;
  updated: string;
}) {
  const priced = projects.filter((p) => p.startingPriceLkr > 0).sort((a, b) => a.startingPriceLkr - b.startingPriceLkr);
  const prices = priced.map((p) => p.startingPriceLkr);
  const areas = new Map<string, Project[]>();
  for (const project of priced) {
    const key = areaOf(project);
    areas.set(key, [...(areas.get(key) ?? []), project]);
  }
  const areaRows = [...areas.entries()]
    .map(([name, list]) => ({ name, count: list.length, low: list[0].startingPriceLkr, high: list[list.length - 1].startingPriceLkr, mid: median(list.map((p) => p.startingPriceLkr)) }))
    .sort((a, b) => a.low - b.low);
  const maxHigh = Math.max(...areaRows.map((r) => r.high), 1);
  const ready = priced.filter((p) => String(p.status) === "Completed").length;

  const tiles = priced.length
    ? [
        { value: compactLkr(prices[0]), label: "Lowest starting price" },
        { value: compactLkr(median(prices)), label: "Median starting price" },
        { value: compactLkr(prices[prices.length - 1]), label: "Highest starting price" },
        { value: String(priced.length), label: `Priced projects in ${areaRows.length} ${areaNoun}s` },
      ]
    : [];

  const breadcrumbJsonLd = buildBreadcrumbJsonLd(guide.breadcrumbs);
  const faqJsonLd = buildFaqJsonLd(guide.faqs);

  return (
    <article className="fdv-page guides-page guide-detail pg-page">
      <script {...jsonLdScriptProps(breadcrumbJsonLd)} />
      {guide.faqs.length > 0 ? <script {...jsonLdScriptProps(faqJsonLd)} /> : null}

      <section className="fdv-hero fdv-hero--split" aria-label={guide.h1}>
        <div className="fdv-hero-split-inner">
          <div className="fdv-hero-content">
            <h1 className="fdv-hero-headline">{guide.h1}</h1>
            <p className="fdv-hero-sub">{guide.intro}</p>
            <div className="fdv-hero-ctas">
              <Link href={listingsHref} className="fdv-cta-final-button">See these apartments</Link>
              <Link href="/guides" className="fdv-cta-secondary fdv-hero-explore-link">All guides</Link>
            </div>
          </div>
          <div className="about-hero-panel">
            <dl className="pg-tiles" aria-label="Price snapshot">
              {tiles.map((tile) => (
                <div key={tile.label} className="pg-tile">
                  <dd>{tile.value}</dd>
                  <dt>{tile.label}</dt>
                </div>
              ))}
            </dl>
            <p className="fdv-hero-mock-caption">From live listings, {updated}.</p>
          </div>
        </div>
      </section>

      <section className="fdv-box fdv-box--gray" id="by-area" aria-label="Price by area">
        <div className="wdx-section-head" data-reveal>
          <h2>Price by area.</h2>
          <p>Starting prices of the projects in each {areaNoun}, lowest first.</p>
        </div>
        <div className="fdv-box-card pg-table-card" data-reveal>
          <table className="pg-table">
            <thead>
              <tr><th>{areaNoun[0].toUpperCase() + areaNoun.slice(1)}</th><th>Projects</th><th>Lowest from</th><th>Typical from</th><th className="pg-range-col">Range</th></tr>
            </thead>
            <tbody>
              {areaRows.map((row) => (
                <tr key={row.name}>
                  <th scope="row">{row.name}</th>
                  <td>{row.count}</td>
                  <td>{compactLkr(row.low)}</td>
                  <td>{compactLkr(row.mid)}</td>
                  <td className="pg-range-col">
                    <span className="pg-bar" aria-hidden="true"><span style={{ left: `${(row.low / maxHigh) * 100}%`, width: `${Math.max(((row.high - row.low) / maxHigh) * 100, 3)}%` }} /></span>
                    <span className="pg-range-text">{compactLkr(row.low)} to {compactLkr(row.high)}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="pg-note">&quot;Typical from&quot; is the middle starting price of the projects in that {areaNoun}. Every figure is the price of the smallest unit a developer advertises, not the price of every unit.</p>
        </div>
      </section>

      {bands.map((band, index) => {
        const inBand = priced.filter((p) => p.startingPriceLkr >= band.min && p.startingPriceLkr < band.max);
        if (!inBand.length) return null;
        return (
          <section key={band.label} className={`fdv-box fdv-box--${index % 2 ? "cream" : "lilac"}`} id={`band-${index + 1}`} aria-label={band.label}>
            <div className="wdx-section-head" data-reveal>
              <h2>{band.label}.</h2>
              <p>{inBand.length} {inBand.length === 1 ? "project" : "projects"} starting in this range.</p>
            </div>
            <div className="pg-cards" data-reveal>
              {inBand.map((project) => <PriceCard key={project.slug} project={project} />)}
            </div>
          </section>
        );
      })}

      <section className="fdv-box fdv-box--gray" id="what-changes-price" aria-label="What changes the price">
        <div className="wdx-section-head" data-reveal>
          <h2>What changes the price.</h2>
        </div>
        <div className="fdv-box-card guide-detail-card" data-reveal>
          <p>
            Floor level, view, unit size and completion stage move the price most. {ready} of these {priced.length} projects are
            completed and ready to move in; the rest are still being built and can be bought on a staged payment plan.
            Ask each developer what is included (parking, fittings, furnishing) and what legal and registration fees come on top.
          </p>
        </div>
      </section>

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

      <section className="fdv-box fdv-box--gray" id="related" aria-label="Related pages">
        <div className="wdx-section-head" data-reveal>
          <h2>Keep exploring.</h2>
        </div>
        <ul className="about-areas" data-reveal>
          {guide.relatedPaths.map((path) => (
            <li key={path}><Link href={path}>{path.split("/").filter(Boolean).pop()!.replace(/-/g, " ")}</Link></li>
          ))}
        </ul>
      </section>

      <section className="fdv-box fdv-box--dark guide-detail-note" aria-label="Before you decide">
        <h2>Before you decide.</h2>
        <p>Prices are starting prices taken from developer listings and can change. Confirm the current price, payment plan and fees with the developer before you commit.</p>
      </section>
    </article>
  );
}
