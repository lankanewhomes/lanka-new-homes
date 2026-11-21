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
      <a className="fdv-cta-primary" href={`${CONTACT.whatsappHref}?text=${encodeURIComponent(`Hi, I'd like to talk about the ${subject} on LankaNewHomes.`)}`}>WhatsApp {CONTACT.whatsappDisplay}</a>
      <a className="fdv-cta-secondary" href={`mailto:${CONTACT.email}?subject=${encodeURIComponent(`LankaNewHomes: ${subject}`)}`}>{CONTACT.email}</a>
    </div>
  );
}

// Same page system as /for-developers, /about and the pricing page (docs/design.md "Page section style: contained boxes"):
// dark split hero, then left-aligned contained boxes, each with its own soft background. No eyebrow labels, no bold, square corners.
export default function AdvertisePage() {
  if (!FEATURED_ENABLED) notFound();
  return (
    <div className="fdv-page adv-page">
      <section className="fdv-hero fdv-hero--split" aria-label="Advertise your project">
        <div className="fdv-hero-split-inner">
          <div className="fdv-hero-content">
            <h1 className="fdv-hero-headline">Put your project in front of buyers who are looking right now.</h1>
            <p className="fdv-hero-sub">Pay a monthly package for the placements that suit you, add one-off boosts when you launch, and pay per lead for the enquiries we send you. Your package belongs to your company: pick which of your projects fill the slots, and swap them any time until the end date.</p>
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
          <p>Monthly packages. Pick which of your projects fill the slots.</p>
        </div>
        <div className="fdv-box-grid fdv-box-grid--3">
          {TIERS_ASC.map((tier) => {
            const info = TIERS[tier];
            return (
              <article key={tier} className={`fdv-box-card adv-tier${tier === "premium" ? " adv-tier--popular" : ""}`}>
                <h3>{info.name}{tier === "premium" ? <span className="adv-popular">Most popular</span> : null}</h3>
                <p className="adv-price"><span>{rs(info.priceLkrPerMonth)}</span> / month</p>
                <p className="adv-slots">{info.projectSlots} {info.projectSlots === 1 ? "project" : "projects"}</p>
                <p>{info.tagline}</p>
                <ul>{info.includes.map((line) => <li key={line}>{line}</li>)}</ul>
                <Cta subject={`${info.name} package`} />
              </article>
            );
          })}
        </div>
        <p className="adv-note">Placements only show projects that match the page (same location and type). Order is Elite, then Premium, then Featured, and projects rotate fairly inside each tier. At most 3 projects are pinned on any page, and the normal results keep their order. Featured project cards are labelled “Featured”; banners and articles are labelled “Sponsored”.</p>
      </section>

      <section className="fdv-box fdv-box--gray" id="discounts" aria-label="Discounts">
        <div className="wdx-section-head">
          <h2>Pay for more months, pay less.</h2>
          <p>Totals shown are for the whole term, paid up front.</p>
        </div>
        <div className="fdv-box-grid fdv-box-grid--4 adv-terms">
          {[{ months: 1, percent: 0 }, ...TERM_DISCOUNTS].map((term) => (
            <article key={term.months} className={`fdv-box-card adv-term${term.months === 12 ? " adv-term--best" : ""}`}>
              <h3>{term.months} {term.months === 1 ? "month" : "months"}</h3>
              <p className="adv-term-off">{term.percent ? `${term.percent}% off` : "Standard price"}{term.months === 12 ? <span className="adv-popular">Best value</span> : null}</p>
              <dl>
                {TIERS_ASC.map((tier) => {
                  const price = priceWithDiscount(TIERS[tier].priceLkrPerMonth, term.months);
                  return (
                    <div key={tier} className="adv-term-row">
                      <dt>{TIERS[tier].name}</dt>
                      <dd>
                        <span className="adv-term-total">{rs(price.total)}</span>
                        <span className="adv-term-note">{price.saved > 0 ? `${rs(Math.round(price.total / term.months))} / month · save ${rs(price.saved)}` : "per month"}</span>
                      </dd>
                    </div>
                  );
                })}
              </dl>
            </article>
          ))}
        </div>
        <div className="fdv-box-card adv-founding">
          <h3>{FOUNDING_PARTNER.label} offer: {FOUNDING_PARTNER.percent}% off your first {FOUNDING_PARTNER.months} months</h3>
          <p>Be one of our first developers and your first {FOUNDING_PARTNER.months} months are half price. Example: Premium for {FOUNDING_PARTNER.months} months costs {rs(priceWithDiscount(TIERS.premium.priceLkrPerMonth, FOUNDING_PARTNER.months, true).total)} instead of {rs(TIERS.premium.priceLkrPerMonth * FOUNDING_PARTNER.months)}. The offer does not stack with the term discounts above: you get whichever saves you more.</p>
          <Cta subject="Founding Partner offer" />
        </div>
      </section>

      <section className="fdv-box fdv-box--sage" id="add-ons" aria-label="Add-ons">
        <div className="wdx-section-head">
          <h2>Add-ons.</h2>
          <p>Book on their own or on top of any package.</p>
        </div>
        <div className="fdv-box-grid fdv-box-grid--3">
          {ADD_ON_ORDER.map((type) => {
            const info = ADD_ONS[type];
            return (
              <article key={type} className="fdv-box-card adv-addon">
                <h3>{info.name}</h3>
                <p className="adv-price"><span>{rs(info.priceLkr)}</span> {info.unit}</p>
                <p>{info.description}</p>
                {info.max ? <p className="adv-max">{info.max}</p> : null}
              </article>
            );
          })}
        </div>
      </section>

      <section className="fdv-box fdv-box--lilac" id="leads" aria-label="Pay per lead">
        <div className="wdx-section-head">
          <h2>Pay per lead.</h2>
          <p>Only pay for real enquiries we send you.</p>
        </div>
        <div className="fdv-box-card adv-lead">
          <p className="adv-price"><span>US${LEAD_PRICE_USD}</span> per lead</p>
          <p>A lead is any of: {LEAD_TYPES.join(", ")}. {LEAD_NOTE} Every lead is logged with the project and the placement it came from, so your monthly report shows exactly where enquiries came from: views, clicks and leads by placement.</p>
        </div>
      </section>

      <section className="fdv-box fdv-box--cream" id="contact" aria-label="Contact">
        <div className="wdx-section-head">
          <h2>Ready to start?</h2>
          <p>Message us and we will set up your package, collect your creative and pick your projects with you.</p>
        </div>
        <Cta subject="getting started" />
        <p className="adv-note"><Link href="/for-developers">List your project for free</Link></p>
      </section>
    </div>
  );
}
