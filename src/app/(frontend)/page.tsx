import { HomeClient } from "@/components/marketplace/home-client";
import { getAllProjects } from "@/lib/project-store";

// Regenerate at most once a minute so admin edits show up without waiting for the next deploy.
export const revalidate = 60;

export default async function Home() {
  const projects = await getAllProjects();

  return <HomeClient projects={projects} />;
}
