import type { Metadata } from "next";
import Link from "next/link";
import { withSocial } from "@/lib/seo";
import { formatPostDate, getProjectLinks } from "@/lib/bio-links";

export const metadata: Metadata = withSocial({
  title: "Latest Listings from Instagram",
  description: "The newest homes LankaNewHomes has posted on Instagram, with floor plans, photos and prices for each.",
  alternates: { canonical: "/links/projects" },
  // A link-in-bio list, not a page worth ranking: keep it out of search but let crawlers follow the listing links.
  robots: { index: false, follow: true },
}, { path: "/links/projects" });

// Owner, 2026-10-20: Instagram only lets the bio link be edited in the phone app, so the bio points at /links (which redirects here) once and this
// page keeps itself current from the `social-posts` collection (every Instagram post is logged there). Newest first,
// one card per listing, each linking to the listing with the same Instagram UTM tags the captions use.
export const revalidate = 300;

const INSTAGRAM_URL = "https://www.instagram.com/lankanewhomes/";

export default async function LinksPage() {
  const links = await getProjectLinks();
  const newest = formatPostDate(links[0]?.postedAt);

  // Owner, 2026-10-20: "built the design like this" (/neighborhoods) — same contained-box system: dark split hero with
  // live counts, then a soft box of white cards (docs/design.md "Page section style: contained boxes").
  return (
    <div className="fdv-page bio-links-page">
      <section className="fdv-hero fdv-hero--split" aria-label="Homes from our Instagram">
        <div className="fdv-hero-split-inner">
          <div className="fdv-hero-content">
            <h1 className="fdv-hero-headline">Homes from our Instagram.</h1>
            <p className="fdv-hero-sub">
              Every home we&apos;ve posted on Instagram, newest first. Tap a listing for floor plans, photos and prices.
            </p>
            <div className="fdv-hero-ctas">
              <Link href="/projects?utm_source=instagram&utm_medium=social&utm_campaign=bio-links" className="fdv-cta-final-button">Browse new homes</Link>
              <Link href="/links/land" className="fdv-cta-secondary fdv-hero-explore-link">Land from Instagram</Link>
              <a href={INSTAGRAM_URL} className="fdv-cta-secondary fdv-hero-explore-link" target="_blank" rel="noopener noreferrer">Follow @lankanewhomes</a>
            </div>
          </div>
          <div className="about-hero-panel">
            <dl className="about-hero-panel-grid" aria-label="Instagram posts by the numbers">
              <div className="about-hero-panel-stat">
                <dd>{links.length}</dd>
                <dt>Homes posted</dt>
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

      <section className="fdv-box fdv-box--sage" id="latest" aria-label="Latest posts">
        <div className="wdx-section-head">
          <h2>Latest posts.</h2>
          <p>The homes from our Instagram, newest first.</p>
        </div>
        {links.length ? (
          // Owner, 2026-10-21: rows like Instagram's own links sheet (round photo, bold name, small detail line, dividers).
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
          <p className="bio-links-empty">New posts are on their way. In the meantime, browse every listing.</p>
        )}
      </section>
    </div>
  );
}
