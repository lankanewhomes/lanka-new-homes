import type { Metadata } from "next";
import { getAllProjects } from "@/lib/project-store";
import { slimForHome } from "@/lib/home-slim";
import { Lanka360Client } from "@/components/marketplace/lanka360-client";

// Regenerate at most once a minute so new/changed listings show up without waiting for a deploy.
export const revalidate = 60;

export const metadata: Metadata = {
  title: "Lanka360: 3D Map of New Homes in Sri Lanka",
  description: "Explore new apartments and homes in Sri Lanka on an interactive 3D map. Click a city to zoom in and see its listings, with prices, floor plans and photos.",
  alternates: { canonical: "/lanka360" },
};

export default async function Lanka360Page() {
  // Slimmed to what the listing cards read (full records would add megabytes to the page).
  const projects = (await getAllProjects()).map(slimForHome);
  return <Lanka360Client projects={projects} />;
}
