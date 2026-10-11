"use client";

import { useEffect, useRef, useState } from "react";
import { Minus, Plus, RotateCcw, X } from "lucide-react";
import { BAY_ONE_EXPLORER, EXPLORER_UNITS, FRONT_HOTSPOTS, SIDE_HOTSPOTS, type ExplorerUnit } from "@/lib/bay-one-explorer";

// "Apartment Explorer": the developer's clickable building view (https://icclk.com/bayone/public/bay-one) rebuilt in our own
// design. Click any apartment on the front or side of the building to see its wing, floor, bedrooms, type, block and size.
// Opened from the hero pill on the listing page (see ProjectHero). Data and region coordinates: src/lib/bay-one-explorer.ts.
const WING_NAME: Record<string, string> = { W: "West wing", N: "North wing", E: "East wing", P: "Penthouse" };
const SQFT_PER_SQM = 10.7639;
const unitByCode = new Map(EXPLORER_UNITS.map((unit) => [unit.code, unit]));

function describe(unit: ExplorerUnit) {
  const parts = unit.code.split("/");
  return {
    wing: unit.code === "PENTHHOUSE" ? "Penthouse" : WING_NAME[parts[0]] ?? `${parts[0]} wing`,
    block: unit.code === "PENTHHOUSE" ? "PH" : parts[parts.length - 1],
    label: unit.code === "PENTHHOUSE" ? "Penthouse" : unit.code,
  };
}

