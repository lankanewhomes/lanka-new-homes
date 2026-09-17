import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Blog",
  description: "Buying guides, market insights, and news from LankaNewHomes.",
  alternates: { canonical: "/blog" },
  // No real posts yet — indexing a "check back soon" page would compete
  // with actual content pages for thin/low-value crawl budget. Remove once
  // real posts exist.
  robots: { index: false, follow: true },
};

export default function BlogPage() {
  return (
    <div className="static-page-shell">
      <h1>Blog</h1>
      <p className="static-page-lede">We&apos;re working on buying guides, market insights, and developer spotlights. Check back soon.</p>
    </div>
  );
}
