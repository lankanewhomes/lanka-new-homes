import type { Metadata } from "next";
import { HomeV2Client } from "@/components/marketplace/home-v2-client";
import { getAllProjects } from "@/lib/project-store";
import { getAllDevelopers } from "@/lib/developer-store";
import { withSocial } from "@/lib/seo";

export const revalidate = 60;

export const metadata: Metadata = withSocial({
  title: "New Homes for Sale Across Sri Lanka",
  robots: { index: false, follow: true },
}, { path: "/home-v2" });

export default async function HomeV2() {
  const [projects, developers] = await Promise.all([getAllProjects(), getAllDevelopers()]);

  return <HomeV2Client projects={projects} developers={developers} />;
}
