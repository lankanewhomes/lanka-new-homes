import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getProjectBySlug } from "@/lib/project-store";
import { getLandBySlug } from "@/lib/land-store";
import { formatLkr } from "@/lib/format";
import { MAX_COMPARE } from "@/lib/compare-constants";
import type { Project, Land } from "@/types";

export const metadata: Metadata = {
  title: "Compare projects",
  robots: { index: false, follow: true },
};

type ComparePageProps = {
  searchParams: Promise<{ type?: string; slugs?: string }>;
};

function slugsFromParam(value: string | undefined): string[] {
  return (value ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, MAX_COMPARE);
}

type Row = { label: string; render: (item: Project | Land) => React.ReactNode };

const PROJECT_ROWS: { label: string; render: (p: Project) => React.ReactNode }[] = [
  { label: "Developer", render: (p) => p.developerName },
  { label: "Price", render: (p) => (p.startingPriceLkr > 0 ? `From ${formatLkr(p.startingPriceLkr)}` : p.priceRange || "Contact for pricing") },
  { label: "Status", render: (p) => p.constructionStatus || p.status },
  { label: "Bedrooms", render: (p) => p.bedrooms || "—" },
  { label: "Bathrooms", render: (p) => p.bathrooms || "—" },
  { label: "Floor area", render: (p) => p.floorAreaRange || "—" },
  { label: "Units", render: (p) => (p.units ? String(p.units) : "—") },
  { label: "Completion", render: (p) => (p.completionYear ? String(p.completionYear) : "—") },
  { label: "Location", render: (p) => `${p.location}, ${p.city}` },
];

const LAND_ROWS: { label: string; render: (l: Land) => React.ReactNode }[] = [
  { label: "Seller", render: (l) => l.sellerName },
  { label: "Price", render: (l) => (l.priceLkr > 0 ? formatLkr(l.priceLkr) : "Contact for pricing") },
  { label: "Land size", render: (l) => `${l.landSizePerches} perches${l.landSizeAcres ? ` (${l.landSizeAcres} acres)` : ""}` },
  { label: "Price / perch", render: (l) => (l.pricePerPerchLkrMin ? `${formatLkr(l.pricePerPerchLkrMin)}${l.pricePerPerchLkrMax ? ` – ${formatLkr(l.pricePerPerchLkrMax)}` : ""}` : "—") },
  { label: "Land use", render: (l) => l.landUse?.join(", ") || "—" },
  { label: "Land type", render: (l) => l.landType || "—" },
  { label: "Road access", render: (l) => l.roadAccess || "—" },
  { label: "Location", render: (l) => `${l.location}, ${l.city}` },
];

export default async function ComparePage({ searchParams }: ComparePageProps) {
  const { type, slugs: slugsParam } = await searchParams;
  const isLand = type === "land";
  const slugs = slugsFromParam(slugsParam);

  const projects = isLand ? [] : (await Promise.all(slugs.map((s) => getProjectBySlug(s)))).filter((p): p is Project => Boolean(p));
  const lands = isLand ? (await Promise.all(slugs.map((s) => getLandBySlug(s)))).filter((l): l is Land => Boolean(l)) : [];

  const items: (Project | Land)[] = isLand ? lands : projects;
  const rows = (isLand ? LAND_ROWS : PROJECT_ROWS) as Row[];
  const basePath = isLand ? "/land" : "/projects";

  return (
    <div className="compare-page">
      <div className="compare-page-shell">
        <h1>Compare {isLand ? "land" : "projects"}</h1>

        {items.length === 0 ? (
          <div className="compare-page-empty">
            <p>Nothing to compare yet — pick a few listings using the <strong>Compare</strong> button on any listing card, then come back here.</p>
            <Link href={basePath} className="compare-page-empty-cta">
              Browse {isLand ? "land" : "projects"}
            </Link>
          </div>
        ) : (
          <div className="compare-table-wrap">
            <table className="compare-table">
              <thead>
                <tr>
                  <th scope="col" className="compare-table-row-head"><span className="sr-only">Detail</span></th>
                  {items.map((item) => {
                    const slug = item.slug;
                    const name = "name" in item ? item.name : item.title;
                    const heroImage = item.heroImage;
                    return (
                      <th scope="col" key={slug}>
                        <Link href={`${basePath}/${slug}`} className="compare-table-item-media">
                          {heroImage ? (
                            <Image src={heroImage} alt={name} width={220} height={150} className="compare-table-item-image" />
                          ) : (
                            <div className="compare-table-item-image compare-table-item-image-placeholder" aria-hidden="true" />
                          )}
                        </Link>
                        <Link href={`${basePath}/${slug}`} className="compare-table-item-name">
                          {name}
                        </Link>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.label}>
                    <th scope="row">{row.label}</th>
                    {items.map((item) => (
                      <td key={item.slug}>{row.render(item)}</td>
                    ))}
                  </tr>
                ))}
                <tr>
                  <th scope="row"><span className="sr-only">Action</span></th>
                  {items.map((item) => (
                    <td key={item.slug}>
                      <Link href={`${basePath}/${item.slug}`} className="compare-table-view-cta">
                        View {isLand ? "listing" : "project"}
                      </Link>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
