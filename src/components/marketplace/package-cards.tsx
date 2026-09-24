import Link from "next/link";
import { Check } from "lucide-react";
import { PACKAGE_LIST, type PackageDefinition } from "@/lib/packages";

// Free / Featured / Premium cards shared by /pricing and /for-developers
// (owner, 2026-09-23): orange top bar, highlighted card fully outlined, the
// others on cream, uppercase plan name, big price, orange tick circles and a
// divider with the fine print underneath. Styled in globals.css (.package-card*).

function footnotes(pkg: PackageDefinition) {
  return pkg.price === 0
    ? [
        { label: "Verified badge:", value: "With Featured or Premium" },
        { label: "Upgrade:", value: "Any time, per project" },
      ]
    : [
        { label: "Verified badge:", value: "Included automatically" },
        { label: "Contract:", value: "None — billed monthly" },
      ];
}

export function PackageCards({ showCta = false }: { showCta?: boolean }) {
  return (
    <div className="package-cards">
      {PACKAGE_LIST.map((pkg) => {
        const highlight = pkg.tier === "premium";
        return (
          <article className={`package-card${highlight ? " package-card-highlight" : ""}`} key={pkg.tier}>
            {highlight ? <span className="package-card-tag">Most visibility</span> : null}
            <h3 className="package-card-name">{pkg.name} package</h3>
            <p className="package-card-tagline">{pkg.tagline}</p>
            {/* No Rs. figure shown for Featured/Premium — they're Coming Soon (no
                payment gateway yet), so a firm price isn't advertised before it can
                actually be bought. `priceHeadline` is a short benefit instead (owner,
                2026-09-24). The real price still lives in packages.ts for billing/CMS. */}
            <p className="package-card-price">
              <strong>{pkg.price === 0 ? "Free" : pkg.priceHeadline}</strong>
              <span>per project</span>
            </p>
            <ul className="package-card-features">
              {pkg.features.map((feature) => (
                <li key={feature}>
                  <span className="package-card-tick" aria-hidden="true"><Check strokeWidth={3} /></span>
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
            <dl className="package-card-notes">
              {footnotes(pkg).map((note) => (
                <div key={note.label}>
                  <dt>{note.label}</dt>
                  <dd>{note.value}</dd>
                </div>
              ))}
            </dl>
            {showCta ? (
              pkg.price === 0 ? (
                <Link href="/developers/register" className="package-card-cta">
                  List for free
                </Link>
              ) : (
                // Featured/Premium can't actually be bought yet — /developers/register
                // is the same free signup form regardless of which button sent you
                // there, with no tier/payment step (payment gateway not built yet).
                // A real link here would be misleading, so this is inert with a
                // "Coming soon" badge instead (owner, 2026-09-23).
                <span className="package-card-cta package-card-cta-soon" aria-disabled="true">
                  Get {pkg.name}
                  <span className="package-card-cta-soon-badge">Coming soon</span>
                </span>
              )
            ) : null}
          </article>
        );
      })}
    </div>
  );
}
