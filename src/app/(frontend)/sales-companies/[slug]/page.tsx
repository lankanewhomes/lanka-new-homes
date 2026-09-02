import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAllSalesCompanies, getSalesCompanyBySlug } from "@/lib/sales-company-store";
import { getAllProjects } from "@/lib/project-store";
import { CompanyProfileDetailView } from "@/components/marketplace/company-profile-views";

// Regenerate at most once a minute so admin edits (e.g. status changes)
// show up without waiting for the next deploy.
export const revalidate = 60;

type SalesCompanyPageProps = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  const companies = await getAllSalesCompanies();
  return companies.map((company) => ({ slug: company.slug }));
}

export async function generateMetadata({ params }: SalesCompanyPageProps): Promise<Metadata> {
  const { slug } = await params;
  const company = await getSalesCompanyBySlug(slug);
  if (!company) return { title: "Sales Company Not Found", robots: { index: false, follow: false } };

  const title = `${company.name} Sales Company Profile`;
  return {
    title,
    description: company.description,
    alternates: { canonical: `/sales-companies/${company.slug}` },
    openGraph: { title, description: company.description, url: `/sales-companies/${company.slug}`, type: "profile", images: [{ url: company.logo, alt: company.name }] },
  };
}

export default async function SalesCompanyPage({ params }: SalesCompanyPageProps) {
  const { slug } = await params;
  const company = await getSalesCompanyBySlug(slug);
  if (!company) return notFound();

  const allProjects = await getAllProjects();
  const projects = allProjects.filter((project) => project.salesCompanySlug === slug);

  return <CompanyProfileDetailView company={company} entityLabel="Sales Company" projects={projects} />;
}
