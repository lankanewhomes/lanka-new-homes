import type { Metadata } from "next";
import { blogPosts } from "@/lib/blog";
import { BlogListing } from "@/components/marketplace/blog-listing";

export const metadata: Metadata = {
  title: "Blog",
  description: "Buying guides, market insights, and web design advice for property developers, from LankaNewHomes.",
  alternates: { canonical: "/blog" },
};

// Layout follows the reference the owner shared, 2026-09-29 (amini.ai's
// resources page): a dark full-bleed "Featured article" band (newest post
// in the current filter, image + content split) above a card grid for the
// rest, plus category filter pills and a Newest/Oldest sort — see
// blog-listing.tsx for why that component borrows only the parts of the
// reference that map to real data (one content type, real categories).
export default function BlogPage() {
  const posts = Object.values(blogPosts).sort((a, b) => (a.publishDate < b.publishDate ? 1 : -1));

  return (
    <div className="fdv-page blog-page">
      <div className="blog-page-head">
        <h1>Blog</h1>
        <p className="blog-page-lede">Buying guides, market insights, and web design advice for property developers.</p>
      </div>

      {posts.length > 0 ? (
        <BlogListing posts={posts} />
      ) : (
        <p className="blog-page-lede">We&apos;re working on buying guides, market insights, and developer spotlights. Check back soon.</p>
      )}
    </div>
  );
}
