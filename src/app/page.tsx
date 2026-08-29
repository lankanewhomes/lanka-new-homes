import { HomeClient } from "@/components/marketplace/home-client";
import { getAllProjects } from "@/lib/project-store";

export default async function Home() {
  const projects = await getAllProjects();

  return <HomeClient projects={projects} />;
}
