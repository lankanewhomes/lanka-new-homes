import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DeveloperProfileView } from "@/components/marketplace/developer-profile-view";
import { getAllDevelopers, getDeveloperBySlug } from "@/lib/developer-store";
import { getAllProjects } from "@/lib/project-store";
import { toAbsoluteUrl } from "@/lib/seo";

type DeveloperProfilePageProps = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  const developers = await getAllDevelopers();
  return developers.map((developer) => ({ slug: developer.slug }));
}

export async function generateMetadata({ params }: DeveloperProfilePageProps): Promise<Metadata> {
  const { slug } = await params;
  const developer = await getDeveloperBySlug(slug);

  if (!developer) {
    return {
      title: "Developer Not Found",
      robots: { index: false, follow: false },
    };
  }

  const title = `${developer.name} Developer Profile`;
  const description = `${developer.description} View current and upcoming projects in Sri Lanka.`;
  const canonicalPath = `/developers/${developer.slug}`;

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
      type: "profile",
      images: [
        {
          url: developer.logo,
          alt: developer.name,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [developer.logo],
    },
  };
}

export default async function DeveloperProfilePage({ params }: DeveloperProfilePageProps) {
  const { slug } = await params;
  const developer = await getDeveloperBySlug(slug);
  if (!developer) return notFound();

  const allProjects = await getAllProjects();
  const developerProjects = allProjects.filter((p) => p.developerSlug === slug);

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: developer.name,
    description: developer.description,
    url: toAbsoluteUrl(`/developers/${developer.slug}`),
    logo: developer.logo,
    foundingDate: String(developer.establishedYear),
    location: {
      "@type": "Place",
      name: developer.location,
    },
    contactPoint: {
      "@type": "ContactPoint",
      telephone: developer.phone,
      email: developer.email,
      contactType: "sales",
      areaServed: "LK",
    },
    sameAs: [developer.website],
  };

  return (
    <div className="developer-page">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <DeveloperProfileView developer={developer} projects={developerProjects} />
    </div>
  );
}
