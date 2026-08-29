import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAllArchitects, getArchitectBySlug } from "@/lib/architect-store";
import { getAllProjects } from "@/lib/project-store";
import { CompanyProfileDetailView } from "@/components/marketplace/company-profile-views";

type ArchitectPageProps = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  const architects = await getAllArchitects();
  return architects.map((architect) => ({ slug: architect.slug }));
}

export async function generateMetadata({ params }: ArchitectPageProps): Promise<Metadata> {
  const { slug } = await params;
  const architect = await getArchitectBySlug(slug);
  if (!architect) return { title: "Architect Not Found", robots: { index: false, follow: false } };

  const title = `${architect.name} Architect Profile`;
  return {
    title,
    description: architect.description,
    alternates: { canonical: `/architects/${architect.slug}` },
    openGraph: { title, description: architect.description, url: `/architects/${architect.slug}`, type: "profile", images: [{ url: architect.logo, alt: architect.name }] },
  };
}

export default async function ArchitectPage({ params }: ArchitectPageProps) {
  const { slug } = await params;
  const architect = await getArchitectBySlug(slug);
  if (!architect) return notFound();

  const allProjects = await getAllProjects();
  const projects = allProjects.filter((project) => project.architectSlug === slug);

  return <CompanyProfileDetailView company={architect} entityLabel="Architect" projects={projects} />;
}
