import type { Metadata } from "next";
import Link from "next/link";
import { withSocial } from "@/lib/seo";
import { formatPostDate, getLandLinks, getProjectLinks, type BioLink } from "@/lib/bio-links";

export const metadata: Metadata = withSocial({
  title: "Latest Homes and Land from Instagram",
  description: "The newest homes and land LankaNewHomes has posted on Instagram, with floor plans, photos, prices and plot details for each.",
  alternates: { canonical: "/links" },
  // A link-in-bio list, not a page worth ranking: keep it out of search but let crawlers follow the listing links.
  robots: { index: false, follow: true },
}, { path: "/links" });

// Owner, 2026-10-23: the Instagram bio points at /links, one page with both lists, homes first and land second.
// /links/projects and /links/land stay as the single-list versions. All three are built from the `social-posts` collection.
export const revalidate = 300;

const INSTAGRAM_URL = "https://www.instagram.com/lankanewhomes/";

function LinkRows({ links }: { links: BioLink[] }) {
  return (
    <ul className="bio-links-list">
      {links.map((link, index) => (
        <li key={link.slug}>
          <a href={link.href} className="bio-links-row">
            <span className="bio-links-thumb">
              {link.image ? (
                // eslint-disable-next-line @next/next/no-img-element -- remote R2 images, same as the listing cards
                <img src={link.image} alt="" loading={index < 6 ? "eager" : "lazy"} />
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
  );
}

export default async function LinksPage() {
  const [homes, land] = await Promise.all([getProjectLinks(), getLandLinks()]);
  const newest = [homes[0]?.postedAt, land[0]?.postedAt].filter(Boolean).sort().pop();

  // Same contained-box system as /neighborhoods (docs/design.md "Page section style: contained boxes"): dark split hero with
  // live counts, then one box per list (sage for homes, cream for land) holding a white panel of rows.
  return (
    <div className="fdv-page bio-links-page">
      <section className="fdv-hero fdv-hero--split" aria-label="Homes and land from our Instagram">
        <div className="fdv-hero-split-inner">
          <div className="fdv-hero-content">
            <h1 className="fdv-hero-headline">Homes and land from our Instagram.</h1>
            <p className="fdv-hero-sub">
              Everything we&apos;ve posted on Instagram, newest first. Tap a listing for floor plans, photos, prices and plot details.
            </p>
            <div className="fdv-hero-ctas">
              <Link href="/projects?utm_source=instagram&utm_medium=social&utm_campaign=bio-links" className="fdv-cta-final-button">Browse new homes</Link>
              <Link href="/land?utm_source=instagram&utm_medium=social&utm_campaign=bio-links-land" className="fdv-cta-secondary fdv-hero-explore-link">Browse all land</Link>
              <a href={INSTAGRAM_URL} className="fdv-cta-secondary fdv-hero-explore-link" target="_blank" rel="noopener noreferrer">Follow @lankanewhomes</a>
            </div>
          </div>
          <div className="about-hero-panel">
            <dl className="about-hero-panel-grid" aria-label="Instagram posts by the numbers">
              <div className="about-hero-panel-stat">
                <dd>{homes.length}</dd>
                <dt>Homes posted</dt>
              </div>
              <div className="about-hero-panel-stat">
                <dd>{land.length}</dd>
                <dt>Lands posted</dt>
              </div>
            </dl>
            <p className="fdv-hero-mock-caption">Latest post {formatPostDate(newest) ?? "–"}. Live from our Instagram posts.</p>
          </div>
        </div>
      </section>

      <section className="fdv-box fdv-box--sage" id="homes" aria-label="Homes from Instagram">
        <div className="wdx-section-head">
          <h2>Homes.</h2>
          <p>The new homes from our Instagram, newest first.</p>
        </div>
        {homes.length ? <LinkRows links={homes} /> : <p className="bio-links-empty">New posts are on their way. In the meantime, browse every listing.</p>}
        <p className="bio-links-more"><Link href="/links/projects">Homes only</Link></p>
      </section>

      <section className="fdv-box fdv-box--cream" id="land" aria-label="Land from Instagram">
        <div className="wdx-section-head">
          <h2>Land.</h2>
          <p>The plots and land from our Instagram, newest first.</p>
        </div>
        {land.length ? <LinkRows links={land} /> : <p className="bio-links-empty">New land posts are on their way. In the meantime, browse every plot.</p>}
        <p className="bio-links-more"><Link href="/links/land">Land only</Link></p>
      </section>
    </div>
  );
}