export function ApartmentExplorer({ projectName, url, onClose }: { projectName: string; url?: string; onClose: () => void }) {
  // Live Sold / Available status from the developer's explorer (see /api/explorer/bay-one); the built-in snapshot is the fallback.
  const [live, setLive] = useState<{ statuses: Record<string, "sold" | "available">; updatedAt: string } | null>(null);
  useEffect(() => {
    let cancelled = false;
    fetch("/api/explorer/bay-one")
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (!cancelled && data?.statuses) setLive({ statuses: data.statuses, updatedAt: data.updatedAt });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);
  const statusOf = (code: string): "sold" | "available" | "none" => live?.statuses[code] ?? unitByCode.get(code)?.status ?? "none";

  const [view, setView] = useState<"front" | "side">("front");
  const [selected, setSelected] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const dragRef = useRef<{ x: number; y: number; px: number; py: number; moved: boolean } | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose]);

  const hotspots = view === "front" ? FRONT_HOTSPOTS : SIDE_HOTSPOTS;
  const image = view === "front" ? BAY_ONE_EXPLORER.frontImage : BAY_ONE_EXPLORER.sideImage;
  const baseUnit = selected ? unitByCode.get(selected) : undefined;
  const unit = baseUnit ? { ...baseUnit, status: statusOf(baseUnit.code) as "sold" | "available" } : undefined;
  const info = unit ? describe(unit) : null;

  const setZoomClamped = (next: number) => {
    const value = Math.min(4, Math.max(1, next));
    setZoom(value);
    if (value === 1) setPan({ x: 0, y: 0 });
  };
  const reset = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };
  const switchView = (next: "front" | "side") => {
    setView(next);
    setSelected(null);
    reset();
  };

  return (
    <div className="axp-modal" role="dialog" aria-modal="true" aria-label={`Apartment Explorer, ${projectName}`}>
      <div className="axp-bar">
        <div className="axp-title">
          <strong>Apartment Explorer</strong>
          <span>{projectName}</span>
        </div>
        {url ? (
          <a className="axp-open" href={url} target="_blank" rel="noopener noreferrer">Developer&apos;s explorer</a>
        ) : null}
        <div className="axp-legend" aria-label="Legend">
          <span><i className="axp-dot axp-dot-available" /> Available</span>
          <span><i className="axp-dot axp-dot-sold" /> Sold</span>
        </div>
        <div className="axp-tabs" role="tablist" aria-label="Building view">
          <button type="button" role="tab" aria-selected={view === "front"} className={view === "front" ? "active" : undefined} onClick={() => switchView("front")}>Front view</button>
          <button type="button" role="tab" aria-selected={view === "side"} className={view === "side" ? "active" : undefined} onClick={() => switchView("side")}>Side view</button>
        </div>
        <button ref={closeRef} type="button" className="axp-close" onClick={onClose} aria-label="Close Apartment Explorer"><X className="h-5 w-5" aria-hidden="true" /></button>
      </div>

      <div className="axp-body">
        <div
          className={`axp-stage${zoom > 1 ? " is-zoomed" : ""}`}
          onPointerDown={(event) => {
            if (zoom <= 1) return;
            dragRef.current = { x: event.clientX, y: event.clientY, px: pan.x, py: pan.y, moved: false };
          }}
          onPointerMove={(event) => {
            const drag = dragRef.current;
            if (!drag) return;
            const dx = event.clientX - drag.x;
            const dy = event.clientY - drag.y;
            if (Math.abs(dx) + Math.abs(dy) > 4) drag.moved = true;
            if (drag.moved) setPan({ x: drag.px + dx, y: drag.py + dy });
          }}
          onPointerUp={() => {
            window.setTimeout(() => {
              dragRef.current = null;
            }, 0);
          }}
          onPointerLeave={() => {
            dragRef.current = null;
          }}
        >
          <div className="axp-canvas" style={{ aspectRatio: String(BAY_ONE_EXPLORER.imageRatio), transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})` }}>
            {/* eslint-disable-next-line @next/next/no-img-element -- fixed-size explorer artwork; hotspot coordinates are percentages of this image */}
            <img src={image} alt={`${projectName}, ${view} view of the building`} draggable={false} />
            {hotspots.map((spot) => {
              const spotUnit = unitByCode.get(spot.code);
              const status = statusOf(spot.code);
              return (
                <button
                  key={spot.code}
                  type="button"
                  className={`axp-hot axp-hot-${status}${selected === spot.code ? " is-selected" : ""}`}
                  style={{ left: `${spot.left}%`, top: `${spot.top}%`, width: `${spot.width}%`, height: `${spot.height}%`, ...(spot.clip ? { clipPath: spot.clip } : {}) }}
                  title={spot.code}
                  aria-label={`Apartment ${spot.code}${spotUnit ? `, ${status}` : ""}`}
                  onClick={() => {
                    if (dragRef.current?.moved) return;
                    setSelected(spot.code);
                  }}
                />
              );
            })}
          </div>
          <div className="axp-zoom">
            <button type="button" onClick={() => setZoomClamped(zoom + 0.5)} aria-label="Zoom in"><Plus className="h-4 w-4" aria-hidden="true" /></button>
            <button type="button" onClick={reset} aria-label="Reset zoom"><RotateCcw className="h-4 w-4" aria-hidden="true" /></button>
            <button type="button" onClick={() => setZoomClamped(zoom - 0.5)} aria-label="Zoom out"><Minus className="h-4 w-4" aria-hidden="true" /></button>
          </div>
        </div>

        <aside className="axp-panel" aria-live="polite">
          {unit && info ? (
            <>
              <div className="axp-panel-head">
                <span className="axp-code">{info.label}</span>
                <span className={`axp-status axp-status-${unit.status}`}>{unit.status === "sold" ? "Sold" : "Available"}</span>
              </div>
              <h3>{info.wing}</h3>
              <dl className="axp-facts">
                <div><dt>Bedrooms</dt><dd>{unit.bedrooms} Bed</dd></div>
                <div><dt>Floor</dt><dd>{unit.floor ? `Floor ${unit.floor}` : "-"}</dd></div>
                <div><dt>Unit type</dt><dd>{unit.type === "PENTH" ? "Penthouse" : unit.type}</dd></div>
                <div><dt>Buyer</dt><dd>{unit.transaction === "foreign" ? "Foreign" : "Local"}</dd></div>
                <div><dt>Block</dt><dd>{info.block}</dd></div>
                <div><dt>Floor area</dt><dd>{unit.areaSqm.toLocaleString("en-US", { maximumFractionDigits: 2 })} m² <small>({Math.round(unit.areaSqm * SQFT_PER_SQM).toLocaleString("en-US")} sq ft)</small></dd></div>
              </dl>
            </>
          ) : (
            <div className="axp-empty">
              <strong>Select a unit</strong>
              <p>Click any apartment on the building to see its details.</p>
            </div>
          )}
          <p className="axp-note">
            Availability {live ? `read from the developer's explorer on ${new Date(live.updatedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}` : `as published by the developer on ${BAY_ONE_EXPLORER.snapshot}`}. Plans, areas and orientation are indicative and subject to change; confirm availability with the sales team. Areas are the developer&apos;s square metres; square feet are converted.
          </p>
        </aside>
      </div>
    </div>
  );
}
