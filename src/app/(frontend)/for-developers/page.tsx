import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { FileText, LayoutGrid, MessageCircle, ShieldCheck, Zap } from "lucide-react";
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
  title: "List Your Project | For Developers",
  description:
    "A premium platform for discovering new property in Sri Lanka. Publish your development, present it beautifully, and reach buyers actively searching — free to list.",
  alternates: { canonical: "/for-developers" },
  openGraph: {
    title: "List Your Project | For Developers",
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
// more illustrative example.es." -> (2026-09-30) "1 card of analytics is
// good can you add other cards different not anyaltytics" — back to one
// dashboard example (was 3 near-identical ones), sitting alongside real,
// different feature cards instead of more analytics repeats.
//
// Owner, 2026-09-29: "this section. needs to show the dashbaord we have
// from backend" — the real dashboard (ListingAnalyticsPanel.tsx) is a
// Payload admin component behind a developer login, tied to one real
// project's real data; it can't be embedded on a public marketing page
// the way the live listing preview above is. Instead this mockup's fields
// now match that real panel's actual stats and copy (Pages / session,
// and the Lead Status row using the real statuses from
// LEAD_STATUS_OPTIONS in collections/Leads.ts — New/Contacted/Site
// visit/Closed) rather than a loosely-invented approximation.
const ANALYTICS_EXAMPLE = {
  views: "2,145", inquiries: "38", inquiryRate: "1.8%", avgTime: "96s", pagesPerSession: "2.4",
  viewsPoints: "0,60 40,55 80,48 120,50 160,35 200,30 240,20 280,18 320,10", inquiriesPoints: "0,82 40,80 80,78 120,75 160,72 200,68 240,60 280,58 320,50",
  leadStatus: [{ label: "New", count: 6 }, { label: "Contacted", count: 19 }, { label: "Site visit", count: 9 }, { label: "Closed", count: 4 }],
} as const;

// Owner, 2026-09-30: "having 1 analytics is grwat. but have some other
// feautes also" -> "can you add other cards different not anyaltytics" —
// real, already-established capabilities every listing has, each its own
// proper card now (was a plain pill list) instead of more dashboard
// mockups.
const PLATFORM_FEATURES = [
  { icon: MessageCircle, label: "Direct WhatsApp & phone enquiries", body: "Buyers reach you instantly — no delay, no missed messages." },
  { icon: LayoutGrid, label: "Unlimited photos & floor plans", body: "Show every unit type and every angle, at no extra cost." },
  { icon: FileText, label: "Brochure downloads", body: "A downloadable PDF brochure on every listing, ready to share." },
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
  { q: "What do the Verified and “Responds within 24 hours” badges mean?", a: "Verified confirms a real, active developer account. “Responds within 24 hours” is earned by replying to enquiries quickly — both are things buyers specifically look for." },
  { q: "Do I need to provide my own photos and floor plans?", a: "Yes — real photography, floor plans and pricing are what make a listing complete. We don't publish placeholder content in their place." },
] as const;

const BADGES = [
  { key: "verified", label: "Verified", className: "listing-badge-pill badge-verified fdv-badge-pill", icon: ShieldCheck },
  { key: "responder", label: "Responds within 24 hours", className: "listing-badge-pill badge-responder fdv-badge-pill", icon: Zap },
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

  return (
    <div className="fdv-page">
      <ScrollReveal />

      {/* 1 — HERO — solid background, centered (owner, 2026-09-29: "you need
          ot change the hero section. re design the devloerps page"),
          matching /web-design's own hero rather than a full-bleed photo. */}
      <section className="fdv-hero fdv-hero--split" aria-label="For property developers">
        <div className="fdv-hero-split-inner">
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
              <a href="#show-product" className="fdv-cta-secondary fdv-hero-explore-link">Explore the platform</a>
            </div>
            {/* Owner, 2026-09-29: "for devloeprs its free to list always" — not
                "at the moment", which read as a limited-time offer. */}
            <p className="fdv-hero-fineprint">Always free to list.</p>
          </div>

          {/* Owner, 2026-09-30: "redesign this section, surprise me" — instead of
              a media strip + a separate badge row, the hero shows one
              listing as a buyer sees it, with every badge a listing can earn
              pinned on its photo and the analytics a developer gets
              underneath. Illustrative: the numbers are the same example
              figures as the Analytics section. */}
          <div className="fdv-hero-mock" aria-hidden="true">
            <div className="fdv-hero-mock-card">
              <div className="fdv-hero-mock-photo">
                {heroProject?.heroImage ? (
                  <Image src={heroProject.heroImage} alt="" fill sizes="(max-width: 900px) 90vw, 520px" className="fdv-hero-marquee-img" priority />
                ) : null}
              </div>
              <div className="fdv-hero-mock-body">
                <strong>{heroProject?.name ?? "Your project"}</strong>
                <span>{heroProject?.location ?? "Sri Lanka"}</span>
              </div>
              <div className="fdv-hero-mock-stats">
                <div><span>Views</span><strong>{ANALYTICS_EXAMPLE.views}</strong></div>
                <div><span>Inquiries</span><strong>{ANALYTICS_EXAMPLE.inquiries}</strong></div>
                <div><span>Inquiry rate</span><strong>{ANALYTICS_EXAMPLE.inquiryRate}</strong></div>
              </div>
            </div>
            <p className="fdv-hero-mock-caption">The analytics every listing gets. Illustrative example.</p>
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

      {/* Owner, 2026-09-30: "create another section, not too big, for the
          badges and remove it from the hero section" */}
      <section className="fdv-box fdv-box--lilac fdv-badges-box" id="badges" aria-label="Listing badges">
        <div className="wdx-section-head" data-reveal>
          <h2>Badges your listing can earn.</h2>
          <p>Real signals buyers look for, shown on your listing and on the search results.</p>
        </div>
        <div className="fdv-badges-row" data-reveal aria-hidden="true">
          {BADGES.map((badge) => (
            <span key={badge.key} className={badge.className}>
              {badge.icon ? <badge.icon className="h-2.5 w-2.5" aria-hidden="true" /> : null}
              {badge.label}
            </span>
          ))}
        </div>
      </section>

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

        <div className="fdv-control-panel-wrap" data-reveal>
          <div className="fdv-analytics-col">
          <div className="fdv-analytics-frame" aria-hidden="true">
            <div className="fdv-analytics-toolbar">
              <span className="fdv-analytics-title">
                Listing Analytics{showcaseProjects[0] ? ` — ${showcaseProjects[0].name}` : ""}
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
                <span className="fdv-analytics-stat-value">{ANALYTICS_EXAMPLE.views}</span>
              </div>
              <div className="fdv-analytics-stat">
                <span className="fdv-analytics-stat-label">Inquiries</span>
                <span className="fdv-analytics-stat-value">{ANALYTICS_EXAMPLE.inquiries}</span>
              </div>
              <div className="fdv-analytics-stat">
                <span className="fdv-analytics-stat-label">Inquiry rate</span>
                <span className="fdv-analytics-stat-value">{ANALYTICS_EXAMPLE.inquiryRate}</span>
              </div>
              <div className="fdv-analytics-stat">
                <span className="fdv-analytics-stat-label">Avg. time on page</span>
                <span className="fdv-analytics-stat-value">{ANALYTICS_EXAMPLE.avgTime}</span>
              </div>
              <div className="fdv-analytics-stat">
                <span className="fdv-analytics-stat-label">Pages / session</span>
                <span className="fdv-analytics-stat-value">{ANALYTICS_EXAMPLE.pagesPerSession}</span>
              </div>
            </div>
            <svg className="fdv-analytics-chart" viewBox="0 0 320 90" preserveAspectRatio="none">
              <polyline className="fdv-analytics-chart-line fdv-analytics-chart-line-views" points={ANALYTICS_EXAMPLE.viewsPoints} />
              <polyline className="fdv-analytics-chart-line fdv-analytics-chart-line-inquiries" points={ANALYTICS_EXAMPLE.inquiriesPoints} />
            </svg>
            <div className="fdv-analytics-legend">
              <span><i className="fdv-analytics-dot fdv-analytics-dot-views" aria-hidden="true" />Views</span>
              <span><i className="fdv-analytics-dot fdv-analytics-dot-inquiries" aria-hidden="true" />Inquiries</span>
            </div>
            <div className="fdv-analytics-leadstatus">
              {ANALYTICS_EXAMPLE.leadStatus.map((row) => (
                <span key={row.label}>{row.label}: <strong>{row.count}</strong></span>
              ))}
            </div>
          </div>
          <p className="fdv-analytics-caption">
            Illustrative example — every developer gets this exact dashboard, live, for each of their own projects.
          </p>
          </div>

          {/* Owner, 2026-09-30: "1 card of analytics is good can you add
              other cards different not anyaltytics" — real platform
              features as their own cards, not more dashboard mockups. */}
          <div className="fdv-feature-cards">
            {PLATFORM_FEATURES.map((feature) => (
              <div className="fdv-feature-card" key={feature.label}>
                <feature.icon className="h-5 w-5" aria-hidden="true" />
                <h3>{feature.label}</h3>
                <p>{feature.body}</p>
              </div>
            ))}
          </div>
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

      {/* Owner, 2026-09-30: "any section you need to add on this page, please
          add" — a short how-it-works, grounded in the FAQ's own answers
          (register, add a project, goes live once approved, enquiries
          reach you instantly). */}
      <section className="fdv-box fdv-box--cream" id="how" aria-label="How listing works">
        <div className="wdx-section-head" data-reveal>
          <h2>How listing works.</h2>
          <p>Three steps from sign-up to your first enquiry.</p>
        </div>
        <div className="fdv-box-grid fdv-box-grid--3" data-reveal>
          <div className="fdv-box-card">
            <h3>Register as a developer</h3>
            <p>Create your free developer account — there is no fee to list, ever.</p>
          </div>
          <div className="fdv-box-card">
            <h3>Add your project</h3>
            <p>Upload real photography, floor plans and pricing. Your listing goes live once approved.</p>
          </div>
          <div className="fdv-box-card">
            <h3>Receive enquiries directly</h3>
            <p>Every enquiry reaches your team the moment it&apos;s sent — by WhatsApp, phone or form.</p>
          </div>
        </div>
      </section>

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
