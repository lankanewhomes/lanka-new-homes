import type { Metadata } from "next";
import { Download } from "lucide-react";

export const metadata: Metadata = {
  title: "Press",
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

export default function PressPage() {
  return (
    <div className="fdv-page press-page">
      {/* Owner, 2026-09-30: "this can be in the hero section" — Media
          inquiries moved out of its own section, into the hero. */}
      <section className="fdv-hero" aria-label="Press">
        <div className="fdv-hero-content">
          <h1 className="fdv-hero-headline">Press &amp; media.</h1>
          <p className="fdv-hero-sub">
            Media inquiries and brand assets for LankaNewHomes, Sri Lanka&apos;s marketplace for new homes and
            developer-led land projects.
          </p>
          <div className="press-contact-card">
            <p>For all press and media inquiries, please contact:</p>
            <a href="mailto:support@lankanewhomes.com" className="press-contact-email">support@lankanewhomes.com</a>
          </div>
        </div>
      </section>

      <section className="press-section press-section-alt" aria-label="Brand kit">
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
