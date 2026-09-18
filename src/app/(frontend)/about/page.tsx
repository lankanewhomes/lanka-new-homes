import type { Metadata } from "next";
import Link from "next/link";
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
    <article className="guide-page about-page">
      <div className="guide-page-intro">
        <p className="guide-page-eyebrow">About LankaNewHomes</p>
        <h1>One place to discover what&apos;s being built in Sri Lanka.</h1>
        <div className="guide-page-answer">
          <p>
            LankaNewHomes is Sri Lanka&apos;s marketplace for new homes, developments, and developer-led land
            projects — connecting buyers directly with developers and builders across the island.
          </p>
        </div>
      </div>

      <dl className="about-stats">
        {stats.map((stat) => (
          <div className="about-stat" key={stat.label}>
            <dd>{stat.value}</dd>
            <dt>{stat.label}</dt>
          </div>
        ))}
      </dl>

      <div className="guide-page-sections">
        <section className="guide-page-section">
          <span className="guide-page-section-number">01</span>
          <div>
            <h2>What We Do</h2>
            <p>
              We bring Sri Lanka&apos;s new residential developments and developer land projects together in
              one place. Explore <strong>condominiums, apartments, villas, houses, and residential land
              projects</strong> from developers across the country — compare locations, pricing, floor plans,
              amenities, and availability without searching across multiple developer websites.
            </p>
            <p>
              LankaNewHomes is built specifically around <strong>new developer and builder projects</strong>,
              giving buyers a dedicated place to discover what&apos;s being developed across Sri Lanka.
            </p>
          </div>
        </section>

        <section className="guide-page-section">
          <span className="guide-page-section-number">02</span>
          <div>
            <h2>For Developers</h2>
            <p>
              LankaNewHomes gives developers and builders a dedicated platform to showcase their projects and
              connect with people actively looking to buy. Create a public profile, manage your project
              listings, receive lead alerts, and showcase your developments to buyers — whether you&apos;re
              selling <strong>new apartments, condominiums, villas, houses, or developer-owned residential
              land</strong>.
            </p>
            <div className="about-page-links" aria-label="For developers">
              <Link href="/for-developers">Why developers list with us</Link>
              <Link href="/pricing">Pricing</Link>
              <Link href="/developers/register">Register as a developer</Link>
            </div>
          </div>
        </section>

        <section className="guide-page-section">
          <span className="guide-page-section-number">03</span>
          <div>
            <h2>For Buyers</h2>
            <p>
              Discover new homes and developer land projects by location or property type. Explore project
              details, view floor plans, amenities and locations, save your favourites, and request
              information directly from the developer or sales team behind each project.
            </p>
            <div className="about-page-links" aria-label="For buyers">
              <Link href="/projects">Browse new homes</Link>
              <Link href="/land">Browse land</Link>
              <Link href="/guides">Buyer guides</Link>
            </div>
          </div>
        </section>
      </div>
    </article>
  );
}
