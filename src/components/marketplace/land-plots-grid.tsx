"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { Search, X } from "lucide-react";
import { RequestInfoDialog } from "@/components/marketplace/components";
import type { LandPlot, Project } from "@/types";

// Plots section for land listings with more than PLOT_GRID_THRESHOLD plots (src/lib/plot-grid.ts) (owner, 2026-10-06): every plot on one screen,
// no separate plots page, no "show more". The block plan sits beside the list so a lot number on the drawing can be found
// in the grid; buyers can tick lots and enquire about them in one message. Plans give lot number + size only, so nothing
// here shows a price or a sold/available label unless the developer published one.
type SortKey = "lot" | "sizeAsc" | "sizeDesc";

const BUCKETS: { key: string; label: string; min: number; max: number }[] = [
  { key: "under6", label: "Under 6P", min: 0, max: 6 },
  { key: "6to8", label: "6 to 8P", min: 6, max: 8 },
  { key: "8to10", label: "8 to 10P", min: 8, max: 10 },
  { key: "10to15", label: "10 to 15P", min: 10, max: 15 },
  { key: "15plus", label: "15P and above", min: 15, max: Infinity },
];

const formatPerches = (value: number) => `${Number.isInteger(value) ? value.toFixed(1) : String(value)}`;

export function LandPlotsGridSection({ plots, project, blockPlan }: { plots: LandPlot[]; project: Project; blockPlan?: string }) {
  const [query, setQuery] = useState("");
  const [bucket, setBucket] = useState<string>("all");
  const [sortBy, setSortBy] = useState<SortKey>("lot");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [requestOpen, setRequestOpen] = useState(false);

  const sizes = useMemo(() => plots.map((plot) => plot.sizePerches).filter((n) => n > 0), [plots]);
  const minSize = sizes.length ? Math.min(...sizes) : 0;
  const maxSize = sizes.length ? Math.max(...sizes) : 0;
  const bucketCounts = useMemo(
    () => BUCKETS.map((b) => ({ ...b, count: plots.filter((plot) => plot.sizePerches >= b.min && plot.sizePerches < b.max).length })).filter((b) => b.count > 0),
    [plots],
  );

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const active = BUCKETS.find((b) => b.key === bucket);
    const list = plots.filter((plot) => {
      if (q && !plot.name.toLowerCase().includes(q)) return false;
      if (active && !(plot.sizePerches >= active.min && plot.sizePerches < active.max)) return false;
      return true;
    });
    const byLot = (a: LandPlot, b: LandPlot) => a.name.localeCompare(b.name, undefined, { numeric: true });
    if (sortBy === "sizeAsc") list.sort((a, b) => a.sizePerches - b.sizePerches || byLot(a, b));
    else if (sortBy === "sizeDesc") list.sort((a, b) => b.sizePerches - a.sizePerches || byLot(a, b));
    else list.sort(byLot);
    return list;
  }, [plots, query, bucket, sortBy]);

  const selectedPlots = plots.filter((plot) => selected.has(plot.id));
  const selectedTotal = selectedPlots.reduce((sum, plot) => sum + plot.sizePerches, 0);
  const selectionMessage = selectedPlots.length
    ? `I'm interested in ${selectedPlots.length === 1 ? "lot" : "lots"} ${selectedPlots.map((plot) => plot.name).join(", ")} at ${project.name}.`
    : "";

  const toggle = (id: string) =>
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <section id="plans-homes" className="plots-grid-shell" aria-label="Plots">
      <div className="plots-grid-head">
        <h2>Plots</h2>
        <p>
          {plots.length} plots{sizes.length ? `, from ${formatPerches(minSize)} to ${formatPerches(maxSize)} perches` : ""}. Tick the lots you like and send one enquiry.
        </p>
      </div>

      <div className={`plots-grid-layout${blockPlan ? " has-plan" : ""}`}>
        {blockPlan ? (
          <a className="plots-grid-plan" href={blockPlan} target="_blank" rel="noopener noreferrer" aria-label="Open the block plan in a new tab">
            <Image src={blockPlan} alt={`${project.name} block plan`} width={1600} height={900} sizes="(max-width: 1000px) 100vw, 560px" />
            <span>Block plan. Tap to enlarge.</span>
          </a>
        ) : null}

        <div className="plots-grid-main">
          <div className="plots-grid-toolbar">
            <label className="plots-grid-search">
              <Search className="h-4 w-4" aria-hidden="true" />
              <input type="search" inputMode="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Find a lot number" aria-label="Find a lot number" />
            </label>
            <label className="plots-grid-sort">
              <span>Sort</span>
              <select value={sortBy} onChange={(event) => setSortBy(event.target.value as SortKey)}>
                <option value="lot">Lot number</option>
                <option value="sizeAsc">Size, small to large</option>
                <option value="sizeDesc">Size, large to small</option>
              </select>
            </label>
          </div>

          <div className="plots-grid-chips" role="group" aria-label="Filter by size">
            <button type="button" className={bucket === "all" ? "active" : undefined} aria-pressed={bucket === "all"} onClick={() => setBucket("all")}>All ({plots.length})</button>
            {bucketCounts.map((b) => (
              <button key={b.key} type="button" className={bucket === b.key ? "active" : undefined} aria-pressed={bucket === b.key} onClick={() => setBucket(b.key)}>
                {b.label} ({b.count})
              </button>
            ))}
          </div>

          {visible.length === 0 ? (
            <p className="plots-grid-empty">No lots match. <button type="button" onClick={() => { setQuery(""); setBucket("all"); }}>Clear filters</button></p>
          ) : (
            <div className={`plots-grid-tiles${visible.length > 60 ? " is-scroll" : ""}`} role="group" aria-label="Plots" tabIndex={visible.length > 60 ? 0 : undefined}>
              {visible.map((plot) => {
                const isSelected = selected.has(plot.id);
                return (
                  <button
                    key={plot.id}
                    type="button"
                    className={`plots-grid-tile${isSelected ? " is-selected" : ""}${plot.status === "Sold" ? " is-sold" : ""}`}
                    aria-pressed={isSelected}
                    onClick={() => toggle(plot.id)}
                    title={`Lot ${plot.name}, ${plot.sizePerches > 0 ? `${formatPerches(plot.sizePerches)} perches` : "size not stated"}`}
                  >
                    <span className="plots-grid-tile-lot">Lot {plot.name}</span>
                    <span className="plots-grid-tile-size">{plot.sizePerches > 0 ? <>{formatPerches(plot.sizePerches)}<small>P</small></> : "-"}</span>
                    {plot.status && plot.status !== "Available" ? <span className="plots-grid-tile-status">{plot.status}</span> : null}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {selectedPlots.length > 0 ? (
        <div className="plots-grid-selection" role="status">
          <p>
            {selectedPlots.length} {selectedPlots.length === 1 ? "lot" : "lots"} selected: {selectedPlots.map((plot) => plot.name).join(", ")}
            {selectedTotal > 0 ? ` (${formatPerches(Math.round(selectedTotal * 10) / 10)} perches in total)` : ""}
          </p>
          <div>
            <button type="button" className="plots-grid-clear" onClick={() => setSelected(new Set())}><X className="h-4 w-4" aria-hidden="true" /> Clear</button>
            <button type="button" className="plots-grid-enquire" onClick={() => setRequestOpen(true)}>Enquire about these lots</button>
          </div>
        </div>
      ) : null}

      <RequestInfoDialog key={selectionMessage} open={requestOpen} onClose={() => setRequestOpen(false)} project={project} variant="inquiry" defaultMessage={selectionMessage} />
    </section>
  );
}
