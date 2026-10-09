"use client";

import "maplibre-gl/dist/maplibre-gl.css";
import { LngLatBounds, setWorkerUrl } from "maplibre-gl";
import Map, { Marker, Popup, type MapRef } from "react-map-gl/maplibre";
import { Compass, House, Layers, Minus, Plus } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { formatLkr } from "@/lib/format";

// The shared map used by /search (and /land) and by /lanka360: nearby listings merge into numbered bubbles that split as you
// zoom in, then become price pins. Clicking a bubble zooms into that area. A 3D / normal switch tilts the city. The map reports
// what part of the world is on screen so the listing list next to it can show "listings in this area" first.
// Same self-hosted maplibre worker + free OpenFreeMap basemap as the older map-pane.tsx.
setWorkerUrl("/maplibre-gl-worker.mjs");
const MAP_STYLE = "https://tiles.openfreemap.org/styles/liberty";

const PIN_ZOOM = 13.2;
const TILT = 58;

export type ExplorerItem = { slug: string; name: string; city: string; lat: number; lng: number; price: number };
/** What the map is showing right now. `zoomed` is false while it is still the whole-country overview. */
export type MapView = { west: number; south: number; east: number; north: number; zoom: number; zoomed: boolean };

function shortPrice(amount: number): string {
  if (amount >= 1_000_000) return `Rs. ${Math.round((amount / 1_000_000) * 10) / 10}M`;
  return formatLkr(amount);
}

