import type { Metadata } from "next";
import Link from "next/link";
import { Star } from "lucide-react";
import { PricingPlanCards } from "@/components/marketplace/pricing-comparison-table";
import { PricingQuickjump } from "@/components/marketplace/pricing-quickjump";
import { ScrollReveal } from "@/components/marketplace/scroll-reveal";
import { FOUNDING_DEVELOPER_CAP, FOUNDING_DEVELOPER_DISCOUNT, PACKAGE_LIST, formatPackagePriceAmount } from "@/lib/packages";

export const metadata: Metadata = {
  title: "Developer Pricing & Packages",
  description: "Listing your projects on LankaNewHomes is always free. Choose a package, then pick which of your projects to feature.",
  alternates: { canonical: "/pricing" },
  // Not linked from anywhere on the site yet (owner, 2026-09-24: still
  // reviewing the plan) — the page itself stays live at this URL, just
  // unreachable by clicking around the site. Keep this off until the
  // owner says otherwise.
  robots: { index: false, follow: true },
};

const FAQS = [
  { q: "Is it really free to list?", a: "Yes. Every project stays free to list, permanently, with unlimited projects. A paid package adds reach (better search placement, homepage rotation, analytics), not a base listing fee." },
  { q: "What does a package actually change?", a: "It decides how many of your projects are featured and where they show up: search ranking, the homepage, map pins, and what buyers see on a project page. The table above lists every difference." },
  { q: "Can I swap which projects are featured?", a: "Yes. Replace a featured project whenever you like until your package end date. Swapping doesn't change the end date." },
  { q: "What happens when my package ends?", a: "Your projects return to free listings until you renew. Nothing is removed." },
  { q: "Can I pay monthly or yearly?", a: "Both. Each paid package shows its monthly price and an annual option." },
  { q: "Can I buy a package today?", a: "Paid packages are coming soon. Use the early-access button on a package and we'll contact you as soon as payments open." },
  { q: "What is the founding developer discount?", a: "A discount for the first founding developers, locked in for as long as you stay subscribed. The banner above shows how many spots are left, counted from real accounts." },
] as const;

// Regenerate at most once a minute so the founding-spots count below
// doesn't go stale for long once a real subscription activates.
export const revalidate = 60;

// Real, honestly-counted remaining slots (owner, 2026-09-25) — never a
// fabricated countdown. Reads Payload directly (is_founding_developer
// isn't synced to Supabase — it's an internal billing flag, not something
// the public developers table needs). Fails soft: if Payload can't be
// reached, the banner just doesn't render rather than breaking the page.
async function getFoundingSpotsRemaining(): Promise<number | null> {
  try {
    const { getPayload } = await import("payload");
    const payloadConfig = (await import("../../../../payload.config")).default;
    const payload = await getPayload({ config: payloadConfig });
    const { totalDocs } = await payload.count({ collection: "developers", where: { is_founding_developer: { equals: true } }, overrideAccess: true });
    return Math.max(0, FOUNDING_DEVELOPER_CAP - totalDocs);
  } catch {
    return null;
  }
}

