import type { Metadata } from "next";
import Link from "next/link";
import { getAllDevelopers } from "@/lib/developer-store";
import type { Developer } from "@/types";

// Regenerate at most once a minute so admin edits show up without waiting for the next deploy.
export const revalidate = 60;

export const metadata: Metadata = {
  title: "Developer Directory in Sri Lanka",
  description: "Browse real estate developers building new apartment projects in Sri Lanka, listed alphabetically.",
  alternates: {
    canonical: "/developers",
  },
  openGraph: {
    title: "Developer Directory in Sri Lanka",
    description: "Browse real estate developers building new apartment projects in Sri Lanka, listed alphabetically.",
    url: "/developers",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Developer Directory in Sri Lanka",
    description: "Browse real estate developers building new apartment projects in Sri Lanka, listed alphabetically.",
  },
};

// Classic A-Z directory groups — fixed ranges rather than sized to today's
// developer count, so the layout stays stable as more developers are added.
const LETTER_GROUPS: { label: string; test: (letter: string) => boolean }[] = [
  { label: "A – F", test: (l) => l >= "A" && l <= "F" },
  { label: "G – L", test: (l) => l >= "G" && l <= "L" },
  { label: "M – R", test: (l) => l >= "M" && l <= "R" },
  { label: "S – Z", test: (l) => l >= "S" && l <= "Z" },
];

export default async function DevelopersPage() {
  const allDevelopers = await getAllDevelopers();

  // De-duplicate by name — the same developer can otherwise appear twice
  // (e.g. one profile with richer data, one bare-bones stub); keep whichever
  // has the most complete profile.
  const developers = Array.from(
    allDevelopers.reduce((unique, developer) => {
      const key = developer.name.trim().toLowerCase();
      const current = unique.get(key);
      const currentScore = current
        ? current.activeProjects + current.completedProjects + Number(Boolean(current.location)) + Number(Boolean(current.description))
        : -1;
      const nextScore = developer.activeProjects + developer.completedProjects + Number(Boolean(developer.location)) + Number(Boolean(developer.description));

      if (!current || nextScore > currentScore) unique.set(key, developer);
      return unique;
    }, new Map<string, Developer>()).values(),
  ).sort((a, b) => a.name.localeCompare(b.name));

  const groups = LETTER_GROUPS
    .map((group) => ({
      label: group.label,
      developers: developers.filter((developer) => group.test(developer.name.trim().charAt(0).toUpperCase())),
    }))
    .filter((group) => group.developers.length > 0);

  return (
    <div className="developer-directory">
      <h1 className="text-3xl font-semibold">Developer Directory</h1>
      <p className="text-sm text-stone-600">Companies developing new residential apartment projects in Sri Lanka, listed A to Z.</p>

      <div className="developer-directory-grid">
        {groups.map((group) => (
          <div key={group.label} className="developer-directory-card">
            <h2>{group.label}</h2>
            <ul>
              {group.developers.map((developer) => (
                <li key={developer.slug}>
                  <Link href={`/developers/${developer.slug}`}>{developer.name}</Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
