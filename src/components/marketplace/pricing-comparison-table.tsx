import Link from "next/link";
import { Check } from "lucide-react";
import {
  PACKAGE_LIST,
  PACKAGE_FEATURE_ROWS,
  PACKAGE_ALWAYS_INCLUDED,
  PACKAGE_ANNUAL_BILLING_NOTE,
  formatPackagePrice,
  formatAnnualPrice,
  type PackageFeatureValue,
} from "@/lib/packages";

// Public /pricing and /for-developers Pricing-section table — replaced the
// old 3-card PackageCards layout once the plan grew to 5 tiers with a real
// feature matrix (owner, 2026-09-24). Visual language deliberately reused
// from the earlier boxy card design (black outline, orange top bar, cream
// header, orange tick circles) rather than the rounded/shadow redesign the
// owner rejected — "put it back how it was". Styled in globals.css
// (.pricing-table*). Only `free` links anywhere (`showCta`); every paid
// tier is Coming Soon (no payment gateway yet) — see packages.ts.
function FeatureCell({ value }: { value: PackageFeatureValue }) {
  if (value === true) {
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
  return <span className="pricing-table-value">{value}</span>;
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
                  <span className="pricing-table-tier-price">{formatPackagePrice(pkg)}</span>
                  {annualPrice && <span className="pricing-table-tier-annual">or {annualPrice}/yr</span>}
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
          {PACKAGE_FEATURE_ROWS.map((row) => (
            <tr key={row.key}>
              <th scope="row">{row.label}</th>
              {row.values.map((value, i) => (
                <td key={PACKAGE_LIST[i].tier}>
                  <FeatureCell value={value} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <p className="pricing-table-note">
        {PACKAGE_ALWAYS_INCLUDED} {PACKAGE_ANNUAL_BILLING_NOTE}
      </p>
    </div>
  );
}
