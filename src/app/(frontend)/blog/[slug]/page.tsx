import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { blogPosts, buildBlogMetadata, formatBlogDate } from "@/lib/blog";

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
        <p className="blog-article-intro">{post.intro}</p>
        {post.sections.map((section) => (
          <section key={section.heading}>
            <h2>{section.heading}</h2>
            <p>{section.body}</p>
          </section>
        ))}
      </div>

      <div className="blog-article-cta">
        <h2>Want your project&apos;s website doing this?</h2>
        <p>We design and build dedicated websites for property developments — a new site, or a rebuild of one that isn&apos;t working.</p>
        <div className="blog-article-cta-links">
          <Link href="/web-design" className="fdv-cta-primary">See our web design service</Link>
        </div>
      </div>

      <p className="blog-article-back"><Link href="/blog">← Back to all posts</Link></p>
    </article>
  );
}
