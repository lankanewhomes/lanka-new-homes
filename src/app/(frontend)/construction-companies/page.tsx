import type { Metadata } from "next";
import { getAllConstructionCompanies } from "@/lib/construction-company-store";
import { PartnerDirectoryCard } from "@/components/marketplace/partner-directory-card";
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

export default async function ConstructionCompaniesPage() {
  const allCompanies = await getAllConstructionCompanies();

  // De-duplicate by name — keep whichever profile is more complete if a
  // company somehow has two records.
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

  return (
    <div>
      <div className="listing-page-intro">
        <h1>Construction Company Directory</h1>
        <p>Companies building new homes in Sri Lanka, listed A to Z.</p>
      </div>

      <p className="partner-directory-count">
        {companies.length} compan{companies.length === 1 ? "y" : "ies"}
      </p>

      <div className="partner-directory-grid">
        {companies.map((company) => (
          <PartnerDirectoryCard
            key={company.slug}
            slug={company.slug}
            basePath="/construction-companies"
            name={company.name}
            logo={company.logo}
            location={company.location}
            description={company.description}
            yearsInBusiness={company.yearsInBusiness}
            phone={company.phone}
          />
        ))}
      </div>
    </div>
  );
}
