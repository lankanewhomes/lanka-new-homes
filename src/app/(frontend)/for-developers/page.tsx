import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ShieldCheck, Zap } from "lucide-react";
import { getProjectBySlug } from "@/lib/project-store";
import { ListingGridCard } from "@/components/marketplace/listing-page";
import { ScrollReveal } from "@/components/marketplace/scroll-reveal";
import { formatLkr } from "@/lib/format";

export const revalidate = 300;

// Dropped the editorial Fraunces serif this page used to load for its own
// headlines (owner, 2026-09-29: a styling-consistency pass bringing this
// page in line with /web-design, which dropped the same serif earlier for
// the same reason — docs/design.md's "no serif anywhere on the site" rule).
// --fdv-serif (globals.css) now just points at the site's sans stack, so
// every heading rule below that still reads `font-family: var(--fdv-serif)`
// needed no individual edit.
//
// This page also uses its own `fdv-` class namespace rather than the
// site's existing `.fd-*` classes below — those are shared with
// /web-design (hero, cards, CTA band, etc.), and this redesign only
// touches /for-developers, so it gets a fully separate set of styles.

export const metadata: Metadata = {
  title: "List Your Development on LankaNewHomes | For Developers & Builders",
  description:
    "A premium platform for discovering new property in Sri Lanka. Publish your development, present it beautifully, and reach buyers actively searching — free to list.",
  alternates: { canonical: "/for-developers" },
  openGraph: {
    title: "List Your Development on LankaNewHomes | For Developers & Builders",
    description:
      "A premium platform for discovering new property in Sri Lanka. Publish your development, present it beautifully, and reach buyers actively searching.",
    url: "/for-developers",
    type: "website",
  },
};

// Real, currently-published listings — every image and figure on this page
// comes from an actual project already on the site, not a mockup.
const HERO_SLUG = "capitol-twinpeaks";
const PRODUCT_PREVIEW_SLUG = "viva-la-vida";
const SHOWCASE_SLUGS = ["capitol-twinpeaks", "viva-la-vida", "imaarat-bambalapitiya"];

// Every real badge a listing can earn (see docs/design.md "Status / badge
// pills"), one place — owner, 2026-09-29: "if in the future i ever add any
// new badhes make sure to add it" + "there haas to be more badges". Add a
// badge here and it shows in the hero automatically, instead of being
// hand-copied into a second place. `fdv-badge-pill` gives every one of
// these its shape (padding, radius, size) — `.listing-badge-pill` alone
// has none of its own (it depends on a parent context class everywhere
// else it's used), which is why Verified/Responds rendered unstyled
// before this was added to their className too ("also fix the badges
// styling").
const BADGES = [
  { key: "verified", label: "Verified", className: "listing-badge-pill badge-verified fdv-badge-pill", icon: ShieldCheck },
  { key: "responder", label: "Responds within 1 hour", className: "listing-badge-pill badge-responder fdv-badge-pill", icon: Zap },
  { key: "featured", label: "Featured", className: "badge-featured fdv-badge-pill", icon: null },
  { key: "premium", label: "Premium", className: "badge-premium fdv-badge-pill", icon: null },
  { key: "move-in-now", label: "Move-In Now", className: "badge-move-in-now fdv-badge-pill", icon: null },
  { key: "quick-move-in", label: "Quick Move-In", className: "badge-quick-move-in fdv-badge-pill", icon: null },
  { key: "availability", label: "Limited Units", className: "listing-badge-pill badge-availability fdv-badge-pill", icon: null },
  { key: "marketing", label: "BOI Approved", className: "listing-badge-pill badge-marketing fdv-badge-pill", icon: null },
  { key: "location", label: "Beachfront", className: "listing-badge-pill badge-location fdv-badge-pill", icon: null },
] as const;

