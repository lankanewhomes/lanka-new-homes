import type { Metadata } from "next";
import { Fraunces } from "next/font/google";
import Image from "next/image";
import Link from "next/link";
import { ShieldCheck, Zap } from "lucide-react";
import { getProjectBySlug } from "@/lib/project-store";
import { ListingGridCard } from "@/components/marketplace/listing-page";
import { ScrollReveal } from "@/components/marketplace/scroll-reveal";
import { PACKAGE_LIST, formatPackagePrice } from "@/lib/packages";
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

      {/* 8 — DEVELOPER CONTROL */}
      <section className="fdv-control" aria-label="Developer dashboard">
        <div className="fdv-control-copy" data-reveal>
          <p className="fdv-eyebrow">The dashboard</p>
          <h2>Your projects. Your information. Your control.</h2>
          <p>Keep your project information current and give buyers a clear, reliable source of information.</p>
        </div>
        <div className="fdv-control-panel" data-reveal aria-hidden="true">
          {[
            { label: "Projects" },
            { label: "Project views" },
            { label: "Enquiries" },
            { label: "Active projects" },
          ].map((row) => (
            <div className="fdv-control-row" key={row.label}>
              <span className="fdv-control-row-label">{row.label}</span>
              <span className="fdv-control-row-bar" />
            </div>
          ))}
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
        <div className="fdv-pricing-grid" data-reveal>
          {PACKAGE_LIST.map((pkg) => (
            <div className={`fdv-pricing-card${pkg.tier === "premium" ? " fdv-pricing-card-highlight" : ""}`} key={pkg.tier}>
              {pkg.tier === "premium" ? <span className="fdv-pricing-card-tag">Most visibility</span> : null}
              <h3>{pkg.name}</h3>
              <p className="fdv-pricing-card-price">{formatPackagePrice(pkg)}</p>
              <ul>
                {pkg.features.map((feature) => <li key={feature}>{feature}</li>)}
              </ul>
            </div>
          ))}
        </div>
        <p className="fdv-pricing-note" data-reveal>
          <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" /> A Verified badge appears automatically once a project has an active Featured or Premium package.
        </p>
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
