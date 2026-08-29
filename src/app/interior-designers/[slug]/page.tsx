import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAllInteriorDesigners, getInteriorDesignerBySlug } from "@/lib/interior-designer-store";
import { getAllProjects } from "@/lib/project-store";
import { CompanyProfileDetailView } from "@/components/marketplace/company-profile-views";

type InteriorDesignerPageProps = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  const designers = await getAllInteriorDesigners();
  return designers.map((designer) => ({ slug: designer.slug }));
}

export async function generateMetadata({ params }: InteriorDesignerPageProps): Promise<Metadata> {
  const { slug } = await params;
  const designer = await getInteriorDesignerBySlug(slug);
  if (!designer) return { title: "Interior Designer Not Found", robots: { index: false, follow: false } };

  const title = `${designer.name} Interior Designer Profile`;
  return {
    title,
    description: designer.description,
    alternates: { canonical: `/interior-designers/${designer.slug}` },
    openGraph: { title, description: designer.description, url: `/interior-designers/${designer.slug}`, type: "profile", images: [{ url: designer.logo, alt: designer.name }] },
  };
}

export default async function InteriorDesignerPage({ params }: InteriorDesignerPageProps) {
  const { slug } = await params;
  const designer = await getInteriorDesignerBySlug(slug);
  if (!designer) return notFound();

  const allProjects = await getAllProjects();
  const projects = allProjects.filter((project) => project.interiorDesignerSlug === slug);

  return <CompanyProfileDetailView company={designer} entityLabel="Interior Designer" projects={projects} />;
}
