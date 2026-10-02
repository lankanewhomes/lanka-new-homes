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
      <div className="fdv-box-card account-empty">
        <p>You have not saved any listings yet. Tap the heart icon on a home to save it.</p>
        <Link href="/projects" className="account-link">Browse new homes</Link>
      </div>
    );
  }

  return (
    <div className="account-card-grid account-card-grid--2">
      {projects.map((project) => (
        <article key={project.slug} className="account-home-card">
          <Link href={`/projects/${project.slug}`} className="account-home-card-media">
            <Image src={project.heroImage} alt={project.name} fill sizes="(min-width: 900px) 33vw, 100vw" className="account-home-card-img" />
          </Link>
          <Link href={`/projects/${project.slug}`} className="account-home-card-name">{project.name}</Link>
          <span className="account-home-card-meta">{project.developerName} · {project.location}</span>
          <span className="account-home-card-meta">{project.startingPriceLkr > 0 ? `From ${formatLkr(project.startingPriceLkr)}` : project.priceRange}</span>
          <div className="account-card-actions">
            <Link href={`/projects/${project.slug}`} className="account-btn account-btn--dark">View property</Link>
            <button type="button" onClick={() => toggleCompare(project.slug, "/projects")} className="account-btn">
              {isComparing(project.slug) ? "In compare" : "Compare"}
            </button>
            <button type="button" onClick={() => remove(project.slug)} className="account-btn">Remove</button>
          </div>
        </article>
      ))}
    </div>
  );
}
