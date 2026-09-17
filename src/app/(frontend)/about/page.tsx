import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About",
  description: "LankaNewHomes is Sri Lanka's marketplace for new homes, developments, and developer-led land projects — connecting buyers directly with developers and builders across the island.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <div className="static-page-shell">
      <h1>About LankaNewHomes</h1>
      <p className="static-page-lede">
        LankaNewHomes is Sri Lanka&apos;s marketplace for new homes, developments, and developer-led land projects — connecting buyers directly with developers and builders across the island.
      </p>

      <h2>What We Do</h2>
      <p>We bring Sri Lanka&apos;s new residential developments and developer land projects together in one place.</p>
      <p>
        Explore <strong>condominiums, apartments, villas, houses, and residential land projects</strong> from developers across the country. Buyers can compare locations, pricing, floor plans, amenities, project details, and availability without having to search across multiple developer websites.
      </p>
      <p>LankaNewHomes is built specifically around <strong>new developer and builder projects</strong>, giving buyers a dedicated place to discover what&apos;s being developed across Sri Lanka.</p>

      <h2>For Developers</h2>
      <p>LankaNewHomes gives developers and builders a dedicated platform to showcase their projects and connect with people actively looking to buy.</p>
      <p>Developers can create a public profile, manage their project listings, receive lead alerts, and showcase their developments to buyers on LankaNewHomes.</p>
      <p>
        Whether you&apos;re selling <strong>new apartments, condominiums, villas, houses, or developer-owned residential land</strong>, LankaNewHomes provides one place to present your projects and reach potential buyers.
      </p>
      <p>
        <Link href="/for-developers">Why developers list with us</Link> · <Link href="/pricing">Pricing</Link> · <Link href="/developers/register">Register as a developer</Link>
      </p>

      <h2>For Buyers</h2>
      <p>Discover new homes and developer land projects by location or property type.</p>
      <p>Explore project details, view floor plans, amenities, locations, and available land, save your favourites, and request information directly from the developer or sales team behind each project.</p>

      <p className="static-page-lede">One place to discover what&apos;s being built — and what&apos;s being developed — in Sri Lanka.</p>
    </div>
  );
}
