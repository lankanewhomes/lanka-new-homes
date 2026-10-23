import type { Metadata } from "next";
import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { blogPosts, buildBlogMetadata, formatBlogDate } from "@/lib/blog";


// Article copy can link to other pages on the site with [text](/path). Only internal paths (starting with a single "/")
// are turned into links, so nothing external can be slipped into a post (owner, 2026-10-23: "do some internal linking").
const INTERNAL_LINK = /\[([^\]]+)\]\((\/[^)\s]*)\)/g;
function renderCopy(text: string): ReactNode[] {
  const out: ReactNode[] = [];
  let last = 0;
  for (const match of text.matchAll(INTERNAL_LINK)) {
    const start = match.index ?? 0;
    if (start > last) out.push(text.slice(last, start));
    out.push(<Link key={`${start}-${match[2]}`} href={match[2]}>{match[1]}</Link>);
    last = start + match[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

type BlogPostPageProps = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return Object.keys(blogPosts).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = blogPosts[slug];
  if (!post) return {};
  return buildBlogMetadata(post);
}

// Layout follows the reference the owner shared, 2026-09-29 (an amini.ai
// blog post): a dark full-bleed hero band — "All posts" back link, title,
// byline, a hero image alongside it — then plain white body copy in a
// centred column (the band's own background spans the full width, only the
// content inside it is constrained — owner, same day: "article background
// needs to be full width, the text stays where it is"). No category
// eyebrow ("delete the eyebrow label on the articles"). No newsletter
// signup or social-share row — not something this site has anywhere else.
export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = blogPosts[slug];
  if (!post) notFound();

  return (
    <article className="fdv-page blog-article">
      {post.draft ? (
        <p className="blog-draft-notice" role="note">
          Draft preview. This article is not listed on the blog or in search results yet.
        </p>
      ) : null}
      <div className="blog-article-hero">
        <div className="blog-article-hero-inner">
          <div className="blog-article-hero-text">
            <Link href="/blog" className="blog-article-back-link">
              <ArrowLeft size={16} strokeWidth={2.5} aria-hidden="true" />
              All posts
            </Link>
            <h1>{post.title}</h1>
            <p className="blog-article-byline">
              By {post.author}
              <br />
              {formatBlogDate(post.publishDate)} · {post.readMinutes} min read
            </p>
          </div>
          <div className="blog-article-hero-media">
            <Image src={post.heroImage} alt="" fill sizes="(min-width: 860px) 50vw, 100vw" priority className="blog-article-hero-img" />
          </div>
        </div>
      </div>

      <div className="blog-article-body">
        <p className="blog-article-intro">{renderCopy(post.intro)}</p>
        {post.sections.map((section) => (
          <section key={section.heading}>
            <h2>{section.heading}</h2>
            <p>{renderCopy(section.body)}</p>
            {section.image ? (
              <figure className="blog-article-figure">
                <Image src={section.image.src} alt={section.image.alt} width={1200} height={675} sizes="(min-width: 860px) 760px, 100vw" />
              </figure>
            ) : null}
            {section.bullets ? (
              <ul className="blog-article-list">
                {section.bullets.map((item) => (
                  <li key={item}>{renderCopy(item)}</li>
                ))}
              </ul>
            ) : null}
            {section.callout ? <aside className="blog-article-callout">{renderCopy(section.callout)}</aside> : null}
          </section>
        ))}
      </div>

      <div className="blog-article-cta">
        {post.cta ? (
          <>
            <div className="blog-article-cta-copy">
              <h2>{post.cta.heading}</h2>
              <p>{post.cta.body}</p>
              <div className="blog-article-cta-links">
                {post.cta.links.map((link, index) => (
                  <Link key={link.href} href={link.href} className={index === 0 ? "blog-cta-button" : "blog-cta-button blog-cta-button--ghost"}>{link.label}</Link>
                ))}
              </div>
            </div>
            {post.cta.steps?.length ? (
              <ol className="blog-article-cta-steps">
                {post.cta.steps.map((step, index) => (
                  <li key={step}>
                    <span className="blog-article-cta-step-num">{index + 1}</span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            ) : null}
          </>
        ) : (
          <div className="blog-article-cta-copy">
            <h2>Want your project&apos;s website doing this?</h2>
            <p>We design and build dedicated websites for property developments — a new site, or a rebuild of one that isn&apos;t working.</p>
            <div className="blog-article-cta-links">
              <Link href="/web-design" className="blog-cta-button">See our web design service</Link>
            </div>
          </div>
        )}
      </div>

      <p className="blog-article-back"><Link href="/blog">← Back to all posts</Link></p>
    </article>
  );
}
