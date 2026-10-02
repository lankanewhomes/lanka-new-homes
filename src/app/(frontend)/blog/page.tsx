import type { Metadata } from "next";
import Link from "next/link";
import { blogPosts } from "@/lib/blog";
import { BlogListing } from "@/components/marketplace/blog-listing";

export const metadata: Metadata = {
  title: "Blog – News & Insights on Sri Lanka Property",
  description: "Buying guides, market insights, and web design advice for property developers, from LankaNewHomes.",
  alternates: { canonical: "/blog" },
};

// Owner, 2026-10-02: "redesign the blog page also" — same contained-box system as /about, /guides and the directories:
// dark split hero with live counts, a tinted box holding the filters, featured article and article cards, and a closing
// box with links. Everything shown is real (BlogPost data); no placeholder articles. On-page title stays "News & Insights"
// (owner, 2026-09-29); the metadata title carries "Blog" to match the /blog URL.
export default function BlogPage() {
  const posts = Object.values(blogPosts).sort((a, b) => (a.publishDate < b.publishDate ? 1 : -1));
  const categoryCount = new Set(posts.map((post) => post.category)).size;

  return (
    <div className="fdv-page blog-index">
      <section className="fdv-hero fdv-hero--split" aria-label="News and insights">
        <div className="fdv-hero-split-inner">
          <div className="fdv-hero-content">
            <h1 className="fdv-hero-headline">News &amp; insights.</h1>
            <p className="fdv-hero-sub">
              Buying guides, market insights, and web design advice for property developers, from LankaNewHomes.
            </p>
            <div className="fdv-hero-ctas">
              <Link href="/guides" className="fdv-cta-final-button">Buying guides</Link>
              <Link href="/for-developers" className="fdv-cta-secondary fdv-hero-explore-link">For developers</Link>
            </div>
          </div>
          <div className="about-hero-panel">
            <dl className="about-hero-panel-grid" aria-label="The blog by the numbers">
              <div className="about-hero-panel-stat">
                <dd>{posts.length}</dd>
                <dt>{posts.length === 1 ? "Article" : "Articles"}</dt>
              </div>
              <div className="about-hero-panel-stat">
                <dd>{categoryCount}</dd>
                <dt>{categoryCount === 1 ? "Category" : "Categories"}</dt>
              </div>
            </dl>
            <p className="fdv-hero-mock-caption">Live counts from the blog.</p>
          </div>
        </div>
      </section>

      <section className="fdv-box fdv-box--gray" id="articles" aria-label="Articles">
        <div className="wdx-section-head" data-reveal>
          <h2>Latest articles.</h2>
          <p>Filter by topic, or sort by newest or oldest.</p>
        </div>
        {posts.length > 0 ? (
          <BlogListing posts={posts} />
        ) : (
          <div className="fdv-box-card account-empty" data-reveal>
            <p>We are working on buying guides, market insights and developer spotlights. Check back soon.</p>
          </div>
        )}
      </section>

      <section className="fdv-box fdv-box--dark guides-howto" aria-label="About News & Insights">
        <div className="guides-howto-grid">
          <div className="guides-howto-text">
            <h2>About News &amp; Insights.</h2>
            <p>
              Practical writing for people who buy, sell or develop property in Sri Lanka: buying guides for new-build homes,
              notes on how the market and neighbourhoods are changing, and advice for developers on presenting their projects
              online.
            </p>
            <p>Articles link through to the project, neighbourhood and developer pages they mention.</p>
          </div>
          <div className="guides-howto-box">
            <h3>Keep exploring</h3>
            <ul>
              <li><Link href="/guides"><strong>Buying guides</strong><span>Foreign ownership, investment and residency.</span></Link></li>
              <li><Link href="/neighborhoods"><strong>Neighborhood guides</strong><span>Compare areas across Sri Lanka.</span></Link></li>
              <li><Link href="/projects"><strong>New projects</strong><span>Apartments, villas and houses.</span></Link></li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}
