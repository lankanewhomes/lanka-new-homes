"use client";

import Image from "next/image";
import Link from "next/link";
import { BedDouble, Ruler, X } from "lucide-react";
import { formatLkr } from "@/lib/format";
import type { Project } from "@/types";

function statusPillLabel(project: Project) {
  if (project.status === "Coming Soon" || project.status === "Launching Soon") return "Preconstruction";
  if (project.isMoveInNow) return "Move In Now";
  if (project.completionYear) return `Move In ${project.completionYear}`;
  return project.status;
}

export function ProjectPopup({ project, basePath, onClose }: { project: Project; basePath: string; onClose: () => void }) {
  const hasPrice = project.startingPriceLkr > 0;

  return (
    <Link href={`${basePath}/${project.slug}`} className="project-popup">
      <div className="project-popup-media">
        <Image src={project.heroImage} alt={project.name} width={210} height={158} className="project-popup-image" />
        <span className="project-popup-status">{statusPillLabel(project)}</span>
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
      </div>

      <div className="project-popup-body">
        <p className="project-popup-name">{project.name}</p>
        <p className="project-popup-price">{hasPrice ? `From ${formatLkr(project.startingPriceLkr)}` : project.status}</p>
        <p className="project-popup-agency">{project.developerName}</p>
        <p className="project-popup-address">{project.location}</p>

        <div className="project-popup-facts-row">
          <span className="project-popup-fact">
            <BedDouble className="h-3.5 w-3.5" aria-hidden="true" />
            {project.bedrooms && project.bedrooms !== "-" ? `${project.bedrooms} bd` : "—"}
          </span>
          <span className="project-popup-fact-divider">|</span>
          <span className="project-popup-fact">
            <Ruler className="h-3.5 w-3.5" aria-hidden="true" />
            {project.floorAreaRange && project.floorAreaRange !== "-" ? `${project.floorAreaRange} SqFt` : "—"}
          </span>
        </div>
      </div>
    </Link>
  );
}
