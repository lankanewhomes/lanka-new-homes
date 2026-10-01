import type { Metadata } from "next";
import Link from "next/link";
import { getAllDevelopers } from "@/lib/developer-store";
import { getAllProjects } from "@/lib/project-store";
import { getAllLands } from "@/lib/land-store";
import { getAllNeighborhoods } from "@/lib/neighborhood-store";

export const metadata: Metadata = {
  title: "Sitemap",
  alternates: { canonical: "/sitemap" },
};

export default async function SitemapPage() {
  const [developers, projects, lands, neighborhoods] = await Promise.all([
    getAllDevelopers(),
    getAllProjects(),
    getAllLands(),
    getAllNeighborhoods(),
  ]);

  // Owner, 2026-09-30: "redesign sitemap" — same contained-box system as
  // /about, /press and /contact (docs/design.md "Page section style:
  // contained boxes"); every link is unchanged, grouped one box per
  // group.
  const groups = [
    {
      id: "main",
      title: "Main",
      tone: "gray",
      links: [
        { href: "/", label: "Home" },
        { href: "/projects", label: "Projects" },
        { href: "/land", label: "Land" },
        { href: "/developers", label: "Developers" },
        { href: "/construction-companies", label: "Construction Companies" },
      ],
    },
    {
      id: "company",
      title: "Company",
      tone: "cream",
      links: [
        { href: "/about", label: "About" },
        { href: "/for-developers", label: "For developers" },
        { href: "/web-design", label: "Web design" },
        { href: "/press", label: "Press" },
        { href: "/contact", label: "Contact" },
        { href: "/blog", label: "Blog" },
        { href: "/privacy", label: "Privacy Policy" },
        { href: "/cookies", label: "Cookie Policy" },
        { href: "/terms", label: "Terms of Service" },
      ],
    },
    { id: "projects", title: "Projects", tone: "sage", links: projects.map((p) => ({ href: `/projects/${p.slug}`, label: p.name })) },
    { id: "land-listings", title: "Land", tone: "lilac", links: lands.map((l) => ({ href: `/land/${l.slug}`, label: l.title })) },
    { id: "developer-profiles", title: "Developers", tone: "gray", links: developers.map((d) => ({ href: `/developers/${d.slug}`, label: d.name })) },
    { id: "areas", title: "Neighborhoods", tone: "cream", links: neighborhoods.map((n) => ({ href: `/neighborhoods/${n.slug}`, label: n.name })) },
  ].filter((group) => group.links.length > 0);

  return (
    <div className="fdv-page sitemap-page">
      <section className="fdv-hero fdv-hero--split" aria-label="Sitemap">
        <div className="fdv-hero-split-inner legal-hero-inner">
          <div className="fdv-hero-content">
            <h1 className="fdv-hero-headline">Sitemap.</h1>
            <p className="fdv-hero-sub">Every page on LankaNewHomes — projects, land, developers and neighbourhood guides — in one place.</p>
          </div>
        </div>
      </section>

      {groups.map((group) => (
        <section className={`fdv-box fdv-box--${group.tone}`} id={group.id} key={group.id} aria-label={group.title}>
          <div className="wdx-section-head">
            <h2>{group.title}.</h2>
            <p>{group.links.length} {group.links.length === 1 ? "page" : "pages"}</p>
          </div>
          <ul className="sitemap-links">
            {group.links.map((link) => (
              <li key={link.href}>
                <Link href={link.href}>{link.label}</Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
