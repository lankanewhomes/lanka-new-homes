import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { blogPosts, formatBlogDate } from "@/lib/blog";

export const metadata: Metadata = {
  title: "Blog",
  description: "Buying guides, market insights, and web design advice for property developers, from LankaNewHomes.",
  alternates: { canonical: "/blog" },
};

// Layout follows the reference the owner shared, 2026-09-29 (amini.ai's
// resources page): a dark full-bleed "Featured article" band (newest post,
// image + content split) above a card grid for the rest — not the earlier
// plain thumbnail list. No category filter pills or pagination (that page's
// own filter bar) — only one post exists today, so a filter with one real
// option isn't worth building yet; add once there are enough posts to need
// it. No category eyebrow on the cards either (owner, same day: "delete the
// eyebrow label on the articles").
export default function BlogPage() {
  const posts = Object.values(blogPosts).sort((a, b) => (a.publishDate < b.publishDate ? 1 : -1));
  const [featured, ...rest] = posts;

  return (
    <div className="fdv-page blog-page">
      <div className="blog-page-head">
        <h1>Blog</h1>
        <p className="blog-page-lede">Buying guides, market insights, and web design advice for property developers.</p>
      </div>

      {featured ? (
        <>
          <section className="blog-hero" aria-label="Featured article">
            <div className="blog-hero-inner">
              <div className="blog-hero-media">
                <Image src={featured.heroImage} alt="" fill sizes="(min-width: 860px) 50vw, 100vw" priority className="blog-hero-media-img" />
              </div>
              <div className="blog-hero-content">
                <p className="blog-hero-eyebrow">Featured article</p>
                <h2><Link href={featured.path}>{featured.title}</Link></h2>
                <p className="blog-hero-excerpt">{featured.excerpt}</p>
                <Link href={featured.path} className="blog-hero-link">
                  Read article
                  <ArrowRight size={16} strokeWidth={2.5} aria-hidden="true" />
                </Link>
                <p className="blog-hero-byline">
                  {featured.author} · {formatBlogDate(featured.publishDate)} · {featured.readMinutes} min read
                </p>
              </div>
            </div>
          </section>

          {rest.length > 0 && (
            <ul className="blog-grid">
              {rest.map((post) => (
                <li key={post.slug} className="blog-card">
                  <Link href={post.path} className="blog-card-media">
                    <Image src={post.heroImage} alt="" fill sizes="(min-width: 760px) 33vw, 100vw" className="blog-card-media-img" />
                  </Link>
                  <div className="blog-card-copy">
                    <h3><Link href={post.path}>{post.title}</Link></h3>
                    <p className="blog-card-excerpt">{post.excerpt}</p>
                    <p className="blog-card-byline">{formatBlogDate(post.publishDate)} · {post.readMinutes} min read</p>
                    <Link href={post.path} className="blog-card-link">
                      Read article
                      <ArrowRight size={14} strokeWidth={2.5} aria-hidden="true" />
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </>
      ) : (
        <p className="blog-page-lede">We&apos;re working on buying guides, market insights, and developer spotlights. Check back soon.</p>
      )}
    </div>
  );
}
