import { HomeClient } from "@/components/marketplace/home-client";
import { getAllProjects } from "@/lib/project-store";
import { getAllLands } from "@/lib/land-store";
import { landToProjectShape } from "@/lib/land-to-project";

// Regenerate at most once a minute so admin edits show up without waiting for the next deploy.
export const revalidate = 60;

export default async function Home() {
  const [projects, lands] = await Promise.all([getAllProjects(), getAllLands()]);

  return <HomeClient projects={projects} lands={lands.map(landToProjectShape)} />;
}
