import type { Metadata } from "next";
import { getAllProjects } from "@/lib/project-store";
import { toLanka360Project, type Lanka360Project } from "@/lib/lanka360";
import { Lanka360Client } from "@/components/marketplace/lanka360-client";

// Regenerate at most once a minute so new/changed listings show up without waiting for a deploy.
export const revalidate = 60;

export const metadata: Metadata = {
  title: "Lanka360: 3D Map of New Homes in Sri Lanka",
  description: "Explore new apartments and homes in Sri Lanka on an interactive 3D map. Filter by city, type, status, bedrooms and price, and see every project's location in the city around it.",
  alternates: { canonical: "/lanka360" },
};

export default async function Lanka360Page() {
  const projects = (await getAllProjects()).map(toLanka360Project).filter((p): p is Lanka360Project => p !== null);
  return <Lanka360Client projects={projects} />;
}
