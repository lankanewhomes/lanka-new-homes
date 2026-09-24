import Link from "next/link";
import { Check } from "lucide-react";
import {
  PACKAGE_LIST,
  PACKAGE_FEATURE_ROWS,
  PACKAGE_ALWAYS_INCLUDED,
  PACKAGE_ANNUAL_BILLING_NOTE,
  formatPackagePriceAmount,
  formatAnnualPrice,
  type PackageFeatureRow,
  type PackageFeatureValue,
} from "@/lib/packages";
import { FeatureInfoTooltip } from "./feature-info-tooltip";

// Public /pricing and /for-developers Pricing-section table — replaced the
// old 3-card PackageCards layout once the plan grew to 5 tiers with a real
// feature matrix (owner, 2026-09-24). Visual language deliberately reused
// from the earlier boxy card design (black outline, orange top bar, cream
// header, orange tick circles) rather than the rounded/shadow redesign the
// owner rejected — "put it back how it was". Styled in globals.css
// (.pricing-table*). Only `free` links anywhere (`showCta`); every paid
// tier is Coming Soon (no payment gateway yet) — see packages.ts.

// A `notYetBuilt` row gets an extra bullet appended wherever its tooltip is
// shown, instead of repeating that line inside packages.ts itself.
function tooltipBullets(row: PackageFeatureRow): string[] {
  return row.notYetBuilt ? [...row.tooltip, "Planned — not built yet."] : row.tooltip;
}

// "Priority slot"/"Fixed premium slot" (Homepage rotation row) get the same
// real-badge-preview treatment as Featured badge — reusing the site's own
// .badge-featured/.badge-premium colors so it reads as "the same kind of
// pill" as the actual homepage-exposure tiers, not a made-up label (owner,
// 2026-09-24: "do they same thing for Priority slot? Fixed premium slot?").
const HOMEPAGE_SLOT_BADGE_CLASS: Record<string, string> = {
  "Priority slot": "badge-featured",
  "Fixed premium slot": "badge-premium",
};

// Every distinct value cell gets its own "?" too, not just the row label —
// owner, 2026-09-24: "beside above free, top of featured, top etc... make
// each have a ?" — so hovering a specific cell (e.g. "Priority slot") explains
// it right there without having to look back at the row label.
function FeatureCell({ value, tooltip, showRealBadge }: { value: PackageFeatureValue; tooltip: string[]; showRealBadge?: boolean }) {
  if (value === true) {
    // "Featured badge" row: show the actual .badge-featured pill (same one
    // used on every project card site-wide) instead of a generic checkmark,
    // so a builder sees exactly what they'd get (owner, 2026-09-24).
    if (showRealBadge) {
      return <span className="badge-featured pricing-table-badge-preview">Featured</span>;
    }
    return (
      <span className="pricing-table-check" aria-label="Included">
        <Check strokeWidth={3} />
      </span>
    );
  }
  if (value === false) {
    return (
      <span className="pricing-table-dash" aria-hidden="true">
        —
      </span>
    );
  }
  const slotBadgeClass = HOMEPAGE_SLOT_BADGE_CLASS[value];
  return (
    <span className="pricing-table-value">
      {slotBadgeClass ? <span className={`${slotBadgeClass} pricing-table-badge-preview`}>{value}</span> : value}
      <FeatureInfoTooltip text={tooltip} />
    </span>
  );
}

export function PricingComparisonTable({ showCta = false }: { showCta?: boolean }) {
  return (
    <div className="pricing-table-wrap">
      <table className="pricing-table">
        <thead>
          <tr>
            <th scope="col" className="pricing-table-feature-head">
              <span className="sr-only">Feature</span>
            </th>
            {PACKAGE_LIST.map((pkg) => {
              const annualPrice = formatAnnualPrice(pkg);
              return (
                <th scope="col" key={pkg.tier} className={pkg.tier === "free" ? "pricing-table-free-col" : undefined}>
                  <span className="pricing-table-tier-name">{pkg.name}</span>
                  {/* Free's own price line would just repeat the tier name
                      ("FREE" / "Free") — the name plus the "List for free"
                      button already say it, so skip it there (owner report,
                      2026-09-24: "where is 2 free"). */}
                  {pkg.tier !== "free" && (
                    <span className="pricing-table-tier-price">
                      {formatPackagePriceAmount(pkg)}
                      <span className="pricing-table-tier-price-suffix">/month</span>
                    </span>
                  )}
                  {annualPrice && <span className="pricing-table-tier-annual">or {annualPrice}</span>}
                  {pkg.tier === "free" ? (
                    showCta ? (
                      <Link href="/developers/register" className="pricing-table-cta">
                        List for free
                      </Link>
                    ) : null
                  ) : (
                    <span className="pricing-table-soon">Coming soon</span>
                  )}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {PACKAGE_FEATURE_ROWS.map((row) => {
            const bullets = tooltipBullets(row);
            return (
              <tr key={row.key}>
                <th scope="row">
                  {row.label}
                  <FeatureInfoTooltip text={bullets} />
                </th>
                {row.values.map((value, i) => (
                  <td key={PACKAGE_LIST[i].tier}>
                    <FeatureCell value={value} tooltip={bullets} showRealBadge={row.key === "featured-badge"} />
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="pricing-table-note">
        {PACKAGE_ALWAYS_INCLUDED} <span className="pricing-table-note-highlight">{PACKAGE_ANNUAL_BILLING_NOTE}</span>
      </p>
    </div>
  );
}
