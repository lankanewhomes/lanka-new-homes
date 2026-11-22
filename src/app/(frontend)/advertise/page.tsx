import type { Metadata } from "next";
import Link from "next/link";
import { Check } from "lucide-react";
import { ADD_ONS, CONTACT, FOUNDING_PARTNER, LEAD_NOTE, LEAD_PRICE_USD, LEAD_TYPES, MAX_PINNED_PER_PAGE, PLACEMENT_LABEL, PLACEMENT_MIN_TIER, TIERS, TIER_ORDER, TIER_RANK, type AddOnType, type FeaturedTier, type Placement } from "@/lib/featured/config";
import { AdvertisePackages } from "@/components/featured/advertise-packages";
import { FEATURED_DEMO } from "@/lib/featured/demo";
import "@/components/featured/featured.css";
import { ADVERTISE_PUBLIC } from "@/lib/featured/demo";
import { notFound } from "next/navigation";

// Developer pricing page for the paid Featured placements. Not in the nav and not indexed for now (owner). All prices come from
// src/lib/featured/config.ts: edit them there.
export const metadata: Metadata = {
  title: "Advertise your project",
  description: "Featured, Premium and Elite placements for property developers on LankaNewHomes.",
  robots: { index: false, follow: false },
  alternates: { canonical: "/advertise" },
};

const rs = (amount: number) => `Rs. ${amount.toLocaleString("en-US")}`;
const TIERS_ASC: FeaturedTier[] = [...TIER_ORDER].reverse();

// Rows of the compare table: every placement a package unlocks (from PLACEMENT_MIN_TIER), then the perks that are not placements.
const COMPARE_LABEL: Partial<Record<Placement, string>> = { "directory-developers": "Developers directory", "directory-construction": "Construction companies directory", "results-banner": "Location and category page banner" };
const COMPARE_ROWS = ([
  { label: "Featured badge and highlighted card", min: "featured" },
  ...(Object.entries(PLACEMENT_MIN_TIER) as [Placement, FeaturedTier][])
    .sort((a, b) => TIER_RANK[a[1]] - TIER_RANK[b[1]])
    .map(([placement, min]) => ({ label: COMPARE_LABEL[placement] ?? PLACEMENT_LABEL[placement], min })),
  { label: "Monthly performance report", min: "featured" },
  { label: "Developer logo and video on your cards", min: "premium" },
  { label: "First in every rotation", min: "elite" },
  { label: "1 week on the homepage hero every month", min: "elite" },
  { label: "Competitor-free project pages", min: "elite" },
  { label: "1 newsletter feature and 2 social posts a month", min: "elite" },
] as { label: string; min: FeaturedTier }[]).sort((a, b) => TIER_RANK[a.min] - TIER_RANK[b.min]);

const ADD_ON_GROUPS: { title: string; items: AddOnType[] }[] = [
  { title: "On the site", items: ["hero-slide", "announcement-bar", "developer-of-month", "new-launch", "city-tile"] },
  { title: "Content and social", items: ["sponsored-article", "social-post", "reel", "newsletter"] },
];

const STEPS = [
  { title: "Message us", text: "Tell us which package or add-on you want and for how long. We confirm the price and the dates." },
  { title: "Pick your projects", text: "Choose which of your projects fill the slots. Send any artwork a banner or hero slide needs." },
  { title: "Go live and track", text: "Your placements start on the agreed date. Swap projects any time, and get a report every month." },
];

const FAQS = [
  { question: "Can I change which projects are promoted?", answer: "Yes. The package belongs to your company, not to one project. Swap the projects in your slots as often as you like until the end date." },
  { question: "Where exactly will my project show?", answer: "Only on pages that match it: the same location and the same type of home. A Colombo apartment project is not shown on a Kandy villa page." },
  { question: "How are projects ordered when several developers pay?", answer: `Elite first, then Premium, then Featured. Inside each package projects take turns fairly. No page pins more than ${MAX_PINNED_PER_PAGE} projects, and the normal search results keep their own order.` },
  { question: "Will buyers know it is paid?", answer: "Yes. Paid project cards are labelled Featured, and banners and articles are labelled Sponsored." },
  { question: `Can I combine the ${FOUNDING_PARTNER.label} offer with a longer-term discount?`, answer: "No. They do not add up. You get whichever of the two saves you more." },
  { question: "What happens if a lead is not real?", answer: `${LEAD_NOTE} A lead is one of: ${LEAD_TYPES.join(", ")}.` },
];

