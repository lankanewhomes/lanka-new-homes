import type { Metadata } from "next";
import Link from "next/link";
import { Building2, Search } from "lucide-react";
import { getAllProjects } from "@/lib/project-store";
import { getAllLands } from "@/lib/land-store";
import { getAllDevelopers } from "@/lib/developer-store";
import { getAllNeighborhoods } from "@/lib/neighborhood-store";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "About",
  description: "LankaNewHomes is Sri Lanka's marketplace for new homes, developments, and developer-led land projects — connecting buyers directly with developers and builders across the island.",
  alternates: { canonical: "/about" },
};

// Owner, 2026-09-29: "redesifn the about us page. https://www.amini.ai/about"
// — that page's structure is hero → stats → mission → values → team →
// careers → footer CTA. We don't fabricate a team or careers section (no
// real bios, headshots or job openings exist to show), so this borrows the
// parts that map to something real — a dark hero, the real live-count
// stats this page already had, a mission statement, and a values section
// grounded in facts already stated elsewhere on the site (always-free
// listing, the Verified/Responds badges, the pricing-on-every-listing
// rule) — and closes with the existing developers/buyers split, restyled
// to the .fdv-page visual language shared with /web-design, /for-developers
// and /contact instead of the plain long-form .guide-page template.
const VALUES = [
  {
    title: "Always free to list",
    body: "Every project on LankaNewHomes is listed for free, permanently — not a limited-time offer.",
  },
  {
    title: "Direct to the developer",
    body: "Enquiries go straight to the project's own team. No agent, no middleman, no added fees.",
  },
  {
    title: "Verified & responsive",
    body: "Developers earn a Verified badge, and a “Responds within 1 hour” badge once they've proven fast to reply.",
  },
  {
    title: "Every listing complete",
    body: "Real photography, floor plans and pricing on every project page — never a placeholder or a locked PDF.",
  },
] as const;

export default async function AboutPage() {
  const [projects, lands, developers, neighborhoods] = await Promise.all([
    getAllProjects(),
    getAllLands(),
    getAllDevelopers(),
    getAllNeighborhoods(),
  ]);

  // Real, live counts — same idea as the CMS dashboard's stat cards, never
  // a hard-coded or estimated figure (see feedback_no_derived_numbers_from_estimates).
  const stats = [
    { label: "Live Projects", value: projects.length },
    { label: "Land Projects", value: lands.length },
    { label: "Developers & Builders", value: developers.length },
    { label: "Areas Covered", value: neighborhoods.length },
  ];

  return (
    <div className="fdv-page about-page">
      <section className="fdv-hero" aria-label="About LankaNewHomes">
        <div className="fdv-hero-content">
          <h1 className="fdv-hero-headline">One place to discover what&apos;s being built in Sri Lanka.</h1>
          <p className="fdv-hero-sub">
            LankaNewHomes is Sri Lanka&apos;s marketplace for new homes, developments, and developer-led land
            projects — connecting buyers directly with developers and builders across the island.
          </p>
          <div className="fdv-hero-ctas">
            <Link href="/projects" className="fdv-cta-primary">Browse new homes</Link>
            <Link href="/for-developers" className="fdv-cta-secondary">For developers</Link>
          </div>

          {/* Owner, 2026-09-29: "these should be under the hero buttons" —
              moved from its own standalone section (previously right after
              the hero) into the hero itself. */}
          <dl className="about-stats about-hero-stats" aria-label="LankaNewHomes by the numbers">
            {stats.map((stat) => (
              <div className="about-stat" key={stat.label}>
                <dd>{stat.value}</dd>
                <dt>{stat.label}</dt>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="fdv-reasons" aria-label="What we stand for">
        <div className="wdx-section-head" data-reveal>
          <h2>What we stand for.</h2>
        </div>
        <div className="fdv-reasons-grid about-values-grid" data-reveal>
          {VALUES.map((value) => (
            <div className="fdv-reason-simple" key={value.title}>
              <h3>{value.title}</h3>
              <p>{value.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="wdx-compare" aria-label="For developers or for buyers">
        <div className="wdx-section-head" data-reveal>
          <h2>Whether you&apos;re building or buying.</h2>
        </div>
        <div className="wdx-compare-grid">
          <div className="wdx-compare-card wdx-compare-card-dark" data-reveal>
            <Building2 size={26} strokeWidth={1.4} aria-hidden="true" />
            <h3>For Developers</h3>
            <p>
              Create a public profile, manage your project listings, receive lead alerts, and showcase your
              developments to buyers — whether you&apos;re selling new apartments, condominiums, villas, houses, or
              developer-owned residential land.
            </p>
            <Link href="/for-developers" className="fdv-text-link">Why developers list with us →</Link>
          </div>
          <div className="wdx-compare-card" data-reveal>
            <Search size={26} strokeWidth={1.4} aria-hidden="true" />
            <h3>For Buyers</h3>
            <p>
              Discover new homes and developer land projects by location or property type. Explore project
              details, view floor plans, amenities and locations, and request information directly from the
              developer or sales team behind each project.
            </p>
            <Link href="/projects" className="fdv-text-link">Browse new homes →</Link>
          </div>
        </div>
      </section>

      <section className="fdv-cta-final" aria-label="Get started">
        <div className="fdv-cta-final-inner" data-reveal>
          <div className="fdv-cta-final-text">
            <h2>
              <span className="fdv-cta-final-muted">Whether you&apos;re building or buying,</span> there&apos;s a
              place for you here.
            </h2>
          </div>
          <div className="about-cta-buttons">
            <Link href="/developers/register" className="fdv-cta-final-button">Register as a developer</Link>
            <Link href="/projects" className="fdv-cta-final-button">Browse new homes</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
