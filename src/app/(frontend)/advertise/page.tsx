import type { Metadata } from "next";
import Link from "next/link";
import { ADD_ONS, CONTACT, FOUNDING_PARTNER, LEAD_NOTE, LEAD_PRICE_USD, LEAD_TYPES, TERM_DISCOUNTS, TIERS, TIER_ORDER, priceWithDiscount, type AddOnType, type FeaturedTier } from "@/lib/featured/config";
import { FEATURED_DEMO } from "@/lib/featured/demo";
import "@/components/featured/featured.css";
import { FEATURED_ENABLED } from "@/lib/featured/demo";
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
const ADD_ON_ORDER: AddOnType[] = ["hero-slide", "announcement-bar", "developer-of-month", "new-launch", "city-tile", "sponsored-article", "social-post", "reel", "newsletter"];

function Cta({ subject }: { subject: string }) {
  return (
    <div className="adv-cta">
      <a className="adv-btn adv-btn--wa" href={`${CONTACT.whatsappHref}?text=${encodeURIComponent(`Hi, I'd like to talk about the ${subject} on LankaNewHomes.`)}`}>WhatsApp {CONTACT.whatsappDisplay}</a>
      <a className="adv-btn" href={`mailto:${CONTACT.email}?subject=${encodeURIComponent(`LankaNewHomes: ${subject}`)}`}>{CONTACT.email}</a>
    </div>
  );
}

export default function AdvertisePage() {
  if (!FEATURED_ENABLED) notFound();
  return (
    <div className="adv">
      <header className="adv-hero">
        <p className="adv-eyebrow">For developers{FEATURED_DEMO ? <span className="fp-demo-flag">PREVIEW</span> : null}</p>
        <h1>Put your project in front of buyers who are looking right now.</h1>
        <p>Pay a monthly package for the placements that suit you, add one-off boosts when you launch, and pay per lead for the enquiries we send you. Your package belongs to your company: pick which of your projects fill the slots, and swap them any time until the end date.</p>
        <Cta subject="advertising packages" />
      </header>

      <section aria-label="Packages">
        <h2>Packages</h2>
        <div className="adv-tiers">
          {TIERS_ASC.map((tier) => {
            const info = TIERS[tier];
            return (
              <article key={tier} className={`adv-tier adv-tier--${tier}`}>
                {tier === "premium" ? <span className="adv-ribbon">Most popular</span> : null}
                <h3>{info.name}</h3>
                <p className="adv-price"><strong>{rs(info.priceLkrPerMonth)}</strong> / month</p>
                <p className="adv-slots">{info.projectSlots} {info.projectSlots === 1 ? "project" : "projects"}</p>
                <p className="adv-tagline">{info.tagline}</p>
                <ul>{info.includes.map((line) => <li key={line}>{line}</li>)}</ul>
                <Cta subject={`${info.name} package`} />
              </article>
            );
          })}
        </div>
        <p className="adv-note">Placements only show projects that match the page (same location and type). Order is Elite, then Premium, then Featured, and projects rotate fairly inside each tier. At most 3 projects are pinned on any page, and the normal results keep their order. Featured project cards are labelled “Featured”; banners and articles are labelled “Sponsored”.</p>
      </section>

      <section aria-label="Discounts">
        <h2>Pay for more months, pay less</h2>
        <div className="adv-table-wrap">
          <table className="adv-table">
            <thead><tr><th>Package</th><th>1 month</th>{TERM_DISCOUNTS.map((term) => <th key={term.months}>{term.months} months<small>−{term.percent}%</small></th>)}</tr></thead>
            <tbody>
              {TIERS_ASC.map((tier) => (
                <tr key={tier}>
                  <th scope="row">{TIERS[tier].name}</th>
                  <td>{rs(TIERS[tier].priceLkrPerMonth)}</td>
                  {TERM_DISCOUNTS.map((term) => <td key={term.months}>{rs(priceWithDiscount(TIERS[tier].priceLkrPerMonth, term.months).total)}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="adv-note">Totals shown are for the whole term, paid up front.</p>
        <div className="adv-founding">
          <h3>{FOUNDING_PARTNER.label} offer: {FOUNDING_PARTNER.percent}% off your first {FOUNDING_PARTNER.months} months</h3>
          <p>Be one of our first developers and your first {FOUNDING_PARTNER.months} months are half price. Example: Premium for {FOUNDING_PARTNER.months} months costs {rs(priceWithDiscount(TIERS.premium.priceLkrPerMonth, FOUNDING_PARTNER.months, true).total)} instead of {rs(TIERS.premium.priceLkrPerMonth * FOUNDING_PARTNER.months)}. The offer does not stack with the term discounts above: you get whichever saves you more.</p>
          <Cta subject="Founding Partner offer" />
        </div>
      </section>

      <section aria-label="Add-ons">
        <h2>Add-ons</h2>
        <p className="adv-note">Book on their own or on top of any package.</p>
        <div className="adv-addons">
          {ADD_ON_ORDER.map((type) => {
            const info = ADD_ONS[type];
            return (
              <article key={type} className="adv-addon">
                <h3>{info.name}</h3>
                <p className="adv-price"><strong>{rs(info.priceLkr)}</strong> {info.unit}</p>
                <p>{info.description}</p>
                {info.max ? <p className="adv-max">{info.max}</p> : null}
              </article>
            );
          })}
        </div>
      </section>

      <section aria-label="Pay per lead">
        <h2>Pay per lead</h2>
        <div className="adv-lead">
          <p className="adv-price"><strong>US${LEAD_PRICE_USD}</strong> per lead</p>
          <p>A lead is any of: {LEAD_TYPES.join(", ")}. {LEAD_NOTE} Every lead is logged with the project and the placement it came from, so your monthly report shows exactly where enquiries came from: views, clicks and leads by placement.</p>
        </div>
      </section>

      <section aria-label="Contact" className="adv-final">
        <h2>Ready to start?</h2>
        <p>Message us and we will set up your package, collect your creative and pick your projects with you.</p>
        <Cta subject="getting started" />
        <p className="adv-note"><Link href="/for-developers">List your project for free</Link> · This page is not public yet.</p>
      </section>
    </div>
  );
}
