"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import { useCompare } from "@/lib/use-compare";
import { formatLkr } from "@/lib/format";
import type { Project } from "@/types";

export function SavedPropertiesList({ userId, initialProjects }: { userId: string; initialProjects: Project[] }) {
  const [projects, setProjects] = useState(initialProjects);
  const { isComparing, toggle: toggleCompare } = useCompare();

  const remove = async (slug: string) => {
    const supabase = createSupabaseBrowserClient();
    await supabase.from("saved_listings").delete().eq("user_id", userId).eq("project_slug", slug);
    setProjects((prev) => prev.filter((project) => project.slug !== slug));
  };

  if (projects.length === 0) {
    return (
      <p style={{ marginTop: 24 }}>
        You haven&apos;t saved any listings yet. <Link href="/projects">Browse new homes</Link> and tap the heart icon to save one.
      </p>
    );
  }

  return (
    <div className="mt-6 space-y-3">
      {projects.map((project) => (
        <article key={project.slug} className="grid gap-3 border border-stone-200 bg-white p-3 sm:grid-cols-[140px_1fr_auto]">
          <div className="relative h-24 w-full overflow-hidden border border-stone-200 bg-stone-100 sm:h-full">
            <Image src={project.heroImage} alt={project.name} fill className="object-cover" sizes="140px" />
          </div>
          <div className="min-w-0 space-y-1">
            <p className="font-semibold text-stone-900">{project.name}</p>
            <p className="text-sm text-stone-600">{project.developerName} • {project.location}</p>
            <p className="text-sm text-stone-800">{project.startingPriceLkr > 0 ? `From ${formatLkr(project.startingPriceLkr)}` : project.priceRange}</p>
          </div>
          <div className="flex flex-row flex-wrap items-start gap-2 sm:flex-col sm:justify-start">
            <Link href={`/projects/${project.slug}`} className="border border-stone-900 bg-stone-900 px-3 py-1.5 text-center text-xs font-medium text-white hover:bg-stone-800">
              View property
            </Link>
            <button
              type="button"
              onClick={() => toggleCompare(project.slug, "/projects")}
              className={`border px-3 py-1.5 text-xs font-medium ${isComparing(project.slug) ? "border-stone-900 bg-stone-100 text-stone-900" : "border-stone-300 text-stone-700 hover:bg-stone-50"}`}
            >
              {isComparing(project.slug) ? "In compare" : "Compare"}
            </button>
            <button type="button" onClick={() => remove(project.slug)} className="border border-stone-300 px-3 py-1.5 text-xs font-medium text-stone-700 hover:bg-stone-50">
              Remove
            </button>
          </div>
        </article>
      ))}
    </div>
  );
}
