import type { Metadata } from "next";
import Link from "next/link";
import { getAllNeighborhoods } from "@/lib/neighborhood-store";
import { getAllProjects } from "@/lib/project-store";

// Regenerate at most once a minute so new neighborhoods and project links show up without waiting for the next deploy.
export const revalidate = 60;

const TITLE = "Neighborhood Guides in Sri Lanka";
const DESCRIPTION =
  "Explore neighborhood guides for the areas where new homes are being built across Sri Lanka — transport, schools, hospitals, typical prices and the new projects in each area.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: {
    canonical: "/neighborhoods",
  },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: "/neighborhoods",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
  },
};

// Same classic A-Z groups as the developer directory (/developers) — fixed
// ranges rather than sized to today's count, so the layout stays stable as
// neighborhoods are added.
const LETTER_GROUPS: { label: string; test: (letter: string) => boolean }[] = [
  { label: "A – F", test: (l) => l >= "A" && l <= "F" },
  { label: "G – L", test: (l) => l >= "G" && l <= "L" },
  { label: "M – R", test: (l) => l >= "M" && l <= "R" },
  { label: "S – Z", test: (l) => l >= "S" && l <= "Z" },
];

export default async function NeighborhoodsPage() {
  const [allNeighborhoods, allProjects] = await Promise.all([getAllNeighborhoods(), getAllProjects()]);

  // Published listings per neighborhood, so a buyer can see where the new
  // homes are (only shown when there is at least one).
  const projectCounts = new Map<string, number>();
  for (const project of allProjects) {
    if (project.neighborhoodSlug) projectCounts.set(project.neighborhoodSlug, (projectCounts.get(project.neighborhoodSlug) ?? 0) + 1);
  }

  const neighborhoods = [...allNeighborhoods].sort((a, b) => a.name.localeCompare(b.name));

  const groups = LETTER_GROUPS
    .map((group) => ({
      label: group.label,
      neighborhoods: neighborhoods.filter((neighborhood) => group.test(neighborhood.name.trim().charAt(0).toUpperCase())),
    }))
    .filter((group) => group.neighborhoods.length > 0);

  const withHomes = neighborhoods
    .filter((neighborhood) => (projectCounts.get(neighborhood.slug) ?? 0) > 0)
    .sort((a, b) => (projectCounts.get(b.slug) ?? 0) - (projectCounts.get(a.slug) ?? 0) || a.name.localeCompare(b.name))
    .slice(0, 6);
  const TINTS = ["gray", "cream", "lilac", "sage"] as const;

  // Owner, 2026-10-02: redesign /neighborhoods in the contained-box system
  // (docs/design.md "Page section style: contained boxes"), same as /about,
  // /guides and /press. Counts are live; nothing estimated.
  return (
    <div className="fdv-page neighborhoods-page">
      <section className="fdv-hero fdv-hero--split" aria-label="Neighborhood guides">
        <div className="fdv-hero-split-inner">
          <div className="fdv-hero-content">
            <h1 className="fdv-hero-headline">Neighborhood guides for Sri Lanka.</h1>
            <p className="fdv-hero-sub">
              Areas across Sri Lanka where new homes are being built, listed A to Z. Each guide covers transport,
              schools, hospitals and the projects for sale there.
            </p>
            <div className="fdv-hero-ctas">
              <Link href="/projects" className="fdv-cta-final-button">Browse new homes</Link>
              <Link href="/land" className="fdv-cta-secondary fdv-hero-explore-link">Land for sale</Link>
            </div>
          </div>
          <div className="about-hero-panel">
            <dl className="about-hero-panel-grid" aria-label="Neighborhood guides by the numbers">
              <div className="about-hero-panel-stat">
                <dd>{neighborhoods.length}</dd>
                <dt>Areas covered</dt>
              </div>
              <div className="about-hero-panel-stat">
                <dd>{[...projectCounts.keys()].filter((slug) => neighborhoods.some((n) => n.slug === slug)).length}</dd>
                <dt>Areas with homes for sale</dt>
              </div>
            </dl>
            <p className="fdv-hero-mock-caption">Live counts from the platform.</p>
          </div>
        </div>
      </section>

      {withHomes.length > 0 ? (
        <section className="fdv-box fdv-box--sage" id="with-homes" aria-label="Areas with the most new homes">
          <div className="wdx-section-head" data-reveal>
            <h2>Where new homes are being built.</h2>
            <p>The areas with the most projects listed right now.</p>
          </div>
          <div className="fdv-box-grid fdv-box-grid--3" data-reveal>
            {withHomes.map((neighborhood) => {
              const count = projectCounts.get(neighborhood.slug) ?? 0;
              return (
                <Link key={neighborhood.slug} href={`/neighborhoods/${neighborhood.slug}`} className="fdv-box-card fdv-box-card-link">
                  <h3>{neighborhood.name}</h3>
                  <p>{neighborhood.city}{neighborhood.district ? `, ${neighborhood.district}` : ""}</p>
                  <p className="guides-card-who">{count} {count === 1 ? "project" : "projects"} for sale</p>
                </Link>
              );
            })}
          </div>
        </section>
      ) : null}

      {groups.map((group, index) => (
        <section key={group.label} className={`fdv-box fdv-box--${TINTS[index % TINTS.length]}`} id={`letters-${index + 1}`} aria-label={`Areas ${group.label}`}>
          <div className="wdx-section-head" data-reveal>
            <h2>{group.label}</h2>
          </div>
          <ul className="neighborhoods-chip-list" data-reveal>
            {group.neighborhoods.map((neighborhood) => {
              const count = projectCounts.get(neighborhood.slug) ?? 0;
              return (
                <li key={neighborhood.slug}>
                  <Link href={`/neighborhoods/${neighborhood.slug}`}>
                    {neighborhood.name}
                    {count > 0 ? <span>{count} {count === 1 ? "project" : "projects"}</span> : null}
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      ))}

      <section className="fdv-box fdv-box--dark guides-howto" aria-label="About the neighborhood guides">
        <div className="guides-howto-grid">
          <div className="guides-howto-text">
            <h2>About the neighborhood guides.</h2>
            <p>
              Each guide describes one area: how to get around, the schools and hospitals nearby, famous places,
              and the new projects and land for sale there.
            </p>
            <p>Use them to compare areas before you shortlist a project, then open a listing to see its own map.</p>
          </div>
          <div className="guides-howto-box">
            <h3>Keep exploring</h3>
            <ul>
              <li><Link href="/projects"><strong>All new projects</strong><span>Apartments, villas and houses across Sri Lanka.</span></Link></li>
              <li><Link href="/land"><strong>Land for sale</strong><span>Plots from developers and builders.</span></Link></li>
              <li><Link href="/guides"><strong>Buying guides</strong><span>Foreign ownership, investment and residency.</span></Link></li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}
