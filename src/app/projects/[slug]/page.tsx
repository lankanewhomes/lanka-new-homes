import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { projects } from "@/data/projects";
import { getProjectBySlug } from "@/lib/project-store";
import { getNeighborhoodBySlug } from "@/lib/neighborhood-store";
import { getDeveloperBySlug } from "@/lib/developer-store";
import {
  AmenitiesShowcaseSection,
  ListingSidebarCard,
  NeighborhoodSection,
  PlansAndHomesSection,
  PricingInformationLayout,
  ProjectDescriptionSection,
  ProjectHero,
  ProjectNarrativeDetails,
  ProjectStatsChips,
} from "@/components/marketplace/components";
import { ProjectViewTracker } from "@/components/marketplace/view-tracker";
import { toAbsoluteUrl } from "@/lib/seo";

type ProjectPageProps = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return projects.map((project) => ({ slug: project.slug }));
}

export async function generateMetadata({ params }: ProjectPageProps): Promise<Metadata> {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);

  if (!project) {
    return {
      title: "Project Not Found",
      robots: { index: false, follow: false },
    };
  }

  const title = `${project.name} - New Apartments in ${project.location}`;
  const description = `${project.summary} Starting from ${project.priceRange}. Explore floor plans, amenities, and availability.`;
  const canonicalPath = `/projects/${project.slug}`;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalPath,
    },
    openGraph: {
      title,
      description,
      url: canonicalPath,
      type: "article",
      images: [
        {
          url: project.heroImage,
          alt: project.name,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [project.heroImage],
    },
  };
}

export default async function ProjectDetailPage({ params }: ProjectPageProps) {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);
  if (!project) return notFound();

  const neighborhood = project.neighborhoodSlug ? await getNeighborhoodBySlug(project.neighborhoodSlug) : undefined;
  const developer = await getDeveloperBySlug(project.developerSlug);

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: project.name,
    description: project.summary,
    image: [project.heroImage, ...project.gallery.map((item) => item.image)],
    brand: {
      "@type": "Brand",
      name: project.developerName,
    },
    offers: {
      "@type": "Offer",
      priceCurrency: "LKR",
      price: project.startingPriceLkr,
      availability:
        project.status === "Coming Soon"
          ? "https://schema.org/PreOrder"
          : "https://schema.org/InStock",
      url: toAbsoluteUrl(`/projects/${project.slug}`),
    },
    additionalProperty: [
      { "@type": "PropertyValue", name: "Bedrooms", value: project.bedrooms },
      { "@type": "PropertyValue", name: "Bathrooms", value: project.bathrooms },
      { "@type": "PropertyValue", name: "Floor Area", value: project.floorAreaRange },
      { "@type": "PropertyValue", name: "Status", value: project.status },
    ],
    url: toAbsoluteUrl(`/projects/${project.slug}`),
  };

  return (
    <div className="space-y-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <ProjectViewTracker projectSlug={project.slug} developerSlug={project.developerSlug} />
      <ProjectHero project={project} backHref="/projects" backLabel="New Projects" />

      <div className="listing-with-sidebar">
        <div className="listing-with-sidebar-main space-y-8">
          <ProjectDescriptionSection project={project} />
          <ProjectStatsChips project={project} />

          <ProjectNarrativeDetails project={project} />

          <section id="pricing" className="space-y-3">
            <PricingInformationLayout project={project} />
          </section>

          <PlansAndHomesSection project={project} />

          <AmenitiesShowcaseSection project={project} />

          <NeighborhoodSection project={project} neighborhoodPageExists={Boolean(neighborhood)} />
        </div>

        <aside className="listing-with-sidebar-aside">
          <ListingSidebarCard project={project} developer={developer} />
        </aside>
      </div>
    </div>
  );
}
