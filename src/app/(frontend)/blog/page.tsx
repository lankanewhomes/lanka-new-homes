import type { Metadata } from "next";
import { blogPosts } from "@/lib/blog";
import { SeoAboutBlock } from "@/components/marketplace/seo-about-block";
import { BlogListing } from "@/components/marketplace/blog-listing";

export const metadata: Metadata = {
  title: "News & Insights",
  description: "Buying guides, market insights, and web design advice for property developers, from LankaNewHomes.",
  alternates: { canonical: "/blog" },
};

// Layout follows the reference the owner shared, 2026-09-29 (amini.ai's
// resources page): a dark full-bleed "Featured article" band (newest post
// in the current filter, image + content split) above a card grid for the
// rest, plus category filter pills and a Newest/Oldest sort — see
// blog-listing.tsx for why that component borrows only the parts of the
// reference that map to real data (one content type, real categories).
// On-page title is "News & Insights" (owner, 2026-09-29 — picked over
// "Blog"/"Insights"/"Resources"); nav and footer links still say "Blog",
// a shorter label than fits well in that spot — only asked to change the
// page's own title.
export default function BlogPage() {
  const posts = Object.values(blogPosts).sort((a, b) => (a.publishDate < b.publishDate ? 1 : -1));

  return (
    <div className="fdv-page blog-page">
      <div className="blog-page-head">
        <h1>News &amp; Insights</h1>
        <p className="blog-page-lede">Buying guides, market insights, and web design advice for property developers.</p>
      </div>

      {posts.length > 0 ? (
        <BlogListing posts={posts} />
      ) : (
        <p className="blog-page-lede">We&apos;re working on buying guides, market insights, and developer spotlights. Check back soon.</p>
      )}

      <SeoAboutBlock
        title="About News & Insights"
        paragraphs={[
          "News & Insights is where LankaNewHomes publishes practical writing for people who buy, sell or develop property in Sri Lanka: buying guides for new-build homes, notes on how the market and neighbourhoods are changing, and advice for developers on presenting their projects online.",
          "Browse by category to find what is relevant to you, and sort by newest or oldest. Articles link through to the project, neighbourhood and developer pages they mention, so you can go from reading about an area to seeing the homes available there.",
        ]}
      />
    </div>
  );
}
