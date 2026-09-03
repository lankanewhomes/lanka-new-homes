import type { Metadata } from "next";
import { DeveloperCard } from "@/components/marketplace/components";
import { getAllDevelopers } from "@/lib/developer-store";

// Regenerate at most once a minute so admin edits show up without waiting for the next deploy.
export const revalidate = 60;

export const metadata: Metadata = {
  title: "Developer Directory in Sri Lanka",
  description: "Explore real estate developers building new apartment projects in Sri Lanka and compare their active and completed developments.",
  alternates: {
    canonical: "/developers",
  },
  openGraph: {
    title: "Developer Directory in Sri Lanka",
    description: "Explore real estate developers building new apartment projects in Sri Lanka and compare their active and completed developments.",
    url: "/developers",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Developer Directory in Sri Lanka",
    description: "Explore real estate developers building new apartment projects in Sri Lanka and compare their active and completed developments.",
  },
};

export default async function DevelopersPage() {
  const allDevelopers = await getAllDevelopers();
  const developers = Array.from(
    allDevelopers.reduce((unique, developer) => {
      const key = developer.name.trim().toLowerCase();
      const current = unique.get(key);
      const currentScore = current
        ? current.activeProjects + current.completedProjects + Number(Boolean(current.location)) + Number(Boolean(current.description))
        : -1;
      const nextScore = developer.activeProjects + developer.completedProjects + Number(Boolean(developer.location)) + Number(Boolean(developer.description));

      if (!current || nextScore > currentScore) unique.set(key, developer);
      return unique;
    }, new Map<string, (typeof allDevelopers)[number]>()).values(),
  );

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-semibold">Developer Directory</h1>
      <p className="text-sm text-stone-600">Companies developing new residential apartment projects in Sri Lanka.</p>
      <div className="grid gap-4 md:grid-cols-2">
        {developers.map((developer) => <DeveloperCard key={developer.slug} developer={developer} />)}
      </div>
    </div>
  );
}
