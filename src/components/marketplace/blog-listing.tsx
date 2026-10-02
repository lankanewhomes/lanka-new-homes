"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { formatBlogDate, type BlogPost } from "@/lib/blog";

// Owner, 2026-10-02: "redesign the blog page" — the blog now uses the contained-box system shared with /about, /guides
// and the directories: category and sort buttons above a featured article card and a grid of article cards, all white
// bordered cards on a tinted box. Filters still genuinely filter / reorder real BlogPost data.
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
      <div className="blog-toolbar" data-reveal>
        <div className="account-chip-row" role="tablist" aria-label="Filter articles by category">
          {CATEGORIES.map((option) => (
            <button
              key={option}
              type="button"
              role="tab"
              aria-selected={option === category}
              className={`account-btn${option === category ? " account-btn--dark" : ""}`}
              onClick={() => setCategory(option)}
            >
              {option}
            </button>
          ))}
        </div>
        <div className="account-chip-row" role="group" aria-label="Sort articles">
          {SORTS.map((option) => (
            <button
              key={option.key}
              type="button"
              aria-pressed={option.key === sort}
              className={`account-btn${option.key === sort ? " account-btn--dark" : ""}`}
              onClick={() => setSort(option.key)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {featured ? (
        <>
          <article className="blog-feature" data-reveal>
            <Link href={featured.path} className="blog-feature-media">
              <Image
                src={featured.heroImage}
                alt=""
                fill
                sizes="(min-width: 900px) 50vw, 100vw"
                priority
                className="account-home-card-img"
              />
            </Link>
            <div className="blog-feature-copy">
              <h3>
                <Link href={featured.path}>{featured.title}</Link>
              </h3>
              <p>{featured.excerpt}</p>
              <p className="account-muted">
                {featured.author} · {formatBlogDate(featured.publishDate)} · {featured.readMinutes} min read
              </p>
              <Link href={featured.path} className="account-btn account-btn--dark blog-feature-link">
                Read article
                <ArrowRight size={16} strokeWidth={2} aria-hidden="true" />
              </Link>
            </div>
          </article>

          {rest.length > 0 ? (
            <ul className="account-card-grid blog-card-grid" data-reveal>
              {rest.map((post) => (
                <li key={post.slug} className="account-home-card">
                  <Link href={post.path} className="account-home-card-media">
                    <Image src={post.heroImage} alt="" fill sizes="(min-width: 900px) 33vw, 100vw" className="account-home-card-img" />
                  </Link>
                  <Link href={post.path} className="account-home-card-name">{post.title}</Link>
                  <span className="account-home-card-meta">{post.excerpt}</span>
                  <span className="account-home-card-meta">
                    {formatBlogDate(post.publishDate)} · {post.readMinutes} min read
                  </span>
                </li>
              ))}
            </ul>
          ) : null}
        </>
      ) : (
        <div className="fdv-box-card account-empty" data-reveal>
          <p>No articles in this category yet. Check back soon.</p>
        </div>
      )}
    </>
  );
}
