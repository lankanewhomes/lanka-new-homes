import type { Metadata } from "next";
import Link from "next/link";
import { getAllDevelopers } from "@/lib/developer-store";
import { getPackage, planRotationWeight } from "@/lib/packages";
import type { Developer } from "@/types";

// Regenerate at most once a minute so admin edits show up without waiting for the next deploy.
export const revalidate = 60;

export const metadata: Metadata = {
  title: "Developers Directory in Sri Lanka",
  description: "Browse real estate developers building new apartment projects in Sri Lanka, listed alphabetically.",
  alternates: {
    canonical: "/developers",
  },
  openGraph: {
    title: "Developers Directory in Sri Lanka",
    description: "Browse real estate developers building new apartment projects in Sri Lanka, listed alphabetically.",
    url: "/developers",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Developers Directory in Sri Lanka",
    description: "Browse real estate developers building new apartment projects in Sri Lanka, listed alphabetically.",
  },
};

// Classic A-Z directory groups — fixed ranges rather than sized to today's
// developer count, so the layout stays stable as more developers are added.
const LETTER_GROUPS: { label: string; test: (letter: string) => boolean }[] = [
  { label: "A – F", test: (l) => l >= "A" && l <= "F" },
  { label: "G – L", test: (l) => l >= "G" && l <= "L" },
  { label: "M – R", test: (l) => l >= "M" && l <= "R" },
  { label: "S – Z", test: (l) => l >= "S" && l <= "Z" },
];

export default async function DevelopersPage() {
  const allDevelopers = await getAllDevelopers();

  // De-duplicate by name — the same developer can otherwise appear twice
  // (e.g. one profile with richer data, one bare-bones stub); keep whichever
  // has the most complete profile.
  const developers = Array.from(
    allDevelopers.reduce((unique, developer) => {
      const key = developer.name.trim().toLowerCase();
      const current = unique.get(key);
      const currentScore = current
        ? current.activeProjects + current.completedProjects + Number(Boolean(current.location)) + Number(Boolean(current.description))
        : -1;
      const nextScore = developer.activeProjects + developer.completedProjects + Number(Boolean(developer.location)) + Number(Boolean(developer.description));

      if (!current || nextScore > currentScore) unique.set(key, developer);
      return unique;
    }, new Map<string, Developer>()).values(),
  ).sort((a, b) => a.name.localeCompare(b.name));

  // Directory pinning (owner, 2026-09-24 build note item 8) — Developer
  // Pro/Campaign developers (same `developerSpotlight` entitlement the
  // homepage chip uses, getPackage in packages.ts) get a pinned section
  // above the regular A-Z groups; Campaign outranks Developer Pro within
  // it (planRotationWeight, same tier-first ordering now used for
  // /projects — see listing-page.tsx). Excluded from the A-Z groups below
  // so nobody appears twice on the page.
  const pinnedDevelopers = developers
    .filter((developer) => getPackage(developer.plan).developerSpotlight)
    .sort((a, b) => planRotationWeight(b.plan) - planRotationWeight(a.plan) || a.name.localeCompare(b.name));
  const pinnedSlugs = new Set(pinnedDevelopers.map((developer) => developer.slug));
  const unpinnedDevelopers = developers.filter((developer) => !pinnedSlugs.has(developer.slug));

  const groups = LETTER_GROUPS
    .map((group) => ({
      label: group.label,
      developers: unpinnedDevelopers.filter((developer) => group.test(developer.name.trim().charAt(0).toUpperCase())),
    }))
    .filter((group) => group.developers.length > 0);

  const TINTS = ["gray", "cream", "lilac", "sage"] as const;

  // Owner, 2026-10-02: redesign /developers in the contained-box system
  // shared with /about, /guides and /neighborhoods. Pinned Developer Pro /
  // Campaign developers keep their own section above the A-Z groups.
  return (
    <div className="fdv-page directory-page">
      <section className="fdv-hero fdv-hero--split" aria-label="Developer directory">
        <div className="fdv-hero-split-inner">
          <div className="fdv-hero-content">
            <h1 className="fdv-hero-headline">Property developers in Sri Lanka.</h1>
            <p className="fdv-hero-sub">
              Companies developing new residential projects in Sri Lanka, listed A to Z. Open a profile to see every
              project they have listed.
            </p>
            <div className="fdv-hero-ctas">
              <Link href="/projects" className="fdv-cta-final-button">Browse new homes</Link>
              <Link href="/for-developers" className="fdv-cta-secondary fdv-hero-explore-link">List your project</Link>
            </div>
          </div>
          <div className="about-hero-panel">
            <dl className="about-hero-panel-grid directory-hero-stat" aria-label="Developer directory by the numbers">
              <div className="about-hero-panel-stat">
                <dd>{developers.length}</dd>
                <dt>Developers listed</dt>
              </div>
            </dl>
            <p className="fdv-hero-mock-caption">Live count from the platform.</p>
          </div>
        </div>
      </section>

      {pinnedDevelopers.length > 0 ? (
        <section className="fdv-box fdv-box--sage" id="developer-pro" aria-label="Developer Pro">
          <div className="wdx-section-head" data-reveal>
            <h2>Developer Pro.</h2>
            <p>Developers on a Developer Pro or Campaign package.</p>
          </div>
          <ul className="neighborhoods-chip-list" data-reveal>
            {pinnedDevelopers.map((developer) => (
              <li key={developer.slug}>
                <Link href={`/developers/${developer.slug}`}>{developer.name}</Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {groups.map((group, index) => (
        <section key={group.label} className={`fdv-box fdv-box--${TINTS[index % TINTS.length]}`} id={`letters-${index + 1}`} aria-label={`Developers ${group.label}`}>
          <div className="wdx-section-head" data-reveal>
            <h2>{group.label}</h2>
          </div>
          <ul className="neighborhoods-chip-list" data-reveal>
            {group.developers.map((developer) => (
              <li key={developer.slug}>
                <Link href={`/developers/${developer.slug}`}>{developer.name}</Link>
              </li>
            ))}
          </ul>
        </section>
      ))}

      <section className="fdv-box fdv-box--dark guides-howto" aria-label="About the developer directory">
        <div className="guides-howto-grid">
          <div className="guides-howto-text">
            <h2>About the developer directory.</h2>
            <p>
              {`This directory lists the ${developers.length} property developers whose new homes and land are available on LankaNewHomes, from established groups to newer boutique developers. Each profile shows who they are, where they build, and every project they have listed with us.`}
            </p>
            <p>
              Open a profile to see current and upcoming projects, location and years in business, and to send an
              enquiry directly to their team. Developers list for free, and buyers contact them directly with no
              agent in between.
            </p>
          </div>
          <div className="guides-howto-box">
            <h3>Keep exploring</h3>
            <ul>
              <li><Link href="/projects"><strong>New projects</strong><span>Apartments, villas and houses.</span></Link></li>
              <li><Link href="/construction-companies"><strong>Construction companies</strong><span>Builders for your own plot.</span></Link></li>
              <li><Link href="/for-developers"><strong>For developers</strong><span>List your projects for free.</span></Link></li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}
