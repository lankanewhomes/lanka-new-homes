import type { Metadata } from "next";
import Link from "next/link";
import { getAllNeighborhoods } from "@/lib/neighborhood-store";
import { getAllProjects } from "@/lib/project-store";

// Regenerate at most once a minute so new neighborhoods and project links show up without waiting for the next deploy.
export const revalidate = 60;

const TITLE = "Neighborhood Guides in Sri Lanka";
const DESCRIPTION =
  "Explore neighborhood guides for the areas where new homes are being built across Sri Lanka — transport, schools, hospitals, typical prices and the new projects in each area.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: {
    canonical: "/neighborhoods",
  },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: "/neighborhoods",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
  },
};

// Same classic A-Z groups as the developer directory (/developers) — fixed
// ranges rather than sized to today's count, so the layout stays stable as
// neighborhoods are added.
const LETTER_GROUPS: { label: string; test: (letter: string) => boolean }[] = [
  { label: "A – F", test: (l) => l >= "A" && l <= "F" },
  { label: "G – L", test: (l) => l >= "G" && l <= "L" },
  { label: "M – R", test: (l) => l >= "M" && l <= "R" },
  { label: "S – Z", test: (l) => l >= "S" && l <= "Z" },
];

export default async function NeighborhoodsPage() {
  const [allNeighborhoods, allProjects] = await Promise.all([getAllNeighborhoods(), getAllProjects()]);

  // Published listings per neighborhood, so a buyer can see where the new
  // homes are (only shown when there is at least one).
  const projectCounts = new Map<string, number>();
  for (const project of allProjects) {
    if (project.neighborhoodSlug) projectCounts.set(project.neighborhoodSlug, (projectCounts.get(project.neighborhoodSlug) ?? 0) + 1);
  }

  const neighborhoods = [...allNeighborhoods].sort((a, b) => a.name.localeCompare(b.name));

  const groups = LETTER_GROUPS
    .map((group) => ({
      label: group.label,
      neighborhoods: neighborhoods.filter((neighborhood) => group.test(neighborhood.name.trim().charAt(0).toUpperCase())),
    }))
    .filter((group) => group.neighborhoods.length > 0);

  return (
    <div className="developer-directory">
      <h1 className="text-3xl">Neighborhood Guides</h1>
      <p className="text-sm text-stone-600">Areas across Sri Lanka where new homes are being built, listed A to Z. Each guide covers transport, schools, hospitals, typical prices and the projects for sale there.</p>

      <div className="developer-directory-grid">
        {groups.map((group) => (
          <div key={group.label} className="developer-directory-card">
            <h2>{group.label}</h2>
            <ul>
              {group.neighborhoods.map((neighborhood) => {
                const count = projectCounts.get(neighborhood.slug) ?? 0;
                return (
                  <li key={neighborhood.slug}>
                    <Link href={`/neighborhoods/${neighborhood.slug}`}>{neighborhood.name}</Link>
                    {count > 0 ? <span className="developer-directory-count">{count} {count === 1 ? "project" : "projects"}</span> : null}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
