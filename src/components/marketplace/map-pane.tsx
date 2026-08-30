"use client";

import "maplibre-gl/dist/maplibre-gl.css";
import { LngLatBounds, setWorkerUrl } from "maplibre-gl";
import Map, { Marker, NavigationControl, Popup, type MapRef } from "react-map-gl/maplibre";
import { useEffect, useMemo, useRef, useState } from "react";
import { ProjectPopup } from "@/components/map/ProjectPopup";
import type { Project } from "@/types";

// maplibre-gl parses vector tiles in a Worker it constructs internally via
// a bundler-relative URL — under Next.js's webpack config that URL doesn't
// resolve correctly, so the worker throws immediately on construction and
// vector sources silently never load a single tile (raster sources still
// work fine since those don't need the worker). Pointing it at our own
// self-hosted copy sidesteps the bundler entirely. Needs BOTH files copied
// to public/ — maplibre-gl-worker.mjs imports maplibre-gl-shared.mjs, so
// copying only the entry file still fails the same way. Re-copy both from
// node_modules/maplibre-gl/dist/ after any maplibre-gl version bump.
setWorkerUrl("/maplibre-gl-worker.mjs");

const SRI_LANKA_CENTER = { longitude: 80.7718, latitude: 7.8731 };
const SRI_LANKA_ZOOM = 7;

// Free, no-signup vector basemap — OpenFreeMap serves community-hosted
// OpenStreetMap-derived vector tiles at no cost and with no API key, unlike
// Mapbox/MapTiler/Google. Swap for a paid provider's style URL later if
// this project ever needs a specific look or SLA.
const MAP_STYLE = "https://tiles.openfreemap.org/styles/liberty";

export type MapAreaSelection = { label: string; projects: Project[] } | null;

export function MapPane({ projects, basePath = "/projects", onSelectArea }: { projects: Project[]; basePath?: string; onSelectArea?: (selection: MapAreaSelection) => void }) {
  const mapRef = useRef<MapRef | null>(null);
  const [activeSlug, setActiveSlug] = useState<string | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  const pinnedProjects = useMemo(
    () => projects.filter((project) => project.coordinates?.lat != null && project.coordinates?.lng != null),
    [projects]
  );

  const activeProject = pinnedProjects.find((project) => project.slug === activeSlug) ?? null;

  // Computed once for the initial camera position — avoids a race where
  // fitBounds/flyTo gets called on the map instance before its style has
  // finished loading (silently ignored by maplibre-gl, leaving the map
  // sitting on the Sri Lanka-wide default with no tiles fetched for the
  // actual marker area). Only the multi-marker fitBounds case still needs
  // to run after load, via the mapLoaded gate below.
  const initialViewState = useMemo(() => {
    if (pinnedProjects.length === 1) {
      return { longitude: pinnedProjects[0].coordinates!.lng, latitude: pinnedProjects[0].coordinates!.lat, zoom: 12 };
    }
    return { ...SRI_LANKA_CENTER, zoom: SRI_LANKA_ZOOM };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded || pinnedProjects.length < 2) return;

    const bounds = pinnedProjects.reduce(
      (acc, project) => acc.extend([project.coordinates!.lng, project.coordinates!.lat]),
      new LngLatBounds()
    );
    map.fitBounds(bounds, { padding: 48, duration: 0, maxZoom: 13 });
  }, [pinnedProjects, mapLoaded]);

  const selectProject = (project: Project) => {
    setActiveSlug((current) => {
      const next = current === project.slug ? null : project.slug;
      onSelectArea?.(next === null ? null : { label: project.city || project.location, projects: [project] });
      return next;
    });
  };

  return (
    <div className="listing-map listing-maplibre-map">
      <Map
        ref={mapRef}
        initialViewState={initialViewState}
        mapStyle={MAP_STYLE}
        style={{ width: "100%", height: "100%" }}
        onLoad={() => setMapLoaded(true)}
      >
        <NavigationControl position="top-left" showCompass={false} />

        {pinnedProjects.map((project) => (
          <Marker
            key={project.slug}
            longitude={project.coordinates!.lng}
            latitude={project.coordinates!.lat}
            anchor="center"
            onClick={(event) => {
              event.originalEvent.stopPropagation();
              selectProject(project);
            }}
          >
            <span className={`listing-map-marker${activeSlug === project.slug ? " active" : ""}`}>1</span>
          </Marker>
        ))}

        {activeProject ? (
          <Popup
            longitude={activeProject.coordinates!.lng}
            latitude={activeProject.coordinates!.lat}
            anchor="top"
            offset={16}
            closeButton={false}
            closeOnClick={false}
            maxWidth="none"
            className="custom-popup"
            onClose={() => {
              setActiveSlug(null);
              onSelectArea?.(null);
            }}
          >
            <ProjectPopup
              project={activeProject}
              basePath={basePath}
              onClose={() => {
                setActiveSlug(null);
                onSelectArea?.(null);
              }}
            />
          </Popup>
        ) : null}
      </Map>

      {pinnedProjects.length === 0 ? <p className="listing-map-empty">No pins to show yet for this area.</p> : null}
    </div>
  );
}
