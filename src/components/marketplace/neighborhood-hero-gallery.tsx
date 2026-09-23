"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import dynamic from "next/dynamic";
import { Camera, ChevronLeft, ChevronRight, Map as MapIcon, X } from "lucide-react";
import type { MapArea, MapPlace } from "@/components/marketplace/map-pane";
import type { Project } from "@/types";

const LazyMapPane = dynamic(() => import("@/components/marketplace/map-pane").then((mod) => mod.MapPane), {
  ssr: false,
  loading: () => <div className="listing-map-loading" aria-hidden="true">Loading map…</div>,
});

const SWIPE_THRESHOLD_PX = 40;

export type NeighborhoodHeroPhoto = { url: string; caption?: string };

// Click-to-enlarge viewer for the neighbourhood hero photos (owner, 2026-09-22 — "just like the
// projects"): same chrome as the project/land pages' lightbox (.listing-photo-lightbox and
// friends), but photos-only — a neighbourhood page has no videos/map/brochure/etc. to give their
// own tabs, so those are dropped rather than carried over empty. Self-contained client component
// (grid + pills + lightbox together) so the page itself can stay a server component; only this
// slice needs the click/open state.
export function NeighborhoodHeroGallery({
  name,
  location,
  heroImage,
  sideImages,
  galleryPhotos,
  map,
}: {
  name: string;
  location: string;
  heroImage: NeighborhoodHeroPhoto;
  /** The up-to-4 thumbnails shown in the grid itself — always a prefix of `galleryPhotos`. */
  sideImages: NeighborhoodHeroPhoto[];
  /** Every gallery photo, not just the ones shown as thumbnails — the lightbox cycles through
   * all of these (via the side thumbnails, the "Photos N" pill, or the arrows), not just 4. */
  galleryPhotos: NeighborhoodHeroPhoto[];
  /** The same map already shown further down the page in its own "Location map" section — the
   * hero's Map pill opens it here too (owner, 2026-09-23), same as a project page's Map pill
   * opens its map inside the lightbox instead of only linking down to it. */
  map?: { projects: Project[]; area?: MapArea; places: MapPlace[] };
}) {
  const photos = [heroImage, ...galleryPhotos];
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<"photos" | "map">("photos");
  const [index, setIndex] = useState(0);
  const touchStartX = useRef<number | null>(null);

  const openAt = (i: number) => {
    setIndex(i);
    setView("photos");
    setOpen(true);
  };
  const openMap = () => {
    setView("map");
    setOpen(true);
  };
  const prev = () => setIndex((i) => (i - 1 + photos.length) % photos.length);
  const next = () => setIndex((i) => (i + 1) % photos.length);
  const active = photos[Math.max(0, Math.min(index, photos.length - 1))];

  const sideModifier =
    sideImages.length === 0 ? " single-photo" : sideImages.length === 1 ? " two-photo" : sideImages.length >= 3 ? ` listing-hero-grid-side-${Math.min(sideImages.length, 4)}` : "";

  return (
    <>
      <div className={`listing-hero-grid${sideModifier}`}>
        <button type="button" className="listing-hero-grid-main" onClick={() => openAt(0)} aria-label="Open photo gallery">
          <Image src={heroImage.url} alt={name} width={1200} height={900} className="listing-hero-grid-main-image" priority />
        </button>

        {sideImages.length > 0 && (
          <div className="listing-hero-grid-side">
            {sideImages.map((photo, i) => (
              <button key={photo.url} type="button" className="listing-hero-grid-side-item" onClick={() => openAt(i + 1)} aria-label={`Open photo: ${photo.caption ?? name}`}>
                <Image src={photo.url} alt={photo.caption ?? name} width={700} height={440} className="listing-hero-grid-side-image" />
              </button>
            ))}
          </div>
        )}

        <div className="listing-hero-grid-pills">
          <button type="button" className="listing-hero-grid-pill" onClick={() => openAt(0)}>
            <Camera className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" /> Photos <span className="listing-hero-quickjump-count">{photos.length}</span>
          </button>
          {map ? (
            <button type="button" className="listing-hero-grid-pill" onClick={openMap}>
              <MapIcon className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" /> Map
            </button>
          ) : null}
        </div>
      </div>

      {open && (
        <div className="listing-photo-lightbox" role="dialog" aria-modal="true" aria-label="Photo gallery">
          <div className="listing-photo-lightbox-topbar">
            <div className="listing-photo-lightbox-toprow">
              <div className="listing-photo-lightbox-meta">
                <p className="primary-line">{name}</p>
                <p className="secondary-line">{location}</p>
              </div>
              <div className="listing-photo-lightbox-actions">
                <button type="button" className="listing-photo-lightbox-close" onClick={() => setOpen(false)} aria-label="Close photo gallery">
                  <X className="h-5 w-5" aria-hidden="true" />
                </button>
              </div>
            </div>

            <div className="listing-photo-lightbox-tabs" role="tablist" aria-label="Viewer options">
              <button type="button" role="tab" aria-selected={view === "photos"} className={view === "photos" ? "active" : undefined} onClick={() => setView("photos")}>
                Photos <span className="listing-photo-lightbox-tab-count">{photos.length}</span>
              </button>
              {map ? (
                <button type="button" role="tab" aria-selected={view === "map"} className={view === "map" ? "active" : undefined} onClick={() => setView("map")}>
                  Map
                </button>
              ) : null}
            </div>
          </div>

          <div className="listing-photo-lightbox-stage">
            {view === "photos" ? (
              <>
                {photos.length > 1 && (
                  <button type="button" className="listing-photo-lightbox-arrow left" onClick={prev} aria-label="Previous photo">
                    <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                  </button>
                )}

                <div
                  className="listing-photo-lightbox-media-wrap"
                  onTouchStart={(event) => {
                    touchStartX.current = event.touches[0]?.clientX ?? null;
                  }}
                  onTouchEnd={(event) => {
                    if (touchStartX.current === null) return;
                    const endX = event.changedTouches[0]?.clientX ?? touchStartX.current;
                    const delta = endX - touchStartX.current;
                    touchStartX.current = null;
                    if (Math.abs(delta) < SWIPE_THRESHOLD_PX) return;
                    if (delta > 0) prev();
                    else next();
                  }}
                >
                  <Image src={active.url} alt={active.caption ?? name} width={1920} height={1080} className="listing-photo-lightbox-image" />
                  {active.caption ? (
                    <div className="listing-photo-lightbox-caption-row">
                      <div className="listing-photo-lightbox-caption">{active.caption}</div>
                    </div>
                  ) : null}
                </div>

                {photos.length > 1 && (
                  <button type="button" className="listing-photo-lightbox-arrow right" onClick={next} aria-label="Next photo">
                    <ChevronRight className="h-5 w-5" aria-hidden="true" />
                  </button>
                )}
              </>
            ) : map ? (
              <div className="listing-photo-lightbox-map-wrap">
                <div className="listing-photo-lightbox-map">
                  <LazyMapPane projects={map.projects} area={map.area} places={map.places} />
                </div>
                <p className="listing-photo-lightbox-map-legend">
                  <span><i className="neighborhood-map-legend-project" aria-hidden="true" />Project</span>
                  {map.places.length > 0 ? <span><i className="neighborhood-map-legend-place" aria-hidden="true" />Nearby place</span> : null}
                  {map.area ? <span><i className="neighborhood-map-legend-area" aria-hidden="true" />Approximate area</span> : null}
                </p>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </>
  );
}
