import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { MapPin, Ruler } from "lucide-react";
import { getAllLands } from "@/lib/land-store";
import { formatLkr } from "@/lib/format";

export const metadata: Metadata = {
  title: "Land for Sale in Sri Lanka",
  description: "Browse land parcels for sale across Sri Lanka, listed by developers, construction companies, and builders — pricing, size, and location for every plot.",
  alternates: {
    canonical: "/land",
  },
  openGraph: {
    title: "Land for Sale in Sri Lanka",
    description: "Browse land parcels for sale across Sri Lanka, listed by developers, construction companies, and builders.",
    url: "/land",
    type: "website",
  },
};

export default async function LandListingPage() {
  const lands = await getAllLands();

  return (
    <div className="listing-page">
      <div className="listing-header-row">
        <div>
          <p className="listing-header-eyebrow">{lands.length} land listings</p>
          <h1 className="listing-header-h1">Land for Sale in Sri Lanka</h1>
          <p className="listing-header-intro">
            Raw land parcels for sale across Sri Lanka, listed by developers, construction companies, and independent builders — separate from new-construction projects above.
          </p>
        </div>
      </div>

      {lands.length > 0 ? (
        <div className="listing-grid">
          {lands.map((land) => (
            <article key={land.slug} className="listing-grid-card">
              <Link href={`/land/${land.slug}`} className="listing-grid-card-media">
                <Image src={land.heroImage} alt={`${land.title} in ${land.location}`} width={480} height={340} className="listing-grid-card-image" />
                <span className="listing-grid-card-status">{land.status}</span>
                {land.isFeatured ? <span className="listing-grid-card-featured">Featured</span> : null}
              </Link>
              <div className="listing-grid-card-body">
                <Link href={`/land/${land.slug}`} className="listing-grid-card-name">{land.title}</Link>
                <p className="listing-grid-card-price">{land.priceLkr > 0 ? formatLkr(land.priceLkr) : "Contact for pricing"}</p>
                <p className="listing-grid-card-developer">{land.landUse} land by {land.sellerName}</p>
                <p className="listing-grid-card-address"><MapPin className="h-3.5 w-3.5" aria-hidden="true" style={{ display: "inline", verticalAlign: "-2px" }} /> {land.location}</p>
                <div className="listing-grid-card-facts">
                  <span><Ruler className="h-3.5 w-3.5" aria-hidden="true" /> {land.landSizePerches} perches</span>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <p className="listing-empty-state">No land listings yet — check back soon.</p>
      )}
    </div>
  );
}
