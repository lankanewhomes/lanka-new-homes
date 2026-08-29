import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Blog",
  description: "Buying guides, market insights, and news from NewHomesSrilanka.",
  alternates: { canonical: "/blog" },
};

export default function BlogPage() {
  return (
    <div className="static-page-shell">
      <h1>Blog</h1>
      <p className="static-page-lede">We&apos;re working on buying guides, market insights, and developer spotlights. Check back soon.</p>
    </div>
  );
}
