import type { Metadata } from "next";
import Link from "next/link";
import { getAllDevelopers } from "@/lib/developer-store";
import { getAllProjects } from "@/lib/project-store";
import { getAllNeighborhoods } from "@/lib/neighborhood-store";

export const metadata: Metadata = {
  title: "Sitemap",
  alternates: { canonical: "/sitemap" },
};

export default async function SitemapPage() {
  const [developers, projects, neighborhoods] = await Promise.all([
    getAllDevelopers(),
    getAllProjects(),
    getAllNeighborhoods(),
  ]);

  return (
    <div className="static-page-shell">
      <h1>Sitemap</h1>

      <h2>Main</h2>
      <ul>
        <li><Link href="/">Home</Link></li>
        <li><Link href="/projects">Projects</Link></li>
        <li><Link href="/developers">Developers</Link></li>
        <li><Link href="/construction-companies">Construction Companies</Link></li>
      </ul>

      <h2>Company</h2>
      <ul>
        <li><Link href="/about">About</Link></li>
        <li><Link href="/contact">Contact</Link></li>
        <li><Link href="/blog">Blog</Link></li>
        <li><Link href="/privacy">Privacy Policy</Link></li>
        <li><Link href="/terms">Terms of Service</Link></li>
      </ul>

      <h2>Projects</h2>
      <ul>
        {projects.map((project) => <li key={project.slug}><Link href={`/projects/${project.slug}`}>{project.name}</Link></li>)}
      </ul>

      <h2>Developers</h2>
      <ul>
        {developers.map((developer) => <li key={developer.slug}><Link href={`/developers/${developer.slug}`}>{developer.name}</Link></li>)}
      </ul>

      {neighborhoods.length > 0 ? (
        <>
          <h2>Neighborhoods</h2>
          <ul>
            {neighborhoods.map((neighborhood) => <li key={neighborhood.slug}><Link href={`/neighborhoods/${neighborhood.slug}`}>{neighborhood.name}</Link></li>)}
          </ul>
        </>
      ) : null}
    </div>
  );
}
