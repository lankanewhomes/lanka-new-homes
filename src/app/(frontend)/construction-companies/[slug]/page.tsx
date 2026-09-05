import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAllConstructionCompanies, getConstructionCompanyBySlug } from "@/lib/construction-company-store";
import { getAllProjects } from "@/lib/project-store";
import { CompanyProfileDetailView } from "@/components/marketplace/company-profile-views";

// Regenerate at most once a minute so admin edits (e.g. status changes)
// show up without waiting for the next deploy.
export const revalidate = 60;

type ConstructionCompanyPageProps = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  const companies = await getAllConstructionCompanies();
  return companies.map((company) => ({ slug: company.slug }));
}

export async function generateMetadata({ params }: ConstructionCompanyPageProps): Promise<Metadata> {
  const { slug } = await params;
  const company = await getConstructionCompanyBySlug(slug);
  if (!company) return { title: "Construction Company Not Found", robots: { index: false, follow: false } };

  const title = `${company.name} Construction Company Profile`;
  return {
    title,
    description: company.description,
    alternates: { canonical: `/construction-companies/${company.slug}` },
    openGraph: { title, description: company.description, url: `/construction-companies/${company.slug}`, type: "profile", images: [{ url: company.logo, alt: company.name }] },
  };
}

export default async function ConstructionCompanyPage({ params }: ConstructionCompanyPageProps) {
  const { slug } = await params;
  const company = await getConstructionCompanyBySlug(slug);
  if (!company) return notFound();

  const allProjects = await getAllProjects();
  const projects = allProjects.filter((project) => project.additionalBuilderSlugs?.includes(slug));

  return <CompanyProfileDetailView company={company} entityLabel="Construction Company" projects={projects} />;
}
