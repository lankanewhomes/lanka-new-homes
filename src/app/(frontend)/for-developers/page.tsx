import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  BadgeCheck,
  CheckCircle2,
  Clock3,
  MessageCircle,
  Rocket,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";
import { getProjectBySlug } from "@/lib/project-store";
import { ListingGridCard } from "@/components/marketplace/listing-page";
import { ForDevelopersFeatures } from "@/components/marketplace/for-developers-features";
import { PACKAGE_LIST, formatPackagePrice } from "@/lib/packages";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "List Your Development on LankaNewHomes | For Developers & Builders",
  description:
    "Publish your project free on Sri Lanka's newest homes marketplace — instant lead alerts with one-tap replies, a Verified badge, built-in analytics, and no approval wait.",
  alternates: { canonical: "/for-developers" },
  openGraph: {
    title: "List Your Development on LankaNewHomes | For Developers & Builders",
    description:
      "Publish your project free on Sri Lanka's newest homes marketplace — instant lead alerts with one-tap replies, a Verified badge, and built-in analytics.",
    url: "/for-developers",
    type: "website",
  },
};

const LEAD_STEPS = [
  {
    icon: MessageCircle,
    title: "A buyer taps “Request Info”",
    body: "On your listing, your floor-plan page, or straight from your builder profile — whichever one they were looking at.",
  },
  {
    icon: Zap,
    title: "You get it instantly — with reply buttons built in",
    body: "An email lands in your inbox the moment they submit: their name, number, and message, plus one-tap buttons to reply on WhatsApp, call, or email.",
  },
  {
    icon: CheckCircle2,
    title: "Tap one, and it's logged — automatically",
    body: "The instant you reply through one of those buttons, the lead is marked contacted and your response time is captured.",
  },
  {
    icon: BadgeCheck,
    title: "Reply fast enough, earn the badge",
    body: "Answer at least 80% of inquiries within an hour over a rolling 90 days and a “Responds within 1 hour” badge appears next to your name.",
  },
];

const HOW_IT_WORKS = [
  { title: "Register your company", body: "Two minutes, one email to confirm. Free — no subscription required to start." },
  { title: "Build your listing", body: "Start from your own brochure or website, or fill it in yourself with the completeness checklist guiding you." },
  { title: "Publish instantly", body: "No approval queue standing between you and going live — publish the moment you're ready." },
  { title: "Get discovered, and reply in one tap", body: "Buyers search, save, and message you directly. Every step shows up on your dashboard." },
];

// Real, currently-published listings — the most honest way to show "what a
// listing looks like here" is to show an actual one, using the exact same
// ListingGridCard every /projects and homepage grid uses. Not a mockup.
const SHOWCASE_SLUGS = ["capitol-twinpeaks", "viva-la-vida", "imaarat-bambalapitiya"];

