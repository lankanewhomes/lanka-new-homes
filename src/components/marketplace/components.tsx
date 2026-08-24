"use client";

import Image from "next/image";
import Link from "next/link";
import { CSSProperties, useEffect, useMemo, useState } from "react";
import {
  Bath,
  BedDouble,
  Bell,
  Building,
  Building2,
  Camera,
  Car,
  ChevronLeft,
  ChevronDown,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  Dumbbell,
  Globe,
  Heart,
  Hammer,
  HousePlus,
  Landmark,
  MapPinned,
  MapPin,
  MessageCircle,
  Phone,
  Ruler,
  Search,
  Send,
  Share2,
  ShieldCheck,
  Square,
  SlidersHorizontal,
  Trees,
  Waves,
  X,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteLanguage, useLanguage } from "@/components/layout/language-provider";
import { compactLkr, formatLkr } from "@/lib/format";
import { Amenity, Article, Developer, FloorPlan, Lead, Location, Project, ProjectStatLabel, Unit } from "@/types";

const amenityIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  Pool: Waves,
  Gym: Dumbbell,
  Rooftop: Building2,
  Parking: Car,
  Security: ShieldCheck,
  CCTV: Camera,
  Garden: Trees,
  "Children's Area": Bell,
  Clubhouse: Landmark,
  "EV Charging": Zap,
  Concierge: Bell,
};

function renderEntityLink(name: string, slug: string | undefined, basePath: string, className?: string) {
  if (!slug) {
    return <span className={className}>{name}</span>;
  }

  return <Link href={`${basePath}/${slug}`} className={className}>{name}</Link>;
}

function hasDisplayValue(value: unknown) {
  if (value === null || value === undefined) {
    return false;
  }

  if (typeof value === "string") {
    return value.trim().length > 0;
  }

  if (typeof value === "number") {
    return Number.isFinite(value) && value > 0;
  }

  return true;
}

export function StatusBadge({ status }: { status: string }) {
  return <span className="rounded-sm border border-stone-300 bg-white px-2 py-1 text-xs font-medium text-stone-700">{status}</span>;
}

export function SaveButton() {
  const [saved, setSaved] = useState(false);
  return (
    <Button variant="outline" className="rounded-sm" onClick={() => setSaved((v) => !v)}>
      <Heart className={`mr-2 h-4 w-4 ${saved ? "fill-current" : ""}`} />
      {saved ? "Saved" : "Save"}
    </Button>
  );
}

export function ShareButton() {
  return (
    <Button variant="outline" className="rounded-sm">
      <Share2 className="mr-2 h-4 w-4" /> Share
    </Button>
  );
}

export function Breadcrumbs({ items }: { items: { label: string; href?: string }[] }) {
  return (
    <div className="flex flex-wrap items-center gap-2 text-sm text-stone-600">
      {items.map((item, idx) => (
        <div key={item.label} className="flex items-center gap-2">
          {item.href ? <Link href={item.href}>{item.label}</Link> : <span>{item.label}</span>}
          {idx < items.length - 1 && <ChevronRight className="h-3.5 w-3.5" />}
        </div>
      ))}
    </div>
  );
}

export function SearchSuggestions() {
  return (
    <div className="grid gap-2 border border-stone-200 bg-white p-3 text-sm text-stone-700">
      <p>Popular: Colombo 03, Rajagiriya, Kandy</p>
      <p>Recent: Now Selling 2 Bedrooms</p>
    </div>
  );
}

export function SearchBar() {
  return (
    <div className="grid gap-2 md:grid-cols-5">
      <input className="border border-stone-300 px-3 py-2 text-sm" placeholder="Location" />
      <input className="border border-stone-300 px-3 py-2 text-sm" placeholder="Price" />
      <input className="border border-stone-300 px-3 py-2 text-sm" placeholder="Bedrooms" />
      <input className="border border-stone-300 px-3 py-2 text-sm" placeholder="Project Status" />
      <Button className="rounded-sm bg-stone-900 text-white"><Search className="mr-2 h-4 w-4" />Search</Button>
    </div>
  );
}

export function FilterChip({ label }: { label: string }) {
  return <button className="rounded-sm border border-stone-300 px-3 py-1 text-xs">{label}</button>;
}

export function FilterBar() {
  const filters = ["Location", "District", "Price", "Bedrooms", "Bathrooms", "Floor Area", "Completion Year", "Project Status", "Developer", "Amenities"];
  return <div className="flex flex-wrap gap-2">{filters.map((f) => <FilterChip key={f} label={f} />)}</div>;
}

export function FilterDrawer() {
  return <div className="border border-stone-200 bg-stone-50 p-3 text-sm">Mobile Filters Drawer Placeholder</div>;
}

export function MapMarker({ label, selected = false }: { label: string; selected?: boolean }) {
  return <span className={`inline-flex rounded-sm border px-2 py-1 text-xs ${selected ? "border-stone-900 bg-stone-900 text-white" : "border-stone-300 bg-white"}`}>{label}</span>;
}

export function MapPlaceholder() {
  return (
    <div className="relative min-h-130 border border-stone-200 bg-[linear-gradient(125deg,#f5f5f4,#e7e5e4)] p-4">
      <div className="absolute left-8 top-8"><MapMarker label="Rs. 48M" selected /></div>
      <div className="absolute left-36 top-36"><MapMarker label="Rs. 35M" /></div>
      <div className="absolute right-24 top-24"><MapMarker label="Rs. 27M" /></div>
      <div className="absolute right-44 bottom-24"><MapMarker label="Rs. 22.5M" /></div>
      <div className="absolute right-4 top-4 space-y-2">
        <button className="block border bg-white px-2 py-1 text-xs">+</button>
        <button className="block border bg-white px-2 py-1 text-xs">-</button>
      </div>
      <div className="absolute bottom-4 left-4 rounded-sm border border-stone-300 bg-white px-2 py-1 text-xs">Cluster: 2 projects</div>
    </div>
  );
}

export function ProjectCard({ project }: { project: Project }) {
  return (
    <article className="grid gap-3 border border-stone-200 bg-white p-3">
      <Image src={project.heroImage} alt={project.name} width={900} height={500} className="h-48 w-full object-cover" />
      <div className="space-y-1">
        <h3 className="text-lg font-semibold text-stone-900">{project.name}</h3>
        <p className="text-sm text-stone-600">{project.developerName} • {project.location}</p>
        <p className="text-sm text-stone-700">From {formatLkr(project.startingPriceLkr)} • {project.bedrooms} Beds • {project.floorAreaRange}</p>
      </div>
      <div className="flex items-center justify-between">
        <StatusBadge status={project.status} />
        <Link className="text-sm font-medium text-stone-900" href={`/projects/${project.slug}`}>View Project</Link>
      </div>
    </article>
  );
}

export function FeaturedProject({ project }: { project: Project }) {
  return (
    <article className="grid gap-4 border border-stone-200 bg-white p-4 md:grid-cols-2">
      <Image src={project.heroImage} alt={project.name} width={1200} height={700} className="h-64 w-full object-cover md:h-full" />
      <div className="space-y-3">
        <StatusBadge status={project.status} />
        <h3 className="text-2xl font-semibold text-stone-900">{project.name}</h3>
        <p className="text-sm text-stone-600">{project.developerName} • {project.location}</p>
        <p className="text-sm leading-relaxed text-stone-700">{project.summary}</p>
        <div className="grid grid-cols-2 gap-2 text-sm text-stone-800">
          <span>From {formatLkr(project.startingPriceLkr)}</span>
          <span>{project.bedrooms} Bedrooms</span>
          <span>{project.floorAreaRange}</span>
          <span>Completion {project.completionYear}</span>
        </div>
        <Link href={`/projects/${project.slug}`} className="inline-flex border border-stone-900 px-4 py-2 text-sm font-medium text-stone-900">Explore Project</Link>
      </div>
    </article>
  );
}

