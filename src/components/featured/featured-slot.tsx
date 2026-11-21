import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { FeaturedCard, DemoFlag } from "@/components/featured/featured-card";
import { ListingGridCard } from "@/components/marketplace/listing-page";
import { slimForHome } from "@/lib/home-slim";
import { FeaturedTrack } from "@/components/featured/featured-track";
import { MAX_PINNED_PER_PAGE, type Placement } from "@/lib/featured/config";
import { FEATURED_DEMO } from "@/lib/featured/demo";
import { activeBookings } from "@/lib/featured/engine";
import { getFeaturedData } from "@/lib/featured/store";
import { selectFeatured } from "@/lib/featured/engine";
import type { AddOnBooking, SlotContext } from "@/lib/featured/types";
import type { Developer } from "@/types";
import "./featured.css";

// ONE reusable server component for every Featured placement:  <FeaturedSlot placement="results-top" context={{ location: "Colombo" }} />
// It picks the right projects or booking (see lib/featured/engine.ts for the rules), renders them in that placement's layout, and
// renders NOTHING when nothing is booked. Everything is server-rendered with fixed sizes, so there is no layout shift.
// Placements that live inside client widgets (hero slider, results grid, map pins, search autocomplete) use the same engine through
// lib/featured/store.ts; see the notes next to those integrations.

const CARD_HEADINGS: Partial<Record<Placement, { title: string; sub?: string }>> = {
  "results-top": { title: "Featured projects", sub: "Sponsored picks that match this page" },
  "project-similar": { title: "Featured projects like this one" },
  "project-nearby": { title: "Featured projects nearby" },
  "thankyou-also-like": { title: "You may also like.", sub: "Featured projects that match what you asked about." },
  "saved-recommended": { title: "Recommended for you" },
  "guide-inline": { title: "Featured projects for this topic" },
  "guide-end": { title: "Featured projects to explore next" },
  "results-empty": { title: "No exact matches, but these featured projects may suit you" },
  "directory-developers": { title: "Featured projects.", sub: "From developers on a Featured package." },
  "directory-construction": { title: "Featured projects", sub: "Sponsored picks" },
  "directory-land": { title: "Featured projects", sub: "Sponsored picks" },
};

const CARD_PLACEMENTS = new Set<Placement>(Object.keys(CARD_HEADINGS) as Placement[]);
const CITY_PATHS: Record<string, string> = { Colombo: "/projects/colombo", Kandy: "/projects/houses-for-sale-in-kandy", Galle: "/projects/houses-for-sale-in-galle", Negombo: "/projects/houses-for-sale-in-negombo" };

// Same look as the homepage "New listings" section: pale panel, left-aligned heading + one-line subheading, card grid, dark "View all" button.
function Section({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`new-listings-section fp-listings ${className}`}>{children}</section>;
}

function Head({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="featured-listings-head">
      <h2>{title}</h2>
      {sub ? <p className="featured-listings-subhead">{sub}</p> : null}
    </div>
  );
}

function Foot({ href, label }: { href?: string; label?: string }) {
  if (!href) return null;
  return (
    <div className="featured-listings-footer new-listings-footer">
      <Link href={href} className="featured-listings-button">{label ?? "View all"}<span aria-hidden="true">↗</span></Link>
    </div>
  );
}

/** Image for a booking: its own creative, else the project's hero photo. */
function bookingImage(booking: AddOnBooking, fallback?: string) {
  return booking.creative?.image || fallback || "";
}

