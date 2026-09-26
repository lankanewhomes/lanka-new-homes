import type { Metadata } from "next";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { PricingComparisonTable } from "@/components/marketplace/pricing-comparison-table";
import { FOUNDING_DEVELOPER_CAP, FOUNDING_DEVELOPER_DISCOUNT } from "@/lib/packages";

export const metadata: Metadata = {
  title: "Pricing",
  description: "Listing your projects on LankaNewHomes is always free. Choose a package, then pick which of your projects to feature.",
  alternates: { canonical: "/pricing" },
  // Not linked from anywhere on the site yet (owner, 2026-09-24: still
  // reviewing the plan) — the page itself stays live at this URL, just
  // unreachable by clicking around the site. Keep this off until the
  // owner says otherwise.
  robots: { index: false, follow: true },
};

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
    <div className="pricing-page">
      <div className="pricing-page-shell">
        <div className="pricing-page-head">
          {/* Headline/lede rewritten for the per-developer model (owner,
              2026-09-24) — the old copy ("Upgrade any individual project")
              described per-project billing, superseded by the 2026-09-24
              restructure (buy one plan, pick which projects fill its
              slots). */}
          <h1>Simple pricing for developers</h1>
          <p className="pricing-page-lede">
            Listing your projects is always free. Choose a package, then pick which of your projects to feature. Swap them any time until your package ends.
          </p>
          {/* "Founding developer" discount (owner, 2026-09-25) — only shown
              while real slots remain; never invents a number if the count
              couldn't be read. */}
          {foundingSpotsRemaining !== null && foundingSpotsRemaining > 0 ? (
            <p className="pricing-table-note-highlight" style={{ marginTop: 12 }}>
              🎉 {foundingSpotsRemaining} of {FOUNDING_DEVELOPER_CAP} founding developer spot{foundingSpotsRemaining === 1 ? "" : "s"} left — get {foundingDiscountPercent}% off, locked in for as long as you stay subscribed.
            </p>
          ) : foundingSpotsRemaining === 0 ? (
            <p className="pricing-table-note-highlight" style={{ marginTop: 12 }}>Founding developer pricing is now closed — all {FOUNDING_DEVELOPER_CAP} spots are taken.</p>
          ) : null}
        </div>

        <PricingComparisonTable showCta />

        {/* Verified copy corrected (owner, 2026-09-24): the table's own
            footnote already says every plan includes verification — this
            box previously contradicted that by implying Verified needs a
            paid package. It's actually the FEATURED PROJECTS specifically
            that show the badge while a package is active. */}
        <p className="pricing-page-note fd-badge-preview">
          <span className="listing-badge-pill badge-verified" title="Verified by LankaNewHomes">
            <ShieldCheck className="h-3 w-3" aria-hidden="true" /> Verified
          </span>
          badge is added to your featured projects while your package is active.
        </p>

        <section className="pricing-how-it-works" aria-label="How it works">
          <h2>How it works</h2>
          <ol>
            <li>
              <strong>Choose a package.</strong> Featured (1 spot), Featured Plus (3), Developer Pro (5) or Campaign (custom).
            </li>
            <li>
              <strong>Pick your projects.</strong> Choose which of your projects fill those spots. All your other projects stay listed for free.
            </li>
            <li>
              <strong>Swap any time.</strong> Replace a featured project whenever you like, until your package end date. Swapping doesn&apos;t change the end date.
            </li>
            <li>
              <strong>Need more spots?</strong> Add extra spots or upgrade your package.
            </li>
          </ol>
          <p className="pricing-how-it-works-note">When your package ends, your projects return to free listings until you renew.</p>
        </section>

        <p className="pricing-page-footer-note">
          Already listed? Choose your package and featured projects from the Placements tab in your developer dashboard. New here? <Link href="/developers/register"><strong>Register as a developer</strong></Link> to list your first project.
        </p>
      </div>
    </div>
  );
}
