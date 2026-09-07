"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { projects as staticProjects } from "@/data/projects";
import { mapSidebarRoutes } from "@/lib/listing-categories";
import type { Project } from "@/types";

function toTitleCase(segment: string): string {
  return decodeURIComponent(segment)
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function getSegmentLabel(segments: string[], index: number, projects: Project[]): string {
  if (segments[index] === "projects" && segments[index - 1] === undefined) {
    return "New Projects";
  }

  if (segments[index - 1] === "projects") {
    return projects.find((project) => project.slug === segments[index])?.name ?? toTitleCase(segments[index]);
  }

  if (segments[index] === "floor-plans") return "Floor Plans";

  if (segments[index - 1] === "floor-plans") {
    const project = projects.find((item) => item.slug === segments[index - 2]);
    return project?.floorPlans.find((plan) => plan.slug === segments[index] || plan.id === segments[index])?.planName ?? toTitleCase(segments[index]);
  }

  return toTitleCase(segments[index]);
}

export function BreadcrumbBar() {
  const pathname = usePathname();
  const [projects, setProjects] = useState<Project[]>(staticProjects);

  useEffect(() => {
    fetch("/api/projects")
      .then((response) => response.json())
      .then((data) => {
        if (Array.isArray(data?.projects)) setProjects(data.projects);
      })
      .catch(() => {});
  }, []);

  if (!pathname || pathname === "/") {
    return null;
  }

  const segments = pathname.split("/").filter(Boolean);
  // The listing pages (/projects, /land, /search, and the project category
  // pages like /projects/colombo) use a wider, *capped* content container
  // (--shell-width: min(1760px, ...) in globals.css) than the rest of the
  // site — match the breadcrumb's inset to it here so "Home / ..." lines up
  // with the search bar/cards below instead of the sitewide 1290px width.
  // Exact match against the same route list the map-sidebar rail uses
  // (mapSidebarRoutes), not a prefix check — a prefix check here would also
  // catch detail pages below.
  const isWideListing = mapSidebarRoutes.includes(pathname);
  // Detail pages (/projects/[slug], /land/[slug], /neighborhoods/[slug], and
  // their sub-routes like /projects/[slug]/floor-plans/[id]). On desktop the
  // class is the sitewide 1290px container — same as the sticky section bar
  // right under the breadcrumb — so it must NOT get isWideListing's 1760px
  // shell; on mobile it carries a gutter override that tracks .listing-hero
  // (see .site-breadcrumb-inner-detail in globals.css).
  const isWideDetail = !isWideListing && (pathname.startsWith("/projects/") || pathname.startsWith("/land/") || pathname.startsWith("/neighborhoods/"));
  // Exact match only (unlike the prefix checks above) — the map sidebar
  // rail only renders on these routes, never on detail pages.
  const hasRail = mapSidebarRoutes.includes(pathname);

  return (
    <nav className={`site-breadcrumb${hasRail ? " site-breadcrumb--rail-offset" : ""}`} aria-label="Breadcrumb">
      <div className={`site-breadcrumb-inner${isWideListing ? " site-breadcrumb-inner-wide" : isWideDetail ? " site-breadcrumb-inner-detail" : ""}`}>
        <ol>
          <li>
            <Link href="/">Home</Link>
          </li>

          {segments.map((segment, index) => {
            const href = `/${segments.slice(0, index + 1).join("/")}`;
            const isLast = index === segments.length - 1;

            return (
              <li key={href}>
                <span className="site-breadcrumb-separator" aria-hidden="true">
                  /
                </span>
                {isLast ? (
                  <span aria-current="page">{getSegmentLabel(segments, index, projects)}</span>
                ) : (
                  <Link href={href}>{getSegmentLabel(segments, index, projects)}</Link>
                )}
              </li>
            );
          })}
        </ol>
      </div>
    </nav>
  );
}