export function ProjectListItem({ project }: { project: Project }) {
  return (
    <article className="grid gap-3 border border-stone-200 bg-white p-3 md:grid-cols-[280px_1fr]">
      <Image src={project.heroImage} alt={project.name} width={600} height={350} className="h-44 w-full object-cover" />
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2 justify-between">
          <h3 className="text-xl font-semibold">{project.name}</h3>
          <StatusBadge status={project.status} />
        </div>
        <p className="text-sm text-stone-600">{project.developerName} • {project.location}</p>
        <p className="text-sm text-stone-700">{project.summary}</p>
        <div className="grid grid-cols-2 gap-2 text-sm text-stone-800 md:grid-cols-4">
          <span>From {formatLkr(project.startingPriceLkr)}</span>
          <span>{project.priceRange}</span>
          <span>{project.bedrooms} Beds</span>
          <span>{project.floorAreaRange}</span>
        </div>
        <div className="flex gap-2">
          <SaveButton />
          <Link href={`/projects/${project.slug}`} className="inline-flex items-center border border-stone-900 px-3 py-2 text-sm">View project</Link>
        </div>
      </div>
    </article>
  );
}

export function ProjectHero({ project }: { project: Project }) {
  const fallbackPhotoLabels = [
    "Exterior",
    "Living Room",
    "Bedroom",
    "Washroom",
    "Kitchen",
    "Dining Area",
    "Balcony",
    "Lobby",
    "Amenities",
    "Rooftop",
  ];

  const photoItems = [
    { label: "Exterior", image: project.heroImage },
    ...project.gallery.map((item, index) => ({
      ...item,
      label: item.label?.trim() || fallbackPhotoLabels[index % fallbackPhotoLabels.length],
    })),
  ];
  const [photoIndex, setPhotoIndex] = useState(0);

  const videoCount = project.videos?.length ?? 0;
  const virtualTourCount = project.virtualTours?.length ?? 0;
  const hasMap = project.coordinates?.lat != null && project.coordinates?.lng != null;
  const hasInteractiveMap = Boolean(project.interactiveMapUrl);
  const blockPlanImage = project.gallery.find((item) => /block\s*plan|site\s*plan/i.test(item.label))?.image;
  const hasBlockPlan = Boolean(blockPlanImage);
  const hasRoadMap = hasMap;

  const availableMedia = useMemo(() => {
    const tabs: Array<"photos" | "videos" | "map" | "interactiveMap" | "virtualTours" | "blockPlan" | "roadMap"> = [];
    if (photoItems.length > 0) tabs.push("photos");
    if (videoCount > 0) tabs.push("videos");
    if (hasMap) tabs.push("map");
    if (hasRoadMap) tabs.push("roadMap");
    if (hasBlockPlan) tabs.push("blockPlan");
    if (hasInteractiveMap) tabs.push("interactiveMap");
    if (virtualTourCount > 0) tabs.push("virtualTours");
    return tabs;
  }, [photoItems.length, videoCount, hasMap, hasRoadMap, hasBlockPlan, hasInteractiveMap, virtualTourCount]);

  const [activeMedia, setActiveMedia] = useState<"photos" | "videos" | "map" | "interactiveMap" | "virtualTours" | "blockPlan" | "roadMap" | null>(null);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [lightboxView, setLightboxView] = useState<"photos" | "map" | "preview">("photos");
  const [activeSection, setActiveSection] = useState("overview");

  useEffect(() => {
    if (activeMedia && !availableMedia.includes(activeMedia)) {
      setActiveMedia(null);
    }
  }, [activeMedia, availableMedia]);

  useEffect(() => {
    const updateActiveSection = () => {
      setActiveSection(window.location.hash.replace("#", "") || "overview");
    };

    updateActiveSection();
    window.addEventListener("hashchange", updateActiveSection);

    return () => window.removeEventListener("hashchange", updateActiveSection);
  }, []);

  const mapQuery = encodeURIComponent(`${project.name} ${project.location}`);
  const mapSrc = `https://www.google.com/maps?q=${mapQuery}&output=embed`;
  const interactiveMapSrc = project.interactiveMapUrl ?? mapSrc;

  const activePhoto = photoItems[Math.max(0, Math.min(photoIndex, photoItems.length - 1))];

  const handlePrevPhoto = () => {
    if (!photoItems.length) return;
    setPhotoIndex((index) => (index - 1 + photoItems.length) % photoItems.length);
  };

  const handleNextPhoto = () => {
    if (!photoItems.length) return;
    setPhotoIndex((index) => (index + 1) % photoItems.length);
  };

  const stats: { icon: React.ComponentType<{ className?: string }>; value: string; label: string; multiline?: boolean }[] = [
    { icon: HousePlus, value: project.status, label: "Listing status" },
    { icon: Hammer, value: project.constructionStatus, label: "Building status" },
    ...(project.startingPriceLkr > 0 ? [{ icon: CircleDollarSign, value: `From ${formatLkr(project.startingPriceLkr)}`, label: "Price range" }] : []),
    { icon: MapPinned, value: project.location, label: "Address" },
    ...(project.units > 0 ? [{ icon: Building2, value: String(project.units), label: "Total Units" }] : []),
    ...(project.floorPlans.length > 0 ? [{ icon: Building2, value: String(project.floorPlans.length), label: "Floor plans" }] : []),
    ...(project.floors > 0 ? [{ icon: Building, value: String(project.floors), label: "Floors" }] : []),
    { icon: Building, value: project.type.replace(" ", "\n"), label: "Property type", multiline: true },
    { icon: BedDouble, value: project.bedrooms, label: "Beds" },
    { icon: Bath, value: project.bathrooms, label: "Baths" },
    { icon: Square, value: project.floorAreaRange, label: "SqFt" },
    ...(project.incentives?.length ? [{ icon: CircleDollarSign, value: String(project.incentives.length), label: "Incentives" }] : []),
    { icon: MapPin, value: project.road ?? "", label: "Road" },
    { icon: MapPinned, value: project.area ?? "", label: "Area" },
    { icon: Zap, value: project.electricity ?? "", label: "Electricity" },
    { icon: Waves, value: project.tapWater ?? "", label: "Tap water" },
    ...(project.startingPriceLkr > 0 && (project.floorPlans[0]?.floorAreaSqFt ?? 0) > 0
      ? [{ icon: Ruler, value: compactLkr(Math.round(project.startingPriceLkr / Math.max(1, project.floorPlans[0]?.floorAreaSqFt ?? 1))), label: "Per SqFt (Avg)" }]
      : []),
  ]
    .filter((item) => hasDisplayValue(item.value))
    .filter((item) => {
      if (!project.desktopVisibleStats?.length) {
        return true;
      }
      const visibleLabels = new Set(project.desktopVisibleStats);
      if (item.label === "Total Units") visibleLabels.add("Total units");
      if (item.label === "Floors") visibleLabels.add("Stories");
      return visibleLabels.has(item.label as ProjectStatLabel);
    });

  const shouldEmphasizeStat = (value: string) => /\d/.test(value);
  const mobileVisibleLabels = new Set(
    project.mobileVisibleStats?.length
      ? project.mobileVisibleStats
      : ["Price range", "Property type", "Beds", "Baths", "Floors", "SqFt"]
  );

  return (
    <section className="listing-hero">
      <div className="listing-hero-media">
        {activeMedia === "photos" && (
          <button
            type="button"
            className="listing-hero-image-trigger"
            onClick={() => {
              setLightboxView("photos");
              setIsLightboxOpen(true);
            }}
            aria-label="Open photo gallery"
          >
            <Image src={activePhoto.image} alt={`${project.name} ${activePhoto.label}`} width={1700} height={780} className="listing-hero-image" priority />
          </button>
        )}

        {activeMedia === null && (
          <button
            type="button"
            className="listing-hero-image-trigger"
            onClick={() => {
              setLightboxView("photos");
              setIsLightboxOpen(true);
            }}
            aria-label="Open photo gallery"
          >
            <Image src={project.heroImage} alt={`${project.name} preview`} width={1700} height={780} className="listing-hero-image" priority />
          </button>
        )}

        {activeMedia === "videos" && videoCount > 0 && (
          <div className="listing-hero-video-surface">
            {project.videos?.[0]?.embedUrl ? (
              <iframe
                className="listing-hero-map-frame"
                title={`${project.name} video`}
                src={project.videos[0].embedUrl}
                loading="lazy"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <>
                <Image src={project.heroImage} alt={`${project.name} video preview`} width={1700} height={780} className="listing-hero-image" priority />
                <div className="listing-hero-video-overlay" aria-label="Video preview">
                  <span>Video preview</span>
                </div>
              </>
            )}
          </div>
        )}

        {activeMedia === "map" && hasMap && (
          <iframe
            className="listing-hero-map-frame"
            title="Project map"
            src={mapSrc}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        )}

        {activeMedia === "roadMap" && hasRoadMap && (
          <iframe
            className="listing-hero-map-frame"
            title="Road map"
            src={mapSrc}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        )}

        {activeMedia === "blockPlan" && hasBlockPlan && (
          <div className="listing-hero-video-surface">
            <Image src={blockPlanImage!} alt={`${project.name} block plan`} width={1700} height={780} className="listing-hero-image" priority />
          </div>
        )}

        {activeMedia === "interactiveMap" && hasInteractiveMap && (
          <iframe
            className="listing-hero-map-frame"
            title="Interactive project map"
            src={interactiveMapSrc}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        )}

        {activeMedia === "virtualTours" && virtualTourCount > 0 && (
          <div className="listing-hero-video-surface">
            <Image src={project.heroImage} alt={`${project.name} virtual tour preview`} width={1700} height={780} className="listing-hero-image" priority />
            <div className="listing-hero-video-overlay" aria-label="Virtual tour preview">
              <span>Virtual tour available</span>
            </div>
          </div>
        )}

        <div className="listing-hero-rail-shell">
          {activeMedia === "photos" && photoItems.length > 1 && (
            <button type="button" className="media-arrow media-arrow-left" aria-label="Previous photo" onClick={handlePrevPhoto}>
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            </button>
          )}

          <div className="listing-hero-rail" role="tablist" aria-label="Project media options">
            <button
              type="button"
              role="tab"
              className={activeMedia === "photos" ? "active" : undefined}
              aria-selected={activeMedia === "photos"}
              onClick={() => setActiveMedia("photos")}
            >
              <span className="tab-label">Photos {photoItems.length}</span>
            </button>

            <button
              type="button"
              role="tab"
              className={`${activeMedia === "videos" ? "active" : ""} ${videoCount === 0 ? "is-muted" : ""}`.trim()}
              aria-selected={activeMedia === "videos"}
              onClick={() => setActiveMedia("videos")}
              disabled={videoCount === 0}
              aria-disabled={videoCount === 0}
            >
              <span className="tab-label">Videos {videoCount}</span>
            </button>

            <button
              type="button"
              role="tab"
              className={`${activeMedia === "map" ? "active" : ""} ${!hasMap ? "is-muted" : ""}`.trim()}
              aria-selected={activeMedia === "map"}
              onClick={() => setActiveMedia("map")}
              disabled={!hasMap}
              aria-disabled={!hasMap}
            >
              <span className="tab-label">Map</span>
            </button>

            <button
              type="button"
              role="tab"
              className={`${activeMedia === "blockPlan" ? "active" : ""} ${!hasBlockPlan ? "is-muted" : ""}`.trim()}
              aria-selected={activeMedia === "blockPlan"}
              onClick={() => setActiveMedia("blockPlan")}
              disabled={!hasBlockPlan}
              aria-disabled={!hasBlockPlan}
            >
              <span className="tab-label">Block Plan</span>
            </button>

            <button
              type="button"
              role="tab"
              className={`${activeMedia === "roadMap" ? "active" : ""} ${!hasRoadMap ? "is-muted" : ""}`.trim()}
              aria-selected={activeMedia === "roadMap"}
              onClick={() => setActiveMedia("roadMap")}
              disabled={!hasRoadMap}
              aria-disabled={!hasRoadMap}
            >
              <span className="tab-label">Road Map</span>
            </button>

            <button
              type="button"
              role="tab"
              className={`${activeMedia === "interactiveMap" ? "active" : ""} ${!hasInteractiveMap ? "is-muted" : ""}`.trim()}
              aria-selected={activeMedia === "interactiveMap"}
              onClick={() => setActiveMedia("interactiveMap")}
              disabled={!hasInteractiveMap}
              aria-disabled={!hasInteractiveMap}
            >
              <span className="tab-label">Interactive map</span>
            </button>

            <button
              type="button"
              role="tab"
              className={`${activeMedia === "virtualTours" ? "active" : ""} ${virtualTourCount === 0 ? "is-muted" : ""}`.trim()}
              aria-selected={activeMedia === "virtualTours"}
              onClick={() => setActiveMedia("virtualTours")}
              disabled={virtualTourCount === 0}
              aria-disabled={virtualTourCount === 0}
            >
              <span className="tab-label">Virtual tours {virtualTourCount}</span>
            </button>
          </div>

          {activeMedia === "photos" && photoItems.length > 1 && (
            <button type="button" className="media-arrow media-arrow-right" aria-label="Next photo" onClick={handleNextPhoto}>
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </button>
          )}
        </div>
      </div>

      {isLightboxOpen && (
        <div className="listing-photo-lightbox" role="dialog" aria-modal="true" aria-label="Photo gallery">
          <div className="listing-photo-lightbox-topbar">
            <div className="listing-photo-lightbox-meta">
              <p className="primary-line">
                <strong>{project.name}</strong>
              </p>
              <p className="secondary-line">{project.location}</p>
            </div>

            <div className="listing-photo-lightbox-actions">
              <button type="button" className="contact-btn">Contact</button>
              <button type="button" className="ghost-btn"><Heart className="h-4 w-4" aria-hidden="true" />Save</button>
              <button type="button" className="ghost-btn"><Share2 className="h-4 w-4" aria-hidden="true" />Share</button>
              <button
                type="button"
                className="listing-photo-lightbox-close"
                onClick={() => setIsLightboxOpen(false)}
                aria-label="Close photo gallery"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>

            <div className="listing-photo-lightbox-tabs" role="tablist" aria-label="Viewer options">
              <button
                type="button"
                role="tab"
                aria-selected={lightboxView === "photos"}
                className={lightboxView === "photos" ? "active" : undefined}
                onClick={() => setLightboxView("photos")}
              >
                {photoItems.length} Photos
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={lightboxView === "map"}
                className={lightboxView === "map" ? "active" : undefined}
                onClick={() => setLightboxView("map")}
              >
                Map
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={lightboxView === "preview"}
                className={lightboxView === "preview" ? "active" : undefined}
                onClick={() => setLightboxView("preview")}
              >
                Preview
              </button>
            </div>
          </div>

          <div className="listing-photo-lightbox-stage">
            {lightboxView === "photos" && (
              <>
                {photoItems.length > 1 && (
                  <button type="button" className="listing-photo-lightbox-arrow left" onClick={handlePrevPhoto} aria-label="Previous photo">
                    <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                  </button>
                )}
                <div className="listing-photo-lightbox-media-wrap">
                  <Image
                    src={activePhoto.image}
                    alt={`${project.name} ${activePhoto.label}`}
                    width={1920}
                    height={1080}
                    className="listing-photo-lightbox-image"
                  />
                  <div className="listing-photo-lightbox-caption-row">
                    <div className="listing-photo-lightbox-caption">{activePhoto.label}</div>
                  </div>
                </div>
                {photoItems.length > 1 && (
                  <button type="button" className="listing-photo-lightbox-arrow right" onClick={handleNextPhoto} aria-label="Next photo">
                    <ChevronRight className="h-5 w-5" aria-hidden="true" />
                  </button>
                )}
              </>
            )}

            {lightboxView === "map" && (
              <iframe
                className="listing-photo-lightbox-map"
                title="Project map viewer"
                src={mapSrc}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            )}

            {lightboxView === "preview" && (
              <div className="listing-photo-lightbox-preview">
                <div className="listing-photo-lightbox-media-wrap">
                  <Image
                    src={project.heroImage}
                    alt={`${project.name} preview`}
                    width={1920}
                    height={1080}
                    className="listing-photo-lightbox-image"
                  />
                  <div className="listing-photo-lightbox-caption-row">
                    <div className="listing-photo-lightbox-caption">{activePhoto.label}</div>
                  </div>
                </div>
                <span>Preview mode</span>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="listing-hero-panel">
        <div className="listing-hero-title-wrap">
          <h1>{project.name}</h1>
          <p>
            By <Link href={`/developers/${project.developerSlug}`}>{project.developerName}</Link>
            {hasDisplayValue(project.neighborhood) ? (
              <>
                <span> | </span>
                <span>
                  {project.neighborhoodSlug
                    ? <Link href={`/neighborhoods/${project.neighborhoodSlug}`}>{project.neighborhood}</Link>
                    : project.neighborhood}
                  {" "}
                  master planned community
                </span>
              </>
            ) : null}
          </p>
        </div>

        <div className="listing-hero-panel-row">
          <nav aria-label="Project sections" className="listing-hero-nav">
            <a href="#overview" className={activeSection === "overview" ? "active" : undefined} onClick={() => setActiveSection("overview")}>Overview</a>
            <a href="#pricing" className={activeSection === "pricing" ? "active" : undefined} onClick={() => setActiveSection("pricing")}>Pricing</a>
            <a href="#plans-homes" className={activeSection === "plans-homes" ? "active" : undefined} onClick={() => setActiveSection("plans-homes")}>Plans & homes</a>
            <a href="#amenities" className={activeSection === "amenities" ? "active" : undefined} onClick={() => setActiveSection("amenities")}>Amenities</a>
          </nav>

          <div className="listing-hero-actions">
            <button type="button" className="action-link"><Bell className="h-4 w-4" aria-hidden="true" />Get updates</button>
            <button type="button" className="action-link"><Heart className="h-4 w-4" aria-hidden="true" />Save</button>
            <button type="button" className="request-info-btn">Request info</button>
          </div>
        </div>
      </div>

      {(hasDisplayValue(project.status) || hasDisplayValue(project.completionYear)) ? (
        <div className="listing-hero-tags" aria-label="Listing status tags">
          {hasDisplayValue(project.status) ? <span>{project.status}</span> : null}
          {hasDisplayValue(project.completionYear) ? <span>Move in {project.completionYear}</span> : null}
        </div>
      ) : null}

        <div className="listing-hero-mobile-ctas" aria-label="Mobile quick actions">
          <button type="button" className="listing-hero-mobile-btn listing-hero-mobile-btn-updates">
            <Bell className="h-4 w-4" aria-hidden="true" />
            Get updates
          </button>
          <button type="button" className="listing-hero-mobile-btn listing-hero-mobile-btn-request">
            Request info
          </button>
        </div>

      <div
        className="listing-hero-stats"
        role="list"
        aria-label="Project summary stats"
        style={{ "--stat-count": stats.length } as CSSProperties}
      >
        {stats.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label} role="listitem" className={mobileVisibleLabels.has(item.label) ? "mobile-stat-visible" : undefined}>
              <Icon className="h-6 w-6" aria-hidden="true" />
              {shouldEmphasizeStat(item.value) ? (
                <strong className={item.multiline ? "multiline" : undefined}>{item.value}</strong>
              ) : (
                <span className={`value-text ${item.multiline ? "multiline" : ""}`.trim()}>{item.value}</span>
              )}
              <span>{item.label}</span>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export function ProjectSummary({ project }: { project: Project }) {
  const rows = [
    ["Starting Price", formatLkr(project.startingPriceLkr)],
    ["Bedrooms", project.bedrooms],
    ["Bathrooms", project.bathrooms],
    ["Floor Area", project.floorAreaRange],
    ["Construction started", project.constructionStarted ?? "Not set"],
    ["Estimated completion", String(project.completionYear)],
    ["Units", String(project.units)],
    ["Floors", String(project.floors)],
    ["Status", project.status],
    ["Developer", project.developerName],
  ];
  return (
    <section className="grid gap-3 border border-stone-200 bg-white p-4 md:grid-cols-3">
      {rows.map(([k, v]) => (
        <div key={k as string} className="border-b border-stone-100 pb-2 md:border-b-0">
          <p className="text-xs uppercase tracking-wide text-stone-500">{k}</p>
          <p className="text-sm font-medium text-stone-900">{v}</p>
        </div>
      ))}
    </section>
  );
}

export function ProjectStats({ project }: { project: Project }) {
  return <ProjectSummary project={project} />;
}

export function FloorPlanCard({ floorPlan }: { floorPlan: FloorPlan }) {
  return (
    <article className="grid gap-3 border border-stone-200 bg-white p-3">
      <Image src={floorPlan.image} alt={floorPlan.planName} width={1000} height={600} className="h-44 w-full object-cover" />
      <h4 className="text-base font-semibold">{floorPlan.planName}</h4>
      <p className="text-sm text-stone-700">{floorPlan.bedrooms} Bed • {floorPlan.bathrooms} Bath • {floorPlan.floorAreaSqFt} sq.ft</p>
      <p className="text-sm font-medium">From {formatLkr(floorPlan.startingPriceLkr)}</p>
      <StatusBadge status={floorPlan.availability} />
    </article>
  );
}

export function FloorPlanBrowser({ floorPlans }: { floorPlans: FloorPlan[] }) {
  const bedroomOptions = useMemo(() => [...new Set(floorPlans.map((floorPlan) => floorPlan.bedrooms))].sort((a, b) => a - b), [floorPlans]);
  const [active, setActive] = useState<number | null>(bedroomOptions[0] ?? null);
  const activeBedroom = active !== null && bedroomOptions.includes(active) ? active : bedroomOptions[0] ?? null;
  const filtered = useMemo(() => activeBedroom === null ? floorPlans : floorPlans.filter((f) => f.bedrooms === activeBedroom), [floorPlans, activeBedroom]);
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-lg font-semibold">Floor Plans ({floorPlans.length})</h3>
      </div>
      <div className="flex flex-wrap gap-2">
        {bedroomOptions.map((bedroomCount) => (
          <button key={bedroomCount} onClick={() => setActive(bedroomCount)} className={`border px-3 py-1 text-sm ${activeBedroom === bedroomCount ? "border-stone-900 bg-stone-900 text-white" : "border-stone-300"}`}>
            {bedroomCount} Bedroom
          </button>
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {filtered.length ? filtered.map((f) => <FloorPlanCard key={f.id} floorPlan={f} />) : <p className="text-sm text-stone-600">No floor plans in this category.</p>}
      </div>
    </section>
  );
}

export function UnitTable({ units }: { units: Unit[] }) {
  return (
    <div className="overflow-x-auto border border-stone-200 bg-white">
      <table className="w-full min-w-175 text-sm">
        <thead className="bg-stone-50 text-left">
          <tr>
            <th className="p-3">Unit</th><th className="p-3">Floor</th><th className="p-3">Type</th><th className="p-3">Area</th><th className="p-3">Price</th><th className="p-3">Status</th>
          </tr>
        </thead>
        <tbody>
          {units.map((unit) => (
            <tr key={unit.id} className="border-t border-stone-100">
              <td className="p-3">{unit.unitNumber}</td><td className="p-3">{unit.floor}</td><td className="p-3">{unit.apartmentType}</td><td className="p-3">{unit.areaSqFt} sq.ft</td><td className="p-3">{formatLkr(unit.priceLkr)}</td><td className="p-3"><StatusBadge status={unit.status} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function AmenityGrid({ amenities }: { amenities: Amenity[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {amenities.map((a) => {
        const Icon = amenityIcons[a.name] ?? Building2;
        return (
          <div key={a.name} className="flex items-center gap-2 border border-stone-200 bg-white px-3 py-2 text-sm">
            <Icon className="h-4 w-4 text-stone-700" />{a.name}
          </div>
        );
      })}
    </div>
  );
}

export function PricingInformationLayout({ project }: { project: Project }) {
  const displayValue = (value: string | undefined) => (hasDisplayValue(value) ? value : "-");
  const pricingHistory = project.pricingHistory?.length
    ? project.pricingHistory
    : [{ date: "-", note: "-" }];
  const incentives = project.incentives?.filter((item) => hasDisplayValue(item)) ?? [];

  return (
    <section className="space-y-4">
      <div className="relative mx-auto w-full max-w-290 overflow-hidden border border-[#d3f2de] bg-[#ecfcf1] px-6 py-8 sm:px-8 sm:py-10 lg:aspect-video lg:px-12 lg:py-12">
        <div
          className="pointer-events-none absolute inset-0 opacity-45"
          aria-hidden="true"
          style={{
            backgroundImage: [
              "repeating-linear-gradient(0deg, transparent 0 36px, rgba(78,161,115,0.16) 36px 37px)",
              "repeating-linear-gradient(90deg, transparent 0 36px, rgba(78,161,115,0.16) 36px 37px)",
              "linear-gradient(rgba(120,188,146,0.16) 1px, transparent 1px)",
              "linear-gradient(90deg, rgba(120,188,146,0.16) 1px, transparent 1px)",
            ].join(","),
            backgroundSize: "100% 100%, 100% 100%, 112px 112px, 112px 112px",
          }}
        />

        <div className="pointer-events-none absolute left-[6%] top-[10%] h-[22%] w-[24%] border border-[#bfe8cc]/70" aria-hidden="true" />
        <div className="pointer-events-none absolute right-[7%] top-[12%] h-[18%] w-[20%] border border-[#bfe8cc]/70" aria-hidden="true" />
        <div className="pointer-events-none absolute right-[15%] bottom-[13%] h-[23%] w-[26%] border border-[#bfe8cc]/70" aria-hidden="true" />

        <div className="relative z-10 grid gap-6 lg:grid-cols-3">
          <article className="border border-[#b8e8c8] bg-white px-6 py-6 text-[#1f2321] shadow-[0_10px_28px_rgba(36,78,54,0.08)]">
            <h3 className="text-[29px] font-semibold">Pricing and fees</h3>

            <div className="mt-7 space-y-4 text-[15px] leading-7">
              <div>
                <p className="font-semibold">Available plan prices</p>
                <p>{displayValue(project.availablePlanPrices)}</p>
              </div>
              <div>
                <p className="font-semibold">Pricing coming soon</p>
                <p>{displayValue(project.pricingComingSoon)}</p>
              </div>
              <div>
                <p className="font-semibold">Average price per sqft</p>
                <p>{displayValue(project.averagePricePerSqft)}</p>
              </div>
              <div>
                <p className="font-semibold">Monthly C.C./maint per sqft</p>
                <p>{displayValue(project.monthlyMaintenancePerSqft)}</p>
              </div>
              <div>
                <p className="font-semibold">Property tax</p>
                <p>{displayValue(project.propertyTax)}</p>
              </div>
              <div>
                <p className="font-semibold">Parking cost</p>
                <p>{displayValue(project.parkingCost)}</p>
              </div>
              <div>
                <p className="font-semibold">Storage cost</p>
                <p>{displayValue(project.storageCost)}</p>
              </div>
              <div>
                <p className="font-semibold">ⓘ Co-op fee realtors</p>
                <p>{displayValue(project.coopFeeRealtors)}</p>
              </div>
              <div>
                <p className="font-semibold">Pricing history</p>
                <div className="space-y-2">
                  {pricingHistory.map((entry) => (
                    <p key={`${entry.date}-${entry.note}`}>{entry.date} - {entry.note}</p>
                  ))}
                </div>
              </div>
            </div>
          </article>

          <article className="border border-[#b8e8c8] bg-white px-6 py-6 text-[#1f2321] shadow-[0_10px_28px_rgba(36,78,54,0.08)]">
            <h3 className="text-[29px] font-semibold">Deposit Structure</h3>

            <div className="mt-7 space-y-4 text-[15px] leading-7">
              <div>
                <p className="font-semibold">Payment structure</p>
                <p>{displayValue(project.depositPaymentStructure ?? project.paymentPlan)}</p>
              </div>
            </div>
          </article>

          <article className="border border-[#b8e8c8] bg-white px-6 py-6 text-[#1f2321] shadow-[0_10px_28px_rgba(36,78,54,0.08)]">
            <h3 className="text-[29px] font-semibold">Current Incentives</h3>

            <div className="mt-7 space-y-4 text-[15px] leading-7">
              {incentives.length ? incentives.map((incentive, index) => (
                <div key={`${incentive}-${index}`}>
                  <p className="font-semibold">Incentive {index + 1}</p>
                  <p>{incentive}</p>
                </div>
              )) : (
                <div>
                  <p className="font-semibold">Incentive 1</p>
                  <p>-</p>
                </div>
              )}
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}

export function PlansAndHomesSection({ project }: { project: Project }) {
  const [activeTab, setActiveTab] = useState<"all" | "floorPlans" | "quickMoveIns">("floorPlans");

  const quickMoveIns = useMemo(
    () => project.floorPlans.filter((plan) => plan.availability === "Available" || plan.availability === "Limited"),
    [project.floorPlans]
  );

  const visiblePlans = useMemo(() => {
    if (activeTab === "quickMoveIns") return quickMoveIns;
    return project.floorPlans;
  }, [activeTab, project.floorPlans, quickMoveIns]);

  return (
    <section id="plans-homes" className="plans-homes-shell" aria-label="Plans and homes">
      <div className="plans-homes-head">
        <h2>Plans &amp; homes</h2>
      </div>

      <div className="plans-homes-toolbar">
        <div className="plans-homes-tabs" role="tablist" aria-label="Plans and homes tabs">
          <button
            type="button"
            role="tab"
            className={activeTab === "all" ? "active" : undefined}
            aria-selected={activeTab === "all"}
            onClick={() => setActiveTab("all")}
          >
            All ({project.floorPlans.length})
          </button>
          <button
            type="button"
            role="tab"
            className={activeTab === "floorPlans" ? "active" : undefined}
            aria-selected={activeTab === "floorPlans"}
            onClick={() => setActiveTab("floorPlans")}
          >
            Floor plans ({project.floorPlans.length})
          </button>
          <button
            type="button"
            role="tab"
            className={activeTab === "quickMoveIns" ? "active" : undefined}
            aria-selected={activeTab === "quickMoveIns"}
            onClick={() => setActiveTab("quickMoveIns")}
          >
            Quick move ins ({quickMoveIns.length})
          </button>
        </div>

        <button type="button" className="plans-filter-btn">
          <SlidersHorizontal className="h-4 w-4" aria-hidden="true" /> Filter &amp; sort
        </button>
      </div>

      <div className="plans-chip-row" aria-label="Applied filters">
        <span>For sale</span>
      </div>

      <div className="plans-homes-grid">
        {visiblePlans.map((plan) => (
          <article key={plan.id} className="plans-home-card">
            <figure>
              <Image src={plan.image} alt={plan.planName} width={960} height={620} className="plans-home-image" />
              <span className="plans-status-pill">For sale</span>
            </figure>

            <div className="plans-home-body">
              <h4>{plan.planName}</h4>
              <p className="plans-home-price">From {formatLkr(plan.startingPriceLkr)}</p>
              <p className="plans-home-type">Condo - Suite</p>
              <div className="plans-home-facts">
                <span><BedDouble className="h-3.5 w-3.5" aria-hidden="true" /> {plan.bedrooms} bd</span>
                <span><Bath className="h-3.5 w-3.5" aria-hidden="true" /> {plan.bathrooms}</span>
                <span><Square className="h-3.5 w-3.5" aria-hidden="true" /> From {plan.floorAreaSqFt} SqFt</span>
              </div>
            </div>
          </article>
        ))}
      </div>

      <div className="plans-more-wrap">
        <button type="button" className="plans-more-btn">
          Show all plans &amp; homes <span aria-hidden="true">+</span>
        </button>
      </div>
    </section>
  );
}

export function AmenitiesShowcaseSection({ project }: { project: Project }) {
  const amenityItems = useMemo(() => {
    const fallbackDescriptions: Record<string, string> = {
      Pool: "Resort-style pool areas create a calming retreat for daily relaxation and weekend gatherings.",
      Gym: "A modern fitness studio with essential equipment for strength, cardio, and everyday wellness.",
      Rooftop: "Elevated rooftop spaces deliver skyline views, fresh air, and flexible lounge zones.",
      Parking: "Secure resident parking is designed for smooth arrival, organized flow, and convenience.",
      Security: "Round-the-clock managed security and monitored entry points provide resident peace of mind.",
      CCTV: "Integrated camera coverage supports safer common areas and building-wide visibility.",
      Garden: "Landscaped green pockets offer a tranquil environment for breaks, walks, and family time.",
      "Children's Area": "Dedicated play zones provide safe, engaging spaces tailored for younger residents.",
      Clubhouse: "A private clubhouse supports social events, meetings, and shared community experiences.",
      "EV Charging": "Future-ready charging points support electric vehicle ownership within the community.",
      Concierge: "Concierge assistance helps coordinate everyday resident requests and guest arrivals.",
    };

    return project.amenities.slice(0, 8).map((amenity) => {
      const imageMatch = project.gallery.find((item) => item.label.toLowerCase().includes(amenity.name.toLowerCase()));

      return {
        name: amenity.name,
        description: fallbackDescriptions[amenity.name] ?? "Thoughtfully planned amenity spaces enhance comfort and support modern urban living.",
        image: imageMatch?.image ?? project.heroImage,
      };
    });
  }, [project.amenities, project.gallery, project.heroImage]);

  const [activeAmenityIndex, setActiveAmenityIndex] = useState(0);
  const activeAmenity = amenityItems[Math.max(0, Math.min(activeAmenityIndex, amenityItems.length - 1))];

  if (!amenityItems.length || !activeAmenity) {
    return null;
  }

  return (
    <section id="amenities" className="amenities-showcase-shell" aria-label="Amenities">
      <h2>Amenities</h2>

      <div className="amenities-showcase-grid">
        <figure className="amenities-showcase-image-wrap">
          <Image
            src={activeAmenity.image}
            alt={`${activeAmenity.name} amenity`}
            width={1400}
            height={950}
            className="amenities-showcase-image"
          />
        </figure>

        <div className="amenities-showcase-list" role="list" aria-label="Amenity details">
          {amenityItems.map((amenity, index) => {
            const isActive = index === activeAmenityIndex;

            return (
              <button
                key={amenity.name}
                type="button"
                role="listitem"
                className={`amenities-showcase-item ${isActive ? "active" : ""}`.trim()}
                aria-pressed={isActive}
                onClick={() => setActiveAmenityIndex(index)}
              >
                <span className="amenities-showcase-item-icon" aria-hidden="true">✓</span>

                <span className="amenities-showcase-item-copy">
                  <strong>{amenity.name}</strong>
                  <span>{amenity.description}</span>
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export function SalesCenterSection({ project }: { project: Project }) {
  const mailHref = `mailto:info@serendibproperty.lk?subject=${encodeURIComponent(`${project.name} sales inquiry`)}`;

  return (
    <section className="sales-center-shell" aria-label="Sales center">
      <div className="sales-alert-card">
        <div className="sales-alert-top">
          <div className="sales-alert-columns">
            <div className="sales-alert-contact">
              <h2 className="sales-alert-heading">{project.name}</h2>
              <p className="sales-alert-center-label">Sales Center</p>
              <p className="sales-alert-phone">+94 81 223 9100</p>
              <a href={mailHref} className="sales-alert-request">Request info</a>
            </div>

            <div className="sales-alert-hours" aria-label="Sales center hours">
              <span>Hours</span>
              <strong>Mon - Sun</strong>
              <span>Closed</span>
            </div>

            <div className="sales-alert-socials" aria-label="Sales center social media">
              <a href={mailHref} aria-label="Message sales" className="sales-alert-social">
                <MessageCircle className="h-4 w-4" aria-hidden="true" />
              </a>
              <a href="https://serendibproperty.lk" target="_blank" rel="noreferrer" aria-label="Visit website" className="sales-alert-social">
                <Globe className="h-4 w-4" aria-hidden="true" />
              </a>
              <a href={mailHref} aria-label="Send an inquiry" className="sales-alert-social">
                <Send className="h-4 w-4" aria-hidden="true" />
              </a>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}

export function ProjectDescriptionSection({ project }: { project: Project }) {
  const article = /^[aeiou]/i.test(project.type.trim()) ? "an" : "a";

  return (
    <section id="overview" className="project-description-shell" aria-label="Project description">
      <h2>The Narrative - Building A details</h2>
      <p>
        {project.description} {project.summary} {project.name} by {project.developerName} in {project.location} offers
        {" "}{article} {project.type.toLowerCase()} with {project.units} units across {project.floors} floors.
      </p>
    </section>
  );
}

export function ProjectNarrativeDetails({ project }: { project: Project }) {
  const launchDate = project.launchDate ? new Date(project.launchDate) : null;
  const salesStarted = launchDate && !Number.isNaN(launchDate.getTime())
    ? launchDate.toLocaleDateString("en-US", { month: "short", year: "numeric" })
    : "";
  const completionDate = hasDisplayValue(project.completionYear) ? new Date(`${project.completionYear}-12-01`) : null;
  const completionMonth = completionDate && !Number.isNaN(completionDate.getTime())
    ? completionDate.toLocaleDateString("en-US", { month: "short", year: "numeric" })
    : "";

  const detailRows = [
    {
      label: "Neighborhood",
      show: hasDisplayValue(project.neighborhood),
      value: project.neighborhoodSlug
        ? renderEntityLink(project.neighborhood, project.neighborhoodSlug, "/neighborhoods")
        : project.neighborhood,
    },
    { label: "Building type", show: hasDisplayValue(project.type), value: project.type },
    { label: "Beds", show: hasDisplayValue(project.bedrooms), value: project.bedrooms },
    { label: "Baths", show: hasDisplayValue(project.bathrooms), value: project.bathrooms },
    { label: "Road", show: hasDisplayValue(project.road), value: project.road ?? "" },
    { label: "Area", show: hasDisplayValue(project.area), value: project.area ?? "" },
    { label: "Electricity", show: hasDisplayValue(project.electricity), value: project.electricity ?? "" },
    { label: "Tap water", show: hasDisplayValue(project.tapWater), value: project.tapWater ?? "" },
    { label: "Ownership", show: hasDisplayValue(project.ownership), value: project.ownership },
    { label: "Listing status", show: hasDisplayValue(project.status), value: project.status },
    { label: "Sales started", show: hasDisplayValue(salesStarted), value: salesStarted },
    { label: "Construction status", show: hasDisplayValue(project.constructionStatus), value: project.constructionStatus },
    { label: "Construction started", show: hasDisplayValue(project.constructionStarted), value: project.constructionStarted ?? "" },
    { label: "Estimated completion", show: hasDisplayValue(completionMonth), value: completionMonth },
    { label: "Ceilings", show: hasDisplayValue(project.ceilingInfo), value: project.ceilingInfo ?? "" },
    { label: "Builder", show: hasDisplayValue(project.developerName), value: renderEntityLink(project.developerName, project.developerSlug, "/developers") },
    { label: "Architect", show: hasDisplayValue(project.architectName), value: renderEntityLink(project.architectName ?? "", project.architectSlug, "/architects") },
    { label: "Marketing company", show: hasDisplayValue(project.salesCompanyName), value: renderEntityLink(project.salesCompanyName ?? "", project.salesCompanySlug, "/sales-companies") },
    { label: "Interior designer", show: hasDisplayValue(project.interiorDesignerName), value: renderEntityLink(project.interiorDesignerName ?? "", project.interiorDesignerSlug, "/interior-designers") },
  ].filter((row) => row.show);

  const splitIndex = Math.ceil(detailRows.length / 2);
  const leftRows = detailRows.slice(0, splitIndex);
  const rightRows = detailRows.slice(splitIndex);

  return (
    <section className="project-narrative-shell" aria-label="Project details">
      <div className="project-narrative-grid">
        <div className="project-narrative-left">
          <div className="project-narrative-list" role="list" aria-label="Narrative detail list">
            {leftRows.map(({ label, value }) => (
              <p key={label} role="listitem">
                <strong>{label}:</strong> {value}
              </p>
            ))}
          </div>
        </div>

        <div className="project-narrative-right" role="list" aria-label="Project fact list">
          {rightRows.map(({ label, value }) => (
            <p key={label} role="listitem">
              <strong>{label}:</strong> {value}
            </p>
          ))}
        </div>
      </div>
    </section>
  );
}

export function ProjectGallery({ gallery }: { gallery: { label: string; image: string }[] }) {
  return (
    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
      {gallery.map((g) => (
        <figure key={g.label} className="overflow-hidden border border-stone-200">
          <Image src={g.image} alt={g.label} width={900} height={700} className="h-52 w-full object-cover" />
          <figcaption className="border-t border-stone-200 px-2 py-1 text-xs text-stone-700">{g.label}</figcaption>
        </figure>
      ))}
    </div>
  );
}

export function DeveloperCard({ developer }: { developer: Developer }) {
  return (
    <article className="grid gap-2 border border-stone-200 bg-white p-4">
      <Image src={developer.logo} alt={developer.name} width={100} height={100} className="h-14 w-14 rounded-full object-cover" />
      <h4 className="text-lg font-semibold">{developer.name}</h4>
      <p className="text-sm text-stone-600">{developer.location}</p>
      <p className="text-sm text-stone-700">{developer.description}</p>
      <p className="text-xs text-stone-600">{developer.activeProjects} active developments</p>
      <Link href={`/developers/${developer.slug}`} className="text-sm font-medium">View projects</Link>
    </article>
  );
}

export function DeveloperProfile({ developer }: { developer: Developer }) {
  return (
    <section className="grid gap-4 border border-stone-200 bg-white p-4 md:grid-cols-[160px_1fr]">
      <Image src={developer.logo} alt={developer.name} width={160} height={160} className="h-28 w-28 rounded-full object-cover" />
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold">{developer.name}</h1>
        <p className="text-sm text-stone-700">{developer.description}</p>
        <div className="grid gap-2 text-sm md:grid-cols-3">
          <span>Established: {developer.establishedYear}</span>
          <span>Location: {developer.location}</span>
          <span>Years in business: {developer.yearsInBusiness}</span>
          <span>Website: {developer.website}</span>
          <span>Email: {developer.email}</span>
          <span>Phone: {developer.phone}</span>
        </div>
      </div>
    </section>
  );
}

export function LocationCard({ location }: { location: Location }) {
  return (
    <article className="border border-stone-200 bg-white">
      <Image src={location.image} alt={location.name} width={900} height={500} className="h-40 w-full object-cover" />
      <div className="space-y-1 p-3">
        <h4 className="text-lg font-semibold">{location.name}</h4>
        <p className="text-xs text-stone-600">{location.district} District</p>
        <p className="text-sm text-stone-700">{location.summary}</p>
      </div>
    </article>
  );
}

export function ArticleCard({ article }: { article: Article }) {
  return (
    <article className="border border-stone-200 bg-white">
      <Image src={article.image} alt={article.title} width={1000} height={600} className="h-44 w-full object-cover" />
      <div className="space-y-2 p-3">
        <p className="text-xs uppercase tracking-wide text-stone-500">{article.category}</p>
        <h4 className="text-lg font-semibold">{article.title}</h4>
        <p className="text-sm text-stone-700">{article.excerpt}</p>
        <p className="text-xs text-stone-500">{article.readTime}</p>
      </div>
    </article>
  );
}

export function LeadForm({ projectSlug, developerSlug }: { projectSlug: string; developerSlug: string }) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
            preferredContactMethod: "Email" as "Email" | "Phone" | "WhatsApp",
    message: "",
  });
  const [state, setState] = useState<"idle" | "loading" | "success" | "error">("idle");

  return (
    <form
      className="grid gap-3 border border-stone-200 bg-white p-4 md:grid-cols-2"
      onSubmit={async (event) => {
        event.preventDefault();
        setState("loading");
        try {
          const payload = {
            name: form.name,
            email: form.email,
            phone: form.phone,
            preferredContactMethod: form.preferredContactMethod as "Email" | "Phone" | "WhatsApp",
            message: form.message,
            projectSlug,
            developerSlug,
          };

          const response = await fetch("/api/leads", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });

          if (!response.ok) {
            throw new Error("Request failed");
          }

          setState("success");
          setForm({ name: "", email: "", phone: "", preferredContactMethod: "Email", message: "" });
        } catch {
          setState("error");
        }
      }}
    >
      <input className="border border-stone-300 px-3 py-2 text-sm" placeholder="Full Name" value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} required />
      <input className="border border-stone-300 px-3 py-2 text-sm" placeholder="Email" type="email" value={form.email} onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))} required />
      <input className="border border-stone-300 px-3 py-2 text-sm" placeholder="Phone" value={form.phone} onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))} required />
      <select className="border border-stone-300 px-3 py-2 text-sm" value={form.preferredContactMethod} onChange={(e) => setForm((prev) => ({ ...prev, preferredContactMethod: e.target.value as "Email" | "Phone" | "WhatsApp" }))}>
        <option value="Email">Email</option><option value="Phone">Phone</option><option value="WhatsApp">WhatsApp</option>
      </select>
      <textarea className="md:col-span-2 border border-stone-300 px-3 py-2 text-sm" rows={4} placeholder="Message" value={form.message} onChange={(e) => setForm((prev) => ({ ...prev, message: e.target.value }))} required />
      <Button className="md:col-span-2 rounded-sm" disabled={state === "loading"}>{state === "loading" ? "Sending..." : "Request Information"}</Button>
      {state === "success" ? <p className="md:col-span-2 text-sm text-green-700">Request sent successfully.</p> : null}
      {state === "error" ? <p className="md:col-span-2 text-sm text-red-700">Something went wrong. Please try again.</p> : null}
    </form>
  );
}

export function Header() {
  const { language, setLanguage } = useLanguage();

  const labels: Record<SiteLanguage, { homes: string; articles: string; pros: string; login: string; signup: string; menu: string }> = {
    en: {
      homes: "New Homes for Sale",
      articles: "Articles",
      pros: "Professionals",
      login: "Log in",
      signup: "Sign up",
      menu: "Menu",
    },
    ta: {
      homes: "விற்பனைக்கு புதிய வீடுகள்",
      articles: "கட்டுரைகள்",
      pros: "வல்லுநர்கள்",
      login: "உள்நுழை",
      signup: "பதிவுபெறு",
      menu: "மெனு",
    },
    si: {
      homes: "විකිණීමට නව නිවාස",
      articles: "ලිපි",
      pros: "වෘත්තීය සේවකයින්",
      login: "පිවිසෙන්න",
      signup: "ලියාපදිංචි වන්න",
      menu: "මෙනුව",
    },
  };

  const text = labels[language];

  return (
    <header className="site-header">
      <div className="site-header-inner">
        <div className="site-brand-group">
          <Link href="/" className="site-logo">LankaLiving<span>.</span></Link>
          <div className="language-segmented" role="group" aria-label="Language switcher">
            <button type="button" className={language === "en" ? "active" : undefined} onClick={() => setLanguage("en")}>EN</button>
            <button type="button" className={language === "si" ? "active" : undefined} onClick={() => setLanguage("si")}>සිංහල</button>
            <button type="button" className={language === "ta" ? "active" : undefined} onClick={() => setLanguage("ta")}>தமிழ்</button>
          </div>
        </div>
        <nav><Link href="/projects">{text.homes}</Link><Link href="/">{text.articles}</Link><Link href="/developers">{text.pros}</Link></nav>
        <div className="header-actions">
          <Link href="/">{text.login}</Link>
          <Link href="/developer/projects/new" className="sign-up">{text.signup}</Link>
        </div>
        <button className="mobile-menu">{text.menu}</button>
      </div>
    </header>
  );
}

export function Footer() {
  return <footer className="site-footer"><div><p className="footer-logo">LankaLiving.</p><div className="footer-links"><Link href="/">About</Link><Link href="/">Careers</Link><Link href="/">Accessibility</Link><Link href="/">Terms & conditions</Link><Link href="/">Privacy policy</Link><Link href="/developer/dashboard">Builder backend</Link></div><p className="partner-sites">Partner sites<br /><span>New homes in Sri Lanka</span></p></div><p className="copyright">© 2026 LankaLiving</p></footer>;
}

export function ProjectOverview({ project }: { project: Project }) {
  const detailsSentence = `${project.name} by ${project.developerName} is located in ${project.location}. ${project.type} with ${project.units} units across ${project.floors} floors. ${project.constructionStatus} and expected completion in ${project.completionYear}.`;
  const launchDate = project.launchDate ? new Date(project.launchDate) : null;
  const salesStarted = launchDate && !Number.isNaN(launchDate.getTime())
    ? launchDate.toLocaleDateString("en-US", { month: "short", year: "numeric" })
    : "";

  return (
    <section className="project-overview-shell">
      <div className="project-main-overview">
        <h3>Overview</h3>
        <div className="project-main-overview-copy">
          <p>{project.description}</p>
          <p>{project.summary}</p>
          <p className="overview-fact-line">{detailsSentence}</p>
        </div>
        <div className="project-overview-pill-row" aria-label="Project snapshot">
          {hasDisplayValue(project.status) ? <span>{project.status}</span> : null}
          {hasDisplayValue(project.neighborhood) ? <span>{project.neighborhood}</span> : null}
          {hasDisplayValue(project.type) ? <span>{project.type}</span> : null}
        </div>
      </div>

      <div className="project-overview-details-head">
        <p>Project details</p>
        <h3 className="project-overview-title">{project.name}</h3>
      </div>

      <div className="project-overview-layout">
        <div className="project-overview-left">
          {hasDisplayValue(project.status) ? <p className="project-overview-eyebrow">{project.status.toUpperCase()}</p> : null}
          {hasDisplayValue(project.neighborhood) ? <p className="project-overview-eyebrow">{project.neighborhood.toUpperCase()}</p> : null}

          <p className="project-overview-text">
            {project.name} by <Link href={`/developers/${project.developerSlug}`} className="overview-link">{project.developerName}</Link> in {project.location} is a {project.type.toLowerCase()} with {project.units} units.
          </p>

          <div className="project-overview-bottom-rows">
            <p>
              <strong>Neighborhood:</strong>{" "}
              {project.neighborhoodSlug
                ? <Link href={`/neighborhoods/${project.neighborhoodSlug}`} className="overview-link">{project.neighborhood}</Link>
                : <Link href={`/projects?neighborhood=${encodeURIComponent(project.neighborhood)}`} className="overview-link">{project.neighborhood}</Link>}
            </p>
            <p>
              <strong>Building type:</strong> {project.type}
            </p>
          </div>
        </div>

        <div className="project-overview-right" role="list" aria-label="Project details list">
          {hasDisplayValue(project.bedrooms) ? <p role="listitem"><strong>Beds:</strong> {project.bedrooms}</p> : null}
          {hasDisplayValue(project.bathrooms) ? <p role="listitem"><strong>Baths:</strong> {project.bathrooms}</p> : null}
          {hasDisplayValue(project.ownership) ? <p role="listitem"><strong>Ownership:</strong> {project.ownership}</p> : null}
          {hasDisplayValue(project.status) ? <p role="listitem"><strong>Listing status:</strong> {project.status}</p> : null}
          {hasDisplayValue(salesStarted) ? <p role="listitem"><strong>Sales started:</strong> {salesStarted}</p> : null}
          {hasDisplayValue(project.constructionStatus) ? <p role="listitem"><strong>Construction status:</strong> {project.constructionStatus}</p> : null}
          {hasDisplayValue(project.completionYear) ? <p role="listitem"><strong>Estimated completion:</strong> {project.completionYear}</p> : null}
          {hasDisplayValue(project.developerName) ? <p role="listitem"><strong>Builders:</strong> <Link href={`/developers/${project.developerSlug}`} className="overview-link">{project.developerName}</Link></p> : null}
          {hasDisplayValue(project.salesCompanyName) ? <p role="listitem"><strong>Sales company:</strong> {renderEntityLink(project.salesCompanyName ?? "", project.salesCompanySlug, "/sales-companies", "overview-link")}</p> : null}
          {hasDisplayValue(project.interiorDesignerName) ? <p role="listitem"><strong>Interior designer:</strong> {renderEntityLink(project.interiorDesignerName ?? "", project.interiorDesignerSlug, "/interior-designers", "overview-link")}</p> : null}
        </div>
      </div>
    </section>
  );
}

export function NearbyList({ project }: { project: Project }) {
  return (
    <div className="grid gap-2 border border-stone-200 bg-white p-4 text-sm md:grid-cols-2">
      {project.nearby.map((n) => <p key={n.name}>{n.name} - {n.distanceKm} km</p>)}
    </div>
  );
}

export function LeadTable({ rows }: { rows: Lead[] }) {
  return (
    <div className="overflow-x-auto border border-stone-200 bg-white">
      <table className="w-full min-w-175 text-sm"><thead className="bg-stone-50"><tr><th className="p-3 text-left">Name</th><th className="p-3 text-left">Project</th><th className="p-3 text-left">Date</th><th className="p-3 text-left">Status</th></tr></thead><tbody>{rows.map((r) => <tr key={r.id} className="border-t border-stone-100"><td className="p-3">{r.name}</td><td className="p-3">{r.projectSlug}</td><td className="p-3">{r.date}</td><td className="p-3">{r.status}</td></tr>)}</tbody></table>
    </div>
  );
}

export function ResultsToolbar({ count }: { count: number }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border border-stone-200 bg-white p-3 text-sm">
      <div className="flex items-center gap-2"><Search className="h-4 w-4" /><span>{count} new apartment projects</span></div>
      <div className="flex items-center gap-2"><FilterChip label="Sort: Featured" /><FilterChip label="Map/List" /></div>
    </div>
  );
}

export function PriceTag({ amount }: { amount: number }) {
  return <span>{compactLkr(amount)}</span>;
}
