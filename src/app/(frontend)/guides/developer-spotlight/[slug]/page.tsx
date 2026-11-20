import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getFeaturedData } from "@/lib/featured/store";
import { FeaturedSlot } from "@/components/featured/featured-slot";
import { FeaturedTrack } from "@/components/featured/featured-track";
import { FEATURED_DEMO } from "@/lib/featured/demo";
import { formatLkr } from "@/lib/format";

// Sponsored "Developer Spotlight" article template (add-on "sponsored article", Rs. 35,000 one-time). One template, filled from the developer's
// own record and projects; always labelled Sponsored. Never indexed unless it is a real booking (see FEATURED_DEMO).
export const revalidate = 60;

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const { developers } = await getFeaturedData();
  const developer = developers.find((entry) => entry.slug === slug);
  return { title: developer ? `Developer Spotlight: ${developer.name}` : "Developer Spotlight", robots: { index: false, follow: false } };
}

export default async function DeveloperSpotlightPage({ params }: Props) {
  const { slug } = await params;
  const { state, projects, developers } = await getFeaturedData();
  const developer = developers.find((entry) => entry.slug === slug);
  const booking = state.bookings.find((entry) => entry.type === "sponsored-article" && entry.developerSlug === slug);
  if (!developer || !booking) return notFound();
  const own = projects.filter((project) => project.developerSlug === slug && project.isPublished !== false && project.heroImage).slice(0, 4);
  const lead = own[0];
  return (
    <article className="fp-article">
      <FeaturedTrack placement="guide-spotlight" developer={slug} projectSlug={lead?.slug} demo={FEATURED_DEMO}>
        <p><span className="fp-sponsored">Sponsored</span>{FEATURED_DEMO ? <span className="fp-demo-flag">DEMO</span> : null}</p>
        <h1>{booking.creative?.headline ?? `Developer Spotlight: ${developer.name}`}</h1>
        <p className="fp-lede">{developer.description}</p>
        {lead ? <Image className="fp-hero" src={booking.creative?.image || lead.heroImage} alt={developer.name} width={1200} height={675} sizes="(max-width: 860px) 100vw, 820px" unoptimized priority /> : null}

        <h2>About {developer.name}</h2>
        <p>
          {developer.name}{developer.location ? ` is based in ${developer.location}` : ""}
          {developer.establishedYear ? ` and has been building since ${developer.establishedYear}` : ""}. {developer.activeProjects} active {developer.activeProjects === 1 ? "development" : "developments"} and {developer.completedProjects} completed.
        </p>

        {own.length ? <h2>Projects to look at</h2> : null}
        {own.map((project) => (
          <p key={project.slug}>
            <Link href={`/projects/${project.slug}`} className="underline"><strong>{project.name}</strong></Link>
            {` — ${[project.location, project.type, project.status].filter(Boolean).join(", ")}${project.startingPriceLkr > 0 ? `, from ${formatLkr(project.startingPriceLkr)}` : ""}.`}
          </p>
        ))}
        <p><Link href={`/developers/${developer.slug}`} className="underline">See every project by {developer.name}</Link></p>
        <p className="fp-article-disclosure">Sponsored content: this article was paid for by {developer.name}. LankaNewHomes does not verify the claims made by sponsors beyond the project details published on their listings.</p>
      </FeaturedTrack>
      <FeaturedSlot placement="guide-end" context={{ limit: 3 }} />
    </article>
  );
}