// Same page system as /for-developers, /about and the pricing page (docs/design.md "Page section style: contained boxes"):
// dark split hero, then left-aligned contained boxes, each with its own soft background. No eyebrow labels, no bold, square corners.
export default function AdvertisePage() {
  if (!ADVERTISE_PUBLIC) notFound();
  return (
    <div className="fdv-page adv-page">
      <section className="fdv-hero fdv-hero--split" aria-label="Advertise your project">
        <div className="fdv-hero-split-inner">
          <div className="fdv-hero-content">
            <h1 className="fdv-hero-headline">Put your project in front of buyers who are looking right now.</h1>
            <p className="fdv-hero-sub">Monthly packages, one-off boosts for a launch, or pay only for the leads we send. Your package belongs to your company, so you choose which projects to promote and can swap them any time.</p>
            <div className="fdv-hero-ctas">
              <a className="fdv-cta-final-button" href={`${CONTACT.whatsappHref}?text=${encodeURIComponent("Hi, I'd like to talk about advertising packages on LankaNewHomes.")}`}>WhatsApp {CONTACT.whatsappDisplay}</a>
              <a href="#packages" className="fdv-cta-secondary fdv-hero-explore-link">Compare packages</a>
            </div>
            <p className="fdv-hero-fineprint">{FEATURED_DEMO ? "Preview. This page is not public yet." : CONTACT.email}</p>
          </div>

          <div className="wdx-hero-checklist">
            <p className="wdx-hero-checklist-title">Packages at a glance</p>
            <ul aria-label="Package prices">
              {TIERS_ASC.map((tier) => (
                <li key={tier} className="pricing-glance-row">
                  <span>{TIERS[tier].name}</span>
                  <span>{rs(TIERS[tier].priceLkrPerMonth)} / month</span>
                </li>
              ))}
              <li className="pricing-glance-row"><span>Pay per lead</span><span>US${LEAD_PRICE_USD} per lead</span></li>
            </ul>
          </div>
        </div>
      </section>

      <section className="fdv-box fdv-box--cream" id="packages" aria-label="Packages">
        <div className="wdx-section-head">
          <h2>Choose a package.</h2>
          <p>One package covers your whole company. Pick how long you want to run, then pick which of your projects fill the slots.</p>
        </div>
        <AdvertisePackages />
      </section>

      <section className="fdv-box fdv-box--gray" id="compare" aria-label="Compare packages">
        <div className="wdx-section-head">
          <h2>Where your project appears.</h2>
          <p>Every placement on the site, and the package that unlocks it.</p>
        </div>
        <div className="fdv-box-card adv-compare-card">
          <table className="adv-compare">
            <thead>
              <tr>
                <th scope="col">Placement</th>
                {TIERS_ASC.map((tier) => <th key={tier} scope="col">{TIERS[tier].name}</th>)}
              </tr>
            </thead>
            <tbody>
              <tr>
                <th scope="row">Projects promoted at a time</th>
                {TIERS_ASC.map((tier) => <td key={tier}>{TIERS[tier].projectSlots}</td>)}
              </tr>
              {COMPARE_ROWS.map((row) => (
                <tr key={row.label}>
                  <th scope="row">{row.label}</th>
                  {TIERS_ASC.map((tier) => (
                    <td key={tier}>
                      {TIER_RANK[tier] >= TIER_RANK[row.min]
                        ? <><Check size={18} strokeWidth={1.5} aria-hidden="true" /><span className="adv-sr">Included</span></>
                        : <><span aria-hidden="true" className="adv-dash">-</span><span className="adv-sr">Not included</span></>}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="adv-note">A placement only shows projects that match the page: same location and same type. Elite comes first, then Premium, then Featured, and projects take turns fairly inside each package. No page pins more than {MAX_PINNED_PER_PAGE} projects, and the normal results keep their order.</p>
      </section>

      <section className="fdv-box fdv-box--sage" id="add-ons" aria-label="Add-ons">
        <div className="wdx-section-head">
          <h2>Add-ons.</h2>
          <p>One-off boosts. Book them on their own or on top of any package.</p>
        </div>
        <div className="fdv-box-grid fdv-box-grid--2 adv-addon-groups">
          {ADD_ON_GROUPS.map((group) => (
            <article key={group.title} className="fdv-box-card adv-addon-group">
              <h3>{group.title}</h3>
              <ul>
                {group.items.map((type) => {
                  const info = ADD_ONS[type];
                  return (
                    <li key={type}>
                      <div>
                        <p className="adv-addon-name">{info.name}</p>
                        <p className="adv-addon-text">{info.description}{info.max ? ` ${info.max}.` : ""}</p>
                      </div>
                      <p className="adv-addon-price"><span>{rs(info.priceLkr)}</span>{info.unit}</p>
                    </li>
                  );
                })}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section className="fdv-box fdv-box--lilac" id="leads" aria-label="Pay per lead">
        <div className="wdx-section-head">
          <h2>Pay per lead.</h2>
          <p>No package needed. Pay only for real enquiries we send you.</p>
        </div>
        <div className="fdv-box-card adv-lead">
          <div className="adv-lead-price">
            <p className="adv-price"><span>US${LEAD_PRICE_USD}</span> per lead</p>
            <p>{LEAD_NOTE}</p>
          </div>
          <div className="adv-lead-types">
            <p>What counts as a lead</p>
            <ul>{LEAD_TYPES.map((type) => <li key={type}><Check size={16} strokeWidth={1.5} aria-hidden="true" /><span>{type}</span></li>)}</ul>
          </div>
          <p className="adv-lead-report">Every lead is logged with the project and the placement it came from. Your monthly report shows views, clicks and leads for each placement.</p>
        </div>
      </section>

      <section className="fdv-box fdv-box--gray" id="how-it-works" aria-label="How it works">
        <div className="wdx-section-head">
          <h2>How it works.</h2>
          <p>From first message to live placement.</p>
        </div>
        <div className="fdv-box-grid fdv-box-grid--3">
          {STEPS.map((step, index) => (
            <article key={step.title} className="fdv-box-card">
              <p className="fdv-box-card-num">{index + 1}</p>
              <h3>{step.title}</h3>
              <p>{step.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="fdv-box fdv-box--cream" id="faq" aria-label="Frequently asked questions">
        <div className="wdx-section-head">
          <h2>Questions developers ask.</h2>
          <p>Short answers before you message us.</p>
        </div>
        <div className="guide-detail-faqs">
          {FAQS.map((faq) => (
            <details key={faq.question} className="fdv-box-card guide-detail-faq">
              <summary>{faq.question}</summary>
              <p>{faq.answer}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="fdv-box fdv-box--dark adv-final" id="contact" aria-label="Contact">
        <div className="wdx-section-head">
          <h2>Ready to start?</h2>
          <p>Message us and we will set up your package, collect your artwork and pick your projects with you.</p>
        </div>
        <div className="adv-cta">
          <a className="fdv-cta-final-button" href={`${CONTACT.whatsappHref}?text=${encodeURIComponent("Hi, I'd like to get started with advertising on LankaNewHomes.")}`}>WhatsApp {CONTACT.whatsappDisplay}</a>
          <a className="fdv-cta-final-button" href={`mailto:${CONTACT.email}?subject=${encodeURIComponent("LankaNewHomes: getting started")}`}>{CONTACT.email}</a>
        </div>
        <p className="adv-final-free">Not ready to pay? <Link href="/for-developers">List your project for free</Link>.</p>
      </section>
    </div>
  );
}
