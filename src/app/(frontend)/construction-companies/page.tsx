import type { Metadata } from "next";
import { PartnerDirectoryPage } from "@/components/marketplace/partner-directory-page";
import { getAllConstructionCompanies } from "@/lib/construction-company-store";
import type { ConstructionCompany } from "@/types";
import { withSocial } from "@/lib/seo";
import { FeaturedSlot } from "@/components/featured/featured-slot";

export const revalidate = 60;

// Title and text use both "construction companies" and "building contractors" (Ubersuggest, Sri Lanka, 2026-11-24: "building
// contractors sri lanka" 1,900 a month, this page at position 10; "construction company sri lanka" 2,400).
export const metadata: Metadata = withSocial({
  title: "Construction Companies & Building Contractors in Sri Lanka",
  description: "Construction companies and house building contractors in Sri Lanka: builders for new homes, pools and renovations, with profiles and contact details, listed A to Z.",
  alternates: {
    canonical: "/construction-companies",
  },
  openGraph: {
    title: "Construction Companies & Building Contractors in Sri Lanka",
    description: "Construction companies and house building contractors in Sri Lanka: builders for new homes, pools and renovations, with profiles and contact details, listed A to Z.",
    url: "/construction-companies",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Construction Companies & Building Contractors in Sri Lanka",
    description: "Construction companies and house building contractors in Sri Lanka: builders for new homes, pools and renovations, with profiles and contact details, listed A to Z.",
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
      intro="Construction companies and building contractors for new homes in Sri Lanka, listed A to Z."
      noun="construction company"
      nounPlural="construction companies"
      basePath="/construction-companies"
      entries={companies}
      featuredSlot={<FeaturedSlot placement="directory-construction" heading="Featured projects." subheading="Sponsored new-home projects." context={{ limit: 4 }} />}
      about={{
        title: "About the construction company directory.",
        paragraphs: [
          `This directory lists the ${companies.length} construction companies on LankaNewHomes, from established contractors to smaller specialist builders working across Sri Lanka. Each has a profile page showing who they are, where they work and how long they have been in business.`,
          "People search for these firms as construction companies, building contractors, house builders or home builders: in Sri Lanka the terms overlap, and most companies here take on house building as well as larger projects.",
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
