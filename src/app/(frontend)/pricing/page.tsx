import type { Metadata } from "next";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { PricingComparisonTable } from "@/components/marketplace/pricing-comparison-table";

export const metadata: Metadata = {
  title: "Pricing",
  description: "Listing a project on LankaNewHomes is always free. Upgrade any project to Featured, Featured Plus, Developer Pro, or Campaign for more search placement and homepage exposure.",
  alternates: { canonical: "/pricing" },
  // Not linked from anywhere on the site yet (owner, 2026-09-24: still
  // reviewing the plan) — the page itself stays live at this URL, just
  // unreachable by clicking around the site. Keep this off until the
  // owner says otherwise.
  robots: { index: false, follow: true },
};

export default function PricingPage() {
  return (
    <div className="pricing-page">
      <div className="pricing-page-shell">
        <div className="pricing-page-head">
          <h1>Simple, per-project pricing</h1>
          <p className="pricing-page-lede">
            Listing a project is always free. Upgrade any individual project for more reach whenever you want it — no bundles, no long-term contracts.
          </p>
        </div>

        <PricingComparisonTable showCta />

        <p className="pricing-page-note fd-badge-preview">
          <span className="listing-badge-pill badge-verified" title="Verified by LankaNewHomes">
            <ShieldCheck className="h-3 w-3" aria-hidden="true" /> Verified
          </span>
          appears automatically once a project has an active paid package.
        </p>

        <p className="pricing-page-footer-note">
          Already listed a project? Upgrade its package any time from the Package tab on that project&apos;s edit page in <Link href="/cms">/cms</Link>. New here? <Link href="/developers/register">Register as a developer</Link> to list your first project.
        </p>
      </div>
    </div>
  );
}
