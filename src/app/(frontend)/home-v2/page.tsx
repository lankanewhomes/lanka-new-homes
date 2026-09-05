import type { Metadata } from "next";
import { HomeV2Client } from "@/components/marketplace/home-v2-client";
import { getAllProjects } from "@/lib/project-store";
import { getAllDevelopers } from "@/lib/developer-store";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "New Homes for Sale Across Sri Lanka",
  robots: { index: false, follow: true },
};

export default async function HomeV2() {
  const [projects, developers] = await Promise.all([getAllProjects(), getAllDevelopers()]);

  return <HomeV2Client projects={projects} developers={developers} />;
}
