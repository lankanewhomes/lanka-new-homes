"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { CONTACT, FOUNDING_PARTNER, TERM_DISCOUNTS, TIERS, TIER_ORDER, priceWithDiscount, type FeaturedTier } from "@/lib/featured/config";

// The package cards on /advertise with a "how long" switch (1, 3, 6, 12 months) and a Founding Partner switch.
// Every number comes from src/lib/featured/config.ts through priceWithDiscount, so the cards can never disagree with the dashboard.
const rs = (amount: number) => `Rs. ${amount.toLocaleString("en-US")}`;
const TIERS_ASC: FeaturedTier[] = [...TIER_ORDER].reverse();
const TERMS = [{ months: 1, percent: 0 }, ...TERM_DISCOUNTS];

export function AdvertisePackages() {
  const [months, setMonths] = useState(1);
  const [founding, setFounding] = useState(false);

  return (
    <>
      <div className="adv-switches">
        <div className="adv-term-switch" role="group" aria-label="How many months">
          {TERMS.map((term) => (
            <button key={term.months} type="button" className={term.months === months ? "active" : undefined} aria-pressed={term.months === months} onClick={() => setMonths(term.months)}>
              <span>{term.months} {term.months === 1 ? "month" : "months"}</span>
              <small>{term.percent ? `${term.percent}% off` : "Standard"}</small>
            </button>
          ))}
        </div>
        <label className="adv-founding-switch">
          <input type="checkbox" checked={founding} onChange={(event) => setFounding(event.target.checked)} />
          <span>{FOUNDING_PARTNER.label}: {FOUNDING_PARTNER.percent}% off your first {FOUNDING_PARTNER.months} months</span>
        </label>
      </div>

      <div className="fdv-box-grid fdv-box-grid--3 adv-tiers">
        {TIERS_ASC.map((tier) => {
          const info = TIERS[tier];
          const price = priceWithDiscount(info.priceLkrPerMonth, months, founding);
          const perMonth = Math.round(price.total / months);
          const popular = tier === "premium";
          return (
            <article key={tier} className={`fdv-box-card adv-tier${popular ? " adv-tier--popular" : ""}`}>
              <h3>{info.name}{popular ? <span className="adv-popular">Most popular</span> : null}</h3>
              <p className="adv-tagline">{info.tagline}</p>
              <p className="adv-price">
                <span>{rs(perMonth)}</span> / month
                {price.saved > 0 ? <s>{rs(info.priceLkrPerMonth)}</s> : null}
              </p>
              <p className="adv-total">
                {months === 1 && price.saved === 0 ? "Billed monthly" : `${rs(price.total)} for ${months} ${months === 1 ? "month" : "months"}`}
                {price.saved > 0 ? <em>You save {rs(price.saved)}</em> : null}
              </p>
              <p className="adv-slots">{info.projectSlots} {info.projectSlots === 1 ? "project" : "projects"} promoted at a time</p>
              <ul>
                {info.includes.map((line) => <li key={line}><Check size={16} strokeWidth={1.5} aria-hidden="true" /><span>{line}</span></li>)}
              </ul>
              <a
                className={popular ? "fdv-cta-primary adv-choose" : "fdv-cta-secondary adv-choose adv-choose--outline"}
                href={`${CONTACT.whatsappHref}?text=${encodeURIComponent(`Hi, I'd like the ${info.name} package on LankaNewHomes for ${months} ${months === 1 ? "month" : "months"}${founding ? " (Founding Partner offer)" : ""}.`)}`}
              >
                Choose {info.name}
              </a>
            </article>
          );
        })}
      </div>
      <p className="adv-note">
        {founding
          ? `The ${FOUNDING_PARTNER.label} offer and the discount for paying several months do not add up: you get whichever saves you more.`
          : "Prices are per company, in Sri Lankan rupees. Pay for 3, 6 or 12 months at once and the price drops."}
      </p>
    </>
  );
}
