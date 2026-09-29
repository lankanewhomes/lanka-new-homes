"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ChevronDown } from "lucide-react";
import { formatBlogDate, type BlogPost } from "@/lib/blog";

// Owner, 2026-09-29: "blog pag elike this" (amini.ai/resources#blog) — that
// reference has filter pills and a "Sort by" dropdown above its article
// grid. We only have one kind of content (no separate "research" tab to
// mirror), so this borrows just the parts that map to real data: a category
// pill per real BlogPost.category value, plus a Newest/Oldest sort — both
// genuinely filter/reorder the grid rather than being decorative.
const CATEGORIES = ["All Posts", "Web design", "For developers", "Market insights"] as const;
type Category = (typeof CATEGORIES)[number];

const SORTS = [
  { key: "newest", label: "Newest" },
  { key: "oldest", label: "Oldest" },
] as const;
type SortKey = (typeof SORTS)[number]["key"];

export function BlogListing({ posts }: { posts: BlogPost[] }) {
  const [category, setCategory] = useState<Category>("All Posts");
  const [sort, setSort] = useState<SortKey>("newest");

  const filtered = useMemo(() => {
    const byCategory = category === "All Posts" ? posts : posts.filter((post) => post.category === category);
    return [...byCategory].sort((a, b) =>
      sort === "newest" ? (a.publishDate < b.publishDate ? 1 : -1) : a.publishDate < b.publishDate ? -1 : 1,
    );
  }, [posts, category, sort]);

  const [featured, ...rest] = filtered;

  return (
    <>
      <div className="blog-filter-bar" data-reveal>
        <div className="blog-filter-pills" role="tablist" aria-label="Filter articles by category">
          {CATEGORIES.map((option) => (
            <button
              key={option}
              type="button"
              role="tab"
              aria-selected={option === category}
              className={`blog-filter-pill${option === category ? " is-active" : ""}`}
              onClick={() => setCategory(option)}
            >
              {option}
            </button>
          ))}
        </div>
        <label className="blog-sort">
          Sort by
          <span className="blog-sort-control">
            <select value={sort} onChange={(event) => setSort(event.target.value as SortKey)} aria-label="Sort articles">
              {SORTS.map((option) => (
                <option key={option.key} value={option.key}>
                  {option.label}
                </option>
              ))}
            </select>
            <ChevronDown size={14} strokeWidth={2.5} aria-hidden="true" className="blog-sort-chevron" />
          </span>
        </label>
      </div>

      {featured ? (
        <>
          <section className="blog-hero" aria-label="Featured article">
            <div className="blog-hero-inner">
              <div className="blog-hero-media">
                <Image
                  src={featured.heroImage}
                  alt=""
                  fill
                  sizes="(min-width: 860px) 50vw, 100vw"
                  priority
                  className="blog-hero-media-img"
                />
              </div>
              <div className="blog-hero-content">
                <p className="blog-hero-eyebrow">Featured article</p>
                <h2>
                  <Link href={featured.path}>{featured.title}</Link>
                </h2>
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
                    <h3>
                      <Link href={post.path}>{post.title}</Link>
                    </h3>
                    <p className="blog-card-excerpt">{post.excerpt}</p>
                    <p className="blog-card-byline">
                      {formatBlogDate(post.publishDate)} · {post.readMinutes} min read
                    </p>
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
        <p className="blog-page-lede">No articles in this category yet — check back soon.</p>
      )}
    </>
  );
}
