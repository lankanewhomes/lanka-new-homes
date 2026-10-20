import type { Metadata } from "next";
import Link from "next/link";
import { withSocial } from "@/lib/seo";

export const metadata: Metadata = withSocial({
  title: "Latest Listings from Instagram",
  description: "The newest homes LankaNewHomes has posted on Instagram, with floor plans, photos and prices for each.",
  alternates: { canonical: "/links" },
  // A link-in-bio list, not a page worth ranking: keep it out of search but let crawlers follow the listing links.
  robots: { index: false, follow: true },
}, { path: "/links" });

// Owner, 2026-10-20: Instagram only lets the bio link be edited in the phone app, so the bio points here once and this
// page keeps itself current from the `social-posts` collection (every Instagram post is logged there). Newest first,
// one card per listing, each linking to the listing with the same Instagram UTM tags the captions use.
export const revalidate = 300;

type BioLink = { slug: string; name: string; area: string | null; price: string | null; image: string | null; href: string; postedAt: string };

async function getBioLinks(): Promise<BioLink[]> {
  try {
    const { getPayload } = await import("payload");
    const payloadConfig = (await import("../../../../payload.config")).default;
    const payload = await getPayload({ config: payloadConfig });
    const { docs } = await payload.find({
      collection: "social-posts",
      where: { and: [{ platform: { equals: "instagram" } }, { status: { equals: "published" } }, { project: { exists: true } }] },
      sort: "-postedAt",
      limit: 60,
      depth: 1,
      overrideAccess: true,
    });
    const seen = new Set<string>();
    const links: BioLink[] = [];
    for (const doc of docs as unknown as { postedAt?: string; thumbnailUrl?: string | null; mediaUrl?: string | null; project?: unknown }[]) {
      const project = doc.project as { slug?: string; name?: string; city?: string | null; city_other?: string | null; district?: string | null; priceRange?: string | null; startingPriceLkr?: number | null; heroImage?: string | null; isPublished?: boolean } | null;
      if (!project?.slug || !project.name || project.isPublished === false || seen.has(project.slug)) continue;
      seen.add(project.slug);
      const postedAt = doc.postedAt ?? new Date().toISOString();
      const campaign = `${project.slug}-social-${postedAt.slice(0, 7)}`;
      links.push({
        slug: project.slug,
        name: project.name,
        // city is empty when the area isn't in the city list (e.g. "Colombo 07", "South Coast"); fall back to city_other, then district.
        area: (project.city && project.city !== "Other" ? project.city : project.city_other || project.district) || null,
        price: project.priceRange || (project.startingPriceLkr ? `From Rs. ${project.startingPriceLkr.toLocaleString("en-US")}` : null),
        image: doc.thumbnailUrl || doc.mediaUrl || project.heroImage || null,
        href: `/projects/${project.slug}?utm_source=instagram&utm_medium=social&utm_campaign=${encodeURIComponent(campaign)}`,
        postedAt,
      });
    }
    return links;
  } catch {
    return [];
  }
}

const INSTAGRAM_URL = "https://www.instagram.com/lankanewhomes/";

export default async function LinksPage() {
  const links = await getBioLinks();
  const newest = links[0] ? new Date(links[0].postedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "Asia/Colombo" }) : null;

  // Owner, 2026-10-20: "built the design like this" (/neighborhoods) — same contained-box system: dark split hero with
  // live counts, then a soft box of white cards (docs/design.md "Page section style: contained boxes").
  return (
    <div className="fdv-page bio-links-page">
      <section className="fdv-hero fdv-hero--split" aria-label="Homes from our Instagram">
        <div className="fdv-hero-split-inner">
          <div className="fdv-hero-content">
            <h1 className="fdv-hero-headline">Homes from our Instagram.</h1>
            <p className="fdv-hero-sub">
              Every home we&apos;ve posted on Instagram, newest first. Tap a listing for floor plans, photos and prices.
            </p>
            <div className="fdv-hero-ctas">
              <Link href="/projects?utm_source=instagram&utm_medium=social&utm_campaign=bio-links" className="fdv-cta-final-button">Browse new homes</Link>
              <a href={INSTAGRAM_URL} className="fdv-cta-secondary fdv-hero-explore-link" target="_blank" rel="noopener noreferrer">Follow @lankanewhomes</a>
            </div>
          </div>
          <div className="about-hero-panel">
            <dl className="about-hero-panel-grid" aria-label="Instagram posts by the numbers">
              <div className="about-hero-panel-stat">
                <dd>{links.length}</dd>
                <dt>Homes posted</dt>
              </div>
              <div className="about-hero-panel-stat">
                <dd>{newest ?? "–"}</dd>
                <dt>Latest post</dt>
              </div>
            </dl>
            <p className="fdv-hero-mock-caption">Live from our Instagram posts.</p>
          </div>
        </div>
      </section>

      <section className="fdv-box fdv-box--sage" id="latest" aria-label="Latest posts">
        <div className="wdx-section-head">
          <h2>Latest posts.</h2>
          <p>The homes from our Instagram, newest first.</p>
        </div>
        {links.length ? (
          <div className="fdv-box-grid fdv-box-grid--4 bio-links-grid">
            {links.map((link, index) => (
              <a key={link.slug} href={link.href} className="fdv-box-card fdv-box-card-link bio-links-card">
                <span className="bio-links-media">
                  {link.image ? (
                    // eslint-disable-next-line @next/next/no-img-element -- remote R2 images, same as the listing cards
                    <img src={link.image} alt={link.name} loading={index < 4 ? "eager" : "lazy"} />
                  ) : null}
                  {index === 0 ? <span className="bio-links-badge">Latest post</span> : null}
                </span>
                <h3>{link.name}</h3>
                {link.area ? <p>{link.area}</p> : null}
                {link.price ? <p className="guides-card-who">{link.price}</p> : null}
              </a>
            ))}
          </div>
        ) : (
          <p className="bio-links-empty">New posts are on their way. In the meantime, browse every listing.</p>
        )}
      </section>
    </div>
  );
}
