import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAllMarketingCompanies, getMarketingCompanyBySlug } from "@/lib/marketing-company-store";
import { getAllProjects } from "@/lib/project-store";
import { CompanyProfileDetailView } from "@/components/marketplace/company-profile-views";

type MarketingCompanyPageProps = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  const companies = await getAllMarketingCompanies();
  return companies.map((company) => ({ slug: company.slug }));
}

export async function generateMetadata({ params }: MarketingCompanyPageProps): Promise<Metadata> {
  const { slug } = await params;
  const company = await getMarketingCompanyBySlug(slug);
  if (!company) return { title: "Marketing Company Not Found", robots: { index: false, follow: false } };

  const title = `${company.name} Marketing Company Profile`;
  return {
    title,
    description: company.description,
    alternates: { canonical: `/marketing-companies/${company.slug}` },
    openGraph: { title, description: company.description, url: `/marketing-companies/${company.slug}`, type: "profile", images: [{ url: company.logo, alt: company.name }] },
  };
}

export default async function MarketingCompanyPage({ params }: MarketingCompanyPageProps) {
  const { slug } = await params;
  const company = await getMarketingCompanyBySlug(slug);
  if (!company) return notFound();

  const allProjects = await getAllProjects();
  const projects = allProjects.filter((project) => project.marketingCompanySlug === slug);

  return <CompanyProfileDetailView company={company} entityLabel="Marketing Company" projects={projects} />;
}
