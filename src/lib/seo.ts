import type { Metadata } from "next";

const FALLBACK_SITE_URL = "https://www.lankanewhomes.com";

function normalizeBaseUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return FALLBACK_SITE_URL;
  return trimmed.endsWith("/") ? trimmed.slice(0, -1) : trimmed;
}

export function getSiteUrl(): string {
  return normalizeBaseUrl(process.env.NEXT_PUBLIC_SITE_URL ?? FALLBACK_SITE_URL);
}

export function toAbsoluteUrl(pathname: string): string {
  const normalizedPath = pathname.startsWith("/") ? pathname : `/${pathname}`;
  return `${getSiteUrl()}${normalizedPath}`;
}

export type BreadcrumbEntry = { label: string; href?: string };

export function buildBreadcrumbJsonLd(items: BreadcrumbEntry[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.label,
      ...(item.href ? { item: toAbsoluteUrl(item.href) } : {}),
    })),
  };
}

export function buildItemListJsonLd(items: { name: string; url: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      url: toAbsoluteUrl(item.url),
    })),
  };
}

export function buildFaqJsonLd(faqs: { question: string; answer: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}

// Sitewide identity schema — read once by Google to associate the domain
// with the LankaNewHomes brand/logo (drives the Knowledge Panel logo and
// sitelinks search box eligibility). Social links match the footer's real
// icons (src/components/marketplace/components.tsx's Footer) — only
// Facebook and Instagram are real, live LankaNewHomes accounts.
export function buildOrganizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "LankaNewHomes",
    url: getSiteUrl(),
    logo: toAbsoluteUrl("/logo-wordmark.svg"),
    sameAs: ["https://www.facebook.com/lankanewhomes", "https://www.instagram.com/lankanewhomes/"],
  };
}

export function buildWebsiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "LankaNewHomes",
    // Google's "site name" row above a result comes from this; give it the spaced form too.
    alternateName: ["Lanka New Homes"],
    url: getSiteUrl(),
    potentialAction: {
      "@type": "SearchAction",
      target: `${getSiteUrl()}/search?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };
}

export function jsonLdScriptProps(data: object) {
  return {
    type: "application/ld+json",
    dangerouslySetInnerHTML: { __html: JSON.stringify(data) },
  } as const;
}


// ---- Open Graph / Twitter ----------------------------------------------------------------------------
// One place builds the share-preview metadata for every page, so each page has the full set (title, description, canonical
// url, type, site name, 1200x630 image with alt, twitter card). A page's own `openGraph` replaces the root layout's
// entirely in Next, so pages must always spread this in rather than set a partial openGraph.
export const SITE_NAME = "LankaNewHomes";
export const DEFAULT_OG_IMAGE = "/og-default.jpg";
export const DEFAULT_OG_IMAGE_ALT = "LankaNewHomes: new homes in Sri Lanka";

type SocialInput = {
  /** Full page/entity name for the share card, never shortened with an ellipsis. */
  title: string;
  description?: string;
  /** Canonical path (or absolute URL). Query strings and fragments are dropped. */
  path: string;
  image?: string | null;
  imageAlt?: string;
  type?: "website" | "article" | "profile";
};

function canonicalNoQuery(path: string): string {
  const raw = path.trim() || "/";
  const withoutQuery = raw.split(/[?#]/)[0] || "/";
  return /^https?:\/\//i.test(withoutQuery) ? withoutQuery : toAbsoluteUrl(withoutQuery);
}

function absoluteImage(image: string): string {
  return /^https?:\/\//i.test(image) ? image : toAbsoluteUrl(image);
}

export function socialMetadata({ title, description, path, image, imageAlt, type = "website" }: SocialInput): Pick<Metadata, "openGraph" | "twitter"> {
  // Share crawlers (Facebook, WhatsApp, X) can't render SVG, so an SVG logo falls back to the default card.
  const own = image?.trim() && !/\.svg(\?.*)?$/i.test(image.trim()) ? image.trim() : "";
  const imageUrl = absoluteImage(own || DEFAULT_OG_IMAGE);
  const alt = own ? imageAlt || title : DEFAULT_OG_IMAGE_ALT;
  const url = canonicalNoQuery(path);
  return {
    openGraph: {
      title,
      ...(description ? { description } : {}),
      url,
      type,
      siteName: SITE_NAME,
      images: [{ url: imageUrl, width: 1200, height: 630, alt }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      ...(description ? { description } : {}),
      images: [{ url: imageUrl, alt }],
    },
  };
}

const DEFAULT_DESCRIPTION = "Discover new homes and apartment communities across Sri Lanka.";

type ImageEntry = string | URL | { url: string | URL; alt?: string };

function firstImage(images: unknown): { url: string; alt?: string } | null {
  const list = (Array.isArray(images) ? images : images ? [images] : []) as ImageEntry[];
  const first = list[0];
  if (!first) return null;
  if (typeof first === "string") return { url: first };
  if (first instanceof URL) return { url: first.toString() };
  const url = typeof first.url === "string" ? first.url : first.url?.toString();
  return url ? { url, alt: first.alt } : null;
}

function plainTitle(title: Metadata["title"]): string {
  if (!title) return SITE_NAME;
  if (typeof title === "string") return title;
  if ("absolute" in title && title.absolute) return title.absolute;
  if ("default" in title && title.default) return title.default;
  return SITE_NAME;
}

/**
 * Adds the full Open Graph + Twitter set to a page's metadata, built from what the page already declares (title,
 * description, canonical, any openGraph image/type), so nothing is repeated per page. `path` is only needed when the page
 * has no canonical. `socialTitle` is for pages whose <title> is shortened to fit a length budget: the share card gets the
 * full name instead.
 */
export function withSocial(meta: Metadata, options: { path?: string; socialTitle?: string; image?: string | null; imageAlt?: string; type?: "website" | "article" | "profile" } = {}): Metadata {
  const canonical = meta.alternates?.canonical;
  const canonicalPath = typeof canonical === "string" ? canonical : canonical instanceof URL ? canonical.toString() : undefined;
  const existingOg = meta.openGraph as { url?: string | URL; type?: string; images?: unknown } | null | undefined;
  const ogUrl = existingOg?.url ? String(existingOg.url) : undefined;
  const existing = firstImage(existingOg?.images);
  const type = options.type ?? (existingOg?.type === "article" || existingOg?.type === "profile" ? existingOg.type : "website");
  return {
    ...meta,
    ...socialMetadata({
      title: options.socialTitle ?? plainTitle(meta.title),
      description: (typeof meta.description === "string" && meta.description.trim()) || DEFAULT_DESCRIPTION,
      path: canonicalPath ?? options.path ?? ogUrl ?? "/",
      image: options.image !== undefined ? options.image : existing?.url,
      imageAlt: options.imageAlt ?? existing?.alt,
      type,
    }),
  };
}
