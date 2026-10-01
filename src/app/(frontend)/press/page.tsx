import type { Metadata } from "next";
import { Download } from "lucide-react";
import { getAllProjects } from "@/lib/project-store";
import { getAllLands } from "@/lib/land-store";
import { getAllDevelopers } from "@/lib/developer-store";
import { getAllNeighborhoods } from "@/lib/neighborhood-store";

export const metadata: Metadata = {
  title: "Press & Media – Brand Assets and Enquiries",
  description: "Media inquiries and brand assets for LankaNewHomes, Sri Lanka's marketplace for new homes and developer-led land projects.",
  alternates: { canonical: "/press" },
};

// Owner, 2026-09-29: "also create a press pae" / "create it like this"
// (a Planned.com-style press page: hero, Media inquiries, Brand kit, "As
// seen in"). We only build the parts that are real: a real contact address
// (the same support@lankanewhomes.com used on /contact) and the two real
// logo files this repo actually has (public/logo-wordmark*.svg). No "As
// seen in" section — LankaNewHomes has no real press coverage to show yet,
// and inventing outlet logos/quotes would be fabricating credibility that
// doesn't exist. Add that section once there's real coverage to list.
const BRAND_ASSETS = [
  { label: "Wordmark — dark", href: "/logo-wordmark.svg", cardClassName: "press-asset-preview-light" },
  { label: "Wordmark — white", href: "/logo-wordmark-white.svg", cardClassName: "press-asset-preview-dark" },
] as const;

export default async function PressPage() {
  const [projects, lands, developers, neighborhoods] = await Promise.all([
    getAllProjects(),
    getAllLands(),
    getAllDevelopers(),
    getAllNeighborhoods(),
  ]);
  const facts = [
    { label: "Live projects", value: projects.length },
    { label: "Land projects", value: lands.length },
    { label: "Developers & builders", value: developers.length },
    { label: "Areas covered", value: neighborhoods.length },
  ];

  return (
    <div className="fdv-page press-page">
      {/* Owner, 2026-09-30: "redesign the press page like about us page" —
          same contained-box system as /about and /for-developers
          (docs/design.md "Page section style: contained boxes"). Media
          inquiries stay in the hero (owner, 2026-09-30: "this can be in the
          hero section"). */}
      <section className="fdv-hero fdv-hero--split" aria-label="Press">
        <div className="fdv-hero-split-inner">
          <div className="fdv-hero-content">
            <h1 className="fdv-hero-headline">Press &amp; media.</h1>
            <p className="fdv-hero-sub">
              Media inquiries and brand assets for LankaNewHomes, Sri Lanka&apos;s marketplace for new homes and
              developer-led land projects.
            </p>
          </div>
          <div className="about-hero-panel">
            <div className="press-contact-card press-hero-contact">
              <p>For all press and media inquiries, please contact:</p>
              <a href="mailto:support@lankanewhomes.com" className="press-contact-email">support@lankanewhomes.com</a>
            </div>
          </div>
        </div>
      </section>

      {/* New boilerplate box — the same description this site already
          publishes (About page / site metadata), nothing invented. */}
      <section className="fdv-box fdv-box--gray" id="about" aria-label="About LankaNewHomes">
        <div className="wdx-section-head" data-reveal>
          <h2>About LankaNewHomes.</h2>
          <p>A short description for press use.</p>
        </div>
        <div className="fdv-box-card press-boilerplate" data-reveal>
          <p>
            LankaNewHomes is Sri Lanka&apos;s marketplace for new homes, developments, and developer-led land
            projects — connecting buyers directly with developers and builders across the island. Every project is
            free to list, enquiries go straight to the project&apos;s own team, and each listing carries real
            photography, floor plans and pricing.
          </p>
        </div>
      </section>

      {/* Owner, 2026-09-30: "any section you need to add" — live counts, the
          same real figures /about shows (never estimated). */}
      <section className="fdv-box fdv-box--sage" id="facts" aria-label="Key facts">
        <div className="wdx-section-head" data-reveal>
          <h2>Key facts.</h2>
          <p>LankaNewHomes by the numbers, counted live from the platform.</p>
        </div>
        <div className="fdv-box-grid fdv-box-grid--4" data-reveal>
          {facts.map((fact) => (
            <div className="fdv-box-card press-fact" key={fact.label}>
              <strong>{fact.value}</strong>
              <span>{fact.label}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="fdv-box fdv-box--cream" id="brand-kit" aria-label="Brand kit">
        <div className="wdx-section-head" data-reveal>
          <h2>Brand kit.</h2>
          <p>The LankaNewHomes wordmark, for press and media use.</p>
        </div>
        <div className="press-assets-grid" data-reveal>
          {BRAND_ASSETS.map((asset) => (
            <a key={asset.href} href={asset.href} download className="press-asset-card">
              <span className={`press-asset-preview ${asset.cardClassName}`}>
                {/* Static SVGs already in /public — a plain <img>, same as
                    any other <link rel="icon"> style asset, needs no
                    next/image optimisation. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={asset.href} alt={asset.label} />
              </span>
              <span className="press-asset-label">
                {asset.label}
                <Download size={16} strokeWidth={2} aria-hidden="true" />
              </span>
            </a>
          ))}
        </div>
      </section>
    </div>
  );
}
