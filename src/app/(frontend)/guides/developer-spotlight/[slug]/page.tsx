import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getFeaturedData } from "@/lib/featured/store";
import { FeaturedSlot } from "@/components/featured/featured-slot";
import { FeaturedTrack } from "@/components/featured/featured-track";
import { FEATURED_DEMO } from "@/lib/featured/demo";
import { ListingGridCard } from "@/components/marketplace/listing-page";

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
  const headline = booking.creative?.headline ?? `Developer Spotlight: ${developer.name}`;
  const image = booking.creative?.image || lead?.heroImage;
  // Same contained-box layout as the guide pages (GuidePageShell): dark split hero, then tinted boxes. Always labelled Sponsored.
  return (
    <article className="fdv-page guides-page guide-detail fp-spotlight">
      <FeaturedTrack placement="guide-spotlight" developer={slug} projectSlug={lead?.slug} demo={FEATURED_DEMO}>
        <section className="fdv-hero fdv-hero--split" aria-label={headline}>
          <div className="fdv-hero-split-inner">
            <div className="fdv-hero-content">
              <p className="fp-spotlight-label"><span className="fp-sponsored">Sponsored</span>{FEATURED_DEMO ? <span className="fp-demo-flag">DEMO</span> : null}</p>
              <h1 className="fdv-hero-headline">{headline}</h1>
              <p className="fdv-hero-sub">{developer.description}</p>
              <div className="fdv-hero-ctas">
                <Link href={`/developers/${developer.slug}`} className="fdv-cta-final-button">See all projects</Link>
                <Link href="/guides" className="fdv-cta-secondary fdv-hero-explore-link">All guides</Link>
              </div>
            </div>
            {image ? (
              <div className="fp-spotlight-media">
                <Image src={image} alt={developer.name} width={1200} height={800} sizes="(max-width: 900px) 100vw, 560px" unoptimized priority />
              </div>
            ) : null}
          </div>
        </section>

        <section className="fdv-box fdv-box--gray" aria-label={`About ${developer.name}`}>
          <div className="wdx-section-head">
            <h2>About {developer.name}.</h2>
          </div>
          <div className="fdv-box-card guide-detail-card">
            <p>
              {developer.name}{developer.location ? ` is based in ${developer.location}` : ""}
              {developer.establishedYear ? ` and has been building since ${developer.establishedYear}` : ""}. {developer.activeProjects} active {developer.activeProjects === 1 ? "development" : "developments"} and {developer.completedProjects} completed.
            </p>
          </div>
        </section>

        {own.length ? (
          <section className="fdv-box fdv-box--cream fp-box" aria-label="Projects to look at">
            <div className="wdx-section-head">
              <h2>Projects to look at.</h2>
              <p>New homes by {developer.name} on LankaNewHomes.</p>
            </div>
            <div className="fp-box-grid">
              {own.map((project) => <ListingGridCard key={project.slug} project={project} />)}
            </div>
            <p className="fp-spotlight-more"><Link href={`/developers/${developer.slug}`} className="fdv-cta-primary">See every project by {developer.name}</Link></p>
          </section>
        ) : null}
      </FeaturedTrack>

      <FeaturedSlot placement="guide-end" context={{ limit: 3 }} />

      <section className="fdv-box fdv-box--lilac" aria-label="Sponsored content">
        <p className="fp-spotlight-disclosure">Sponsored content: this article was paid for by {developer.name}. LankaNewHomes does not verify the claims made by sponsors beyond the project details published on their listings.</p>
      </section>
    </article>
  );
}
