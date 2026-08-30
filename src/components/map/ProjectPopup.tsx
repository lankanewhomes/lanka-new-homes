"use client";

import Image from "next/image";
import Link from "next/link";
import { X } from "lucide-react";
import { formatLkr } from "@/lib/format";
import type { Project } from "@/types";

function badgeInfo(project: Project) {
  if (project.status === "Coming Soon" || project.status === "Launching Soon") return { label: "Pre-Construction", tone: "status" as const };
  return { label: project.status, tone: "status" as const };
}

export function ProjectPopup({ project, basePath, onClose }: { project: Project; basePath: string; onClose: () => void }) {
  const photoLabel = project.gallery?.[0]?.label || "Exterior";
  const isNewListing = Boolean(project.isMoveInNow || project.isFeatured);
  const badge = badgeInfo(project);
  const meta = [project.location, project.startingPriceLkr > 0 ? formatLkr(project.startingPriceLkr) : project.status].filter(Boolean).join(" · ");
  const facts = [
    project.bedrooms && project.bedrooms !== "-" ? `${project.bedrooms} bd` : null,
    project.floorAreaRange && project.floorAreaRange !== "-" ? `${project.floorAreaRange} SqFt` : null,
  ].filter(Boolean).join(" · ");

  return (
    <Link href={`${basePath}/${project.slug}`} className="project-popup">
      <div className="project-popup-media">
        <Image src={project.heroImage} alt={project.name} width={210} height={130} className="project-popup-image" />
        <button
          type="button"
          className="project-popup-close"
          aria-label="Close"
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            onClose();
          }}
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
        <span className="project-popup-credit">PHOTO · {photoLabel}</span>
      </div>

      <div className="project-popup-body">
        <div className="project-popup-title-row">
          <p className="project-popup-title">{project.name}</p>
          <span className={`project-popup-badge project-popup-badge-${badge.tone}`}>{badge.label}</span>
        </div>

        <p className="project-popup-meta">{meta}</p>
        {facts ? <p className="project-popup-facts">{facts}</p> : null}

        {isNewListing ? <p className="project-popup-tag">New listing</p> : null}

        <div className="project-popup-divider" />

        <span className="project-popup-view-link">View listing →</span>
      </div>
    </Link>
  );
}