export default async function ForDevelopersPage() {
  const showcaseProjects = (await Promise.all(SHOWCASE_SLUGS.map((slug) => getProjectBySlug(slug)))).filter(
    (p): p is NonNullable<typeof p> => Boolean(p)
  );
  const heroProject = showcaseProjects[0];

  return (
    <div className="fd-page">
      <section className="fd-hero" aria-label="For developers and builders">
        <div className="fd-hero-grid">
          <div className="fd-hero-copy">
            <p className="fd-eyebrow">For developers &amp; builders</p>
            <h1>Your buyers are already searching for new homes.<br />Make sure it's your project they find.</h1>
            <p className="fd-hero-sub">
              Publish your development on Sri Lanka's newest homes marketplace — free to list, live in minutes,
              with instant lead alerts the moment a buyer reaches out.
            </p>
            <div className="fd-hero-ctas">
              <Link href="/developers/register" className="fd-cta-primary">Register your company — it's free</Link>
              <a href="#how-it-works" className="fd-cta-secondary">See how it works</a>
            </div>
          </div>

          {heroProject ? (
            <Link href={`/projects/${heroProject.slug}`} className="fd-hero-photo" aria-label={`View the real ${heroProject.name} listing`}>
              <Image src={heroProject.heroImage} alt={heroProject.name} fill sizes="(max-width: 900px) 100vw, 46vw" className="fd-hero-photo-img" />
              <span className="fd-hero-photo-tag">A real listing on LankaNewHomes →</span>
            </Link>
          ) : null}
        </div>

        {/* Same stat-chip look a real listing's hero uses (.listing-hero-stat-chip)
            — reused verbatim, not a new style, so this reads like the site's own
            language rather than a bolted-on marketing band. */}
        <div className="fd-hero-stats">
          <div className="listing-hero-stat-chip">
            <Sparkles className="listing-hero-stat-chip-icon" aria-hidden="true" />
            <div className="listing-hero-stat-chip-content">
              <span className="listing-hero-stat-chip-value">Free</span>
              <span className="listing-hero-stat-chip-label">to list, no minimum</span>
            </div>
          </div>
          <div className="listing-hero-stat-chip">
            <Clock3 className="listing-hero-stat-chip-icon" aria-hidden="true" />
            <div className="listing-hero-stat-chip-content">
              <span className="listing-hero-stat-chip-value">Minutes</span>
              <span className="listing-hero-stat-chip-label">to publish, no approval wait</span>
            </div>
          </div>
          <div className="listing-hero-stat-chip">
            <Zap className="listing-hero-stat-chip-icon" aria-hidden="true" />
            <div className="listing-hero-stat-chip-content">
              <span className="listing-hero-stat-chip-value">Instant</span>
              <span className="listing-hero-stat-chip-label">lead alerts, one-tap reply</span>
            </div>
          </div>
          <div className="listing-hero-stat-chip">
            <ShieldCheck className="listing-hero-stat-chip-icon" aria-hidden="true" />
            <div className="listing-hero-stat-chip-content">
              <span className="listing-hero-stat-chip-value">Verified</span>
              <span className="listing-hero-stat-chip-label">badge, earned not applied for</span>
            </div>
          </div>
        </div>
      </section>

      <section className="fd-section" aria-label="What happens when a buyer reaches out">
        <div className="fd-section-head">
          <h2>From click to conversation, tracked automatically</h2>
          <p>This is the part most listing sites don't build — what actually happens after a buyer hits submit.</p>
        </div>

        <div className="fd-lead-steps">
          {LEAD_STEPS.map((step, index) => (
            <div className="fd-lead-step" key={step.title}>
              <div className="fd-lead-step-number" aria-hidden="true">{index + 1}</div>
              <step.icon className="fd-lead-step-icon" aria-hidden="true" />
              <h3>{step.title}</h3>
              <p>{step.body}</p>
            </div>
          ))}
        </div>

        <div className="fd-badge-preview" aria-hidden="true">
          <span className="fd-badge-preview-label">Earned automatically, shown on your listings:</span>
          <span className="listing-badge-pill badge-verified">
            <ShieldCheck className="h-3 w-3" aria-hidden="true" /> Verified
          </span>
          <span className="listing-badge-pill badge-responder">
            <Zap className="h-3 w-3" aria-hidden="true" /> Responds within 1 hour
          </span>
        </div>
      </section>

      <section className="fd-section" aria-label="Everything that comes with a listing">
        <ForDevelopersFeatures />
      </section>

      {showcaseProjects.length > 0 ? (
        <section className="fd-section" aria-label="What a finished listing looks like">
          <div className="fd-section-head">
            <h2>This is what a listing looks like</h2>
            <p>Not a mockup — three real, currently-published listings, shown the exact way buyers browse them on /projects and the homepage.</p>
          </div>
          <div className="home-card-grid fd-showcase-grid">
            {showcaseProjects.map((project) => (
              <ListingGridCard key={project.slug} project={project} />
            ))}
          </div>
        </section>
      ) : null}

      <section className="fd-how-section" id="how-it-works" aria-label="How it works">
        <div className="fd-section-head">
          <h2>How it works</h2>
          <p>Four steps between where you are now and your project in front of active buyers.</p>
        </div>
        <ol className="fd-how-list">
          {HOW_IT_WORKS.map((step, index) => (
            <li className="fd-how-item" key={step.title}>
              <span className="fd-how-number">{index + 1}</span>
              <div>
                <h3>{step.title}</h3>
                <p>{step.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="fd-section" aria-label="Pricing">
        <div className="fd-section-head">
          <h2>Listing is always free. Upgrade any project for more reach.</h2>
          <p>Every listing gets the full page, photos, floor plans, and brochure at no cost. Featured and Premium are optional, per project — pick one after your listing is live.</p>
        </div>

        <div className="fd-feature-grid fd-pricing-grid">
          {PACKAGE_LIST.map((pkg) => (
            <div className={`fd-feature-card fd-pricing-card${pkg.tier === "premium" ? " fd-pricing-card-highlight" : ""}`} key={pkg.tier}>
              {pkg.tier === "premium" ? <span className="fd-pricing-card-tag">Most visibility</span> : null}
              <h3>{pkg.name}</h3>
              <p className="fd-pricing-card-price">{formatPackagePrice(pkg)}</p>
              <ul className="fd-pricing-card-features">
                {pkg.features.map((feature) => <li key={feature}>{feature}</li>)}
              </ul>
            </div>
          ))}
        </div>

        <p className="fd-pricing-note">Pick a package for any project from your dashboard once it's listed — no separate sign-up.</p>
      </section>

      <section className="fd-cta-band" aria-label="Get started">
        <Rocket className="fd-cta-band-icon" aria-hidden="true" />
        <h2>Ready to put your project in front of active buyers?</h2>
        <p>Registration is free, and there's no minimum to keep listing.</p>
        <div className="fd-hero-ctas">
          <Link href="/developers/register" className="fd-cta-primary">Register your company</Link>
          <Link href="/developers/login" className="fd-cta-secondary">Already have an account? Log in</Link>
        </div>
      </section>
    </div>
  );
}
