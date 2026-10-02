"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Check, ChevronDown } from "lucide-react";
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

// Square, spaced sort dropdown in the same style as the filter dropdowns on /projects (owner, 2026-10-02: "redesign the
// filters"). Closes on picking an option, tapping outside, or pressing Escape.
function SortDropdown({ value, onChange }: { value: SortKey; onChange: (value: SortKey) => void }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const current = SORTS.find((option) => option.key === value) ?? SORTS[0];

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className={`listing-filter-pill listing-filter-pill--custom blog-sort-dropdown${open ? " is-open" : ""}`}>
      <button type="button" className="listing-filter-pill-button" aria-haspopup="listbox" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
        Sort: {current.label}
        <ChevronDown className="h-3 w-3" aria-hidden="true" />
      </button>
      {open ? (
        <ul className="listing-filter-menu blog-sort-menu" role="listbox" aria-label="Sort articles">
          {SORTS.map((option) => (
            <li key={option.key}>
              <button
                type="button"
                role="option"
                aria-selected={option.key === value}
                onClick={() => {
                  onChange(option.key);
                  setOpen(false);
                }}
              >
                <span>{option.label}</span>
                {option.key === value ? <Check className="h-4 w-4" aria-hidden="true" /> : null}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

export function BlogListing({ posts }: { posts: BlogPost[] }) {
  const [category, setCategory] = useState<Category>("All Posts");
  const [sort, setSort] = useState<SortKey>("newest");

  const filtered = useMemo(() => {
    const byCategory = category === "All Posts" ? posts : posts.filter((post) => post.category === category);
    const sorted = [...byCategory].sort((a, b) =>
      sort === "newest" ? (a.publishDate < b.publishDate ? 1 : -1) : a.publishDate < b.publishDate ? -1 : 1,
    );
    // The featured article always sits on top (owner, 2026-10-02: "one of the articles needs to be featured … on the
    // top"), whichever way the rest is sorted. If a category filter leaves it out, the first result leads instead.
    const featuredIndex = sorted.findIndex((post) => post.featured);
    if (featuredIndex > 0) sorted.unshift(...sorted.splice(featuredIndex, 1));
    return sorted;
  }, [posts, category, sort]);

  const [featured, ...rest] = filtered;

  return (
    <>
      <div className="blog-filterbar" data-reveal>
        <div className="blog-filter-pills" role="tablist" aria-label="Filter articles by topic">
          {CATEGORIES.map((option) => {
            const count = option === "All Posts" ? posts.length : posts.filter((post) => post.category === option).length;
            return (
              <button
                key={option}
                type="button"
                role="tab"
                aria-selected={option === category}
                className={`blog-filter-pill${option === category ? " is-active" : ""}`}
                onClick={() => setCategory(option)}
              >
                {option}
                <span className="blog-filter-count">{count}</span>
              </button>
            );
          })}
        </div>
        <div className="blog-filterbar-end">
          <p className="blog-result-count" aria-live="polite">
            {filtered.length} {filtered.length === 1 ? "article" : "articles"}
          </p>
          <SortDropdown value={sort} onChange={setSort} />
        </div>
      </div>

      {featured ? (
        <>
          <article className="blog-feature" data-reveal>
            <Link href={featured.path} className="blog-feature-media">
              {featured.featured ? <span className="blog-feature-badge badge-featured">Featured</span> : null}
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
