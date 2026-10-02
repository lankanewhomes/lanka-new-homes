import type { Metadata } from "next";
import { SeoAboutBlock } from "@/components/marketplace/seo-about-block";
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
      <SeoAboutBlock
        title="About the construction company directory"
        paragraphs={[
          `This directory lists the ${companies.length} construction companies on LankaNewHomes, from established contractors to smaller specialist builders working across Sri Lanka. Each company has its own profile page showing who they are, where they work and how long they have been in business.`,
          "Open a profile to see a company's location, years in business and contact details, and to get in touch directly. Comparing a few builders on their track record and the type of work they take on is one of the most useful steps before you commission a new home, a renovation or an extension.",
          "Many buyers of land use a construction company to build their own home after they purchase a plot, while others hire a builder for a pool, a boundary wall or a full villa. Whatever the project, ask for a written quotation, a clear timeline and examples of finished work before you sign a contract.",
          "Construction companies can be listed on LankaNewHomes for free, and enquiries go straight to the company with no agent in between. If you run a building firm in Sri Lanka and want to appear here, register from the For Developers page.",
        ]}
      />
    </div>
  );
}