export async function FeaturedSlot({ placement, context = {}, fallbackContexts = [], exclude = [], heading, subheading, basePath = "/projects" }: {
  placement: Placement;
  context?: SlotContext;
  /** Tried in order, only when `context` finds nothing: a wider place or type, never an unrelated one. */
  fallbackContexts?: SlotContext[];
  /** Project slugs already shown elsewhere on the page. */
  exclude?: string[];
  heading?: string;
  subheading?: string;
  basePath?: "/projects" | "/land";
}) {
  const { state, projects, developers } = await getFeaturedData();
  const now = context.now ?? new Date();
  const developerBySlug = new Map<string, Developer>(developers.map((developer) => [developer.slug, developer]));
  const projectBySlug = new Map(projects.map((project) => [project.slug, project]));

  // ---- Project cards (results, project pages, thank-you, saved, guides, directories) ----
  if (CARD_PLACEMENTS.has(placement)) {
    let items: ReturnType<typeof selectFeatured> = [];
    for (const candidate of [context, ...fallbackContexts]) {
      items = selectFeatured(state, projects, placement, { ...candidate, limit: (candidate.limit ?? context.limit ?? (placement === "results-top" ? MAX_PINNED_PER_PAGE : 4)) + exclude.length })
        .filter((item) => !exclude.includes(item.project.slug))
        .slice(0, candidate.limit ?? context.limit ?? (placement === "results-top" ? MAX_PINNED_PER_PAGE : 4));
      if (items.length) break;
    }
    if (!items.length) return null;
    const text = CARD_HEADINGS[placement]!;
    const cards = items.map((item) => (
      <FeaturedCard key={item.project.slug} project={item.project} tier={item.tier} placement={placement} developer={developerBySlug.get(item.developerSlug)} basePath={basePath} />
    ));
    // Pinned inside a results list (projects, land): no heading, the page's own .listing-grid, so the cards line up with the listings below.
    if (placement === "results-top" || placement === "directory-land") {
      return <section className="fp-section fp-section--tight"><div className="listing-grid fp-grid--top">{cards}</div></section>;
    }
    // Directory pages (developers, construction companies) are built from the site's contained boxes, so the slot is one of those boxes.
    if (placement === "directory-developers" || placement === "directory-construction" || placement === "thankyou-also-like") {
      return (
        <section className="fdv-box fdv-box--cream fp-box" aria-label={heading ?? text.title}>
          <div className="wdx-section-head">
            <h2>{heading ?? text.title}</h2>
            {subheading ?? text.sub ? <p>{subheading ?? text.sub}</p> : null}
          </div>
          <div className="fp-box-grid">{cards}</div>
        </section>
      );
    }
    return (
      <Section>
        <Head title={heading ?? text.title} sub={subheading ?? text.sub} />
        <div className="home-card-grid featured-listings-grid">{cards}</div>
      </Section>
    );
  }

  switch (placement) {
    // ---- Homepage: Featured Projects carousel (Premium and above) ----
    case "home-featured-carousel": {
      const items = selectFeatured(state, projects, placement, { ...context, limit: context.limit ?? 4 });
      if (!items.length) return null;
      return (
        <Section>
          <Head title={heading ?? "Featured Projects"} sub={subheading ?? "Hand-picked new homes from our partner developers."} />
          <div className="home-card-grid featured-listings-grid">
            {items.map((item) => (
              <FeaturedCard key={item.project.slug} project={item.project} tier={item.tier} placement={placement} developer={developerBySlug.get(item.developerSlug)} />
            ))}
          </div>
        <Foot href="/projects" label="View all projects" />
        </Section>
      );
    }

    // ---- Homepage: New Launches strip (add-on) ----
    case "home-new-launches": {
      const bookings = activeBookings(state, now, "new-launch").slice(0, 4);
      if (!bookings.length) return null;
      return (
        <Section className="fp-launch">
          <Head title={heading ?? "New Launches"} sub={subheading ?? "Just launched or launching soon."} />
          <div className="home-card-grid featured-listings-grid">
            {bookings.slice(0, 4).map((booking) => {
              const project = booking.projectSlug ? projectBySlug.get(booking.projectSlug) : undefined;
              if (!project) return null;
              return (
                <FeaturedTrack key={booking.id} placement={placement} projectSlug={project.slug} developer={project.developerSlug} demo={FEATURED_DEMO} className="fp-card">
                  <ListingGridCard project={slimForHome(project)} featured={{ tier: "featured", label: "New launch", logo: developerBySlug.get(project.developerSlug)?.logo, developerName: project.developerName }} />
                </FeaturedTrack>
              );
            })}
          </div>
          <Foot href="/projects" label="View all new projects" />
        </Section>
      );
    }

    // ---- Homepage: Developer of the Month (add-on, one per month) ----
    case "home-developer-of-month": {
      const booking = activeBookings(state, now, "developer-of-month")[0];
      const developer = booking ? developerBySlug.get(booking.developerSlug) : undefined;
      if (!booking || !developer) return null;
      const project = booking.projectSlug ? projectBySlug.get(booking.projectSlug) : undefined;
      const href = booking.creative?.ctaHref ?? `/developers/${developer.slug}`;
      return (
        <Section>
          <FeaturedTrack placement={placement} projectSlug={project?.slug} developer={developer.slug} demo={FEATURED_DEMO} className="fp-dom">
            <div className="fp-dom-media">
              <Image src={bookingImage(booking, project?.heroImage)} alt={developer.name} width={900} height={560} sizes="(max-width: 760px) 100vw, 55vw" unoptimized />
              <span className="fp-sponsored" style={{ position: "absolute", top: 10, left: 10 }}>Sponsored{FEATURED_DEMO ? " · demo" : ""}</span>
            </div>
            <div className="fp-dom-body">
              <span className="fp-dom-badge">Developer of the Month</span>
              <h3>{developer.name}</h3>
              <p>{booking.creative?.subline || developer.description?.slice(0, 220)}</p>
              <p>{developer.activeProjects} active developments · {developer.yearsInBusiness} years in business</p>
              <Link className="fp-cta" href={href}>{booking.creative?.ctaLabel ?? "View developer"}</Link>
            </div>
          </FeaturedTrack>
        </Section>
      );
    }

    // ---- Homepage: featured developer logo bar (Elite) ----
    case "home-logo-bar": {
      const elite = [...new Set(state.packages.filter((pkg) => pkg.tier === "elite").map((pkg) => pkg.developerSlug))];
      const active = elite.filter((slug) => state.packages.some((pkg) => pkg.developerSlug === slug && pkg.tier === "elite" && pkg.startDate <= now.toISOString().slice(0, 10) && pkg.endDate >= now.toISOString().slice(0, 10)));
      const logos = active.map((slug) => developerBySlug.get(slug)).filter((developer): developer is Developer => Boolean(developer?.logo));
      if (!logos.length) return null;
      return (
        <Section>
          <Head title={heading ?? "Featured developers"} sub={subheading ?? "Trusted partners building across Sri Lanka."} />
          <div className="fp-logos">
            {logos.map((developer) => (
              <FeaturedTrack key={developer.slug} placement={placement} developer={developer.slug} demo={FEATURED_DEMO}>
                <Link href={`/developers/${developer.slug}`} className="fp-logo" aria-label={developer.name}>
                  <Image src={developer.logo} alt={developer.name} width={160} height={52} unoptimized />
                </Link>
              </FeaturedTrack>
            ))}
          </div>
        </Section>
      );
    }

    // ---- Homepage: city tiles, one sponsored project each (add-on) ----
    case "home-city-tiles": {
      const bookings = activeBookings(state, now, "city-tile").filter((booking) => booking.city);
      if (!bookings.length) return null;
      return (
        <Section>
          <Head title={heading ?? "Explore by city"} sub={subheading ?? "Each city features one sponsored project"} />
          <div className="fp-cities">
            {bookings.slice(0, 6).map((booking) => {
              const project = booking.projectSlug ? projectBySlug.get(booking.projectSlug) : undefined;
              if (!project) return null;
              return (
                <FeaturedTrack key={booking.id} placement={placement} projectSlug={project.slug} developer={project.developerSlug} demo={FEATURED_DEMO}>
                  <Link href={`/projects/${project.slug}`} className="fp-city">
                    <Image src={bookingImage(booking, project.heroImage)} alt={`${project.name}, ${booking.city}`} width={400} height={520} sizes="(max-width: 760px) 50vw, 20vw" unoptimized />
                    <span className="fp-sponsored">Sponsored{FEATURED_DEMO ? " · demo" : ""}</span>
                    <span className="fp-city-text"><strong>{booking.city}</strong><span>{project.name}</span></span>
                  </Link>
                  {CITY_PATHS[booking.city ?? ""] ? <p style={{ margin: "6px 0 0", fontSize: 12 }}><Link href={CITY_PATHS[booking.city ?? ""]} style={{ textDecoration: "underline" }}>All homes in {booking.city}</Link></p> : null}
                </FeaturedTrack>
              );
            })}
          </div>
        </Section>
      );
    }

    // ---- Location / category page banner (Elite) ----
    case "results-banner": {
      const [item] = selectFeatured(state, projects, placement, { ...context, limit: 1 });
      if (!item) return null;
      const { project } = item;
      return (
        <section className="fp-section fp-section--tight">
          <FeaturedTrack placement={placement} projectSlug={project.slug} developer={project.developerSlug} demo={FEATURED_DEMO}>
            <Link href={`/projects/${project.slug}`} className="fp-banner">
              <div className="fp-banner-media">
                <Image src={project.heroImage} alt={`${project.name} in ${project.location}`} width={700} height={400} sizes="(max-width: 760px) 100vw, 340px" unoptimized />
                <span className="fp-sponsored">Sponsored{FEATURED_DEMO ? " · demo" : ""}</span>
              </div>
              <div className="fp-banner-body">
                <small>{project.developerName}</small>
                <strong>{project.name}</strong>
                <small>{[project.location, project.type, project.priceRange].filter(Boolean).join(" · ")}</small>
                <span className="fp-cta">View project</span>
              </div>
            </Link>
          </FeaturedTrack>
        </section>
      );
    }

    // ---- Announcement bar at the very top of the site (add-on) ----
    case "site-announcement": {
      const booking = activeBookings(state, now, "announcement-bar")[0];
      if (!booking?.creative) return null;
      return (
        <FeaturedTrack placement={placement} projectSlug={booking.projectSlug} developer={booking.developerSlug} demo={FEATURED_DEMO} className="fp-announce">
          <Link href={booking.creative.ctaHref} className="fp-announce-link">
            <span className="fp-announce-text">{booking.creative.headline}</span>
            <span className="fp-announce-cta">{booking.creative.ctaLabel ?? "Learn more"} <span aria-hidden="true">→</span></span>
          </Link>
          <span className="fp-announce-ad">Sponsored Now</span>
        </FeaturedTrack>
      );
    }

    // ---- Card inside the Projects menu (Elite) ----
    case "site-menu-card": {
      const [item] = selectFeatured(state, projects, placement, { ...context, limit: 1 });
      if (!item) return null;
      const { project } = item;
      return (
        <FeaturedTrack placement={placement} projectSlug={project.slug} developer={project.developerSlug} demo={FEATURED_DEMO}>
          <Link href={`/projects/${project.slug}`} className="fp-menucard">
            <Image src={project.heroImage} alt="" width={144} height={108} unoptimized />
            <span><em>Featured</em><strong>{project.name}</strong><small>{project.location}</small></span>
          </Link>
        </FeaturedTrack>
      );
    }

    // ---- Developer Spotlight teaser (sponsored article add-on) ----
    case "guide-spotlight": {
      const bookings = activeBookings(state, now, "sponsored-article");
      if (!bookings.length) return null;
      return (
        <Section>
          <Head title={heading ?? "Developer Spotlight"} sub={subheading ?? "Sponsored articles from our partner developers"} />
          {bookings.map((booking) => booking.creative ? (
            <FeaturedTrack key={booking.id} placement={placement} projectSlug={booking.projectSlug} developer={booking.developerSlug} demo={FEATURED_DEMO}>
              <Link href={booking.creative.ctaHref} className="fp-spot">
                <Image src={booking.creative.image} alt="" width={680} height={380} unoptimized />
                <span className="fp-spot-body">
                  <span><span className="fp-sponsored">Sponsored</span></span>
                  <h3>{booking.creative.headline}</h3>
                  <p>{booking.creative.subline}</p>
                  <span className="fp-cta">{booking.creative.ctaLabel ?? "Read more"}</span>
                </span>
              </Link>
            </FeaturedTrack>
          ) : null)}
        </Section>
      );
    }

    default:
      return null; // hero, inline results, map pins and autocomplete are fed to their client widgets, see store.ts
  }
}
