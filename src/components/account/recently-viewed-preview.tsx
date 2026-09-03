"use client";

import Image from "next/image";
import Link from "next/link";
import { useRecentViews } from "@/lib/use-recent-views";
import { formatLkr } from "@/lib/format";

// Recently viewed is tracked by an anonymous session id in localStorage
// (project_views table), not the signed-in user id — see use-recent-views.ts
// — so this section is a small client island inside an otherwise
// server-rendered dashboard page.
export function RecentlyViewedPreview() {
  const { projects, loading } = useRecentViews();

  if (loading) return null;

  if (projects.length === 0) {
    return <p className="text-xs text-stone-500">You haven&apos;t viewed any projects yet.</p>;
  }

  return (
    <div className="space-y-2">
      {projects.slice(0, 3).map((project) => (
        <Link key={project.slug} href={`/projects/${project.slug}`} className="flex items-center gap-3">
          <div className="relative h-12 w-12 shrink-0 overflow-hidden border border-stone-200 bg-stone-100">
            <Image src={project.heroImage} alt={project.name} fill className="object-cover" sizes="48px" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-stone-900">{project.name}</p>
            <p className="text-xs text-stone-500">{project.startingPriceLkr > 0 ? formatLkr(project.startingPriceLkr) : project.location}</p>
          </div>
        </Link>
      ))}
    </div>
  );
}
