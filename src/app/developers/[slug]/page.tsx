import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DeveloperProfile, ProjectCard } from "@/components/marketplace/components";
import { developers } from "@/data/developers";
import { projects } from "@/data/projects";
import { toAbsoluteUrl } from "@/lib/seo";

type DeveloperProfilePageProps = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return developers.map((developer) => ({ slug: developer.slug }));
}

export async function generateMetadata({ params }: DeveloperProfilePageProps): Promise<Metadata> {
  const { slug } = await params;
  const developer = developers.find((d) => d.slug === slug);

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
  const developer = developers.find((d) => d.slug === slug);
  if (!developer) return notFound();

  const currentProjects = projects.filter((p) => p.developerSlug === slug && p.status !== "Coming Soon");
  const upcomingProjects = projects.filter((p) => p.developerSlug === slug && p.status === "Coming Soon");
  const completedProjects = [
    `${developer.name} Residences One`,
    `${developer.name} Lakeside Tower`,
  ];

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
    <div className="space-y-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <DeveloperProfile developer={developer} />

      <section className="space-y-3">
        <h2 className="text-2xl font-semibold">Current Projects</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {currentProjects.length ? currentProjects.map((p) => <ProjectCard key={p.slug} project={p} />) : <p className="text-sm text-stone-600">No current projects.</p>}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-2xl font-semibold">Upcoming Projects</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {upcomingProjects.length ? upcomingProjects.map((p) => <ProjectCard key={p.slug} project={p} />) : <p className="text-sm text-stone-600">No upcoming projects.</p>}
        </div>
      </section>

      <section className="space-y-3 border border-stone-200 bg-white p-4">
        <h2 className="text-2xl font-semibold">Completed Projects</h2>
        <ul className="list-disc pl-6 text-sm text-stone-700">{completedProjects.map((c) => <li key={c}>{c}</li>)}</ul>
      </section>

      <section className="space-y-3 border border-stone-200 bg-white p-4">
        <h2 className="text-2xl font-semibold">About Developer</h2>
        <p className="text-sm text-stone-700">{developer.description}</p>
      </section>
    </div>
  );
}
