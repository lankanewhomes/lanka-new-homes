"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Globe, Minus, Plus } from "lucide-react";
import { formatLkr } from "@/lib/format";
import type { Project } from "@/types";

// Visual map layer only — pin positions are derived deterministically from
// project coordinates so they stay stable across renders, not from a real
// map SDK. Swap in a real map provider here later; the surrounding page
// content (ListingGridCard list) is the actual indexable content.
function pinPosition(lat: number, lng: number, seed: number) {
  const top = 10 + (Math.abs(Math.sin(lat * 37 + seed)) * 76);
  const left = 8 + (Math.abs(Math.cos(lng * 41 + seed)) * 82);
  return { top, left };
}

type Cluster = { top: number; left: number; projects: Project[] };

const BOUNDARY_POINTS = "18,10 55,4 78,14 92,20 88,38 94,52 84,66 70,78 52,92 34,86 22,74 10,60 6,38 12,22";

function clusterProjects(projects: Project[]): Cluster[] {
  const points = projects.map((project, index) => {
    const lat = project.coordinates?.lat ?? 6.9271;
    const lng = project.coordinates?.lng ?? 79.8612;
    return { project, ...pinPosition(lat, lng, index) };
  });

  const clusters: Cluster[] = [];
  const RADIUS = 6;

  for (const point of points) {
    const existing = clusters.find((cluster) => Math.hypot(cluster.top - point.top, cluster.left - point.left) < RADIUS);
    if (existing) {
      existing.projects.push(point.project);
      existing.top = (existing.top * (existing.projects.length - 1) + point.top) / existing.projects.length;
      existing.left = (existing.left * (existing.projects.length - 1) + point.left) / existing.projects.length;
    } else {
      clusters.push({ top: point.top, left: point.left, projects: [point.project] });
    }
  }

  return clusters;
}

function pinSizeClass(count: number) {
  if (count >= 20) return "lg";
  if (count >= 5) return "md";
  return "sm";
}

export function MapPane({ projects }: { projects: Project[] }) {
  const [zoom, setZoom] = useState(1);
  const [boundaryOn, setBoundaryOn] = useState(true);
  const [activeClusterIndex, setActiveClusterIndex] = useState<number | null>(null);
  const [popupProjectSlug, setPopupProjectSlug] = useState<string | null>(null);

  const clusters = useMemo(() => clusterProjects(projects), [projects]);
  const activeCluster = activeClusterIndex !== null ? clusters[activeClusterIndex] : null;
  const popupProject = useMemo(
    () => (popupProjectSlug ? projects.find((project) => project.slug === popupProjectSlug) ?? null : activeCluster && activeCluster.projects.length === 1 ? activeCluster.projects[0] : null),
    [popupProjectSlug, projects, activeCluster]
  );

  return (
    <div className="listing-map" style={{ ["--map-zoom" as string]: zoom }}>
      {boundaryOn ? (
        <button type="button" className="listing-map-remove-boundary" onClick={() => setBoundaryOn(false)}>
          Remove boundary
        </button>
      ) : (
        <button type="button" className="listing-map-remove-boundary" onClick={() => setBoundaryOn(true)}>
          Add boundary
        </button>
      )}

      <div className="listing-map-canvas">
        {boundaryOn ? (
          <svg className="listing-map-boundary" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
            <polygon points={BOUNDARY_POINTS} />
          </svg>
        ) : null}

        {clusters.map((cluster, index) => (
          <button
            key={`${cluster.top}-${cluster.left}`}
            type="button"
            className={`listing-map-pin listing-map-pin-${pinSizeClass(cluster.projects.length)}${activeClusterIndex === index ? " active" : ""}`}
            style={{ top: `${cluster.top}%`, left: `${cluster.left}%` }}
            onClick={() => {
              setActiveClusterIndex((current) => (current === index ? null : index));
              setPopupProjectSlug(null);
            }}
            aria-label={cluster.projects.length === 1 ? `View ${cluster.projects[0].name}` : `${cluster.projects.length} projects in this area`}
          >
            {cluster.projects.length}
          </button>
        ))}

        {projects.length === 0 ? <p className="listing-map-empty">No pins to show yet for this area.</p> : null}
      </div>

      <div className="listing-map-controls">
        <button type="button" onClick={() => setZoom((z) => Math.min(z + 0.15, 1.6))} aria-label="Zoom in"><Plus className="h-4 w-4" /></button>
        <button type="button" onClick={() => setZoom((z) => Math.max(z - 0.15, 0.7))} aria-label="Zoom out"><Minus className="h-4 w-4" /></button>
        <button type="button" aria-label="Map layers"><Globe className="h-4 w-4" /></button>
      </div>

      {activeCluster && activeCluster.projects.length > 1 && !popupProject ? (
        <div className="listing-map-cluster-list" role="dialog" aria-label={`${activeCluster.projects.length} projects`}>
          <button type="button" className="listing-map-popup-close" onClick={() => setActiveClusterIndex(null)} aria-label="Close">×</button>
          <p className="listing-map-cluster-list-title">{activeCluster.projects.length} projects</p>
          <ul>
            {activeCluster.projects.map((project) => (
              <li key={project.slug}>
                <button type="button" onClick={() => setPopupProjectSlug(project.slug)}>{project.name}</button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {popupProject ? (
        <div className="listing-map-popup" role="dialog" aria-label={popupProject.name}>
          <button
            type="button"
            className="listing-map-popup-close"
            onClick={() => {
              setPopupProjectSlug(null);
              setActiveClusterIndex(null);
            }}
            aria-label="Close"
          >
            ×
          </button>
          <Image src={popupProject.heroImage} alt={`${popupProject.name} in ${popupProject.location}`} width={220} height={140} className="listing-map-popup-image" />
          <div className="listing-map-popup-body">
            <p className="listing-map-popup-name">{popupProject.name}</p>
            <p className="listing-map-popup-price">From {formatLkr(popupProject.startingPriceLkr)}</p>
            <Link href={`/projects/${popupProject.slug}`} className="listing-map-popup-link">View Project</Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}
