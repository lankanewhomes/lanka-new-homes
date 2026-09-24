import type { Metadata } from "next";
import { Fraunces } from "next/font/google";
import Image from "next/image";
import Link from "next/link";
import { ShieldCheck, Zap } from "lucide-react";
import { getProjectBySlug } from "@/lib/project-store";
import { ListingGridCard } from "@/components/marketplace/listing-page";
import { ScrollReveal } from "@/components/marketplace/scroll-reveal";
import { PricingComparisonTable } from "@/components/marketplace/pricing-comparison-table";
import { formatLkr } from "@/lib/format";

export const revalidate = 300;

// Serif is scoped to this page only (see docs/design.md "Colors & type" —
// the rest of the site is deliberately sans-only). This redesign's brief
// explicitly asked for an editorial serif on major headlines "if the
// existing brand system allows it" — it doesn't, site-wide, so this is a
// one-page exception, not a change to that convention.
//
// This page also uses its own `fdv-` class namespace rather than the
// site's existing `.fd-*` classes below — those are shared with
// /web-design (hero, cards, CTA band, etc.), and this redesign only
// touches /for-developers, so it gets a fully separate set of styles.
const displaySerif = Fraunces({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--fdv-font-serif",
});

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
const IMMERSIVE_SLUG = "oceana-wadduwa";
const SHOWCASE_SLUGS = ["capitol-twinpeaks", "viva-la-vida", "imaarat-bambalapitiya"];

const LOCATIONS = ["Sri Lanka", "Canada", "United Kingdom", "Australia", "United States", "UAE"];

