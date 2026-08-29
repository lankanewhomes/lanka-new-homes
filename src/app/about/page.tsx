import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About",
  description: "NewHomesSrilanka connects buyers with new construction homes and trusted developers across Sri Lanka.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <div className="static-page-shell">
      <h1>About NewHomesSrilanka</h1>
      <p className="static-page-lede">NewHomesSrilanka is Sri Lanka&apos;s marketplace for new construction homes, connecting buyers with verified developers, ongoing projects, and the neighborhoods they&apos;re built in.</p>

      <h2>What we do</h2>
      <p>We bring together new condominium, apartment, and villa developments from across the island in one place, so buyers can compare pricing, floor plans, amenities, and availability without chasing down individual developer websites.</p>

      <h2>For developers</h2>
      <p>Developers get a public profile page, project listings management, and a homepage hero placement to reach active buyers. Visit the <a href="/developers/register">developer registration page</a> to get started.</p>

      <h2>For buyers</h2>
      <p>Browse new homes by location or project type, save the ones you like, and request more information directly from the sales team behind each project.</p>
    </div>
  );
}