export default async function ForDevelopersPage() {
  const [heroProject, productProject, showcaseProjects] = await Promise.all([
    getProjectBySlug(HERO_SLUG),
    getProjectBySlug(PRODUCT_PREVIEW_SLUG),
    Promise.all(SHOWCASE_SLUGS.map((slug) => getProjectBySlug(slug))).then((list) =>
      list.filter((p): p is NonNullable<typeof p> => Boolean(p))
    ),
  ]);

  const presentationPhotos = [
    ...(productProject?.gallery ?? []).slice(0, 2),
    ...(heroProject?.gallery ?? []).slice(0, 2),
  ];
  const presentationFloorPlan = productProject?.floorPlans?.[0];
  const presentationRoadMap = productProject?.roadMapImages?.[0];

  // Hero marquee — real project media, not stock (same rule as the rest of
  // this page), covering the range of what a project page can carry: a
  // photo, floor plans, amenities, a road map (owner, 2026-09-29: "showing
  // the image of the house, floor plans, amenities, road map, block
  // plan... make sure there is effect. scrolling").
  const heroMarqueeItems = [
    productProject ? { src: productProject.heroImage, label: "Photography" } : null,
    presentationFloorPlan ? { src: presentationFloorPlan.image, label: "Floor plans" } : null,
    presentationPhotos[0] ? { src: presentationPhotos[0].image, label: "Amenities" } : null,
    presentationRoadMap ? { src: presentationRoadMap.image, label: "Road map" } : null,
    presentationPhotos[1] ? { src: presentationPhotos[1].image, label: "Gallery" } : null,
  ].filter((item): item is { src: string; label: string } => Boolean(item));

  return (
    <div className="fdv-page">
      <ScrollReveal />

      {/* 1 — HERO — solid background, centered (owner, 2026-09-29: "you need
          ot change the hero section. re design the devloerps page"),
          matching /web-design's own hero rather than a full-bleed photo. */}
      <section className="fdv-hero" aria-label="For property developers">
        <div className="fdv-hero-content">
          <h1 className="fdv-hero-headline">
            Put your projects in front of the right buyers.
          </h1>
          <p className="fdv-hero-sub">
            A premium platform built to showcase Sri Lanka&apos;s newest homes, developments and land projects.
          </p>
          <div className="fdv-hero-ctas">
            <Link href="/developers/register" className="fdv-cta-primary">Register as a Developer</Link>
            <a href="#introduction" className="fdv-cta-secondary">Explore the platform</a>
          </div>
          {/* Owner, 2026-09-29: "for devloeprs its free to list always" — not
              "at the moment", which read as a limited-time offer. */}
          <p className="fdv-hero-fineprint">Always free to list.</p>

          {/* Owner, 2026-09-29: "you can also add the badhes on the hero
              section also" — real badge pills, all six (was four — "add a
              title and add all the badges"), from the BADGES config above
              so a future new badge type only needs adding there. */}
          <p className="fdv-hero-badges-title">Badges your listing can earn</p>
          <div className="fdv-hero-badges" aria-hidden="true">
            {BADGES.map((badge) => (
              <span key={badge.key} className={badge.className}>
                {badge.icon ? <badge.icon className="h-3 w-3" aria-hidden="true" /> : null}
                {badge.label}
              </span>
            ))}
          </div>
        </div>

        {heroMarqueeItems.length > 0 ? (
          <div className="fdv-hero-marquee" aria-hidden="true">
            <div className="fdv-hero-marquee-track">
              {[...heroMarqueeItems, ...heroMarqueeItems].map((item, index) => (
                <div className="fdv-hero-marquee-frame" key={`${item.label}-${index}`}>
                  <Image src={item.src} alt="" fill sizes="320px" className="fdv-hero-marquee-img" />
                  <span className="fdv-hero-marquee-tag">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </section>

      {/* 2 — INTRODUCTION */}
      <section className="fdv-intro" id="introduction" aria-label="Introduction">
        <div className="fdv-intro-grid">
          <h2 className="fdv-intro-statement" data-reveal>Your development deserves more than a listing.</h2>
          <div className="fdv-intro-copy" data-reveal>
            <p>
              LankaNewHomes gives developers a dedicated place to present their projects beautifully, reach
              active property buyers, and generate direct enquiries.
            </p>
            <Link href="/developers/register" className="fdv-text-link">Register as a developer →</Link>
          </div>
        </div>
      </section>

      {/* 3 — WHY DEVELOPERS LIST HERE — one simple section, not three large
          alternating photo blocks (owner, 2026-09-29: "put theses in 1
          section... make it simpler" — dropped the numbers, kicker labels,
          photos and the fake chat-bubble mockup, keeping just the three
          actual reasons). */}
      <section className="fdv-reasons" aria-label="Why developers list here">
        <div className="fdv-reasons-grid">
          <div className="fdv-reason-simple" data-reveal>
            <h3>Reach buyers actively searching for new property.</h3>
            <p>
              Your projects appear alongside other new developments, homes, apartments, villas and land
              projects being researched by buyers right now.
            </p>
          </div>
          <div className="fdv-reason-simple" data-reveal>
            <h3>Give every project the presentation it deserves.</h3>
            <p>
              Photography, floor plans, pricing, amenities, videos, brochures, maps and virtual tours come
              together in one premium project page.
            </p>
          </div>
          <div className="fdv-reason-simple" data-reveal>
            <h3>Turn interest into direct enquiries.</h3>
            <p>
              Make it easy for interested buyers to request information and connect with your development
              team — the moment they submit, you have it.
            </p>
          </div>
        </div>
      </section>

      {/* 4 — SHOW THE PRODUCT */}
      {productProject ? (
        <section className="fdv-showcase-product" aria-label="A real project page">
          <div className="fdv-section-head" data-reveal>
            <h2>A better way to present your developments.</h2>
          </div>

          <div className="fdv-product-frame" data-reveal>
            <div className="fdv-product-photo">
              <Image
                src={productProject.heroImage}
                alt=""
                fill
                sizes="(min-width: 1100px) 1100px, 100vw"
                className="fdv-product-photo-img"
              />
              <div className="fdv-product-photo-overlay" />
              <div className="fdv-product-photo-caption">
                <span className="fdv-product-status">{productProject.status}</span>
                <h3>{productProject.name}</h3>
                <p>{productProject.location}</p>
              </div>
            </div>

            <div className="fdv-product-rows">
              <div className="fdv-product-row">
                <span className="fdv-product-row-label">Pricing</span>
                <span className="fdv-product-row-value">{formatLkr(productProject.startingPriceLkr)} onward</span>
              </div>
              <div className="fdv-product-row">
                <span className="fdv-product-row-label">Floor plans</span>
                <span className="fdv-product-row-value">{productProject.floorPlans?.length ?? 0} unit types</span>
              </div>
              <div className="fdv-product-row">
                <span className="fdv-product-row-label">Amenities</span>
                <span className="fdv-product-row-value">{productProject.amenities?.length ?? 0} listed</span>
              </div>
              <div className="fdv-product-row">
                <span className="fdv-product-row-label">Media</span>
                <span className="fdv-product-row-value">
                  {productProject.gallery?.length ?? 0} photos
                  {productProject.videos?.length ? `, ${productProject.videos.length} videos` : ""}
                  {productProject.brochureUrl ? ", brochure" : ""}
                </span>
              </div>
              <div className="fdv-product-row">
                <span className="fdv-product-row-label">Map</span>
                <span className="fdv-product-row-value">Location &amp; road map</span>
              </div>
              <Link href={`/projects/${productProject.slug}`} className="fdv-cta-secondary fdv-product-cta">
                View the live page →
              </Link>
            </div>
          </div>
          <p className="fdv-caption" data-reveal>Every project gets a dedicated presentation.</p>
        </section>
      ) : null}

      {/* 8 — ANALYTICS DASHBOARD */}
      <section className="fdv-control" aria-label="Developer analytics dashboard">
        <div className="fdv-control-inner">
        <div className="fdv-control-copy" data-reveal>
          <h2>See exactly how buyers find your listing.</h2>
          <p>
            Views, inquiries, response performance and traffic sources — the same Listing Analytics tab
            included on every one of your projects from day one.
          </p>
        </div>
        <div className="fdv-control-panel-wrap" data-reveal>
          <div className="fdv-analytics-frame" aria-hidden="true">
            <div className="fdv-analytics-toolbar">
              <span className="fdv-analytics-title">Listing Analytics</span>
              <div className="fdv-analytics-ranges">
                <span className="fdv-analytics-range">Last 7 days</span>
                <span className="fdv-analytics-range fdv-analytics-range-active">Last 28 days</span>
                <span className="fdv-analytics-range">Last 90 days</span>
              </div>
            </div>
            <div className="fdv-analytics-stats">
              <div className="fdv-analytics-stat">
                <span className="fdv-analytics-stat-label">Views</span>
                <span className="fdv-analytics-stat-value">2,145</span>
              </div>
              <div className="fdv-analytics-stat">
                <span className="fdv-analytics-stat-label">Inquiries</span>
                <span className="fdv-analytics-stat-value">38</span>
              </div>
              <div className="fdv-analytics-stat">
                <span className="fdv-analytics-stat-label">Inquiry rate</span>
                <span className="fdv-analytics-stat-value">1.8%</span>
              </div>
              <div className="fdv-analytics-stat">
                <span className="fdv-analytics-stat-label">Avg. time on page</span>
                <span className="fdv-analytics-stat-value">96s</span>
              </div>
            </div>
            <svg className="fdv-analytics-chart" viewBox="0 0 320 90" preserveAspectRatio="none">
              <polyline
                className="fdv-analytics-chart-line fdv-analytics-chart-line-views"
                points="0,60 40,55 80,48 120,50 160,35 200,30 240,20 280,18 320,10"
              />
              <polyline
                className="fdv-analytics-chart-line fdv-analytics-chart-line-inquiries"
                points="0,82 40,80 80,78 120,75 160,72 200,68 240,60 280,58 320,50"
              />
            </svg>
            <div className="fdv-analytics-legend">
              <span><i className="fdv-analytics-dot fdv-analytics-dot-views" aria-hidden="true" />Views</span>
              <span><i className="fdv-analytics-dot fdv-analytics-dot-inquiries" aria-hidden="true" />Inquiries</span>
            </div>
          </div>
          <p className="fdv-analytics-caption">
            Illustrative example — every developer gets this exact dashboard, live, for each of their own projects.
          </p>
        </div>
        </div>
      </section>

      {showcaseProjects.length > 0 ? (
        <section className="fdv-live-listings" aria-label="Live listings">
          <div className="fdv-section-head" data-reveal>
            <h2>This is what a listing looks like.</h2>
            <p className="fdv-section-sub">Not a mockup — real, currently-published listings, shown the exact way buyers browse them.</p>
          </div>
          <div className="home-card-grid fdv-showcase-grid" data-reveal>
            {showcaseProjects.map((project) => (
              <ListingGridCard key={project.slug} project={project} />
            ))}
          </div>
        </section>
      ) : null}

      {/* 10 — PREMIUM CTA — redesigned to match a reference the owner shared,
          2026-09-29 (a dark, plain-background band: a two-tone headline
          left, a pill button right, no photo). Button style matches the
          footer's own "List your project" pill exactly (owner, same day:
          "please be constant with design"), not the arrow-circle pattern
          used on /contact and the listing popup — those are a different,
          already-established button family for a different context. */}
      <section className="fdv-cta-final" aria-label="Get started">
        <div className="fdv-cta-final-inner" data-reveal>
          <div className="fdv-cta-final-text">
            <h2><span className="fdv-cta-final-muted">Let&apos;s put your projects</span> on the map.</h2>
            <p className="fdv-hero-fineprint">Always free to list.</p>
          </div>
          <Link href="/developers/register" className="fdv-cta-final-button">Register as a Developer</Link>
        </div>
      </section>
    </div>
  );
}