export default async function ForDevelopersPage() {
  const [heroProject, productProject, immersiveProject, showcaseProjects] = await Promise.all([
    getProjectBySlug(HERO_SLUG),
    getProjectBySlug(PRODUCT_PREVIEW_SLUG),
    getProjectBySlug(IMMERSIVE_SLUG),
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

  return (
    <div className={`fdv-page ${displaySerif.variable}`}>
      <ScrollReveal />

      {/* 1 — HERO */}
      <section className="fdv-hero" aria-label="For property developers">
        {heroProject ? (
          <div className="fdv-hero-media">
            <Image
              src={heroProject.heroImage}
              alt=""
              fill
              priority
              sizes="100vw"
              className="fdv-hero-media-img"
            />
            <div className="fdv-hero-media-overlay" />
          </div>
        ) : null}

        <div className="fdv-hero-content">
          <p className="fdv-eyebrow">For property developers</p>
          <h1 className="fdv-hero-headline">
            Put your projects in front<br />of the right buyers.
          </h1>
          <p className="fdv-hero-sub">
            A premium platform built to showcase Sri Lanka&apos;s newest homes, developments and land projects.
          </p>
          <div className="fdv-hero-ctas">
            <Link href="/developers/register" className="fdv-cta-primary">Register as a Developer</Link>
            <a href="#introduction" className="fdv-cta-secondary">Explore the platform</a>
          </div>
          <p className="fdv-hero-fineprint">Free to list at the moment.</p>
        </div>
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

      {/* 3 — THREE BIG REASONS */}
      <section className="fdv-reasons" aria-label="Why developers list here">
        <div className="fdv-reason" data-reveal>
          <div className="fdv-reason-media">
            {showcaseProjects[1] ? (
              <Image src={showcaseProjects[1].heroImage} alt="" fill sizes="(min-width: 900px) 46vw, 100vw" className="fdv-reason-img" />
            ) : null}
          </div>
          <div className="fdv-reason-copy">
            <span className="fdv-reason-number">01</span>
            <p className="fdv-reason-kicker">Be discovered</p>
            <h3>Reach buyers actively searching for new property.</h3>
            <p className="fdv-reason-body">
              Your projects appear alongside other new developments, homes, apartments, villas and land
              projects being researched by buyers right now.
            </p>
          </div>
        </div>

        <div className="fdv-reason fdv-reason-reverse" data-reveal>
          <div className="fdv-reason-media">
            {presentationFloorPlan ? (
              <Image src={presentationFloorPlan.image} alt="" fill sizes="(min-width: 900px) 46vw, 100vw" className="fdv-reason-img fdv-reason-img-plan" />
            ) : null}
          </div>
          <div className="fdv-reason-copy">
            <span className="fdv-reason-number">02</span>
            <p className="fdv-reason-kicker">Be presented</p>
            <h3>Give every project the presentation it deserves.</h3>
            <p className="fdv-reason-body">
              Photography, floor plans, pricing, amenities, videos, brochures, maps and virtual tours come
              together in one premium project page.
            </p>
          </div>
        </div>

        <div className="fdv-reason" data-reveal>
          <div className="fdv-reason-media fdv-reason-media-dark">
            <div className="fdv-reason-contact-preview" aria-hidden="true">
              <span className="listing-badge-pill badge-responder">
                <Zap className="h-3 w-3" aria-hidden="true" /> Responds within 1 hour
              </span>
              <p className="fdv-reason-contact-line">&ldquo;Hi, I&apos;d like more information on the 3 bedroom unit.&rdquo;</p>
              <span className="fdv-reason-contact-tag">Request received — reply in one tap</span>
            </div>
          </div>
          <div className="fdv-reason-copy">
            <span className="fdv-reason-number">03</span>
            <p className="fdv-reason-kicker">Be contacted</p>
            <h3>Turn interest into direct enquiries.</h3>
            <p className="fdv-reason-body">
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
            <p className="fdv-eyebrow">The presentation</p>
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

      {/* 5 — LARGE IMAGE + TEXT */}
      {immersiveProject ? (
        <section className="fdv-immersive" aria-label="Buyers everywhere">
          <Image
            src={immersiveProject.heroImage}
            alt=""
            fill
            sizes="100vw"
            className="fdv-immersive-img"
          />
          <div className="fdv-immersive-overlay" />
          <div className="fdv-immersive-content" data-reveal>
            <h2>Reach buyers wherever they are.</h2>
            <p>Your next buyer may be in Colombo, Toronto, London, Dubai, Melbourne or elsewhere around the world.</p>
          </div>
        </section>
      ) : null}

      {/* 6 — INTERNATIONAL BUYERS */}
      <section className="fdv-international" aria-label="International reach">
        <h2 data-reveal>Sri Lankan property doesn&apos;t stop at Sri Lanka.</h2>
        <p data-reveal>
          LankaNewHomes makes it easier for people researching property from Sri Lanka and overseas to
          discover new developments in one place.
        </p>
        <ul className="fdv-locations" data-reveal>
          {LOCATIONS.map((location) => (
            <li key={location}>{location}</li>
          ))}
        </ul>
      </section>

      {/* 7 — PROJECT PRESENTATION composition */}
      <section className="fdv-composition" aria-label="Everything buyers need">
        <div className="fdv-section-head" data-reveal>
          <p className="fdv-eyebrow">The details</p>
          <h2>Everything buyers need to make a decision.</h2>
        </div>
        <div className="fdv-composition-grid" data-reveal>
          {presentationPhotos[0] ? (
            <div className="fdv-composition-tile fdv-composition-tile-large">
              <Image src={presentationPhotos[0].image} alt="" fill sizes="(min-width: 900px) 40vw, 100vw" className="fdv-reason-img" />
              <span className="fdv-composition-tag">Photography</span>
            </div>
          ) : null}
          {presentationFloorPlan ? (
            <div className="fdv-composition-tile fdv-composition-tile-plan">
              <Image src={presentationFloorPlan.image} alt="" fill sizes="(min-width: 900px) 22vw, 100vw" className="fdv-reason-img fdv-reason-img-plan" />
              <span className="fdv-composition-tag">Floor plans</span>
            </div>
          ) : null}
          {presentationPhotos[1] ? (
            <div className="fdv-composition-tile">
              <Image src={presentationPhotos[1].image} alt="" fill sizes="(min-width: 900px) 22vw, 100vw" className="fdv-reason-img" />
              <span className="fdv-composition-tag">Amenities</span>
            </div>
          ) : null}
          {presentationRoadMap ? (
            <div className="fdv-composition-tile">
              <Image src={presentationRoadMap.image} alt="" fill sizes="(min-width: 900px) 22vw, 100vw" className="fdv-reason-img" />
              <span className="fdv-composition-tag">Road map</span>
            </div>
          ) : null}
          {presentationPhotos[2] ? (
            <div className="fdv-composition-tile">
              <Image src={presentationPhotos[2].image} alt="" fill sizes="(min-width: 900px) 22vw, 100vw" className="fdv-reason-img" />
              <span className="fdv-composition-tag">Virtual walkthrough</span>
            </div>
          ) : null}
        </div>
      </section>

      {/* 7.5 — BADGES */}
      <section className="fdv-badges" aria-label="Trust badges">
        <div className="fdv-section-head" data-reveal>
          <p className="fdv-eyebrow">Trust signals</p>
          <h2>Badges that make buyers click through.</h2>
          <p className="fdv-section-sub">
            Earned automatically from real activity on your listing — never sold, never assigned by hand.
          </p>
        </div>
        <div className="fdv-badge-grid" data-reveal>
          <div className="fdv-badge-card">
            <span className="listing-badge-pill badge-verified fdv-badge-pill">
              <ShieldCheck className="h-3 w-3" aria-hidden="true" /> Verified
            </span>
            <p>Shown automatically once a project has any active paid package.</p>
          </div>
          <div className="fdv-badge-card">
            <span className="listing-badge-pill badge-responder fdv-badge-pill">
              <Zap className="h-3 w-3" aria-hidden="true" /> Responds within 1 hour
            </span>
            <p>Earned when you reply to at least 80% of inquiries within an hour, over the last 90 days.</p>
          </div>
          <div className="fdv-badge-card">
            <span className="badge-featured fdv-badge-pill">Featured</span>
            <p>Boosts your project into featured placements across the homepage and search.</p>
          </div>
          <div className="fdv-badge-card">
            <span className="badge-premium fdv-badge-pill">Premium</span>
            <p>Developer Pro and Campaign — top placement plus the full analytics dashboard below.</p>
          </div>
          <div className="fdv-badge-card">
            <span className="badge-move-in-now fdv-badge-pill">Move-In Now</span>
            <p>Marked when a project is fully complete and ready for immediate handover.</p>
          </div>
          <div className="fdv-badge-card">
            <span className="badge-quick-move-in fdv-badge-pill">Quick Move-In</span>
            <p>Shown automatically when one of your unit types is flagged as quick move-in.</p>
          </div>
        </div>
      </section>

      {/* 8 — ANALYTICS DASHBOARD */}
      <section className="fdv-control" aria-label="Developer analytics dashboard">
        <div className="fdv-control-copy" data-reveal>
          <p className="fdv-eyebrow">The dashboard</p>
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
      </section>

      {/* 9 — HOW IT WORKS */}
      <section className="fdv-how" id="how-it-works" aria-label="How it works">
        <div className="fdv-how-step" data-reveal>
          <span className="fdv-how-number">01</span>
          <h3>Register</h3>
          <p>Create your developer account.</p>
        </div>
        <div className="fdv-how-step" data-reveal>
          <span className="fdv-how-number">02</span>
          <h3>Showcase</h3>
          <p>Add your developments and project information.</p>
        </div>
        <div className="fdv-how-step" data-reveal>
          <span className="fdv-how-number">03</span>
          <h3>Connect</h3>
          <p>Receive enquiries from interested buyers.</p>
        </div>
      </section>

      {/* Pricing — kept factual and undramatized, folded in ahead of the closing CTA */}
      <section className="fdv-pricing" aria-label="Pricing">
        <div className="fdv-section-head" data-reveal>
          <p className="fdv-eyebrow">Pricing</p>
          <h2>Listing is always free. Upgrade any project for more reach.</h2>
        </div>
        <div className="fdv-pricing-cards" data-reveal>
          <PricingComparisonTable />
        </div>
        <p className="fdv-pricing-note" data-reveal>
          <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" /> A Verified badge is added to your featured projects while your package is active.
        </p>
      </section>

      {/* Placement inventory — where each tier actually shows up, with real
          samples (the same badge/chip/map-pin classes used live elsewhere
          on the site) rather than generic icons, so a developer sees
          exactly what they'd get. Almost everything here is planned, not
          built — each card says so explicitly (owner, 2026-09-24). */}
      <section className="fdv-placement" aria-label="Where you'll be seen">
        <div className="fdv-section-head" data-reveal>
          <p className="fdv-eyebrow">Placement</p>
          <h2>Exactly where a paid plan puts your project.</h2>
          <p className="fdv-section-sub">Real samples of each placement, and which plan unlocks it.</p>
        </div>
        <div className="fdv-placement-grid" data-reveal>
          <div className="fdv-placement-card">
            <div className="fdv-placement-sample fdv-placement-sample-hero">
              <span className="fdv-placement-sample-hero-pill">View project</span>
              <span className="fdv-placement-sample-hero-dots"><i /><i /><i /></span>
            </div>
            <h4>Homepage hero carousel</h4>
            <p>Developer Pro rotates in with other Pro developers; Campaign gets a fixed slide for the campaign period.</p>
            <span className="fdv-placement-tag">Pro &amp; Campaign · Coming soon</span>
          </div>

          <div className="fdv-placement-card">
            <div className="fdv-placement-sample">
              <span className="listing-filter-pill hero-quick-link-pill hero-quick-link-pill-highlight">Your Company</span>
            </div>
            <h4>Chip row under the homepage search bar</h4>
            <p>A Developer Spotlight chip alongside the category chips (e.g. &quot;Colombo&quot;, &quot;Villas&quot;).</p>
            <span className="fdv-placement-tag">Developer Pro · Coming soon</span>
          </div>

          <div className="fdv-placement-card">
            <div className="fdv-placement-sample fdv-placement-sample-shelf">
              {[1, 2, 3, 4].map((i) => (
                <span key={i} className="fdv-placement-sample-shelf-card">
                  <span className="badge-featured fdv-badge-pill fdv-placement-sample-shelf-badge">Featured</span>
                </span>
              ))}
            </div>
            <h4>New &quot;Featured projects&quot; section</h4>
            <p>A homepage section above &quot;New listings&quot; — 8 rotating slots, capped so placement stays valuable.</p>
            <span className="fdv-placement-tag">Any Featured tier · Coming soon</span>
          </div>

          <div className="fdv-placement-card">
            <div className="fdv-placement-sample fdv-placement-sample-map">
              <span className="listing-map-marker fdv-placement-sample-pin-plain">2</span>
              <span className="listing-map-marker active">1</span>
            </div>
            <h4>Highlighted map pin</h4>
            <p>Featured and above stand out from plain pins on every map view.</p>
            <span className="fdv-placement-tag">Featured &amp; up · Coming soon</span>
          </div>

          <div className="fdv-placement-card">
            <div className="fdv-placement-sample fdv-placement-sample-rank">
              <span className="fdv-placement-sample-rank-row fdv-placement-sample-rank-top">Campaign — pinned #1</span>
              <span className="fdv-placement-sample-rank-row">Developer Pro — top of featured</span>
              <span className="fdv-placement-sample-rank-row">Featured / Featured Plus</span>
              <span className="fdv-placement-sample-rank-row fdv-placement-sample-rank-muted">Free — standard order</span>
            </div>
            <h4>Search, city &amp; collection page ranking</h4>
            <p>/projects, city pages, and collections (e.g. /colombo, /beachfront) rank paid plans above Free — never a guaranteed &quot;#1&quot;, except Campaign&apos;s 1–2 pinned pages.</p>
            <span className="fdv-placement-tag">All paid tiers · Coming soon</span>
          </div>

          <div className="fdv-placement-card">
            <div className="fdv-placement-sample fdv-placement-sample-directory">
              <span className="fdv-placement-sample-directory-row fdv-placement-sample-directory-pinned">Your Company · Pro</span>
              <span className="fdv-placement-sample-directory-row">Other developer</span>
              <span className="fdv-placement-sample-directory-row">Other developer</span>
            </div>
            <h4>/developers directory</h4>
            <p>Pinned to the top, plus an upgraded developer page — banner, all projects, a lead form.</p>
            <span className="fdv-placement-tag">Developer Pro · Coming soon</span>
          </div>

          <div className="fdv-placement-card">
            <div className="fdv-placement-sample fdv-placement-sample-email">
              <span className="fdv-placement-sample-email-line">New listings matching your saved search</span>
              <span className="fdv-placement-sample-email-featured">★ Featured for you</span>
            </div>
            <h4>Saved-search alert emails</h4>
            <p>A dedicated &quot;Featured&quot; block inside every buyer alert email.</p>
            <span className="fdv-placement-tag">Developer Pro · Coming soon</span>
          </div>

          <div className="fdv-placement-card">
            <div className="fdv-placement-sample fdv-placement-sample-competitor">
              <p className="fdv-placement-sample-competitor-line"><strong>Free project page:</strong> shows paid competitors in &quot;Similar projects&quot;</p>
              <p className="fdv-placement-sample-competitor-line"><strong>Paid project page:</strong> shows only your own other projects</p>
            </div>
            <h4>&quot;Similar projects&quot; rail</h4>
            <p>The clearest reason to upgrade — a Free page&apos;s own rail can point buyers to a paid competitor.</p>
            <span className="fdv-placement-tag">Featured &amp; up removes it · Coming soon</span>
          </div>

          <div className="fdv-placement-card">
            <div className="fdv-placement-sample fdv-placement-sample-campaign">
              <span>Sponsored blog article</span>
              <span>Newsletter feature</span>
              <span>FB / IG posts</span>
            </div>
            <h4>Blog, newsletter &amp; social</h4>
            <p>Included with Campaign. Optional Sinhala/Tamil homepage takeover for launches aimed at those audiences.</p>
            <span className="fdv-placement-tag">Campaign · Not built yet</span>
          </div>
        </div>
      </section>

      {showcaseProjects.length > 0 ? (
        <section className="fdv-live-listings" aria-label="Live listings">
          <div className="fdv-section-head" data-reveal>
            <p className="fdv-eyebrow">Live on the platform</p>
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

      {/* 10 — PREMIUM CTA */}
      <section className="fdv-cta-final" aria-label="Get started">
        {heroProject ? (
          <div className="fdv-cta-final-media">
            <Image src={heroProject.heroImage} alt="" fill sizes="100vw" className="fdv-immersive-img" />
            <div className="fdv-immersive-overlay fdv-cta-final-overlay" />
          </div>
        ) : null}
        <div className="fdv-cta-final-content" data-reveal>
          <h2>Let&apos;s put your projects on the map.</h2>
          <p>Join LankaNewHomes and give your developments the visibility and presentation they deserve.</p>
          <Link href="/developers/register" className="fdv-cta-primary">Register as a Developer</Link>
          <p className="fdv-hero-fineprint">Free to list at the moment.</p>
        </div>
      </section>
    </div>
  );
}
