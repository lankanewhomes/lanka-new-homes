import { HomeClient } from "@/components/marketplace/home-client";
import { getAllDevelopers } from "@/lib/developer-store";
import { getAllProjects } from "@/lib/project-store";

export default async function Home() {
  const [projects, developers] = await Promise.all([getAllProjects(), getAllDevelopers()]);

  return <HomeClient projects={projects} developers={developers} />;
}
