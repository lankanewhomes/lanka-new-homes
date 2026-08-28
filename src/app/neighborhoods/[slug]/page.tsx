import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { MapPin } from "lucide-react";
import { getAllNeighborhoods, getNeighborhoodBySlug } from "@/lib/neighborhood-store";
import { getAllProjects } from "@/lib/project-store";
import { formatLkr } from "@/lib/format";
import { toAbsoluteUrl } from "@/lib/seo";

type NeighborhoodPageProps = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  const neighborhoods = await getAllNeighborhoods();
  return neighborhoods.map((neighborhood) => ({ slug: neighborhood.slug }));
}

export async function generateMetadata({ params }: NeighborhoodPageProps): Promise<Metadata> {
  const { slug } = await params;
  const neighborhood = await getNeighborhoodBySlug(slug);

  if (!neighborhood) {
    return { title: "Neighborhood Not Found", robots: { index: false, follow: false } };
  }

  const title = `${neighborhood.name} Neighborhood Guide - New Homes in ${neighborhood.city}`;
  const canonicalPath = `/neighborhoods/${neighborhood.slug}`;

  return {
    title,
    description: neighborhood.description,
    alternates: { canonical: canonicalPath },
    openGraph: {
      title,
      description: neighborhood.description,
      url: canonicalPath,
      images: [{ url: neighborhood.heroImage, alt: neighborhood.name }],
    },
  };
}

export default async function NeighborhoodPage({ params }: NeighborhoodPageProps) {
  const { slug } = await params;
  const neighborhood = await getNeighborhoodBySlug(slug);
  if (!neighborhood) return notFound();

  const allProjects = await getAllProjects();
  const neighborhoodProjects = allProjects.filter((project) => project.neighborhoodSlug === slug);

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Place",
    name: neighborhood.name,
    description: neighborhood.description,
    url: toAbsoluteUrl(`/neighborhoods/${neighborhood.slug}`),
    image: neighborhood.heroImage,
    address: { "@type": "PostalAddress", addressLocality: neighborhood.city, addressRegion: neighborhood.province, addressCountry: "LK" },
  };

  return (
    <div className="developer-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />

      <section className="neighborhood-hero" aria-label={`${neighborhood.name} overview`}>
        <div className="neighborhood-hero-media">
          <Image src={neighborhood.heroImage} alt={neighborhood.name} fill priority sizes="100vw" />
          <div className="neighborhood-hero-overlay" />
        </div>
        <div className="neighborhood-hero-panel">
          <h1>{neighborhood.name}</h1>
          <p className="neighborhood-hero-location"><MapPin size={14} aria-hidden="true" />{neighborhood.city}, {neighborhood.province}</p>
        </div>
      </section>

      <div className="developer-content">
        <section className="developer-about" style={{ background: "#fff", border: "1px solid #ece4d4" }}>
          <h2>About {neighborhood.name}</h2>
          <p>{neighborhood.description}</p>
        </section>

        <section className="developer-projects-section">
          <h2>New homes in {neighborhood.name}</h2>
          {neighborhoodProjects.length === 0 ? (
            <p className="developer-empty-note">No projects listed in this neighborhood yet.</p>
          ) : (
            <div className="home-card-grid developer-projects-grid">
              {neighborhoodProjects.map((project) => (
                <Link href={`/projects/${project.slug}`} className="home-project-card" key={project.slug}>
                  <div className="home-project-image-wrap">
                    <Image src={project.heroImage} alt={project.name} width={640} height={390} />
                    <span className="developer-status-badge">{project.status}</span>
                  </div>
                  <h3>{project.name}</h3>
                  <p>{project.status === "Coming Soon" ? "Register now" : `From ${formatLkr(project.startingPriceLkr)}`}</p>
                  <div className="home-card-meta"><MapPin size={13} /><small>{project.location}</small></div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
