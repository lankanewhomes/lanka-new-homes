import type { Metadata } from "next";
import Link from "next/link";
import { Check, ShieldCheck } from "lucide-react";
import { PACKAGE_LIST, formatPackagePrice } from "@/lib/packages";

export const metadata: Metadata = {
  title: "Pricing",
  description: "Listing a project on LankaNewHomes is always free. Upgrade any project to Featured or Premium for more search placement and homepage exposure.",
  alternates: { canonical: "/pricing" },
};

export default function PricingPage() {
  return (
    <div className="pricing-page">
      <div className="pricing-page-shell">
        <div className="pricing-page-head">
          <h1>Simple, per-project pricing</h1>
          <p className="pricing-page-lede">
            Listing a project is always free. Upgrade any individual project to Featured or Premium whenever you want more reach — no bundles, no long-term contracts.
          </p>
        </div>

        <div className="pricing-page-grid">
          {PACKAGE_LIST.map((pkg) => (
            <div className={`pricing-page-card${pkg.tier === "premium" ? " pricing-page-card-highlight" : ""}`} key={pkg.tier}>
              {pkg.tier === "premium" ? <span className="pricing-page-card-tag">Most visibility</span> : null}
              <h2>{pkg.name}</h2>
              <p className="pricing-page-card-price">{formatPackagePrice(pkg)}</p>
              <ul>
                {pkg.features.map((feature) => (
                  <li key={feature}>
                    <Check className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <Link href="/developers/register" className={`pricing-page-card-cta${pkg.tier === "premium" ? " pricing-page-card-cta-solid" : ""}`}>
                {pkg.tier === "free" ? "List for free" : `Get ${pkg.name}`}
              </Link>
            </div>
          ))}
        </div>

        <p className="pricing-page-note">
          <ShieldCheck className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
          A Verified badge appears automatically once a project has an active Featured or Premium package.
        </p>

        <p className="pricing-page-footer-note">
          Already listed a project? Upgrade its package any time from the Package tab on that project&apos;s edit page in <Link href="/cms">/cms</Link>. New here? <Link href="/developers/register">Register as a developer</Link> to list your first project.
        </p>
      </div>
    </div>
  );
}
