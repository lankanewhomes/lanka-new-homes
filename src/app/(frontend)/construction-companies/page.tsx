import type { Metadata } from "next";
import Link from "next/link";
import { getAllConstructionCompanies } from "@/lib/construction-company-store";
import type { ConstructionCompany } from "@/types";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Construction Company Directory in Sri Lanka",
  description: "Browse construction companies building new homes in Sri Lanka, listed alphabetically.",
  alternates: {
    canonical: "/construction-companies",
  },
  openGraph: {
    title: "Construction Company Directory in Sri Lanka",
    description: "Browse construction companies building new homes in Sri Lanka, listed alphabetically.",
    url: "/construction-companies",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Construction Company Directory in Sri Lanka",
    description: "Browse construction companies building new homes in Sri Lanka, listed alphabetically.",
  },
};

// Classic A-Z directory groups — fixed ranges rather than sized to today's
// company count, so the layout stays stable as more companies are added.
// Same convention as /developers.
const LETTER_GROUPS: { label: string; test: (letter: string) => boolean }[] = [
  { label: "A – F", test: (l) => l >= "A" && l <= "F" },
  { label: "G – L", test: (l) => l >= "G" && l <= "L" },
  { label: "M – R", test: (l) => l >= "M" && l <= "R" },
  { label: "S – Z", test: (l) => l >= "S" && l <= "Z" },
];

export default async function ConstructionCompaniesPage() {
  const allCompanies = await getAllConstructionCompanies();

  // De-duplicate by name, same rationale as /developers — keep whichever
  // profile is more complete if a company somehow has two records.
  const companies = Array.from(
    allCompanies.reduce((unique, company) => {
      const key = company.name.trim().toLowerCase();
      const current = unique.get(key);
      const currentScore = current ? Number(Boolean(current.location)) + Number(Boolean(current.description)) : -1;
      const nextScore = Number(Boolean(company.location)) + Number(Boolean(company.description));

      if (!current || nextScore > currentScore) unique.set(key, company);
      return unique;
    }, new Map<string, ConstructionCompany>()).values(),
  ).sort((a, b) => a.name.localeCompare(b.name));

  const groups = LETTER_GROUPS
    .map((group) => ({
      label: group.label,
      companies: companies.filter((company) => group.test(company.name.trim().charAt(0).toUpperCase())),
    }))
    .filter((group) => group.companies.length > 0);

  return (
    <div className="developer-directory">
      <h1 className="text-3xl">Construction Company Directory</h1>
      <p className="text-sm text-stone-600">Companies building new homes in Sri Lanka, listed A to Z.</p>

      <div className="developer-directory-grid">
        {groups.map((group) => (
          <div key={group.label} className="developer-directory-card">
            <h2>{group.label}</h2>
            <ul>
              {group.companies.map((company) => (
                <li key={company.slug}>
                  <Link href={`/construction-companies/${company.slug}`}>{company.name}</Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