export function ExplorerMap({
  items,
  selectedSlug,
  onSelect,
  onViewChange,
  renderPopup,
  defaultTilt = false,
  fitKey,
}: {
  items: ExplorerItem[];
  selectedSlug?: string | null;
  onSelect?: (slug: string | null) => void;
  onViewChange?: (view: MapView) => void;
  /** Card shown next to the selected pin. */
  renderPopup?: (slug: string, close: () => void) => ReactNode;
  defaultTilt?: boolean;
  /** Changing this value re-frames the map around `items` (e.g. after the filters change). */
  fitKey?: string;
}) {
  const mapRef = useRef<MapRef | null>(null);
  const [zoom, setZoom] = useState(7);
  const [tilted, setTilted] = useState(defaultTilt);
  const overviewZoom = useRef<number | null>(null);

  const report = useCallback(() => {
    const map = mapRef.current?.getMap();
    if (!map || !onViewChange) return;
    const b = map.getBounds();
    const z = map.getZoom();
    if (overviewZoom.current === null) overviewZoom.current = z;
    onViewChange({ west: b.getWest(), south: b.getSouth(), east: b.getEast(), north: b.getNorth(), zoom: z, zoomed: z > overviewZoom.current + 0.9 });
  }, [onViewChange]);

  const fitTo = useCallback(
    (list: { lat: number; lng: number }[], maxZoom = 15, duration = 1100) => {
      const map = mapRef.current;
      if (!map || list.length === 0) return;
      const bounds = new LngLatBounds();
      list.forEach((item) => bounds.extend([item.lng, item.lat]));
      map.fitBounds(bounds, { padding: 70, maxZoom, duration, pitch: tilted ? TILT : 0 });
    },
    [tilted],
  );

  // Frame everything once the map is ready, and again whenever the caller says the set of listings changed.
  const firstFit = useRef(true);
  useEffect(() => {
    if (!mapRef.current || items.length === 0) return;
    const instant = firstFit.current;
    firstFit.current = false;
    fitTo(items, items.length === 1 ? 15 : 12, instant ? 0 : 900);
    if (instant) overviewZoom.current = null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fitKey]);

  // Nearby listings merge into one bubble; the grid cell shrinks as you zoom, so bubbles split and finally become pins.
  const groups = useMemo(() => {
    const cell = (360 / Math.pow(2, Math.max(zoom, 3))) * 0.28;
    const cells = new globalThis.Map<string, ExplorerItem[]>();
    for (const item of items) {
      const key = `${Math.floor(item.lng / cell)}:${Math.floor(item.lat / cell)}`;
      cells.set(key, [...(cells.get(key) ?? []), item]);
    }
    return Array.from(cells.entries()).map(([key, group]) => {
      const counts = new globalThis.Map<string, number>();
      group.forEach((p) => counts.set(p.city, (counts.get(p.city) ?? 0) + 1));
      const name = Array.from(counts.entries()).sort((x, y) => y[1] - x[1])[0][0];
      return {
        key,
        name,
        group,
        lat: group.reduce((sum, p) => sum + p.lat, 0) / group.length,
        lng: group.reduce((sum, p) => sum + p.lng, 0) / group.length,
      };
    });
  }, [items, zoom]);

  const openGroup = useCallback(
    (event: React.MouseEvent, group: ExplorerItem[]) => {
      event.stopPropagation();
      if (group.length === 1) {
        onSelect?.(group[0].slug);
        mapRef.current?.flyTo({ center: [group[0].lng, group[0].lat], zoom: 16, pitch: tilted ? TILT : 0, duration: 1300 });
      } else {
        fitTo(group, 14);
      }
    },
    [fitTo, onSelect],
  );

  const toggleTilt = () => {
    const next = !tilted;
    setTilted(next);
    mapRef.current?.easeTo({ pitch: next ? TILT : 0, bearing: next ? -17 : 0, duration: 800 });
  };

  const showPins = zoom >= PIN_ZOOM;
  const selected = selectedSlug ? items.find((item) => item.slug === selectedSlug) : undefined;

  return (
    <div className="xmap">
      <Map
        ref={mapRef}
        initialViewState={{ longitude: 80.7, latitude: 7.8, zoom: 6.8, pitch: defaultTilt ? TILT : 0, bearing: defaultTilt ? -17 : 0 }}
        mapStyle={MAP_STYLE}
        maxPitch={70}
        onLoad={() => {
          fitTo(items, items.length === 1 ? 15 : 12, 0);
          report();
        }}
        onMove={(event) => setZoom(event.viewState.zoom)}
        onMoveEnd={report}
        onClick={() => onSelect?.(null)}
        style={{ width: "100%", height: "100%" }}
        attributionControl={{ compact: true }}
      >
        {!showPins
          ? groups.map((group) => {
              const size = Math.min(88, 52 + group.group.length * 5);
              return (
                <Marker key={group.key} longitude={group.lng} latitude={group.lat} anchor="center">
                  <button
                    type="button"
                    className="l360-bubble"
                    style={{ width: size, height: size }}
                    aria-label={`${group.name}: ${group.group.length} listing${group.group.length === 1 ? "" : "s"}`}
                    // eslint-disable-next-line react-hooks/refs -- false positive: the map ref is only read when the click happens
                    onClick={(event) => openGroup(event, group.group)}
                  >
                    <span className="l360-bubble-core"><House size={18} aria-hidden="true" /></span>
                    <span className="l360-bubble-count">{group.group.length}</span>
                    <span className="l360-bubble-name">{group.name}</span>
                  </button>
                </Marker>
              );
            })
          : items.map((item) => (
              <Marker key={item.slug} longitude={item.lng} latitude={item.lat} anchor="bottom">
                <button
                  type="button"
                  className={`l360-pin${selectedSlug === item.slug ? " is-selected" : ""}`}
                  onClick={(event) => {
                    event.stopPropagation();
                    onSelect?.(item.slug);
                  }}
                >
                  <House size={13} aria-hidden="true" />
                  <span>{item.price > 0 ? shortPrice(item.price) : item.name}</span>
                </button>
              </Marker>
            ))}

        {selected && renderPopup ? (
          <Popup longitude={selected.lng} latitude={selected.lat} anchor="bottom" offset={34} closeButton={false} closeOnClick={false} maxWidth="260px" className="xmap-popup">
            {renderPopup(selected.slug, () => onSelect?.(null))}
          </Popup>
        ) : null}
      </Map>

      <div className="l360-controls">
        <button type="button" onClick={() => mapRef.current?.zoomIn()} aria-label="Zoom in"><Plus size={18} /></button>
        <button type="button" onClick={() => mapRef.current?.zoomOut()} aria-label="Zoom out"><Minus size={18} /></button>
        <button type="button" onClick={() => fitTo(items, 12)} aria-label="Show all listings"><Compass size={18} /></button>
        <button type="button" className={tilted ? "is-on" : ""} onClick={toggleTilt} aria-label="Toggle 3D view" aria-pressed={tilted}><Layers size={18} /><small>3D</small></button>
      </div>
    </div>
  );
}
