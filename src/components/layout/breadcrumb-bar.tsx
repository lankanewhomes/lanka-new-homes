"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { projects } from "@/data/projects";

function toTitleCase(segment: string): string {
  return decodeURIComponent(segment)
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function getSegmentLabel(segments: string[], index: number): string {
  if (segments[index - 1] === "projects") {
    return projects.find((project) => project.slug === segments[index])?.name ?? toTitleCase(segments[index]);
  }

  if (segments[index] === "floor-plans") return "Floor Plans";

  if (segments[index - 1] === "floor-plans") {
    const project = projects.find((item) => item.slug === segments[index - 3]);
    return project?.floorPlans.find((plan) => plan.id === segments[index])?.planName ?? toTitleCase(segments[index]);
  }

  return toTitleCase(segments[index]);
}

export function BreadcrumbBar() {
  const pathname = usePathname();

  if (!pathname || pathname === "/") {
    return null;
  }

  const segments = pathname.split("/").filter(Boolean);

  return (
    <nav className="site-breadcrumb" aria-label="Breadcrumb">
      <div className="site-breadcrumb-inner">
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
                  <span aria-current="page">{getSegmentLabel(segments, index)}</span>
                ) : (
                  <Link href={href}>{getSegmentLabel(segments, index)}</Link>
                )}
              </li>
            );
          })}
        </ol>
      </div>
    </nav>
  );
}
