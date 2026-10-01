import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";
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
    body: "Developers earn a Verified badge, and a “Responds within 24 hours” badge once they've proven fast to reply.",
  },
  {
    title: "Every listing complete",
    body: "Real photography, floor plans and pricing on every project page — never a placeholder or a locked PDF.",
  },
] as const;

// Owner, 2026-09-30: new "How it works" section — grounded in what the site
// already states elsewhere (free listing, direct enquiries), nothing invented.
const STEPS = [
  {
    title: "Developers list for free",
    body: "A developer registers, adds a project with real photography, floor plans and pricing, and it goes live once approved.",
  },
  {
    title: "Buyers browse real listings",
    body: "Buyers search by area, price and project type, compare homes side by side, and save the ones they like.",
  },
  {
    title: "Enquiries go direct",
    body: "Every enquiry reaches the project's own team the moment it's sent, by WhatsApp, phone or a form — no agent in between.",
  },
] as const;

// Owner, 2026-09-30: "put actually of the buildings, not swimming pool,
// backyard" — hand-picked projects whose hero image is the building's
// exterior, in this order.
const SHOWCASE_SLUGS = [
  "rush-city-dematagoda",
  "barrington-towers",
  "rush-residencies-allen-dehiwala",
  "raintree-villas-digana-kandy",
  "imaarat-bambalapitiya",
  "rush-tower-2-dehiwala",
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

  const showcaseProjects = SHOWCASE_SLUGS
    .map((slug) => projects.find((project) => project.slug === slug))
    .filter((project): project is NonNullable<typeof project> => Boolean(project));

  return (
    <div className="fdv-page about-page">
      {/* Owner, 2026-09-30: "about us page redesign like the for-developers
          page. also if you need to add any section go ahead" — same
          contained-box system as /for-developers (docs/design.md "Page
          section style: contained boxes"): dark hero box, then tinted,
          textured boxes with left-aligned headings. */}
      <section className="fdv-hero fdv-hero--split" aria-label="About LankaNewHomes">
        <div className="fdv-hero-split-inner">
          <div className="fdv-hero-content">
            <h1 className="fdv-hero-headline">One place to discover what&apos;s being built in Sri Lanka.</h1>
            <p className="fdv-hero-sub">
              LankaNewHomes is Sri Lanka&apos;s marketplace for new homes, developments, and developer-led land
              projects — connecting buyers directly with developers and builders across the island.
            </p>
            <div className="fdv-hero-ctas">
              <Link href="/projects" className="fdv-cta-final-button">Browse new homes</Link>
              <Link href="/for-developers" className="fdv-cta-secondary fdv-hero-explore-link">For developers</Link>
            </div>
          </div>

          <div className="about-hero-panel">
            <dl className="about-hero-panel-grid" aria-label="LankaNewHomes by the numbers">
              {stats.map((stat) => (
                <div className="about-hero-panel-stat" key={stat.label}>
                  <dd>{stat.value}</dd>
                  <dt>{stat.label}</dt>
                </div>
              ))}
            </dl>
            <p className="fdv-hero-mock-caption">Live counts from the platform.</p>
          </div>
        </div>
      </section>

      <section className="fdv-box fdv-box--gray" id="stand" aria-label="What we stand for">
        <div className="wdx-section-head" data-reveal>
          <h2>What we stand for.</h2>
          <p>Four commitments that shape every listing and every enquiry on the platform.</p>
        </div>
        <div className="fdv-box-grid fdv-box-grid--4" data-reveal>
          {VALUES.map((value) => (
            <div className="fdv-box-card" key={value.title}>
              <h3>{value.title}</h3>
              <p>{value.body}</p>
              {value.title === "Verified & responsive" ? (
                <span className="listing-badge-pill badge-verified fdv-badge-pill about-card-badge">
                  <ShieldCheck className="h-2.5 w-2.5" aria-hidden="true" />
                  Verified
                </span>
              ) : null}
            </div>
          ))}
        </div>
      </section>

      <section className="fdv-box fdv-box--cream" id="how" aria-label="How it works">
        <div className="wdx-section-head" data-reveal>
          <h2>How it works.</h2>
          <p>From a developer&apos;s first listing to a buyer&apos;s first enquiry — three steps, no middleman.</p>
        </div>
        <div className="fdv-box-grid fdv-box-grid--3" data-reveal>
          {STEPS.map((step) => (
            <div className="fdv-box-card" key={step.title}>
              <h3>{step.title}</h3>
              <p>{step.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Owner, 2026-09-29: "add more section... also add some images also
          please" — real project photography, not stock, same rule as the
          rest of the site's marketing pages. */}
      {showcaseProjects.length > 0 ? (
        <section className="fdv-box fdv-box--sage about-showcase" id="listings" aria-label="What's already on LankaNewHomes">
          <div className="wdx-section-head" data-reveal>
            <h2>See what&apos;s already on LankaNewHomes.</h2>
            <p>
              A sample of the real developments already listed — apartments, villas, houses and residential
              land, from developers across the island.
            </p>
          </div>
          <div className="about-showcase-grid" data-reveal>
            {showcaseProjects.map((project) => (
              <Link href={`/projects/${project.slug}`} className="about-showcase-card" key={project.slug}>
                <div className="about-showcase-card-media">
                  <Image
                    src={project.heroImage}
                    alt={project.name}
                    fill
                    sizes="(min-width: 900px) 33vw, 50vw"
                    className="about-showcase-card-img"
                  />
                </div>
                <span className="about-showcase-card-label">{project.name}</span>
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
