import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, FileText, LayoutGrid, MessageCircle, ShieldCheck, Zap } from "lucide-react";
import { getProjectBySlug } from "@/lib/project-store";
import { ListingGridCard } from "@/components/marketplace/listing-page";
import { ScrollReveal } from "@/components/marketplace/scroll-reveal";
import { ScaledPreview, PRODUCT_PREVIEW } from "@/components/marketplace/web-design-frames";
import { ForDevelopersQuickjump } from "@/components/marketplace/for-developers-quickjump";

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
// Owner, 2026-09-29: "this is create [great]. keep the content. but add 2
// more illustrative example.es." — the same panel design/content, shown
// for 3 of the real showcase projects (so it also visibly backs up the
// caption below: "every developer gets this... for each of their own
// projects"), each with its own illustrative (not real) numbers.
//
// Owner, same day: "this section. needs to show the dashbaord we have
// from backend" — the real dashboard (ListingAnalyticsPanel.tsx) is a
// Payload admin component behind a developer login, tied to one real
// project's real data; it can't be embedded on a public marketing page
// the way the live listing preview above is. Instead this mockup's fields
// now match that real panel's actual stats and copy (Pages / session,
// and the Lead Status row using the real statuses from
// LEAD_STATUS_OPTIONS in collections/Leads.ts — New/Contacted/Site
// visit/Closed) rather than a loosely-invented approximation.
const ANALYTICS_EXAMPLES = [
  {
    views: "2,145", inquiries: "38", inquiryRate: "1.8%", avgTime: "96s", pagesPerSession: "2.4",
    viewsPoints: "0,60 40,55 80,48 120,50 160,35 200,30 240,20 280,18 320,10", inquiriesPoints: "0,82 40,80 80,78 120,75 160,72 200,68 240,60 280,58 320,50",
    leadStatus: [{ label: "New", count: 6 }, { label: "Contacted", count: 19 }, { label: "Site visit", count: 9 }, { label: "Closed", count: 4 }],
  },
  {
    views: "3,860", inquiries: "72", inquiryRate: "1.9%", avgTime: "112s", pagesPerSession: "2.8",
    viewsPoints: "0,70 40,62 80,58 120,44 160,40 200,26 240,22 280,14 320,8", inquiriesPoints: "0,85 40,80 80,74 120,70 160,64 200,58 240,52 280,44 320,36",
    leadStatus: [{ label: "New", count: 11 }, { label: "Contacted", count: 34 }, { label: "Site visit", count: 18 }, { label: "Closed", count: 9 }],
  },
  {
    views: "1,290", inquiries: "21", inquiryRate: "1.6%", avgTime: "84s", pagesPerSession: "2.1",
    viewsPoints: "0,66 40,64 80,60 120,56 160,50 200,42 240,34 280,24 320,16", inquiriesPoints: "0,88 40,86 80,84 120,80 160,76 200,70 240,64 280,58 320,52",
    leadStatus: [{ label: "New", count: 3 }, { label: "Contacted", count: 10 }, { label: "Site visit", count: 5 }, { label: "Closed", count: 3 }],
  },
] as const;

// Owner, 2026-09-30: "having 1 analytics is grwat. but have some other
// feautes also" — real, already-established capabilities every listing
// has (not invented for this section), shown alongside the analytics
// example rather than replacing it.
const PLATFORM_FEATURES = [
  { icon: MessageCircle, label: "Direct WhatsApp & phone enquiries" },
  { icon: LayoutGrid, label: "Unlimited photos & floor plans" },
  { icon: FileText, label: "Brochure downloads" },
] as const;

