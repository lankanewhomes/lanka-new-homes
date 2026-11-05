import type { Metadata } from "next";
import Link from "next/link";
import { getAllNeighborhoods } from "@/lib/neighborhood-store";
import { getAllProjects } from "@/lib/project-store";
import { getAllLands } from "@/lib/land-store";
import { landsInArea } from "@/lib/area-lands";
import { landDistricts } from "@/lib/land-seo-pages";
import { buildBreadcrumbJsonLd, jsonLdScriptProps, withSocial } from "@/lib/seo";

// The hub for every /neighborhoods/<slug> page (owner, 2026-11-02: "add an areas hub page"). Prime Lands links every one of its city
// pages from one hub; until now ours had none. Every number shown is counted live from the listings, never typed in.
export const revalidate = 60;

const PATH = "/neighborhoods";
const TITLE = "Houses, Land & New Homes for Sale by Area in Sri Lanka";
const DESCRIPTION = "Find houses, land and new homes for sale by area in Sri Lanka: Colombo 1 to 15, Maharagama, Nugegoda, Kandy, Galle and more, with the live number of listings in each.";

export const metadata: Metadata = withSocial({ title: TITLE, description: DESCRIPTION, alternates: { canonical: PATH } }, { path: PATH });

const GROUPS: { label: string; test: (district: string, name: string) => boolean }[] = [
  { label: "Colombo city (Colombo 1 to 15)", test: (_district, name) => /^colombo \d|^port city|^fort\b/i.test(name) },
];

export default async function NeighborhoodsHubPage() {
  const [neighborhoods, projects, lands] = await Promise.all([getAllNeighborhoods(), getAllProjects(), getAllLands()]);

  const rows = neighborhoods
    .map((area) => ({
      area,
      homes: projects.filter((project) => project.neighborhoodSlug === area.slug).length,
      plots: landsInArea(lands, area).length,
    }))
    .sort((a, b) => a.area.name.localeCompare(b.area.name, "en", { numeric: true }));

  // Colombo city first, then every other district alphabetically; areas without a district go under their province.
  const byGroup = new Map<string, typeof rows>();
  for (const row of rows) {
    const special = GROUPS.find((group) => group.test(row.area.district ?? "", row.area.name));
    const key = special?.label ?? (row.area.district?.trim() || `${row.area.province} Province`);
    byGroup.set(key, [...(byGroup.get(key) ?? []), row]);
  }
  const groups = [...byGroup.entries()].sort(([a], [b]) => (a === GROUPS[0].label ? -1 : b === GROUPS[0].label ? 1 : a.localeCompare(b)));

  const districts = landDistricts(lands);
  const totalHomes = rows.reduce((sum, row) => sum + row.homes, 0);
  const totalPlots = rows.reduce((sum, row) => sum + row.plots, 0);
  const breadcrumb = buildBreadcrumbJsonLd([{ label: "Home", href: "/" }, { label: "Areas", href: PATH }]);

  return (
    <div className="fdv-page">
      <script {...jsonLdScriptProps(breadcrumb)} />
      <section className="fdv-hero fdv-hero--split" aria-label="Areas">
        <div className="fdv-hero-split-inner">
          <div className="fdv-hero-content">
            <h1 className="fdv-hero-headline">Houses, land and new homes for sale by area.</h1>
            <p className="fdv-hero-sub">
              Pick an area to see its new homes, land plots and developers, with a short guide to what the area is like.
              {rows.length > 0 ? ` ${rows.length} areas, ${totalHomes} new homes and ${totalPlots} land plots listed right now.` : ""}
            </p>
            <div className="fdv-hero-ctas">
              <Link href="/projects" className="fdv-cta-final-button">Browse new homes</Link>
              <Link href="/land" className="fdv-cta-secondary fdv-hero-explore-link">Browse land</Link>
            </div>
          </div>
        </div>
      </section>

      {groups.map(([label, items], index) => (
        <section key={label} className={`fdv-box ${["fdv-box--gray", "fdv-box--sage", "fdv-box--cream", "fdv-box--lilac"][index % 4]}`} aria-label={label}>
          <div className="wdx-section-head" data-reveal>
            <h2>{label}.</h2>
            <p>{items.length} {items.length === 1 ? "area" : "areas"}</p>
          </div>
          <div className="fdv-box-grid fdv-box-grid--3" data-reveal>
            {items.map(({ area, homes, plots }) => (
              <Link key={area.slug} href={`/neighborhoods/${area.slug}`} className="fdv-box-card fdv-box-card-link">
                <h3>{area.name}</h3>
                <p>
                  {homes} new {homes === 1 ? "home" : "homes"} · {plots} land {plots === 1 ? "plot" : "plots"}
                </p>
              </Link>
            ))}
          </div>
        </section>
      ))}
      {districts.length > 0 ? (
        <section className="fdv-box fdv-box--dark" aria-label="Land by district">
          <div className="wdx-section-head" data-reveal>
            <h2>Land for sale by district.</h2>
            <p>Every district where land is listed right now.</p>
          </div>
          <ul className="about-areas" data-reveal>
            <li><Link href="/land/best-land-for-sale-in-colombo">Colombo district</Link></li>
            {districts.map((entry) => (
              <li key={entry.slug}>
                <Link href={`/land/district/${entry.slug}`}>{entry.name} district ({entry.count})</Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
