import type { Metadata } from "next";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { PackageCards } from "@/components/marketplace/package-cards";

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

        <PackageCards showCta />

        <p className="pricing-page-note fd-badge-preview">
          <span className="listing-badge-pill badge-verified" title="Verified by LankaNewHomes">
            <ShieldCheck className="h-3 w-3" aria-hidden="true" /> Verified
          </span>
          appears automatically once a project has an active Featured or Premium package.
        </p>

        <p className="pricing-page-footer-note">
          Already listed a project? Upgrade its package any time from the Package tab on that project&apos;s edit page in <Link href="/cms">/cms</Link>. New here? <Link href="/developers/register">Register as a developer</Link> to list your first project.
        </p>
      </div>
    </div>
  );
}