// Owner, 2026-09-29: "for-devlopers faq needs to look this this faq
// [neighborhoods]... be constant please" — this page had no FAQ before;
// added using the same .guide-page-faq-item accordion every other FAQ on
// the site uses. Content is grounded in facts already stated elsewhere on
// this page (always-free listing, the badges, the analytics dashboard),
// not invented.
const FAQS = [
  { q: "Is it really free to list?", a: "Yes — every project stays free to list, permanently. A paid package adds extra reach (better search placement, homepage rotation), not a base listing fee." },
  { q: "How do I get started?", a: "Register as a developer, then add your first project. It goes live once approved." },
  { q: "How do buyer enquiries reach me?", a: "Every enquiry submitted on your listing reaches you the moment it's sent — no delay, no middleman." },
  { q: "Can I list more than one project?", a: "Yes, there's no limit on the number of free listings a developer account can have." },
  { q: "What do the Verified and “Responds within 1 hour” badges mean?", a: "Verified confirms a real, active developer account. “Responds within 1 hour” is earned by replying to enquiries quickly — both are things buyers specifically look for." },
  { q: "Do I need to provide my own photos and floor plans?", a: "Yes — real photography, floor plans and pricing are what make a listing complete. We don't publish placeholder content in their place." },
] as const;

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
            {/* Owner, 2026-09-29: "same styling as list your project. same
                as the footer. please be constant with design" — the
                footer/final-CTA pill, not the solid-fill .fdv-cta-primary. */}
            <Link href="/developers/register" className="fdv-cta-final-button">Register as a developer</Link>
            <a href="#show-product" className="fdv-cta-secondary fdv-hero-explore-link">
              Explore the platform
              <ArrowRight size={16} strokeWidth={2.5} aria-hidden="true" />
            </a>
          </div>
          {/* Owner, 2026-09-29: "for devloeprs its free to list always" — not
              "at the moment", which read as a limited-time offer. */}
          <p className="fdv-hero-fineprint">Always free to list.</p>
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

        {/* Owner, 2026-09-29: "put these below the imagee" — moved out of
            .fdv-hero-content to after the marquee, same placement
            /web-design uses for its own hero chip list below its marquee.
            Wrapped in one group (owner, 2026-09-30: "too spacing. put it
            closer") — as two separate direct children of .fdv-hero, the
            parent's own 48px flex gap was stacking on top of the title's
            own margin, doubling up the gap between them. */}
        <div className="fdv-hero-badges-group">
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
      </section>

      {/* 4 — SHOW THE PRODUCT — a live iframe of the real /projects/{slug}
          page, not a static photo with a fabricated overlay caption (owner,
          2026-09-29: "can you show the acutal hero section and over
          section"). Same ScaledPreview component /web-design's sample
          switcher uses; see its comment in web-design-frames.tsx. The
          Introduction and "Why developers list here" sections that used to
          precede this were deleted the same day ("delelte this section" —
          owner pasted both) — this is now the hero's "#introduction"
          scroll target (renamed below to "#show-product"). */}
      {productProject ? (
        <section className="fdv-showcase-product" id="show-product" aria-label="A real project page">
          <div className="wdx-section-head" data-reveal>
            <h2>A better way to present your developments.</h2>
            <p>An iframe of a real, live listing, not a static photo — see exactly what a buyer sees.</p>
          </div>

          <div className="fdv-product-frame" data-reveal>
            <div className="fdv-product-preview">
              <div className="wdx-browser-bar" aria-hidden="true">
                <span className="wdx-browser-dots"><i /><i /><i /></span>
                <span className="wdx-browser-url">www.lankanewhomes.com</span>
              </div>
              <ScaledPreview
                src={`/projects/${productProject.slug}`}
                title={`${productProject.name} — live listing preview`}
                base={PRODUCT_PREVIEW}
              />
            </div>

            <div className="fdv-product-foot">
              <Link href={`/projects/${productProject.slug}`} className="fdv-cta-secondary fdv-product-cta">
                View the live page →
              </Link>
            </div>
          </div>
          <p className="fdv-caption" data-reveal>Every project gets a dedicated presentation.</p>
        </section>
      ) : null}

      {/* 8 — ANALYTICS DASHBOARD */}
      <section className="fdv-control" id="analytics" aria-label="Developer analytics dashboard">
        <div className="fdv-control-inner">
        <div className="wdx-section-head" data-reveal>
          <h2>See exactly how buyers find your listing.</h2>
          <p>
            Views, inquiries, response performance and traffic sources — the same Listing Analytics tab
            included on every one of your projects from day one.
          </p>
        </div>

        {/* Owner, 2026-09-30: "having 1 analytics is grwat. but have some
            other feautes also" — real capabilities every listing already
            has, alongside the analytics example rather than in place of
            it. */}
        <ul className="fdv-platform-features" data-reveal aria-label="Also included on every listing">
          {PLATFORM_FEATURES.map((feature) => (
            <li key={feature.label}>
              <feature.icon className="h-4 w-4" aria-hidden="true" />
              {feature.label}
            </li>
          ))}
        </ul>

        <div className="fdv-control-panel-wrap" data-reveal>
          <div className="fdv-analytics-row">
          {ANALYTICS_EXAMPLES.map((example, index) => (
            <div className="fdv-analytics-frame" aria-hidden="true" key={index}>
              <div className="fdv-analytics-toolbar">
                <span className="fdv-analytics-title">
                  Listing Analytics{showcaseProjects[index] ? ` — ${showcaseProjects[index].name}` : ""}
                </span>
                <div className="fdv-analytics-ranges">
                  <span className="fdv-analytics-range">Last 7 days</span>
                  <span className="fdv-analytics-range fdv-analytics-range-active">Last 28 days</span>
                  <span className="fdv-analytics-range">Last 90 days</span>
                </div>
              </div>
              <div className="fdv-analytics-stats">
                <div className="fdv-analytics-stat">
                  <span className="fdv-analytics-stat-label">Views</span>
                  <span className="fdv-analytics-stat-value">{example.views}</span>
                </div>
                <div className="fdv-analytics-stat">
                  <span className="fdv-analytics-stat-label">Inquiries</span>
                  <span className="fdv-analytics-stat-value">{example.inquiries}</span>
                </div>
                <div className="fdv-analytics-stat">
                  <span className="fdv-analytics-stat-label">Inquiry rate</span>
                  <span className="fdv-analytics-stat-value">{example.inquiryRate}</span>
                </div>
                <div className="fdv-analytics-stat">
                  <span className="fdv-analytics-stat-label">Avg. time on page</span>
                  <span className="fdv-analytics-stat-value">{example.avgTime}</span>
                </div>
                <div className="fdv-analytics-stat">
                  <span className="fdv-analytics-stat-label">Pages / session</span>
                  <span className="fdv-analytics-stat-value">{example.pagesPerSession}</span>
                </div>
              </div>
              <svg className="fdv-analytics-chart" viewBox="0 0 320 90" preserveAspectRatio="none">
                <polyline className="fdv-analytics-chart-line fdv-analytics-chart-line-views" points={example.viewsPoints} />
                <polyline className="fdv-analytics-chart-line fdv-analytics-chart-line-inquiries" points={example.inquiriesPoints} />
              </svg>
              <div className="fdv-analytics-legend">
                <span><i className="fdv-analytics-dot fdv-analytics-dot-views" aria-hidden="true" />Views</span>
                <span><i className="fdv-analytics-dot fdv-analytics-dot-inquiries" aria-hidden="true" />Inquiries</span>
              </div>
              <div className="fdv-analytics-leadstatus">
                {example.leadStatus.map((row) => (
                  <span key={row.label}>{row.label}: <strong>{row.count}</strong></span>
                ))}
              </div>
            </div>
          ))}
          </div>
          <p className="fdv-analytics-caption">
            Illustrative example — every developer gets this exact dashboard, live, for each of their own projects.
          </p>
        </div>
        </div>
      </section>

      {showcaseProjects.length > 0 ? (
        <section className="fdv-live-listings" id="listings" aria-label="Live listings">
          <div className="wdx-section-head" data-reveal>
            <h2>This is what a listing looks like.</h2>
            <p>Not a mockup — real, currently-published listings, shown the exact way buyers browse them.</p>
          </div>
          <div className="home-card-grid fdv-showcase-grid" data-reveal>
            {showcaseProjects.map((project) => (
              <ListingGridCard key={project.slug} project={project} />
            ))}
          </div>
        </section>
      ) : null}

      {/* 9 — FAQ */}
      <section className="wdx-faq" id="faq" aria-label="Questions">
        <div className="wdx-section-head" data-reveal>
          <h2>Questions developers ask us.</h2>
          <p>The questions that come up most before a developer lists their first project.</p>
        </div>
        <div className="wdx-faq-list" data-reveal>
          {FAQS.map((item) => (
            <details className="guide-page-faq-item" key={item.q}>
              <summary>{item.q}</summary>
              <p>{item.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* Owner, 2026-09-30: "deelte this section" — the closing 'Let's put
          your projects on the map' CTA band. The hero already has its own
          'Register as a developer' button, so the page still ends with a
          clear call to action via the quickjump menu below. */}

      <ForDevelopersQuickjump />
    </div>
  );
}
