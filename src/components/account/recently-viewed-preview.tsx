"use client";

import Image from "next/image";
import Link from "next/link";
import { useRecentViews } from "@/lib/use-recent-views";
import { formatLkr } from "@/lib/format";

// Recently viewed is tracked by an anonymous session id in localStorage
// (project_views table), not the signed-in user id — see use-recent-views.ts
// — so this section is a small client island inside an otherwise
// server-rendered dashboard page. Renders the same image cards as the
// "Saved homes" box (.account-home-card) so the dashboard reads as one design.
export function RecentlyViewedPreview() {
  const { projects, loading } = useRecentViews();

  if (loading) return null;

  if (projects.length === 0) {
    return (
      <div className="fdv-box-card account-empty">
        <p>You have not viewed any projects yet.</p>
        <Link href="/projects" className="account-link">Browse new homes</Link>
      </div>
    );
  }

  return (
    <>
      {projects.slice(0, 3).map((project) => (
        <Link key={project.slug} href={`/projects/${project.slug}`} className="account-home-card">
          <span className="account-home-card-media">
            <Image src={project.heroImage} alt={project.name} fill sizes="(min-width: 900px) 33vw, 100vw" className="account-home-card-img" />
          </span>
          <span className="account-home-card-name">{project.name}</span>
          <span className="account-home-card-meta">
            {project.startingPriceLkr > 0 ? `From ${formatLkr(project.startingPriceLkr)}` : project.location}
          </span>
        </Link>
      ))}
    </>
  );
}
