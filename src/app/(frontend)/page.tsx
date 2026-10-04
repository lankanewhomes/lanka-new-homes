import { HomeClient } from "@/components/marketplace/home-client";
import { getAllProjects } from "@/lib/project-store";
import { getAllLands } from "@/lib/land-store";
import { getAllDevelopers } from "@/lib/developer-store";
import { landToProjectShape } from "@/lib/land-to-project";
import { newListingsCutoff } from "@/lib/new-listings";

// Regenerate at most once a minute so admin edits show up without waiting for the next deploy.
export const revalidate = 60;

export default async function Home() {
  const [projects, lands, developers] = await Promise.all([getAllProjects(), getAllLands(), getAllDevelopers()]);

  // Computed here, on the server, so the cached HTML and the client's hydration
  // pass share one cutoff for the 30-day New listings window (see lib/new-listings.ts).
  // Every land plot we know of: plots listed one by one, plus the developer-published plot count of lands that have no rows.
  const landPlotTotal = lands.reduce((total, land) => total + ((land.plots ?? []).length || land.plotCount || 0), 0);

  return <HomeClient projects={projects} lands={lands.map(landToProjectShape)} landPlotTotal={landPlotTotal} developers={developers} newListingsSince={newListingsCutoff()} />;
}
