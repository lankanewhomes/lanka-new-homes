import type { Metadata } from "next";
import Link from "next/link";
import { withSocial } from "@/lib/seo";
import { formatPostDate, getLandLinks } from "@/lib/bio-links";

export const metadata: Metadata = withSocial({
  title: "Latest Land from Instagram",
  description: "The newest plots and land LankaNewHomes has posted on Instagram, with prices per perch, plot details and photos for each.",
  alternates: { canonical: "/links/land" },
  // A link-in-bio list, not a page worth ranking: keep it out of search but let crawlers follow the listing links.
  robots: { index: false, follow: true },
}, { path: "/links/land" });

// Owner, 2026-10-22: a second link-in-bio page for the land posts (the homes list is /links/projects). Built the same way: it keeps
// itself current from the `social-posts` collection (every Instagram post is logged there), newest first, one row per land
// listing, each linking to /land/<slug> with the same Instagram UTM tags the captions use.
export const revalidate = 300;

const INSTAGRAM_URL = "https://www.instagram.com/lankanewhomes/";

export default async function LandLinksPage() {
  const links = await getLandLinks();
  const newest = formatPostDate(links[0]?.postedAt);

  // Same contained-box system and row layout as /links (docs/design.md "Page section style: contained boxes").
  return (
    <div className="fdv-page bio-links-page">
      <section className="fdv-hero fdv-hero--split" aria-label="Land from our Instagram">
        <div className="fdv-hero-split-inner">
          <div className="fdv-hero-content">
            <h1 className="fdv-hero-headline">Land from our Instagram.</h1>
            <p className="fdv-hero-sub">
              Every plot and land listing we&apos;ve posted on Instagram, newest first. Tap a listing for plot details, photos and prices per perch.
            </p>
            <div className="fdv-hero-ctas">
              <Link href="/land?utm_source=instagram&utm_medium=social&utm_campaign=bio-links-land" className="fdv-cta-final-button">Browse all land</Link>
              <Link href="/links/projects" className="fdv-cta-secondary fdv-hero-explore-link">Homes from Instagram</Link>
              <a href={INSTAGRAM_URL} className="fdv-cta-secondary fdv-hero-explore-link" target="_blank" rel="noopener noreferrer">Follow @lankanewhomes</a>
            </div>
          </div>
          <div className="about-hero-panel">
            <dl className="about-hero-panel-grid" aria-label="Instagram land posts by the numbers">
              <div className="about-hero-panel-stat">
                <dd>{links.length}</dd>
                <dt>Lands posted</dt>
              </div>
              <div className="about-hero-panel-stat">
                <dd>{newest ?? "–"}</dd>
                <dt>Latest post</dt>
              </div>
            </dl>
            <p className="fdv-hero-mock-caption">Live from our Instagram posts.</p>
          </div>
        </div>
      </section>

      <section className="fdv-box fdv-box--sage" id="latest" aria-label="Latest land posts">
        <div className="wdx-section-head">
          <h2>Latest posts.</h2>
          <p>The land from our Instagram, newest first.</p>
        </div>
        {links.length ? (
          <ul className="bio-links-list">
            {links.map((link, index) => (
              <li key={link.slug}>
                <a href={link.href} className="bio-links-row">
                  <span className="bio-links-thumb">
                    {link.image ? (
                      // eslint-disable-next-line @next/next/no-img-element -- remote R2 images, same as the listing cards
                      <img src={link.image} alt="" loading={index < 8 ? "eager" : "lazy"} />
                    ) : null}
                  </span>
                  <span className="bio-links-text">
                    <span className="bio-links-name">
                      {link.name}
                      {index === 0 ? <span className="bio-links-badge">Latest</span> : null}
                    </span>
                    <span className="bio-links-meta">{[link.area, link.price].filter(Boolean).join(" · ")}</span>
                  </span>
                  <svg className="bio-links-arrow" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M9 6l6 6-6 6" /></svg>
                </a>
              </li>
            ))}
          </ul>
        ) : (
          <p className="bio-links-empty">New land posts are on their way. In the meantime, browse every plot.</p>
        )}
      </section>
    </div>
  );
}