export default async function PricingPage() {
  const foundingSpotsRemaining = await getFoundingSpotsRemaining();
  const foundingDiscountPercent = Math.round(FOUNDING_DEVELOPER_DISCOUNT * 100);

  return (
    <div className="fdv-page pricing-page">
      <ScrollReveal />

      {/* Owner, 2026-10-01: "redesign this page ... take inspiration from web-design, for-developers" —
          same split hero + contained boxes (docs/design.md "Page section style: contained boxes"). */}
      <section className="fdv-hero fdv-hero--split" aria-label="Pricing">
        <div className="fdv-hero-split-inner">
          <div className="fdv-hero-content">
            <h1 className="fdv-hero-headline">Simple pricing for developers.</h1>
            <p className="fdv-hero-sub">
              Listing your projects is always free. Choose a package, then pick which of your projects to feature.
              Swap them any time until your package ends.
            </p>
            <div className="fdv-hero-ctas">
              <Link href="/developers/register" className="fdv-cta-final-button">List for free</Link>
              <a href="#packages" className="fdv-cta-secondary fdv-hero-explore-link">Compare packages</a>
            </div>
            <p className="fdv-hero-fineprint">Always free to list.</p>
          </div>

          <div className="wdx-hero-checklist">
            <p className="wdx-hero-checklist-title">Packages at a glance</p>
            <ul aria-label="Package prices">
              {PACKAGE_LIST.map((pkg) => (
                <li key={pkg.tier} className="pricing-glance-row">
                  <span>{pkg.name}</span>
                  <span>{pkg.tier === "free" ? "Free" : `${formatPackagePriceAmount(pkg)} / month`}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="fdv-box fdv-box--cream pricing-box-packages" id="packages" aria-label="Packages">
        <div className="wdx-section-head" data-reveal>
          <h2>Choose a package.</h2>
          <p>Every package includes a free, verified listing. Paid packages add placement and analytics.</p>
        </div>
        {/* "Founding developer" discount (owner, 2026-09-25) — only shown while real slots remain;
            never invents a number if the count couldn't be read. */}
        {foundingSpotsRemaining !== null && foundingSpotsRemaining > 0 ? (
          <p className="pricing-table-note-highlight pricing-founding-banner">
            🎉 {foundingSpotsRemaining} of {FOUNDING_DEVELOPER_CAP} founding developer spot{foundingSpotsRemaining === 1 ? "" : "s"} left — get {foundingDiscountPercent}% off, locked in for as long as you stay subscribed.
          </p>
        ) : foundingSpotsRemaining === 0 ? (
          <p className="pricing-table-note-highlight pricing-founding-banner">Founding developer pricing is now closed — all {FOUNDING_DEVELOPER_CAP} spots are taken.</p>
        ) : null}
        <div data-reveal>
          <PricingPlanCards showCta />
        </div>
        {/* The table's footnote says every plan includes verification; the badge below is specifically
            on FEATURED projects while a package is active (owner, 2026-09-24). */}
        <p className="pricing-page-note fd-badge-preview">
          <span className="listing-badge-pill badge-featured" title="Promoted listing">
            <Star className="h-3 w-3" aria-hidden="true" fill="currentColor" /> Featured
          </span>
          badge is added to your projects while your package is active. The free Verified Developer badge is separate and never depends on a package.
        </p>
      </section>

      <section className="fdv-box fdv-box--gray" id="how-it-works" aria-label="How it works">
        <div className="wdx-section-head" data-reveal>
          <h2>How it works.</h2>
          <p>When your package ends, your projects return to free listings until you renew.</p>
        </div>
        <div className="fdv-box-grid fdv-box-grid--4" data-reveal>
          <div className="fdv-box-card">
            <h3>Choose a package</h3>
            <p>Featured (1 spot), Featured Plus (3), Developer Pro (5) or Campaign (custom).</p>
          </div>
          <div className="fdv-box-card">
            <h3>Pick your projects</h3>
            <p>Choose which of your projects fill those spots. All your other projects stay listed for free.</p>
          </div>
          <div className="fdv-box-card">
            <h3>Swap any time</h3>
            <p>Replace a featured project whenever you like, until your package end date. Swapping doesn&apos;t change the end date.</p>
          </div>
          <div className="fdv-box-card">
            <h3>Need more spots?</h3>
            <p>Add extra spots or upgrade your package.</p>
          </div>
        </div>
        <p className="pricing-page-footer-note" data-reveal>
          Already listed? Choose your package and featured projects from the Placements tab in your developer dashboard. New here? <Link href="/developers/register"><strong>Register as a developer</strong></Link> to list your first project.
        </p>
      </section>

      {/* Placement inventory — where each tier actually shows up, with real samples (the same
          badge/chip/map-pin classes used live elsewhere on the site). Almost everything here is
          planned, not built — each card says so explicitly (owner, 2026-09-24). */}
      <section className="fdv-box fdv-box--sage pricing-box-placements" id="placements" aria-label="Where you'll be seen">
        <div className="wdx-section-head" data-reveal>
          <h2>Exactly where a paid plan puts your project.</h2>
          <p>Real samples of each placement, and which plan unlocks it.</p>
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

      <section className="fdv-box fdv-box--lilac" id="faq" aria-label="Questions">
        <div className="wdx-section-head" data-reveal>
          <h2>What developers ask us.</h2>
          <p>The questions that come up most before someone picks a package.</p>
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

      <PricingQuickjump />
    </div>
  );
}
