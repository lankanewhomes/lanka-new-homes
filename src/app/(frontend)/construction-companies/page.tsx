import type { Metadata } from "next";
import { PartnerDirectoryPage } from "@/components/marketplace/partner-directory-page";
import { getAllConstructionCompanies } from "@/lib/construction-company-store";
import type { ConstructionCompany } from "@/types";
import { withSocial } from "@/lib/seo";

export const revalidate = 60;

export const metadata: Metadata = withSocial({
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
}, { path: "/construction-companies" });

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
    <PartnerDirectoryPage
      title="Construction companies in Sri Lanka."
      intro="Companies building new homes in Sri Lanka, listed A to Z."
      noun="construction company"
      nounPlural="construction companies"
      basePath="/construction-companies"
      entries={companies}
      about={{
        title: "About the construction company directory.",
        paragraphs: [
          `This directory lists the ${companies.length} construction companies on LankaNewHomes, from established contractors to smaller specialist builders working across Sri Lanka. Each has a profile page showing who they are, where they work and how long they have been in business.`,
          "Many buyers of land use a construction company to build their own home after they purchase a plot, while others hire a builder for a pool, a boundary wall or a full villa. Ask for a written quotation, a clear timeline and examples of finished work before you sign a contract.",
          "Construction companies can be listed on LankaNewHomes for free, and enquiries go straight to the company with no agent in between.",
        ],
      }}
      related={[
        { label: "Colombo", href: "/construction-companies/colombo", note: "Builders working in Colombo." },
        { label: "Swimming pools", href: "/construction-companies/swimming-pools", note: "Pool construction specialists." },
        { label: "Consulting", href: "/construction-companies/consulting", note: "Construction consultants." },
        { label: "Land for sale", href: "/land", note: "Find a plot to build on." },
      ]}
    />
  );
}
