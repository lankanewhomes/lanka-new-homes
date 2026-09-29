import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { blogPosts, formatBlogDate } from "@/lib/blog";

export const metadata: Metadata = {
  title: "Blog",
  description: "Buying guides, market insights, and web design advice for property developers, from LankaNewHomes.",
  alternates: { canonical: "/blog" },
};

// Layout follows the reference the owner shared, 2026-09-29 (amini.ai's
// resources page): a plain header, then posts as a list — thumbnail,
// category, title, byline — not a card grid. Only one post exists today;
// once there are a few, the newest can move into a larger "featured" slot
// above the list the same way the reference does.
export default function BlogPage() {
  const posts = Object.values(blogPosts).sort((a, b) => (a.publishDate < b.publishDate ? 1 : -1));

  return (
    <div className="blog-page">
      <div className="blog-page-head">
        <h1>Blog</h1>
        <p className="blog-page-lede">Buying guides, market insights, and web design advice for property developers.</p>
      </div>

      {posts.length > 0 ? (
        <ul className="blog-list">
          {posts.map((post) => (
            <li key={post.slug} className="blog-list-item">
              <Link href={post.path} className="blog-list-thumb">
                <Image src={post.heroImage} alt="" fill sizes="(min-width: 760px) 240px, 100vw" className="blog-list-thumb-img" />
              </Link>
              <div className="blog-list-copy">
                <p className="blog-list-category">{post.category}</p>
                <h2><Link href={post.path}>{post.title}</Link></h2>
                <p className="blog-list-excerpt">{post.excerpt}</p>
                <p className="blog-list-byline">{post.author} · {formatBlogDate(post.publishDate)} · {post.readMinutes} min read</p>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="blog-page-lede">We&apos;re working on buying guides, market insights, and developer spotlights. Check back soon.</p>
      )}
    </div>
  );
}
