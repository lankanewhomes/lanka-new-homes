"use client";

import "maplibre-gl/dist/maplibre-gl.css";
import { LngLatBounds, setWorkerUrl } from "maplibre-gl";
import Map, { Layer, Marker, NavigationControl, Popup, Source, type MapRef } from "react-map-gl/maplibre";
import { useEffect, useMemo, useRef, useState } from "react";
import { ProjectPopup } from "@/components/map/ProjectPopup";
import { hasPremiumStyleBadge, isPaidPackageTier } from "@/lib/packages";
import type { Project } from "@/types";

// Highlighted map pins (owner, 2026-09-24 build note item 6) — Free stays
// the plain/muted grey pin (matches the "plain" comparison pin already
// shown on /for-developers' placement-inventory mockup,
// .fdv-placement-sample-pin-plain), Featured/Featured Plus keeps today's
// existing orange (unchanged — that's the pin every project already used
// to render as), Developer Pro/Campaign gets its own bigger, darker-orange
// marker so it stands out even against a plain Featured pin, same accent
// color as .badge-premium.
function mapMarkerTierClass(project: Project): string {
  if (hasPremiumStyleBadge(project.package)) return "marker-premium";
  if (!isPaidPackageTier(project.package)) return "marker-free";
  return "";
}

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

// Neighborhood pages: the area's centre/radius (drawn as an approximate-area circle) and the
// nearby places to mark. Both optional, so the listing-page map is unchanged.
export type MapArea = { lat: number; lng: number; radiusKm: number; label: string };
export type MapPlace = { name: string; category: string; lat: number; lng: number };

const KM_PER_DEGREE = 111.32;

function areaBounds(area: MapArea): [[number, number], [number, number]] {
  const dLat = area.radiusKm / KM_PER_DEGREE;
  const dLng = area.radiusKm / (KM_PER_DEGREE * Math.cos((area.lat * Math.PI) / 180));
  return [[area.lng - dLng, area.lat - dLat], [area.lng + dLng, area.lat + dLat]];
}

function areaCircle(area: MapArea) {
  const dLat = area.radiusKm / KM_PER_DEGREE;
  const dLng = area.radiusKm / (KM_PER_DEGREE * Math.cos((area.lat * Math.PI) / 180));
  const ring = Array.from({ length: 65 }, (_, i) => {
    const angle = (i / 64) * 2 * Math.PI;
    return [area.lng + dLng * Math.cos(angle), area.lat + dLat * Math.sin(angle)];
  });
  return { type: "Feature" as const, properties: {}, geometry: { type: "Polygon" as const, coordinates: [ring] } };
}

export function MapPane({ projects, basePath = "/projects", onSelectArea, area, places = [] }: { projects: Project[]; basePath?: string; onSelectArea?: (selection: MapAreaSelection) => void; area?: MapArea; places?: MapPlace[] }) {
  const mapRef = useRef<MapRef | null>(null);
  const [activeSlug, setActiveSlug] = useState<string | null>(null);
  const [activePlace, setActivePlace] = useState<MapPlace | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  // "load" fires once the style JSON is parsed, but the actual vector tiles
  // for the current view are still streaming in at that point — rendering
  // the map immediately on "load" exposed the style's raw background color
  // (a flat cream/grey) as a visible flash wherever tiles hadn't painted
  // yet. "idle" fires once the map has nothing left to render for the
  // current view, so gating the loading overlay on it instead means the
  // overlay only lifts once the map is actually visually complete.
  const [mapIdle, setMapIdle] = useState(false);

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
    if (area) return { longitude: area.lng, latitude: area.lat, zoom: 13 };
    if (pinnedProjects.length === 1) {
      return { longitude: pinnedProjects[0].coordinates!.lng, latitude: pinnedProjects[0].coordinates!.lat, zoom: 12 };
    }
    return { ...SRI_LANKA_CENTER, zoom: SRI_LANKA_ZOOM };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Neighborhood map: frame the approximate-area circle, the projects and the marked places together.
  useEffect(() => {
    const map = mapRef.current;
    if (!area || !map || !mapLoaded) return;
    const [sw, ne] = areaBounds(area);
    const bounds = new LngLatBounds(sw, ne);
    pinnedProjects.forEach((project) => bounds.extend([project.coordinates!.lng, project.coordinates!.lat]));
    places.forEach((place) => bounds.extend([place.lng, place.lat]));
    map.fitBounds(bounds, { padding: 56, duration: 0, maxZoom: 15 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapLoaded]);

  useEffect(() => {
    const map = mapRef.current;
    if (area || !map || !mapLoaded || pinnedProjects.length < 2) return;

    const bounds = pinnedProjects.reduce(
      (acc, project) => acc.extend([project.coordinates!.lng, project.coordinates!.lat]),
      new LngLatBounds()
    );
    map.fitBounds(bounds, { padding: 48, duration: 0, maxZoom: 13 });
  }, [pinnedProjects, mapLoaded]);

  const selectProject = (project: Project) => {
    setActivePlace(null);
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
        onIdle={() => setMapIdle(true)}
      >
        <NavigationControl position="top-left" showCompass={false} />

        {area ? (
          <>
            <Source id="neighborhood-area" type="geojson" data={areaCircle(area)}>
              <Layer id="neighborhood-area-fill" type="fill" paint={{ "fill-color": "#f47b36", "fill-opacity": 0.1 }} />
              <Layer id="neighborhood-area-line" type="line" paint={{ "line-color": "#f47b36", "line-width": 2, "line-dasharray": [2, 2] }} />
            </Source>
            {/* A project/land page centres this circle on the pin's own exact coordinates (an
                "immediate vicinity" indicator, not "we're unsure where this is") — omit the
                label there, since the project's own numbered marker already sits at that same
                point and a text pill on top of it would just double up. */}
            {area.label ? (
              <Marker longitude={area.lng} latitude={area.lat} anchor="center">
                <span className="listing-map-area-label">{area.label}</span>
              </Marker>
            ) : null}
          </>
        ) : null}

        {places.map((place) => (
          <Marker
            key={`${place.category}-${place.name}`}
            longitude={place.lng}
            latitude={place.lat}
            anchor="center"
            onClick={(event) => {
              event.originalEvent.stopPropagation();
              setActiveSlug(null);
              setActivePlace((current) => (current?.name === place.name ? null : place));
            }}
          >
            <span className="listing-map-place-marker" title={place.name} />
          </Marker>
        ))}

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
            <span className={["listing-map-marker", mapMarkerTierClass(project), activeSlug === project.slug ? "active" : ""].filter(Boolean).join(" ")}>1</span>
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
        {activePlace ? (
          <Popup longitude={activePlace.lng} latitude={activePlace.lat} anchor="top" offset={10} closeButton={false} onClose={() => setActivePlace(null)}>
            <span className="listing-map-place-popup">
              <strong>{activePlace.name}</strong>
              <span>{activePlace.category}</span>
            </span>
          </Popup>
        ) : null}
      </Map>

      {pinnedProjects.length === 0 && !area ? <p className="listing-map-empty">No pins to show yet for this area.</p> : null}
      <div className={`listing-map-tile-overlay${mapIdle ? " is-hidden" : ""}`} aria-hidden="true" />
    </div>
  );
}
