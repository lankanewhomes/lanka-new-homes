import type { Metadata } from "next";
import Link from "next/link";
import { getAllDevelopers } from "@/lib/developer-store";
import { getPackage, planRotationWeight } from "@/lib/packages";
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

  // Directory pinning (owner, 2026-09-24 build note item 8) — Developer
  // Pro/Campaign developers (same `developerSpotlight` entitlement the
  // homepage chip uses, getPackage in packages.ts) get a pinned section
  // above the regular A-Z groups; Campaign outranks Developer Pro within
  // it (planRotationWeight, same tier-first ordering now used for
  // /projects — see listing-page.tsx). Excluded from the A-Z groups below
  // so nobody appears twice on the page.
  const pinnedDevelopers = developers
    .filter((developer) => getPackage(developer.plan).developerSpotlight)
    .sort((a, b) => planRotationWeight(b.plan) - planRotationWeight(a.plan) || a.name.localeCompare(b.name));
  const pinnedSlugs = new Set(pinnedDevelopers.map((developer) => developer.slug));
  const unpinnedDevelopers = developers.filter((developer) => !pinnedSlugs.has(developer.slug));

  const groups = LETTER_GROUPS
    .map((group) => ({
      label: group.label,
      developers: unpinnedDevelopers.filter((developer) => group.test(developer.name.trim().charAt(0).toUpperCase())),
    }))
    .filter((group) => group.developers.length > 0);

  return (
    <div className="developer-directory">
      <h1 className="text-3xl">Developer Directory</h1>
      <p className="text-sm text-stone-600">Companies developing new residential apartment projects in Sri Lanka, listed A to Z.</p>

      {pinnedDevelopers.length > 0 ? (
        <div className="developer-directory-pinned">
          <h2>Developer Pro</h2>
          <ul>
            {pinnedDevelopers.map((developer) => (
              <li key={developer.slug}>
                <Link href={`/developers/${developer.slug}`}>{developer.name}</Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

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
