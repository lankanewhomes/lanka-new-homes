import type { Metadata } from "next";
import { DeveloperCard } from "@/components/marketplace/components";
import { getAllDevelopers } from "@/lib/developer-store";

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
  const developers = await getAllDevelopers();

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
