"use client";

import Image from "next/image";
import Link from "next/link";
import { AccountMenu } from "@/components/auth/account-menu";
import { IconChevronRight as TablerChevronRight, IconMenu2, IconX as TablerX } from "@tabler/icons-react";
import { useSavedListing } from "@/lib/use-saved-listing";
import { getStoredUtmParams, getTrafficSource, trackEvent } from "@/lib/ga4";
import { getSessionId } from "@/components/marketplace/view-tracker";
import {
  ApartmentIcon,
  AreaIcon,
  BathIcon,
  BedIcon,
  BlueprintIcon,
  BoltIcon,
  BuildingIcon,
  CarIcon,
  ClockIcon,
  ConstructionIcon,
  DropletIcon,
  FloorsIcon,
  GiftIcon,
  LandmarkIcon,
  PinIcon,
  PriceTagIcon,
  RoadIcon,
  RulerIcon,
  ShieldIcon,
  StatusHouseIcon,
} from "@/components/icons/stat-icons";
import { Fragment, FormEvent, useEffect, useMemo, useRef, useState } from "react";
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
  Heart,
  HeartPulse,
  Hammer,
  HousePlus,
  Landmark,
  Mail,
  Compass,
  Construction,
  Droplet,
  FileText,
  Gift,
  Layers,
  LayoutGrid,
  LayoutPanelLeft,
  Map as MapIcon,
  MapPinned,
  MapPin,
  Navigation,
  RotateCw,
  Phone,
  Ruler,
  Search,
  Share2,
  ShieldCheck,
  Square,
  SlidersHorizontal,
  Trees,
  ClipboardList,
  Users,
  UtensilsCrossed,
  Video,
  Waves,
  X,
  Zap,
  MessageCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteLanguage, useLanguage } from "@/components/layout/language-provider";
import { compactLkr, formatLkr, formatOfficeHours } from "@/lib/format";
import { Amenity, Article, Developer, FloorPlan, Lead, Location, NearbyPlace, Project } from "@/types";
import { localizedProjectCopy, useListingT } from "@/lib/i18n/use-listing-t";
import { floorPlanSummarySentence } from "@/lib/i18n/floor-plan-sentence";
import { formatWhatsAppNumber, listingWhatsAppHref } from "@/lib/whatsapp";
import { groupNearbyPlaces } from "@/lib/nearby-places";

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
  "Infinity Pool": Waves,
  "Games Room": LayoutGrid,
  "Sky Lounge": Building2,
  "Retail Mall": Building,
  Hotel: HousePlus,
};

function renderEntityLink(name: string, slug: string | undefined, basePath: string, className?: string) {
  if (!slug) {
    return <span className={className}>{name}</span>;
  }

  return <Link href={`${basePath}/${slug}`} className={className}>{name}</Link>;
}

function FacebookIcon({ className }: { className?: string }) {
  return <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true"><path d="M22 12a10 10 0 1 0-11.6 9.9v-7H8v-2.9h2.4V9.8c0-2.4 1.4-3.7 3.6-3.7 1 0 2.1.2 2.1.2v2.3h-1.2c-1.2 0-1.6.7-1.6 1.5v1.8h2.7l-.4 2.9h-2.3v7A10 10 0 0 0 22 12Z" /></svg>;
}

function InstagramIcon({ className }: { className?: string }) {
  return <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" /></svg>;
}

function WhatsappIcon({ className }: { className?: string }) {
  return <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15L2 22l5.2-1.4A10 10 0 1 0 12 2Zm5.6 14.3c-.2.6-1.3 1.2-1.8 1.3-.5.1-1 .1-3.5-1s-4.1-3.4-4.2-3.5c-.1-.2-1-1.3-1-2.5s.6-1.8.9-2.1c.2-.2.5-.3.7-.3h.5c.2 0 .4 0 .6.5.2.5.7 1.7.7 1.8.1.2.1.3 0 .5-.1.2-.1.3-.3.5l-.4.5c-.1.2-.3.3-.1.6.2.3.9 1.4 1.9 2.3 1.3 1.1 2.3 1.5 2.6 1.6.3.1.5.1.7-.1.2-.2.8-.9 1-1.2.2-.3.4-.2.7-.1.3.1 1.7.8 2 1 .3.1.5.2.6.3.1.2.1.7-.1 1.3Z" /></svg>;
}

function YoutubeIcon({ className }: { className?: string }) {
  return <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="2" y="5" width="20" height="14" rx="4" /><path d="m10 9 5 3-5 3Z" fill="currentColor" stroke="currentColor" strokeLinejoin="round" /></svg>;
}

function TiktokIcon({ className }: { className?: string }) {
  return <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true"><path d="M16.6 5.8a4.3 4.3 0 0 1-3-4.3h-3.2v14.6a2.6 2.6 0 1 1-2.6-2.6c.2 0 .5 0 .7.1V10.4a5.9 5.9 0 0 0-.7 0A5.9 5.9 0 1 0 13.6 16V9.2a7.4 7.4 0 0 0 4.3 1.4V7.4a4.3 4.3 0 0 1-1.3-1.6Z" /></svg>;
}

function LinkedinIcon({ className }: { className?: string }) {
  return <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true"><path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5ZM3 9h4v12H3V9Zm7 0h3.8v1.7h.05c.53-1 1.83-2.05 3.77-2.05 4.03 0 4.78 2.66 4.78 6.11V21h-4v-5.3c0-1.27-.02-2.9-1.77-2.9-1.77 0-2.04 1.38-2.04 2.8V21h-4V9Z" /></svg>;
}

function TwitterIcon({ className }: { className?: string }) {
  return <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true"><path d="M18.9 2H22l-7.6 8.7L23 22h-6.8l-5.3-6.9L4.9 22H1.8l8.1-9.3L1 2h7l4.8 6.3L18.9 2Zm-1.2 18h1.9L7.4 4H5.4l12.3 16Z" /></svg>;
}

export const SOCIAL_ICON: Record<string, React.ComponentType<{ className?: string }>> = {
  facebook: FacebookIcon,
  instagram: InstagramIcon,
  whatsapp: WhatsappIcon,
  youtube: YoutubeIcon,
  tiktok: TiktokIcon,
  linkedin: LinkedinIcon,
  twitter: TwitterIcon,
};

// Admin/developer-pasted video fields accept a plain YouTube/Vimeo watch
// link ("or upload a video file... paste its URL here") — neither of those
// play in an <iframe> as-is, only their dedicated embed URL does.
function toEmbeddableVideoUrl(url: string): string {
  const youtubeWatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/);
  if (youtubeWatch) return `https://www.youtube.com/embed/${youtubeWatch[1]}`;

  const vimeo = url.match(/vimeo\.com\/(\d+)/);
  if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}`;

  return url;
}

function isDirectVideoFile(url: string): boolean {
  return /\.(mp4|webm|mov)(\?|$)/i.test(url) || url.startsWith("blob:");
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

function isHotDealActive(project: Project) {
  return Boolean(project.hotDeal?.enabled && hasDisplayValue(project.hotDeal?.title));
}

// "Move in 2022" on a building finished years ago is noise, not a selling
// point — the badge only makes sense for a move-in date a buyer can still
// plan around: this year onward. Past years show nothing (the year is still
// in the fact sheet as "Move-in year"). Asked for on 2026-09-07.
export function isUpcomingMoveIn(project: Pick<Project, "completionYear">) {
  return project.completionYear >= new Date().getFullYear();
}

// Developers quote short distances in metres ("10 m to Marine Drive"), and
// distanceKm stores that as 0.01 — show it back as metres rather than
// "0.01 km".
function formatDistanceKm(distanceKm: number) {
  if (distanceKm < 1) return `${Math.round(distanceKm * 1000)} m`;
  return `${distanceKm} km`;
}

function hasQuickMoveIn(project: Project) {
  return project.floorPlans.some((plan) => plan.quickMoveIn);
}

// Fire-and-forget: logs a raw Analytics event server-side (Payload) and
// mirrors it to GA4 client-side. Used by the brochure-download button and
// the tel: phone links — never awaited, never blocks the actual action
// (opening the brochure, dialing the number).
// "Unit A · 3 bed · 1,300 SqFt" — how a plan is named on a lead and in the
// developer's alert. Only facts the plan carries; missing ones drop out.
function describeFloorPlanForLead(plan: FloorPlan): string {
  return [
    plan.planName,
    plan.bedrooms > 0 ? `${plan.bedrooms} bed` : "",
    plan.floorAreaSqFt > 0 ? `${plan.floorAreaSqFt.toLocaleString("en-US")} SqFt` : "",
  ].filter(Boolean).join(" · ");
}

function logListingEvent(endpoint: string, ga4EventName: string, projectSlug: string, listingName: string) {
  const sessionId = getSessionId();
  const trafficSource = getTrafficSource();
  fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ projectSlug, sessionId, trafficSource }),
    keepalive: true,
  }).catch(() => {});
  trackEvent(ga4EventName, { listing_id: projectSlug, listing_name: listingName });
}

export function StatusBadge({ status }: { status: string }) {
  return <span className="rounded-sm border border-stone-300 bg-white px-2 py-1 text-xs font-medium text-stone-700">{status}</span>;
}

export function SaveButton({ projectSlug }: { projectSlug: string }) {
  const { saved, toggle } = useSavedListing(projectSlug);
  return (
    <Button variant="outline" className="rounded-sm" onClick={toggle}>
      <Heart className={`mr-2 h-4 w-4 ${saved ? "fill-current text-[#d94f4f]" : ""}`} />
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
      <Image src={project.heroImage} alt={`${project.name} in ${project.location}`} width={900} height={500} className="h-48 w-full object-cover" />
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
      <Image src={project.heroImage} alt={`${project.name} in ${project.location}`} width={1200} height={700} className="h-64 w-full object-cover md:h-full" />
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
      <Image src={project.heroImage} alt={`${project.name} in ${project.location}`} width={600} height={350} className="h-44 w-full object-cover" />
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2 justify-between">
          <h3 className="text-xl font-semibold">{project.name}</h3>
          <StatusBadge status={project.status} />
        </div>
        <p className="text-sm text-stone-600">
          {project.developerName}
          {(project.coDevelopers ?? []).filter((entry) => entry.name).map((entry) => `, ${entry.name}`).join("")}
          {" "}• {project.location}
        </p>
        {(project.isFeatured || project.isMoveInNow || hasQuickMoveIn(project)) ? (
          <div className="home-card-badge-row" aria-label="Listing badges">
            {project.isMoveInNow ? <span className="badge-move-in-now">Move-In Now</span> : null}
            {hasQuickMoveIn(project) ? <span className="badge-quick-move-in">Quick Move-In</span> : null}
            {project.isFeatured ? <span className="badge-featured">Featured</span> : null}
          </div>
        ) : null}
        <p className="text-sm text-stone-700">{project.summary}</p>
        <div className="grid grid-cols-2 gap-2 text-sm text-stone-800 md:grid-cols-4">
          <span>From {formatLkr(project.startingPriceLkr)}</span>
          <span>{project.priceRange}</span>
          <span>{project.bedrooms} Beds</span>
          <span>{project.floorAreaRange}</span>
          {hasDisplayValue(project.ownership) ? <span>{project.ownership}</span> : null}
        </div>
        <div className="flex gap-2">
          <SaveButton projectSlug={project.slug} />
          <Link href={`/projects/${project.slug}`} className="inline-flex items-center border border-stone-900 px-3 py-2 text-sm">View project</Link>
        </div>
      </div>
    </article>
  );
}

// Swipe-to-navigate for the photo lightbox's media wrap (mobile touch
// only — desktop keeps using the arrow buttons). Tracks the touch start
// position in a ref rather than state, since it never needs to trigger a
// re-render; a horizontal drag past SWIPE_THRESHOLD_PX fires the matching
// prev/next callback, same as clicking an arrow would.
const SWIPE_THRESHOLD_PX = 50;

function useSwipeNavigation(onPrev: () => void, onNext: () => void) {
  const touchStartX = useRef<number | null>(null);

  return {
    onTouchStart: (event: React.TouchEvent) => {
      touchStartX.current = event.touches[0]?.clientX ?? null;
    },
    onTouchEnd: (event: React.TouchEvent) => {
      if (touchStartX.current === null) return;
      const endX = event.changedTouches[0]?.clientX ?? touchStartX.current;
      const delta = endX - touchStartX.current;
      touchStartX.current = null;
      if (Math.abs(delta) < SWIPE_THRESHOLD_PX) return;
      if (delta > 0) onPrev();
      else onNext();
    },
  };
}

export function ProjectHero({
  project,
  titleOverride,
  heroImageOverride,
  floorPlan,
  showAmenitiesAndNeighborhoodNav = true,
  backHref,
  backLabel,
  plansHomesNavLabel = "Floor Plans",
  amenitiesNavLabel = "Amenities",
  statusLabelOverride,
  extraBadges = [],
  roadMapImages = [],
  blockPlanImages: blockPlanImagesProp = [],
  videoLinks = [],
  requestInfoVariant = "standard",
  whatsappHref = null,
}: {
  project: Project;
  titleOverride?: string;
  heroImageOverride?: string;
  floorPlan?: FloorPlan;
  showAmenitiesAndNeighborhoodNav?: boolean;
  backHref?: string;
  backLabel?: string;
  plansHomesNavLabel?: string;
  amenitiesNavLabel?: string;
  /** Shows this instead of `project.status` in the status pill — for pages
   * (like land) that adapt their own data onto the Project shape and need
   * to display their real status value rather than the mapped one. */
  statusLabelOverride?: string;
  /** Extra small pills rendered alongside Move-In-Now/Featured/etc. — for
   * marketing trust badges (e.g. land's "Easy Payment Plan") that don't map
   * to any existing Project boolean flag. */
  // Plain strings render with the generic .badge-extra color; pass an
  // object with `kind` to get a per-category color (availability /
  // marketing / location) so the badge groups are visually distinct.
  extraBadges?: (string | { label: string; kind?: "availability" | "marketing" | "location" })[];
  /** Land-only media that doesn't fit the Project shape: multiple road map
   * images, multiple block plan images, and a list of video links (rather
   * than the single gallery-label-matched road map image / single embed
   * video that Project pages use). Ignored (default []) on Project pages. */
  roadMapImages?: { label: string; image: string }[];
  blockPlanImages?: { label: string; image: string }[];
  videoLinks?: { label: string; url: string }[];
  /** Forwarded to RequestInfoDialog — see its `variant` prop. */
  requestInfoVariant?: "standard" | "inquiry";
  /** wa.me link to the developer with a pre-filled opener (src/lib/whatsapp.ts
   * listingWhatsAppHref) — renders the green WhatsApp button beside
   * "Request info" on desktop and in the mobile bar. Null = no button. */
  whatsappHref?: string | null;
}) {
  const { saved: savedListing, toggle: toggleSaved } = useSavedListing(project.slug);
  const hasKeyFeatures = normalizeUnitFeaturesForDisplay(project.unitFeatures).some((group) => group.items.length > 0);
  const hasCommercialAreas = (project.commercialAreas?.length ?? 0) > 0;
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

  const photoItems = heroImageOverride
    ? [
        { label: floorPlan?.image3d ? `${floorPlan.planName} — 2D Floor Plan` : (floorPlan?.planName ?? "Floor Plan"), image: heroImageOverride },
        // A 3D render of the same plan, when the developer provides one —
        // becomes the second lightbox item so 2D/3D flip via the arrows.
        ...(floorPlan?.image3d ? [{ label: `${floorPlan.planName} — 3D View`, image: floorPlan.image3d }] : []),
      ]
    : [
        { label: "Exterior", image: project.heroImage },
        // heroImage is almost always also the first (or an early) gallery
        // photo — without this filter that same image shows twice in the
        // grid (once as the main photo via heroImage, once again as a side
        // thumbnail via gallery), while a genuinely different photo never
        // gets its slot.
        ...project.gallery
          .filter((item) => item.image !== project.heroImage)
          .map((item, index) => ({
            ...item,
            label: item.label?.trim() || fallbackPhotoLabels[index % fallbackPhotoLabels.length],
          })),
      ];
  const [photoIndex, setPhotoIndex] = useState(0);

  const usingExtraVideos = !project.videos?.length && videoLinks.length > 0;
  const videoItems: { label: string; url: string }[] = usingExtraVideos
    ? videoLinks
    : (project.videos ?? []).filter((video) => video.embedUrl).map((video, index) => ({ label: video.label || `Video ${index + 1}`, url: video.embedUrl! }));
  const videoCount = videoItems.length;
  const [videoIndex, setVideoIndex] = useState(0);
  const activeVideo = videoItems[Math.max(0, Math.min(videoIndex, videoItems.length - 1))];
  const handlePrevVideo = () => setVideoIndex((index) => (index - 1 + videoItems.length) % videoItems.length);
  const handleNextVideo = () => setVideoIndex((index) => (index + 1) % videoItems.length);
  const virtualTourCount = project.virtualTours?.length ?? 0;
  const { t } = useListingT();
  const hasMap = project.coordinates?.lat != null && project.coordinates?.lng != null;
  const hasInteractiveMap = Boolean(project.interactiveMapUrl);
  // Floor plan count for the hero pill: prefer a gallery photo explicitly
  // labeled as a block/site/floor plan, otherwise count the project's own
  // Floor Plans data. The pill jumps to the "Floor Plans" section below
  // rather than opening the lightbox — that section is the real browsing UI.
  const hasGalleryFloorPlanImage = project.gallery.some((item) => /block\s*plan|site\s*plan|floor\s*plan/i.test(item.label));
  const floorPlanCount = project.floorPlans.length > 0 ? project.floorPlans.length : (hasGalleryFloorPlanImage ? 1 : 0);
  const hasBlockPlan = floorPlanCount > 0;
  // Road Map is normally a single uploaded gallery image (like Floor Plan),
  // matched by label — but land pages pass roadMapImages directly since they
  // support several road map uploads, not just one.
  const roadMapImage = project.gallery.find((item) => /road\s*map/i.test(item.label))?.image;
  const roadMapItems = roadMapImages.length > 0 ? roadMapImages : (roadMapImage ? [{ label: "Road Map", image: roadMapImage }] : []);
  const hasRoadMap = roadMapItems.length > 0;
  // Block Plan pill/lightbox — same auto-derive-from-gallery convention as
  // Road Map above. This was previously prop-only, and since no caller ever
  // passed it, the Block Plan pill never actually appeared anywhere on the
  // live site even when a project had a "Block Plan" gallery photo.
  const blockPlanImage = project.gallery.find((item) => /block\s*plan/i.test(item.label))?.image;
  const blockPlanImages = blockPlanImagesProp.length > 0 ? blockPlanImagesProp : (blockPlanImage ? [{ label: "Block Plan", image: blockPlanImage }] : []);
  const hasBlockPlanImages = blockPlanImages.length > 0;
  const hasStreetView = hasMap;

  const [roadMapIndex, setRoadMapIndex] = useState(0);
  const [blockPlanIndex, setBlockPlanIndex] = useState(0);
  const activeRoadMapItem = roadMapItems[Math.max(0, Math.min(roadMapIndex, roadMapItems.length - 1))];
  const activeBlockPlanItem = blockPlanImages[Math.max(0, Math.min(blockPlanIndex, blockPlanImages.length - 1))];

  // Photos/Videos/Map/Road Map/Street View/Block Plan/Floor Plan all open
  // the lightbox (see the pills below); only these two swap the hero's own
  // inline media surface.
  const availableMedia = useMemo(() => {
    const tabs: Array<"interactiveMap" | "virtualTours"> = [];
    if (hasInteractiveMap) tabs.push("interactiveMap");
    if (virtualTourCount > 0) tabs.push("virtualTours");
    return tabs;
  }, [hasInteractiveMap, virtualTourCount]);

  const [activeMedia, setActiveMedia] = useState<"interactiveMap" | "virtualTours" | null>(null);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  useEffect(() => {
    if (!isLightboxOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsLightboxOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isLightboxOpen]);
  const [lightboxView, setLightboxView] = useState<"photos" | "videos" | "map" | "roadMap" | "blockPlan" | "streetView" | "view360">("photos");
  const [activeSection, setActiveSection] = useState("overview");
  const [requestInfoOpen, setRequestInfoOpen] = useState(false);
  // The brochure pill opens the same dialog as "Request info", just with
  // brochure-specific copy — everything else about the dialog is shared.
  const [requestInfoDialogVariant, setRequestInfoDialogVariant] = useState<"standard" | "inquiry" | "brochure">(requestInfoVariant);
  const openRequestInfo = () => {
    setRequestInfoDialogVariant(requestInfoVariant);
    setRequestInfoOpen(true);
  };
  const openBrochureRequest = () => {
    setRequestInfoDialogVariant("brochure");
    setRequestInfoOpen(true);
  };
  const titlePanelRef = useRef<HTMLDivElement>(null);
  const [scrolledPastTitle, setScrolledPastTitle] = useState(false);

  useEffect(() => {
    if (activeMedia && !availableMedia.includes(activeMedia)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setActiveMedia(null);
    }
  }, [activeMedia, availableMedia]);

  // Mobile-only: the top action bar (Get updates / Request info) is fixed,
  // not sticky — it's rendered inside .listing-hero, a short section, and
  // position: sticky is bounded by its nearest containing block, so it
  // would scroll away with that section instead of staying pinned through
  // the rest of the page. Gate its visibility on having scrolled past the
  // title instead, so it doesn't overlap the site header at the top of the
  // page before that. The bottom quick-jump tab bar doesn't need this —
  // nothing else occupies the bottom of the viewport for it to overlap.
  useEffect(() => {
    const target = titlePanelRef.current;
    if (!target) return;
    const observer = new IntersectionObserver(([entry]) => setScrolledPastTitle(!entry.isIntersecting), { threshold: 0 });
    observer.observe(target);
    return () => observer.disconnect();
  }, []);

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
  const streetViewSrc = project.streetViewUrl
    ? project.streetViewUrl
    : hasMap
      ? `https://www.google.com/maps?layer=c&cbll=${project.coordinates.lat},${project.coordinates.lng}&output=svembed`
      : mapSrc;

  const activePhoto = photoItems[Math.max(0, Math.min(photoIndex, photoItems.length - 1))];

  const handlePrevPhoto = () => {
    if (!photoItems.length) return;
    setPhotoIndex((index) => (index - 1 + photoItems.length) % photoItems.length);
  };

  const handleNextPhoto = () => {
    if (!photoItems.length) return;
    setPhotoIndex((index) => (index + 1) % photoItems.length);
  };

  const handlePrevRoadMap = () => {
    if (!roadMapItems.length) return;
    setRoadMapIndex((index) => (index - 1 + roadMapItems.length) % roadMapItems.length);
  };

  const handleNextRoadMap = () => {
    if (!roadMapItems.length) return;
    setRoadMapIndex((index) => (index + 1) % roadMapItems.length);
  };

  const handlePrevBlockPlan = () => {
    if (!blockPlanImages.length) return;
    setBlockPlanIndex((index) => (index - 1 + blockPlanImages.length) % blockPlanImages.length);
  };

  const handleNextBlockPlan = () => {
    if (!blockPlanImages.length) return;
    setBlockPlanIndex((index) => (index + 1) % blockPlanImages.length);
  };

  const photoSwipeHandlers = useSwipeNavigation(handlePrevPhoto, handleNextPhoto);
  const roadMapSwipeHandlers = useSwipeNavigation(handlePrevRoadMap, handleNextRoadMap);
  const blockPlanSwipeHandlers = useSwipeNavigation(handlePrevBlockPlan, handleNextBlockPlan);

  // Every quick-jump control on the hero (photos/videos/map/etc.) — shared
  // by the hero's own pill row and the desktop floating bottom bar, so the
  // two never drift out of sync. `render` takes the caller's className so
  // each surface keeps its own pill styling.
  const heroMediaPills: { key: string; show: boolean; lightboxKey?: typeof lightboxView; render: (className: string) => React.ReactElement }[] = [
    {
      key: "photos",
      show: photoItems.length > 0,
      lightboxKey: "photos",
      render: (className) => (
        <button
          type="button"
          className={className}
          onClick={() => {
            setPhotoIndex(0);
            setLightboxView("photos");
            setIsLightboxOpen(true);
          }}
        >
          <LayoutGrid className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" /> <span className="listing-hero-quickjump-label">{t("Photos")} <span className="listing-hero-quickjump-count">{photoItems.length}</span></span>
        </button>
      ),
    },
    {
      key: "videos",
      show: videoCount > 0,
      lightboxKey: "videos",
      render: (className) => (
        <button
          type="button"
          className={className}
          onClick={() => {
            setLightboxView("videos");
            setIsLightboxOpen(true);
          }}
        >
          <Video className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" /> <span className="listing-hero-quickjump-label">{t("Videos")} <span className="listing-hero-quickjump-count">{videoCount}</span></span>
        </button>
      ),
    },
    {
      key: "map",
      show: hasMap,
      lightboxKey: "map",
      render: (className) => (
        <button
          type="button"
          className={className}
          onClick={() => {
            setLightboxView("map");
            setIsLightboxOpen(true);
          }}
        >
          <MapIcon className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" /> <span className="listing-hero-quickjump-label">{t("Map")}</span>
        </button>
      ),
    },
    {
      key: "brochure",
      // Always available, not just when a PDF exists — this is a lead-
      // capture touchpoint either way: with a real file it downloads one
      // after submitting, without one it still collects the request (see
      // RequestInfoDialog's isBrochure branch below).
      show: true,
      render: (className) => (
        <button type="button" className={className} onClick={openBrochureRequest}>
          <FileText className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" /> <span className="listing-hero-quickjump-label">{t("Brochure")}</span>
        </button>
      ),
    },
    {
      key: "road-map",
      show: hasRoadMap,
      lightboxKey: "roadMap",
      render: (className) => (
        <button
          type="button"
          className={className}
          onClick={() => {
            setRoadMapIndex(0);
            setLightboxView("roadMap");
            setIsLightboxOpen(true);
          }}
        >
          <MapPinned className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" /> <span className="listing-hero-quickjump-label">{t("Road Map")}{roadMapItems.length > 1 ? <span className="listing-hero-quickjump-count">{roadMapItems.length}</span> : null}</span>
        </button>
      ),
    },
    {
      key: "block-plan",
      show: hasBlockPlanImages,
      lightboxKey: "blockPlan",
      render: (className) => (
        <button
          type="button"
          className={className}
          onClick={() => {
            setBlockPlanIndex(0);
            setLightboxView("blockPlan");
            setIsLightboxOpen(true);
          }}
        >
          <Layers className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" /> <span className="listing-hero-quickjump-label">{t("Block Plan")}{blockPlanImages.length > 1 ? <span className="listing-hero-quickjump-count">{blockPlanImages.length}</span> : null}</span>
        </button>
      ),
    },
    {
      key: "view-360",
      show: Boolean(project.view360Url),
      lightboxKey: "view360",
      render: (className) => (
        <button
          type="button"
          className={className}
          onClick={() => {
            setLightboxView("view360");
            setIsLightboxOpen(true);
          }}
        >
          <RotateCw className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" /> <span className="listing-hero-quickjump-label">360° View</span>
        </button>
      ),
    },
    {
      key: "street-view",
      show: hasStreetView,
      lightboxKey: "streetView",
      render: (className) => (
        <button
          type="button"
          className={className}
          onClick={() => {
            setLightboxView("streetView");
            setIsLightboxOpen(true);
          }}
        >
          <Navigation className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" /> <span className="listing-hero-quickjump-label">{t("Street View")}</span>
        </button>
      ),
    },
    {
      key: "interactive-map",
      show: hasInteractiveMap,
      render: (className) => (
        <button type="button" className={className} onClick={() => setActiveMedia("interactiveMap")}>
          <Compass className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" /> <span className="listing-hero-quickjump-label">Interactive map</span>
        </button>
      ),
    },
    {
      key: "virtual-tours",
      show: virtualTourCount > 0,
      render: (className) => (
        <button type="button" className={className} onClick={() => setActiveMedia("virtualTours")}>
          <Camera className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" /> <span className="listing-hero-quickjump-label">{t("Virtual tours")} <span className="listing-hero-quickjump-count">{virtualTourCount}</span></span>
        </button>
      ),
    },
    {
      // Last among the regular pills (only Street View, which always sorts
      // after everything else, can come after it) — moved here from right
      // after Map, per an explicit request to push it to the end of the
      // mobile sticky bar.
      key: "floor-plans",
      show: hasBlockPlan,
      render: (className) => (
        <a href="#plans-homes" className={className} onClick={() => setActiveSection("plans-homes")}>
          <LayoutPanelLeft className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" /> <span className="listing-hero-quickjump-label">{t(plansHomesNavLabel)} <span className="listing-hero-quickjump-count">{floorPlanCount}</span></span>
        </a>
      ),
    },
  ];
  const visibleHeroMediaPills = heroMediaPills.filter((pill) => pill.show);
  // The mobile sticky-to-bottom quick-jump bar has room for 6 icons max.
  // Street View is the least essential of the set, so it always sorts last
  // and is the first (only) thing dropped when the bar is already full —
  // never bumps a more useful pill out to make room for itself.
  const quickjumpOtherPills = visibleHeroMediaPills.filter((pill) => pill.key !== "street-view");
  const quickjumpStreetViewPill = visibleHeroMediaPills.find((pill) => pill.key === "street-view");
  const quickjumpPills =
    quickjumpOtherPills.length < 6 && quickjumpStreetViewPill
      ? [...quickjumpOtherPills.slice(0, 6), quickjumpStreetViewPill]
      : quickjumpOtherPills.slice(0, 6);

  return (
    <>
    <div className="listing-hero-sticky-bar">
      <div className="listing-hero-panel-row">
        <nav aria-label="Project sections" className="listing-hero-nav">
          {backHref ? (
            <Link href={backHref} className="listing-hero-nav-back">
              <ChevronLeft className="h-3.5 w-3.5" aria-hidden="true" /> {t(backLabel ?? "Back")}
            </Link>
          ) : null}
          <a href="#overview" className={activeSection === "overview" ? "active" : undefined} onClick={() => setActiveSection("overview")}>{t("Overview")}</a>
          <a href="#pricing" className={activeSection === "pricing" ? "active" : undefined} onClick={() => setActiveSection("pricing")}>{t("Pricing")}</a>
          {hasKeyFeatures ? (
            <a href="#key-features" className={activeSection === "key-features" ? "active" : undefined} onClick={() => setActiveSection("key-features")}>{t("Key Features")}</a>
          ) : null}
          <a href="#plans-homes" className={activeSection === "plans-homes" ? "active" : undefined} onClick={() => setActiveSection("plans-homes")}>{t(plansHomesNavLabel)}</a>
          {showAmenitiesAndNeighborhoodNav ? (
            <>
              <a href="#amenities" className={activeSection === "amenities" ? "active" : undefined} onClick={() => setActiveSection("amenities")}>{t(amenitiesNavLabel)}</a>
              {hasCommercialAreas ? (
                <a href="#commercial-areas" className={activeSection === "commercial-areas" ? "active" : undefined} onClick={() => setActiveSection("commercial-areas")}>{t("Commercial Areas")}</a>
              ) : null}
              <a href="#neighborhood" className={activeSection === "neighborhood" ? "active" : undefined} onClick={() => setActiveSection("neighborhood")}>{t("Neighborhood")}</a>
            </>
          ) : null}
        </nav>

        <div className="listing-hero-actions">
          <button type="button" className="action-link"><Bell className="h-4 w-4" aria-hidden="true" />{t("Get updates")}</button>
          <button type="button" className="action-link" onClick={toggleSaved}>
            <Heart className={`h-4 w-4${savedListing ? " text-[#d94f4f]" : ""}`} aria-hidden="true" fill={savedListing ? "currentColor" : "none"} />
            {savedListing ? t("Saved") : t("Save")}
          </button>
          {whatsappHref ? (
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="request-info-btn whatsapp-btn"
              onClick={() => logListingEvent("/api/events/whatsapp-click", "click_whatsapp", project.slug, project.name)}
            >
              <MessageCircle className="h-4 w-4" aria-hidden="true" />
              WhatsApp
            </a>
          ) : null}
          <button type="button" className="request-info-btn" onClick={openRequestInfo}>{t("Request info")}</button>
        </div>
      </div>
    </div>

    <section className="listing-hero">
      <div className="listing-hero-media">
        {activeMedia === null && (
          <div className={`listing-hero-grid${photoItems.length === 1 ? " single-photo" : photoItems.length === 2 ? " two-photo" : ""}`}>
            <button
              type="button"
              className="listing-hero-grid-main"
              onClick={() => {
                setPhotoIndex(0);
                setLightboxView("photos");
                setIsLightboxOpen(true);
              }}
              aria-label="Open photo gallery"
            >
              <Image
                src={photoItems[0].image}
                alt={`${project.name} ${photoItems[0].label}`}
                width={1200}
                height={900}
                className={`listing-hero-grid-main-image${heroImageOverride ? " is-floor-plan" : ""}`}
                priority
              />
            </button>

            {photoItems.length > 1 && (
              <div className="listing-hero-grid-side">
                {photoItems.slice(1, 3).map((item, index) => (
                  <button
                    key={item.image}
                    type="button"
                    className="listing-hero-grid-side-item"
                    onClick={() => {
                      setPhotoIndex(index + 1);
                      setLightboxView("photos");
                      setIsLightboxOpen(true);
                    }}
                    aria-label={`Open photo: ${item.label}`}
                  >
                    <Image src={item.image} alt={`${project.name} ${item.label}`} width={700} height={440} className="listing-hero-grid-side-image" />
                  </button>
                ))}
              </div>
            )}

            <div className="listing-hero-grid-pills">
              {visibleHeroMediaPills.map((pill) => (
                <Fragment key={pill.key}>{pill.render("listing-hero-grid-pill")}</Fragment>
              ))}
            </div>
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

        {activeMedia !== null && (
          <button type="button" className="listing-hero-media-back" onClick={() => setActiveMedia(null)}>
            <ChevronLeft className="h-4 w-4" aria-hidden="true" /> Back to photos
          </button>
        )}
      </div>

      {isLightboxOpen && (
        <div className="listing-photo-lightbox" role="dialog" aria-modal="true" aria-label="Photo gallery">
          <div className="listing-photo-lightbox-topbar">
            <div className="listing-photo-lightbox-toprow">
              <div className="listing-photo-lightbox-meta">
                <p className="primary-line">{project.name}</p>
                <p className="secondary-line">{project.location}</p>
              </div>

              <div className="listing-photo-lightbox-actions">
                <button type="button" className="listing-photo-lightbox-action-btn">
                  <Bell className="h-4 w-4" aria-hidden="true" />
                  {t("Get updates")}
                </button>
                <button type="button" className="listing-photo-lightbox-action-btn" onClick={toggleSaved}>
                  <Heart className={`h-4 w-4${savedListing ? " text-[#d94f4f]" : ""}`} aria-hidden="true" fill={savedListing ? "currentColor" : "none"} />
                  {savedListing ? t("Saved") : t("Save")}
                </button>
                <button type="button" className="listing-photo-lightbox-action-btn">
                  <Share2 className="h-4 w-4" aria-hidden="true" />
                  {t("Share")}
                </button>
                <button
                  type="button"
                  className="listing-photo-lightbox-close"
                  onClick={() => setIsLightboxOpen(false)}
                  aria-label="Close photo gallery"
                >
                  <X className="h-5 w-5" aria-hidden="true" />
                </button>
              </div>
            </div>

            <div className="listing-photo-lightbox-tabs" role="tablist" aria-label="Viewer options">
              <button
                type="button"
                role="tab"
                aria-selected={lightboxView === "photos"}
                className={lightboxView === "photos" ? "active" : undefined}
                onClick={() => setLightboxView("photos")}
              >
                {t("Photos")} <span className="listing-photo-lightbox-tab-count">{photoItems.length}</span>
              </button>
              {videoCount > 0 && (
                <button
                  type="button"
                  role="tab"
                  aria-selected={lightboxView === "videos"}
                  className={lightboxView === "videos" ? "active" : undefined}
                  onClick={() => setLightboxView("videos")}
                >
                  {t("Videos")} <span className="listing-photo-lightbox-tab-count">{videoCount}</span>
                </button>
              )}
              {hasMap && (
                <button
                  type="button"
                  role="tab"
                  aria-selected={lightboxView === "map"}
                  className={lightboxView === "map" ? "active" : undefined}
                  onClick={() => setLightboxView("map")}
                >
                  Map
                </button>
              )}
              {hasRoadMap && (
                <button
                  type="button"
                  role="tab"
                  aria-selected={lightboxView === "roadMap"}
                  className={lightboxView === "roadMap" ? "active" : undefined}
                  onClick={() => setLightboxView("roadMap")}
                >
                  Road Map
                </button>
              )}
              {hasBlockPlanImages && (
                <button
                  type="button"
                  role="tab"
                  aria-selected={lightboxView === "blockPlan"}
                  className={lightboxView === "blockPlan" ? "active" : undefined}
                  onClick={() => setLightboxView("blockPlan")}
                >
                  Block Plan
                </button>
              )}
              {project.view360Url && (
                <button
                  type="button"
                  role="tab"
                  aria-selected={lightboxView === "view360"}
                  className={lightboxView === "view360" ? "active" : undefined}
                  onClick={() => setLightboxView("view360")}
                >
                  360° View
                </button>
              )}
              {hasStreetView && (
                <button
                  type="button"
                  role="tab"
                  aria-selected={lightboxView === "streetView"}
                  className={lightboxView === "streetView" ? "active" : undefined}
                  onClick={() => setLightboxView("streetView")}
                >
                  Street View
                </button>
              )}
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
                <div className="listing-photo-lightbox-media-wrap" {...photoSwipeHandlers}>
                  <Image
                    src={activePhoto.image}
                    alt={`${project.name} ${activePhoto.label}`}
                    width={1920}
                    height={1080}
                    className={`listing-photo-lightbox-image${heroImageOverride ? " is-floor-plan" : ""}`}
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

            {lightboxView === "videos" && activeVideo && (
              <>
                {videoItems.length > 1 && (
                  <button type="button" className="listing-photo-lightbox-arrow left" onClick={handlePrevVideo} aria-label="Previous video">
                    <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                  </button>
                )}
                <div className="listing-photo-lightbox-media-wrap">
                  {isDirectVideoFile(activeVideo.url) ? (
                    <video key={activeVideo.url} src={activeVideo.url} controls className="listing-hero-map-frame" />
                  ) : (
                    <iframe
                      key={activeVideo.url}
                      className="listing-photo-lightbox-map"
                      title={activeVideo.label}
                      src={toEmbeddableVideoUrl(activeVideo.url)}
                      loading="lazy"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  )}
                  <div className="listing-photo-lightbox-caption-row">
                    <div className="listing-photo-lightbox-caption">{activeVideo.label}</div>
                  </div>
                </div>
                {videoItems.length > 1 && (
                  <button type="button" className="listing-photo-lightbox-arrow right" onClick={handleNextVideo} aria-label="Next video">
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

            {lightboxView === "roadMap" && activeRoadMapItem && (
              <>
                {roadMapItems.length > 1 && (
                  <button type="button" className="listing-photo-lightbox-arrow left" onClick={handlePrevRoadMap} aria-label="Previous road map">
                    <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                  </button>
                )}
                <div className="listing-photo-lightbox-media-wrap" {...roadMapSwipeHandlers}>
                  <Image
                    src={activeRoadMapItem.image}
                    alt={`${project.name} ${activeRoadMapItem.label || "road map"}`}
                    width={1920}
                    height={1080}
                    className="listing-photo-lightbox-image"
                  />
                  {activeRoadMapItem.label ? (
                    <div className="listing-photo-lightbox-caption-row">
                      <div className="listing-photo-lightbox-caption">{activeRoadMapItem.label}</div>
                    </div>
                  ) : null}
                </div>
                {roadMapItems.length > 1 && (
                  <button type="button" className="listing-photo-lightbox-arrow right" onClick={handleNextRoadMap} aria-label="Next road map">
                    <ChevronRight className="h-5 w-5" aria-hidden="true" />
                  </button>
                )}
              </>
            )}

            {lightboxView === "blockPlan" && activeBlockPlanItem && (
              <>
                {blockPlanImages.length > 1 && (
                  <button type="button" className="listing-photo-lightbox-arrow left" onClick={handlePrevBlockPlan} aria-label="Previous block plan">
                    <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                  </button>
                )}
                <div className="listing-photo-lightbox-media-wrap" {...blockPlanSwipeHandlers}>
                  <Image
                    src={activeBlockPlanItem.image}
                    alt={`${project.name} ${activeBlockPlanItem.label || "block plan"}`}
                    width={1920}
                    height={1080}
                    className="listing-photo-lightbox-image"
                  />
                  {activeBlockPlanItem.label ? (
                    <div className="listing-photo-lightbox-caption-row">
                      <div className="listing-photo-lightbox-caption">{activeBlockPlanItem.label}</div>
                    </div>
                  ) : null}
                </div>
                {blockPlanImages.length > 1 && (
                  <button type="button" className="listing-photo-lightbox-arrow right" onClick={handleNextBlockPlan} aria-label="Next block plan">
                    <ChevronRight className="h-5 w-5" aria-hidden="true" />
                  </button>
                )}
              </>
            )}

            {lightboxView === "streetView" && (
              <iframe
                className="listing-photo-lightbox-map"
                title="Street view"
                src={streetViewSrc}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            )}

            {lightboxView === "view360" && project.view360Url && (
              <iframe
                className="listing-photo-lightbox-map"
                title="360° view"
                src={project.view360Url}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            )}

          </div>
        </div>
      )}

      <div className="listing-hero-panel" ref={titlePanelRef}>
        <div className="listing-hero-title-wrap">
          <h1>{titleOverride ?? project.name}</h1>
          <p>
            By <Link href={`/developers/${project.developerSlug}`}>{project.developerName}</Link>
            {(project.coDevelopers ?? []).filter((entry) => entry.name).map((entry) => (
              <span key={entry.name}>, {entry.href ? <Link href={entry.href}>{entry.name}</Link> : entry.name}</span>
            ))}
            {hasDisplayValue(project.city) ? (
              <>
                <span> | </span>
                {project.neighborhoodSlug ? (
                  <Link href={`/neighborhoods/${project.neighborhoodSlug}`}>{project.city}</Link>
                ) : (
                  <span>{project.city}</span>
                )}
              </>
            ) : null}
          </p>
        </div>
      </div>

      {(hasDisplayValue(project.status) || isUpcomingMoveIn(project) || project.isFeatured || project.isMoveInNow || hasQuickMoveIn(project) || Boolean(project.paymentPlanBadge) || extraBadges.length > 0) ? (
        <div className="listing-hero-tags" aria-label="Listing status tags">
          {hasDisplayValue(project.status) ? <span className="listing-hero-tag-status">{t(statusLabelOverride ?? project.status)}</span> : null}
          {isUpcomingMoveIn(project) ? <span className="listing-hero-tag-move-in">{t("Move in")} {project.completionYear}</span> : null}
          {project.isMoveInNow ? <span className="listing-badge-pill badge-move-in-now">{t("Move-In Now")}</span> : null}
          {hasQuickMoveIn(project) ? <span className="listing-badge-pill badge-quick-move-in">{t("Quick Move-In")}</span> : null}
          {project.isFeatured ? <span className="listing-badge-pill badge-featured">{t("Featured")}</span> : null}
          {project.paymentPlanBadge ? <span className="listing-badge-pill badge-featured">{project.paymentPlanBadge}</span> : null}
          {extraBadges.map((badge) => {
            const label = typeof badge === "string" ? badge : badge.label;
            const kind = typeof badge === "string" ? undefined : badge.kind;
            return <span key={`${kind ?? "extra"}-${label}`} className={`listing-badge-pill ${kind ? `badge-${kind}` : "badge-extra"}`}>{label}</span>;
          })}
        </div>
      ) : null}

      {isHotDealActive(project) ? <HotDealCard hotDeal={project.hotDeal!} /> : null}

        <div className={`listing-hero-mobile-ctas${scrolledPastTitle ? " is-visible" : ""}${whatsappHref ? " has-whatsapp" : ""}`} aria-label="Mobile quick actions">
          <button type="button" className="listing-hero-mobile-btn listing-hero-mobile-btn-updates">
            <Bell className="h-4 w-4" aria-hidden="true" />
            {t("Get updates")}
          </button>
          {whatsappHref ? (
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="listing-hero-mobile-btn listing-hero-mobile-btn-whatsapp"
              aria-label="Chat on WhatsApp"
              onClick={() => logListingEvent("/api/events/whatsapp-click", "click_whatsapp", project.slug, project.name)}
            >
              <MessageCircle className="h-5 w-5" aria-hidden="true" />
            </a>
          ) : null}
          <button type="button" className="listing-hero-mobile-btn listing-hero-mobile-btn-request" onClick={openRequestInfo}>
            {t("Request info")}
          </button>
        </div>

    </section>

    {/* Rendered as a sibling of .listing-hero (not nested inside it) so its
        containing block spans the rest of the page — position: sticky is
        bounded by its nearest containing block, so nested inside the short
        hero section it would scroll away with the section instead of
        staying pinned through the rest of the page on mobile. */}
    {quickjumpPills.length > 0 && (
      // Mobile only: two-word labels ("Road Map", "Block Plan", "Floor
      // Plans", "Street View") stack onto two lines — but only once there
      // are enough tabs (the full set of 7) that they need the room; with
      // fewer tabs every label stays on its natural single line. Capped at
      // 6 pills now (see quickjumpPills above), so this can no longer
      // actually trigger — left in place in case the cap changes later.
      <div className={`listing-hero-quickjump-bar${quickjumpPills.length >= 7 ? " is-compact" : ""}`} aria-label="Quick jump">
        {quickjumpPills.map((pill) => (
          <Fragment key={pill.key}>
            {pill.render(`listing-hero-quickjump-btn${pill.lightboxKey && pill.lightboxKey === lightboxView ? " is-active" : ""}`)}
          </Fragment>
        ))}
      </div>
    )}

    <RequestInfoDialog open={requestInfoOpen} onClose={() => setRequestInfoOpen(false)} project={project} floorPlan={floorPlan} variant={requestInfoDialogVariant} />
    </>
  );
}

function HotDealCard({ hotDeal }: { hotDeal: NonNullable<Project["hotDeal"]> }) {
  return (
    <div className="hot-deal-banner">
      <span className="hot-deal-banner-badge">{hotDeal.badge || "Hot Deal"}</span>
      <span className="hot-deal-banner-title">{hotDeal.title}</span>
      <span className="hot-deal-banner-desc">{hotDeal.description}</span>
    </div>
  );
}

// Keyed by chip *key* (the stored picker value), not the display label.
const STAT_CHIP_ICON: Record<string, React.ComponentType<{ className?: string }>> = {
  "Listing status": HousePlus,
  Status: HousePlus,
  "Building status": Construction,
  "Move in": Clock3,
  "Price range": CircleDollarSign,
  Price: CircleDollarSign,
  "Price CAD": CircleDollarSign,
  Address: MapPin,
  "Total units": Building2,
  "Total Units": Building2,
  "Units sold": Layers,
  "Units available": Compass,
  "Floor plans": LayoutGrid,
  "Plan type": LayoutGrid,
  Stories: Ruler,
  Floors: Ruler,
  "Property type": Building,
  "Project type": Building,
  Beds: BedDouble,
  Baths: Bath,
  SqFt: Square,
  "Interior size": Square,
  Balcony: Square,
  Basement: Layers,
  Garage: Car,
  Road: MapPinned,
  Area: MapPin,
  Electricity: Zap,
  "Tap water": Droplet,
  Incentives: Gift,
  Parking: Car,
  "Carpark levels": Car,
  "Avg unit price": CircleDollarSign,
  "Avg floor area": Square,
  Ownership: ShieldCheck,
  Ceilings: Ruler,
  Neighborhood: Compass,
  Security: ShieldCheck,
  District: MapPin,
  "Sales started": Clock3,
};

// A chip's key is the value stored by the admin pickers (desktop/mobile/
// floorPlanVisibleStats — a Postgres enum), so a chip can be renamed on the
// page without a schema change: only this map moves. It also keeps one name
// per field across chips, fact sheet and admin — the same value used to be
// "Move in" as a chip and "Completed in" in the fact sheet, "Building status"
// vs "Construction status", "Property type" vs "Building type".
const STAT_DISPLAY_LABEL: Record<string, string> = {
  "Move in": "Move-in year",
  "Building status": "Construction status",
  "Total Units": "Total units",
  "Total units": "Total units",
  "Project type": "Property type",
  Stories: "Floors",
};
const statDisplayLabel = (key: string) => STAT_DISPLAY_LABEL[key] ?? key;

// The default chip set is the listing-card facts a buyer filters on, in this
// order — what they need to decide "worth a look?" in a few seconds.
// Everything else lives in the fact sheet under Overview and only becomes a
// chip when a project's picker explicitly selects it (long text like an
// address or a security note wraps badly in a chip; derived numbers like
// the old "Per SqFt (Avg)" — price ÷ first plan's size — are gone for good).
// When a default has no data on a project, the overflow list fills the slot
// in order (asked for 2026-09-08) so the row stays full: 8 on desktop, the
// first 6 of the same list on mobile. See docs/design.md "Stats chips vs
// fact sheet".
const DEFAULT_PROJECT_STAT_KEYS = ["Price range", "Property type", "Beds", "Baths", "SqFt", "Listing status", "Move in", "Total Units"];
const PROJECT_STAT_OVERFLOW_KEYS = ["Floors", "Building status", "Ownership", "Parking", "Units available", "Floor plans", "Sales started"];
// Land plots (the only remaining ProjectStatsChips floor-plan caller —
// project floor-plan pages use FloorPlanStatsChips).
const DEFAULT_FLOOR_PLAN_STAT_KEYS = ["Price", "Project type", "Plan type", "Beds", "Baths", "SqFt", "Status", "Move in"];
const FLOOR_PLAN_STAT_OVERFLOW_KEYS = ["Ownership", "Interior size", "Balcony", "Parking"];
const DEFAULT_DESKTOP_CHIP_CAP = 8;
const DEFAULT_MOBILE_CHIP_CAP = 6;
const PICKER_CHIP_CAP = 10;

type StatChip = { key: string; value: string; label?: string };

function pickDefaultChips(candidates: StatChip[], defaultKeys: string[], overflowKeys: string[]): StatChip[] {
  const byKey = new Map(candidates.map((item) => [item.key, item]));
  return [...defaultKeys, ...overflowKeys]
    .map((key) => byKey.get(key))
    .filter((item): item is StatChip => Boolean(item))
    .slice(0, DEFAULT_DESKTOP_CHIP_CAP);
}

export function ProjectStatsChips({ project, floorPlan, areaUnit = "SqFt" }: { project: Project; floorPlan?: FloorPlan; areaUnit?: "SqFt" | "perches" }) {
  const { t, tPrice } = useListingT();
  const formatArea = (value: number) => value.toLocaleString("en-US");
  // Same rule as the badge: a move-in year is a chip only while it's still
  // ahead (this year onward) — the fact sheet keeps past years as "Completed in".
  const moveInYear = isUpcomingMoveIn(project) ? String(project.completionYear) : "";

  const candidates: StatChip[] = floorPlan
    ? [
        // Defaults, in display order
        ...(floorPlan.startingPriceLkr > 0 ? [{ key: "Price", value: `From ${formatLkr(floorPlan.startingPriceLkr)}` }] : []),
        { key: "Project type", value: project.type },
        ...(hasDisplayValue(floorPlan.planType) ? [{ key: "Plan type", value: floorPlan.planType ?? "" }] : []),
        // A land plot maps onto this shape with 0 beds/baths — that means
        // "not applicable", never "zero bedrooms".
        ...(floorPlan.bedrooms > 0 ? [{ key: "Beds", value: String(floorPlan.bedrooms) }] : []),
        ...(floorPlan.bathrooms > 0 ? [{ key: "Baths", value: String(floorPlan.bathrooms) }] : []),
        // One plan is one exact size, so no "From" prefix here — the range
        // belongs on the project page.
        ...(floorPlan.floorAreaSqFt > 0 ? [{ key: "SqFt", value: formatArea(floorPlan.floorAreaSqFt), label: areaUnit === "perches" ? "Perches" : "SqFt" }] : []),
        { key: "Status", value: floorPlan.availability },
        ...(moveInYear ? [{ key: "Move in", value: moveInYear }] : []),
        // Picker-only
        { key: "Address", value: project.location },
        ...(hasDisplayValue(project.ownership) ? [{ key: "Ownership", value: project.ownership }] : []),
        ...(floorPlan.interiorSizeSqFt ? [{ key: "Interior size", value: `${formatArea(floorPlan.interiorSizeSqFt)} SqFt` }] : []),
        ...(hasDisplayValue(floorPlan.basement) ? [{ key: "Basement", value: floorPlan.basement ?? "" }] : []),
        ...(floorPlan.balconySizeSqFt ? [{ key: "Balcony", value: `${formatArea(floorPlan.balconySizeSqFt)} SqFt` }] : []),
        ...(hasDisplayValue(floorPlan.garage) ? [{ key: "Garage", value: floorPlan.garage ?? "" }] : []),
        ...(floorPlan.parkingSpaces ? [{ key: "Parking", value: String(floorPlan.parkingSpaces) }] : []),
        ...(hasDisplayValue(project.ceilingInfo) ? [{ key: "Ceilings", value: project.ceilingInfo ?? "" }] : []),
        ...(hasDisplayValue(project.security) ? [{ key: "Security", value: project.security }] : []),
        ...(hasDisplayValue(project.constructionStatus) ? [{ key: "Building status", value: project.constructionStatus }] : []),
      ]
    : [
        // Defaults, in display order
        ...(project.startingPriceLkr > 0 ? [{ key: "Price range", value: `From ${formatLkr(project.startingPriceLkr)}` }] : []),
        { key: "Property type", value: project.type },
        { key: "Beds", value: project.bedrooms },
        { key: "Baths", value: project.bathrooms },
        { key: "SqFt", value: project.floorAreaRange },
        { key: "Listing status", value: project.status },
        ...(moveInYear ? [{ key: "Move in", value: moveInYear }] : []),
        ...(project.units > 0 ? [{ key: "Total Units", value: String(project.units) }] : []),
        ...(project.floors > 0 ? [{ key: "Floors", value: String(project.floors) }] : []),
        // Picker-only
        { key: "Building status", value: project.constructionStatus },
        { key: "Address", value: project.location },
        // Developer-entered counts (never a count of plan types).
        ...((project.soldUnits ?? 0) > 0 ? [{ key: "Units sold", value: String(project.soldUnits) }] : []),
        ...((project.availableUnits ?? 0) > 0 ? [{ key: "Units available", value: String(project.availableUnits) }] : []),
        ...(project.floorPlans.length > 0 ? [{ key: "Floor plans", value: String(project.floorPlans.length) }] : []),
        { key: "Road", value: project.road ?? "" },
        { key: "Area", value: project.area ?? "" },
        { key: "Electricity", value: project.electricity ?? "" },
        { key: "Tap water", value: project.tapWater ?? "" },
        ...(project.incentives?.length ? [{ key: "Incentives", value: String(project.incentives.length) }] : []),
        ...(hasDisplayValue(project.parking) ? [{ key: "Parking", value: project.parking }] : []),
        ...(project.carparkLevels ? [{ key: "Carpark levels", value: String(project.carparkLevels) }] : []),
        ...(project.averageUnitPriceLkr ? [{ key: "Avg unit price", value: formatLkr(project.averageUnitPriceLkr) }] : []),
        ...(project.averageFloorAreaSqFt ? [{ key: "Avg floor area", value: `${formatArea(project.averageFloorAreaSqFt)} SqFt` }] : []),
        ...(hasDisplayValue(project.ownership) ? [{ key: "Ownership", value: project.ownership }] : []),
        ...(hasDisplayValue(project.ceilingInfo) ? [{ key: "Ceilings", value: project.ceilingInfo ?? "" }] : []),
        ...(hasDisplayValue(project.security) ? [{ key: "Security", value: project.security }] : []),
        ...(hasDisplayValue(project.district) ? [{ key: "District", value: project.district }] : []),
        ...(hasDisplayValue(project.launchDate) ? [{ key: "Sales started", value: new Date(project.launchDate).toLocaleDateString("en-US", { month: "short", year: "numeric" }) }] : []),
      ];

  // "-" is the store's "not provided" placeholder for bedrooms/bathrooms/
  // floorAreaRange — never worth a chip.
  const available = candidates.filter((item) => hasDisplayValue(item.value) && item.value.trim() !== "-");
  const picker: string[] | undefined = floorPlan ? project.floorPlanVisibleStats : project.desktopVisibleStats;
  const stats = picker?.length
    ? available.filter((item) => picker.includes(item.key)).slice(0, PICKER_CHIP_CAP)
    : pickDefaultChips(
        available,
        floorPlan ? DEFAULT_FLOOR_PLAN_STAT_KEYS : DEFAULT_PROJECT_STAT_KEYS,
        floorPlan ? FLOOR_PLAN_STAT_OVERFLOW_KEYS : PROJECT_STAT_OVERFLOW_KEYS,
      );

  const mobileVisibleKeys = new Set<string>(
    project.mobileVisibleStats?.length
      ? project.mobileVisibleStats
      : stats.slice(0, DEFAULT_MOBILE_CHIP_CAP).map((item) => item.key)
  );

  if (!stats.length) return null;

  return (
    <div className="listing-hero-stats-chips stats-chips-mobile-limited" role="list" aria-label="Project summary stats">
      {stats.map((item) => {
        const Icon = STAT_CHIP_ICON[item.key] ?? Building2;
        const label = t(item.label ?? statDisplayLabel(item.key));
        return (
          <div key={item.key} role="listitem" className={`listing-hero-stat-chip${mobileVisibleKeys.has(item.key) ? " mobile-stat-visible" : ""}`}>
            <Icon className="listing-hero-stat-chip-icon" aria-hidden="true" />
            <div className="listing-hero-stat-chip-content">
              <span className="listing-hero-stat-chip-value">{tPrice(t(item.value))}</span>
              <span className="listing-hero-stat-chip-label">{label}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function StatsContactCard({ project, developer, requestInfoVariant = "standard" }: { project: Project; developer?: Developer; requestInfoVariant?: "standard" | "inquiry" }) {
  const [requestInfoOpen, setRequestInfoOpen] = useState(false);
  const name = developer?.name ?? project.developerName ?? project.contact.name;
  const email = hasDisplayValue(project.contact?.email) ? project.contact.email : developer?.email;
  const phone = hasDisplayValue(project.contact?.phone) ? project.contact.phone : developer?.phone;
  const projectSocialEntries = Object.entries(project.socialLinks ?? {}).filter(([, url]) => hasDisplayValue(url)) as [string, string][];
  const developerSocialEntries = Object.entries(developer?.socialLinks ?? {}).filter(([, url]) => hasDisplayValue(url)) as [string, string][];
  // WhatsApp gets its own labelled tap-to-chat row (tracked like phone
  // clicks), so it's dropped from the social icon strip to avoid showing twice.
  const contactWhatsAppHref = listingWhatsAppHref(developer?.socialLinks?.whatsapp, project.name);
  const socialEntries = (projectSocialEntries.length > 0 ? projectSocialEntries : developerSocialEntries)
    .filter(([platform]) => !(platform === "whatsapp" && contactWhatsAppHref));

  return (
    <div className="stats-contact-card">
      {developer?.logo ? (
        <Image src={developer.logo} alt={name} width={140} height={70} className="stats-contact-card-logo" />
      ) : null}

      <div className="stats-contact-card-body">
        <Link href={developer ? `/developers/${developer.slug}` : `/projects/${project.slug}`} className="stats-contact-card-name">
          {name}
        </Link>

        {hasDisplayValue(email) ? (
          <a href={`mailto:${email}`} className="stats-contact-card-row">
            <Mail className="h-4 w-4" aria-hidden="true" /> {email}
          </a>
        ) : null}

        {/* A developer can list several numbers separated by "/" — each is its own tap-to-call row. */}
        {phone && hasDisplayValue(phone) ? phone.split(/\s*\/\s*/).filter(Boolean).map((number) => (
          <a
            key={number}
            href={`tel:${number.replace(/\s+/g, "")}`}
            className="stats-contact-card-row"
            onClick={() => logListingEvent("/api/events/phone-click", "click_phone", project.slug, project.name)}
          >
            <Phone className="h-4 w-4" aria-hidden="true" /> {number}
          </a>
        )) : null}

        {contactWhatsAppHref ? (
          <a
            href={contactWhatsAppHref}
            target="_blank"
            rel="noopener noreferrer"
            className="stats-contact-card-row stats-contact-card-row-whatsapp"
            onClick={() => logListingEvent("/api/events/whatsapp-click", "click_whatsapp", project.slug, project.name)}
          >
            <MessageCircle className="h-4 w-4" aria-hidden="true" /> WhatsApp {formatWhatsAppNumber(developer?.socialLinks?.whatsapp)}
          </a>
        ) : null}
      </div>

      {socialEntries.length > 0 ? (
        <div className="stats-contact-card-social" aria-label="Social media">
          {socialEntries.map(([platform, url]) => {
            const Icon = SOCIAL_ICON[platform];
            if (!Icon) return null;
            return (
              <a key={platform} href={url} target="_blank" rel="noreferrer noopener" aria-label={`Visit us on ${platform}`} className="stats-contact-card-social-link">
                <Icon className="h-4 w-4" />
              </a>
            );
          })}
        </div>
      ) : null}

      <button type="button" className="stats-contact-card-btn" onClick={() => setRequestInfoOpen(true)}>
        Request info
      </button>

      <RequestInfoDialog open={requestInfoOpen} onClose={() => setRequestInfoOpen(false)} project={project} variant={requestInfoVariant} />
    </div>
  );
}

export function RequestInfoDialog({
  open,
  onClose,
  project,
  floorPlan,
  variant = "standard",
}: {
  open: boolean;
  onClose: () => void;
  project: Project;
  /** The plan the buyer is looking at (floor-plan pages) — named in the
   * lead and in the developer's alert so they know exactly what was asked about. */
  floorPlan?: FloorPlan;
  /** "inquiry" swaps in the "Send us your inquiry" layout (Name/Email/Contact
   * Number/Message field order, a marketing opt-in checkbox) used on the
   * land detail page. "brochure" keeps the standard layout but swaps the
   * title/subtitle/submit copy and default lead message for the brochure
   * pill on the hero media bar. Everywhere else keeps the original layout. */
  variant?: "standard" | "inquiry" | "brochure";
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [contactMethod, setContactMethod] = useState<"Phone" | "Text" | "Email">("Phone");
  const [agreed, setAgreed] = useState(false);
  const [keepPosted, setKeepPosted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const MESSAGE_MAX = 900;
  const isInquiry = variant === "inquiry";
  const isBrochure = variant === "brochure";

  useEffect(() => {
    if (!open) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSubmitted(false);
    setErrorMessage("");
  }, [open]);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setErrorMessage("");

    try {
      const planLabel = floorPlan ? describeFloorPlanForLead(floorPlan) : "";
      const subject = planLabel ? `${planLabel} at ${project.name}` : project.name;
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          phone,
          preferredContactMethod: contactMethod,
          message: message.trim() || (isBrochure ? `Brochure request for ${subject}` : `Request info for ${subject}`),
          projectSlug: project.slug,
          developerSlug: project.developerSlug,
          marketingOptIn: keepPosted,
          sessionId: getSessionId(),
          trafficSource: getTrafficSource(),
          isBrochureRequest: isBrochure,
          floorPlanName: planLabel || undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        setErrorMessage(data?.error ?? "Unable to send your request. Please try again.");
        return;
      }

      setSubmitted(true);
      const { utm_campaign } = getStoredUtmParams();
      trackEvent("generate_lead", {
        listing_id: project.slug,
        listing_name: project.name,
        traffic_source: getTrafficSource(),
        ...(utm_campaign ? { utm_campaign } : {}),
      });

      // Best-effort: start the download right away instead of making them
      // click "Download Brochure" again below — kept as a visible fallback
      // since a window.open() this far into an async handler can still get
      // blocked by the browser's popup blocker in some cases.
      if (isBrochure && project.brochureUrl) {
        logListingEvent("/api/events/brochure-download", "download_brochure", project.slug, project.name);
        window.open(project.brochureUrl, "_blank", "noopener,noreferrer");
      }
    } catch {
      setErrorMessage("Unable to send your request. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="request-info-overlay" role="dialog" aria-modal="true" aria-label="Contact us" onClick={onClose}>
      <div className={`request-info-dialog${!isInquiry ? " request-info-dialog-brochure" : ""}`} onClick={(event) => event.stopPropagation()}>
        <div className="request-info-topbar">
          <p className="request-info-topbar-title">{isBrochure ? "Download Brochure" : isInquiry ? "Send us your inquiry" : "Contact Us"}</p>
          <button type="button" className="request-info-close" aria-label="Close" onClick={onClose}><X className="h-5 w-5" /></button>
        </div>

        <div className={`request-info-listing${!isInquiry ? " request-info-listing-brochure" : ""}`}>
          <Image src={project.heroImage} alt={project.name} width={64} height={64} className="request-info-listing-image" />
          {!isInquiry ? (
            <div className="request-info-listing-text">
              <p className="request-info-listing-title">{project.name}</p>
              <p className="request-info-listing-address">{[project.location, project.city].filter(Boolean).join(", ")}</p>
            </div>
          ) : (
            <p className="request-info-listing-title">{project.name}</p>
          )}
        </div>

        {submitted ? (
          <div className="request-info-success">
            <h2>{isBrochure ? "Brochure ready" : "Request sent"}</h2>
            <p>
              {isBrochure
                ? project.brochureUrl
                  ? `Thanks, ${name.split(" ")[0] || "there"} — your download should start automatically. We've also emailed a copy to ${email}.`
                  : `Thanks, ${name.split(" ")[0] || "there"} — we don't have a digital brochure for ${project.name} yet, but the sales team will send you the details shortly.`
                : `Thanks, ${name.split(" ")[0] || "there"} — the ${project.name} sales team will reach out to you by ${contactMethod.toLowerCase()} shortly.`}
            </p>
            {isBrochure && project.brochureUrl ? (
              <Button
                type="button"
                onClick={() => {
                  logListingEvent("/api/events/brochure-download", "download_brochure", project.slug, project.name);
                  window.open(project.brochureUrl, "_blank", "noopener,noreferrer");
                }}
              >
                Download Brochure
              </Button>
            ) : null}
            <Button type="button" onClick={onClose}>Close</Button>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="request-info-body">
            {isInquiry && <h2>Want to find out more?</h2>}
            <p className="request-info-required-note"><span className="request-info-star">*</span> Indicates a required field</p>

            <label className="request-info-field">
              <span>{isInquiry ? "Your Name" : "Name"}<span className="request-info-star">*</span></span>
              <input value={name} onChange={(event) => setName(event.target.value)} required placeholder="Enter your name" />
            </label>

            {isInquiry ? (
              <label className="request-info-field">
                <span>Email Address</span>
                <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Enter your email" />
              </label>
            ) : null}

            <label className="request-info-field">
              <span>{isInquiry ? "Contact Number" : "Phone number"}<span className="request-info-star">*</span></span>
              {isInquiry ? (
                <div className="request-info-phone-row">
                  <span className="request-info-phone-flag" aria-hidden="true">🇱🇰 +94</span>
                  <input type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} required placeholder="7X XXX XXXX" />
                </div>
              ) : (
                <input type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} required placeholder="+94 7X XXX XXXX" />
              )}
            </label>

            {!isInquiry ? (
              <label className="request-info-field">
                <span>Email<span className="request-info-star">*</span></span>
                <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required placeholder="Enter your email" />
              </label>
            ) : null}

            <label className="request-info-field">
              <span>{isInquiry ? "Message" : "Anything else we should know?"}</span>
              <textarea
                value={message}
                onChange={(event) => setMessage(event.target.value.slice(0, MESSAGE_MAX))}
                placeholder="Enter your message"
                rows={4}
              />
              <span className="request-info-char-count">{MESSAGE_MAX - message.length} characters remaining</span>
            </label>

            <div className="request-info-field">
              <span>How would you like to get in touch?<span className="request-info-star">*</span></span>
              <div className="request-info-radio-row">
                {(["Phone", "Text", "Email"] as const).map((method) => (
                  <label key={method} className="request-info-radio">
                    <input
                      type="radio"
                      name="contactMethod"
                      checked={contactMethod === method}
                      onChange={() => setContactMethod(method)}
                    />
                    {method}
                  </label>
                ))}
              </div>
            </div>

            {isInquiry ? (
              <label className="request-info-consent">
                <input type="checkbox" checked={keepPosted} onChange={(event) => setKeepPosted(event.target.checked)} />
                <span>Yes, keep me posted on new launches, property digest and partner offers.</span>
              </label>
            ) : null}

            <label className="request-info-consent">
              <input type="checkbox" checked={agreed} onChange={(event) => setAgreed(event.target.checked)} required />
              <span>I agree to be contacted by LankaNewHomes agents via WhatsApp, SMS, Call, Email etc.</span>
            </label>

            {errorMessage ? <p className="request-info-error">{errorMessage}</p> : null}

            <button type="submit" className="request-info-submit-big" disabled={submitting || !agreed}>
              {submitting ? "Sending..." : isBrochure ? "Download Brochure" : isInquiry ? "Send" : "Submit Form"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export function ProjectSummary({ project }: { project: Project }) {
  const rows = [
    ["Starting Price", formatLkr(project.startingPriceLkr)],
    ["Bedrooms", project.bedrooms],
    ["Bathrooms", project.bathrooms],
    ["Floor Area", project.floorAreaRange],
    ["Completion", String(project.completionYear)],
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
  const [active, setActive] = useState<number>(1);
  const tabs = [1, 2, 3, 4];
  const filtered = useMemo(() => floorPlans.filter((f) => f.bedrooms === active), [floorPlans, active]);
  return (
    <section className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {tabs.map((b) => (
          <button key={b} onClick={() => setActive(b)} className={`border px-3 py-1 text-sm ${active === b ? "border-stone-900 bg-stone-900 text-white" : "border-stone-300"}`}>
            {b} Bedroom
          </button>
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {filtered.length ? filtered.map((f) => <FloorPlanCard key={f.id} floorPlan={f} />) : <p className="text-sm text-stone-600">No floor plans in this category.</p>}
      </div>
    </section>
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
  const { t, tPrice } = useListingT();
  const pricingHistory = project.pricingHistory?.filter((entry) => hasDisplayValue(entry.date) || hasDisplayValue(entry.note)) ?? [];
  const incentives = project.incentives?.filter((item) => hasDisplayValue(item)) ?? [];
  const depositStructure = project.depositPaymentStructure ?? project.paymentPlan;
  const paymentLines = project.paymentPlanItems?.filter((item) => hasDisplayValue(item)).length
    ? project.paymentPlanItems.filter((item) => hasDisplayValue(item))
    : (depositStructure ?? "").split(";").map((item) => item.trim()).filter((item) => hasDisplayValue(item));
  const includedUtilities = project.includedUtilities?.filter((item) => hasDisplayValue(item)) ?? [];
  const paidUtilities = project.paidUtilities?.filter((item) => hasDisplayValue(item.label) && hasDisplayValue(item.value)) ?? [];

  const pricingFields = [
    { label: "Available plan prices", value: project.availablePlanPrices },
    { label: "Pricing coming soon", value: project.pricingComingSoon },
    { label: "Average price per sqft", value: project.averagePricePerSqft },
    { label: "Monthly C.C./maint per sqft", value: project.monthlyMaintenancePerSqft },
    { label: "Property tax", value: project.propertyTax },
    { label: "Parking cost", value: project.parkingCost },
    { label: "Storage cost", value: project.storageCost },
    { label: "ⓘ Co-op fee realtors", value: project.coopFeeRealtors },
  ].filter((field) => hasDisplayValue(field.value));

  // Every listing gets a Pricing section — the sticky nav always links to
  // #pricing, and a buyer looks for price first. These rows come from
  // figures already in the record (the developer's own starting price and
  // per-plan prices), so the card is never empty even before an editor
  // fills the fee fields; when there is genuinely nothing, it says so.
  const startingPrice = project.startingPriceLkr > 0 ? `From ${formatLkr(project.startingPriceLkr)}` : "";
  const planPrices = project.floorPlans
    .filter((plan) => plan.startingPriceLkr > 0)
    .map((plan) => `${plan.planName} — ${formatLkr(plan.startingPriceLkr)}`);
  const hasAnyPricingDetail = Boolean(startingPrice) || planPrices.length > 0 || pricingFields.length > 0 || pricingHistory.length > 0 || includedUtilities.length > 0 || paidUtilities.length > 0;

  const hasPricingCard = true;
  const hasDepositCard = paymentLines.length > 0;
  const hasIncentivesCard = incentives.length > 0;

  return (
    <section className="space-y-4">
      <div className="relative mx-auto w-full max-w-290 overflow-hidden border border-[#c9ddf5] bg-[#eef4fc] px-6 py-8 sm:px-8 sm:py-10 lg:px-12 lg:py-12">
        <div
          className="pointer-events-none absolute inset-0 opacity-45"
          aria-hidden="true"
          style={{
            backgroundImage: [
              "repeating-linear-gradient(0deg, transparent 0 36px, rgba(78,120,161,0.16) 36px 37px)",
              "repeating-linear-gradient(90deg, transparent 0 36px, rgba(78,120,161,0.16) 36px 37px)",
              "linear-gradient(rgba(120,155,188,0.16) 1px, transparent 1px)",
              "linear-gradient(90deg, rgba(120,155,188,0.16) 1px, transparent 1px)",
            ].join(","),
            backgroundSize: "100% 100%, 100% 100%, 112px 112px, 112px 112px",
          }}
        />

        <div className="pointer-events-none absolute left-[6%] top-[10%] h-[22%] w-[24%] border border-[#bfd4ec]/70" aria-hidden="true" />
        <div className="pointer-events-none absolute right-[7%] top-[12%] h-[18%] w-[20%] border border-[#bfd4ec]/70" aria-hidden="true" />
        <div className="pointer-events-none absolute right-[15%] bottom-[13%] h-[23%] w-[26%] border border-[#bfd4ec]/70" aria-hidden="true" />

        <div className="relative z-10 grid gap-6 lg:grid-cols-3">
          {hasPricingCard ? (
            <article className="border border-[#c9ddf5] bg-white px-6 py-6 text-[#1f2321] shadow-[0_10px_28px_rgba(36,78,54,0.08)]">
              <h3 className="text-[29px] font-semibold">{t("Pricing and fees")}</h3>

              <div className="mt-7 space-y-4 text-[15px] leading-7">
                {startingPrice ? (
                  <div>
                    <p className="font-semibold">{t("Starting price")}</p>
                    <p>{tPrice(startingPrice)}</p>
                  </div>
                ) : null}
                {planPrices.length > 0 ? (
                  <div>
                    <p className="font-semibold">{t("Plan prices")}</p>
                    <div className="space-y-1">
                      {planPrices.map((line) => <p key={line}>{line}</p>)}
                    </div>
                  </div>
                ) : null}
                {!hasAnyPricingDetail ? <p>Contact us for current pricing and availability.</p> : null}
                {pricingFields.map((field) => (
                  <div key={field.label}>
                    <p className="font-semibold">{field.label}</p>
                    <p>{field.value}</p>
                  </div>
                ))}
                {pricingHistory.length > 0 ? (
                  <div>
                    <p className="font-semibold">Pricing history</p>
                    <div className="space-y-2">
                      {pricingHistory.map((entry) => (
                        <p key={`${entry.date}-${entry.note}`}>{entry.date} - {entry.note}</p>
                      ))}
                    </div>
                  </div>
                ) : null}
                {includedUtilities.length > 0 ? (
                  <div>
                    <p className="font-semibold">Included in maintenance</p>
                    <p>{includedUtilities.join(", ")}</p>
                  </div>
                ) : null}
                {paidUtilities.length > 0 ? (
                  <div>
                    <p className="font-semibold">Paid separately</p>
                    <div className="space-y-1">
                      {paidUtilities.map((item) => (
                        <p key={item.label}>{item.label}: {item.value}</p>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            </article>
          ) : null}

          {hasDepositCard ? (
            <article className="border border-[#c9ddf5] bg-white px-6 py-6 text-[#1f2321] shadow-[0_10px_28px_rgba(36,78,54,0.08)]">
              <h3 className="text-[29px] font-semibold">{t("Deposit Structure")}</h3>

              <div className="mt-7 space-y-4 text-[15px] leading-7">
                <div>
                  <p className="font-semibold">{t("Payment structure")}</p>
                  <div className="space-y-1">
                    {paymentLines.map((line, index) => <p key={`${line}-${index}`}>{line}</p>)}
                  </div>
                </div>
              </div>
            </article>
          ) : null}

          {hasIncentivesCard ? (
            <article className="border border-[#c9ddf5] bg-white px-6 py-6 text-[#1f2321] shadow-[0_10px_28px_rgba(36,78,54,0.08)]">
              <h3 className="text-[29px] font-semibold">{t("Current Incentives")}</h3>

              <div className="mt-7 space-y-4 text-[15px] leading-7">
                {incentives.map((incentive, index) => (
                  <div key={`${incentive}-${index}`}>
                    <p className="font-semibold">Incentive {index + 1}</p>
                    <p>{incentive}</p>
                  </div>
                ))}
              </div>
            </article>
          ) : null}
        </div>
      </div>
    </section>
  );
}


const PLAN_SORT_OPTIONS = [
  { value: "default", label: "Featured" },
  { value: "priceAsc", label: "Price: Low to high" },
  { value: "priceDesc", label: "Price: High to low" },
  { value: "bedsAsc", label: "Beds: Low to high" },
  { value: "bedsDesc", label: "Beds: High to low" },
] as const;

type PlanSortValue = typeof PLAN_SORT_OPTIONS[number]["value"];

export function PlansAndHomesSection({ project, title = "Floor Plans", excludeFloorPlanId, showQuickMoveIns = true, planHrefBase, showBedBath = true }: { project: Project; title?: string; excludeFloorPlanId?: string; showQuickMoveIns?: boolean; planHrefBase?: string; showBedBath?: boolean }) {
  const { t, tPrice } = useListingT();
  const hrefBase = planHrefBase ?? `/projects/${project.slug}/floor-plans`;
  const [activeTab, setActiveTab] = useState<string>("all");
  const [filterOpen, setFilterOpen] = useState(false);
  const [availabilityFilter, setAvailabilityFilter] = useState<Set<string>>(new Set());
  const [bedroomFilter, setBedroomFilter] = useState<Set<number>>(new Set());
  const [sortBy, setSortBy] = useState<PlanSortValue>("default");

  const floorPlans = useMemo(
    () => (excludeFloorPlanId ? project.floorPlans.filter((plan) => plan.id !== excludeFloorPlanId) : project.floorPlans),
    [project.floorPlans, excludeFloorPlanId]
  );

  const quickMoveIns = useMemo(
    () => floorPlans.filter((plan) => plan.quickMoveIn),
    [floorPlans]
  );

  const availabilityOptions = useMemo(() => Array.from(new Set(floorPlans.map((plan) => plan.availability))), [floorPlans]);
  const bedroomOptions = useMemo(() => Array.from(new Set(floorPlans.map((plan) => plan.bedrooms))).sort((a, b) => a - b), [floorPlans]);

  const activeFilterCount = availabilityFilter.size + bedroomFilter.size + (sortBy !== "default" ? 1 : 0);

  const toggleSetValue = <T,>(set: Set<T>, setter: (next: Set<T>) => void, value: T) => {
    const next = new Set(set);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    setter(next);
  };

  const resetFilters = () => {
    setAvailabilityFilter(new Set());
    setBedroomFilter(new Set());
    setSortBy("default");
  };

  const visiblePlans = useMemo(() => {
    const base = activeTab === "quickMoveIns"
      ? quickMoveIns
      : activeTab === "all"
        ? floorPlans
        : floorPlans.filter((plan) => plan.availability === activeTab);

    const filtered = base.filter((plan) => {
      if (availabilityFilter.size > 0 && !availabilityFilter.has(plan.availability)) return false;
      if (bedroomFilter.size > 0 && !bedroomFilter.has(plan.bedrooms)) return false;
      return true;
    });

    const sorted = [...filtered];
    if (sortBy === "priceAsc") sorted.sort((a, b) => a.startingPriceLkr - b.startingPriceLkr);
    else if (sortBy === "priceDesc") sorted.sort((a, b) => b.startingPriceLkr - a.startingPriceLkr);
    else if (sortBy === "bedsAsc") sorted.sort((a, b) => a.bedrooms - b.bedrooms);
    else if (sortBy === "bedsDesc") sorted.sort((a, b) => b.bedrooms - a.bedrooms);

    return sorted;
  }, [activeTab, floorPlans, quickMoveIns, availabilityFilter, bedroomFilter, sortBy]);

  return (
    <section id="plans-homes" className="plans-homes-shell" aria-label="Plans and homes">
      <div className="plans-homes-head">
        <h2>{t(title)}</h2>
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
            All ({floorPlans.length})
          </button>
          {availabilityOptions.map((option) => (
            <button
              key={option}
              type="button"
              role="tab"
              className={activeTab === option ? "active" : undefined}
              aria-selected={activeTab === option}
              onClick={() => setActiveTab(option)}
            >
              {option} ({floorPlans.filter((plan) => plan.availability === option).length})
            </button>
          ))}
          {showQuickMoveIns && quickMoveIns.length > 0 ? (
            <button
              type="button"
              role="tab"
              className={activeTab === "quickMoveIns" ? "active" : undefined}
              aria-selected={activeTab === "quickMoveIns"}
              onClick={() => setActiveTab("quickMoveIns")}
            >
              Quick move ins ({quickMoveIns.length})
            </button>
          ) : null}
        </div>

        <div className="plans-filter-wrap">
          <button type="button" className="plans-filter-btn" onClick={() => setFilterOpen(true)}>
            <SlidersHorizontal className="h-4 w-4" aria-hidden="true" /> Filter &amp; sort{activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}
          </button>

          {filterOpen ? (
            <div className="plans-filter-overlay" role="dialog" aria-modal="true" aria-label="Filter and sort" onClick={() => setFilterOpen(false)}>
              <div className="plans-filter-panel" onClick={(event) => event.stopPropagation()}>
                <div className="plans-filter-panel-head">
                  <p>Filter &amp; sort</p>
                  <button type="button" aria-label="Close" onClick={() => setFilterOpen(false)}><X className="h-4 w-4" /></button>
                </div>

                <div className="plans-filter-group">
                  <p className="plans-filter-group-label">Sales status</p>
                  <div className="plans-filter-options">
                    {availabilityOptions.map((option) => (
                      <label key={option} className="plans-filter-option">
                        <input type="checkbox" checked={availabilityFilter.has(option)} onChange={() => toggleSetValue(availabilityFilter, setAvailabilityFilter, option)} />
                        <span>{option}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="plans-filter-group">
                  <p className="plans-filter-group-label">Beds</p>
                  <div className="plans-filter-options">
                    {bedroomOptions.map((option) => (
                      <label key={option} className="plans-filter-option">
                        <input type="checkbox" checked={bedroomFilter.has(option)} onChange={() => toggleSetValue(bedroomFilter, setBedroomFilter, option)} />
                        <span>{option} bd</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="plans-filter-group">
                  <p className="plans-filter-group-label">Sort by</p>
                  <div className="plans-filter-options">
                    {PLAN_SORT_OPTIONS.map((option) => (
                      <label key={option.value} className="plans-filter-option">
                        <input type="radio" name="plan-sort" checked={sortBy === option.value} onChange={() => setSortBy(option.value)} />
                        <span>{option.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="plans-filter-panel-actions">
                  <button type="button" className="plans-filter-reset" onClick={resetFilters}>Reset filters</button>
                  <button type="button" className="plans-filter-apply" onClick={() => setFilterOpen(false)}>View results ({visiblePlans.length})</button>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <div className="plans-homes-grid">
        {visiblePlans.map((plan) => (
          <Link key={plan.id} href={`${hrefBase}/${plan.slug ?? plan.id}`} className="plans-home-card">
            <figure>
              <Image src={plan.image || project.heroImage} alt={plan.planName} width={960} height={620} className="plans-home-image" />
              <span
                className={`plans-status-pill${plan.availability === "Sold Out" ? " plans-status-pill-sold" : plan.availability === "Limited" ? " plans-status-pill-booked" : ""}`}
              >
                {plan.availability}
              </span>
            </figure>

            <div className="plans-home-body">
              {project.isFeatured ? (
                <div className="plans-home-badge-row" aria-label={`${title} badges`}>
                  <span className="badge-featured">Featured</span>
                </div>
              ) : null}
              <h4>{plan.planName}</h4>
              <p className="plans-home-price">{plan.startingPriceLkr > 0 ? tPrice(`From ${formatLkr(plan.startingPriceLkr)}`) : t("Contact for pricing")}</p>
              <p className="plans-home-type">{plan.planType || project.type}</p>
              <div className="plans-home-facts">
                {showBedBath ? (
                  <>
                    <span><BedDouble className="h-3.5 w-3.5" aria-hidden="true" /> {plan.bedrooms} bd</span>
                    <span><Bath className="h-3.5 w-3.5" aria-hidden="true" /> {plan.bathrooms}</span>
                  </>
                ) : null}
                <span><Square className="h-3.5 w-3.5" aria-hidden="true" /> From {plan.floorAreaSqFt} SqFt</span>
              </div>
            </div>
          </Link>
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

const KEY_FEATURE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  indoor: LayoutPanelLeft,
  outdoor: Trees,
  specifications: ClipboardList,
};

/** Accepts either the current `KeyFeatureCategory[]` shape or the legacy
 * `{ indoor?: string[]; outdoor?: string[]; other?: string[] }` shape still
 * held by projects saved before the Key Features redesign — Supabase jsonb
 * has no schema to enforce the newer type at read time. */
function normalizeUnitFeaturesForDisplay(raw: unknown): { key: string; label: string; items: { field: string; value: string }[] }[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw as { key: string; label: string; items: { field: string; value: string }[] }[];

  const legacy = raw as { indoor?: string[]; outdoor?: string[]; other?: string[] };
  const parseLines = (lines?: string[]) =>
    (lines ?? []).map((line) => {
      const sepIndex = line.indexOf(": ");
      return sepIndex === -1 ? { field: "", value: line } : { field: line.slice(0, sepIndex), value: line.slice(sepIndex + 2) };
    });
  return [
    { key: "indoor", label: "Indoor Features", items: parseLines(legacy.indoor) },
    { key: "outdoor", label: "Outdoor Features", items: parseLines(legacy.outdoor) },
    { key: "other", label: "Other", items: parseLines(legacy.other) },
  ];
}

export function KeyFeaturesSection({ unitFeatures }: { unitFeatures: unknown }) {
  const { t } = useListingT();
  const groups = normalizeUnitFeaturesForDisplay(unitFeatures).filter((group) => group.items.length > 0);

  const [openKey, setOpenKey] = useState<string | null>(groups[0]?.key ?? null);

  if (!groups.length) return null;

  return (
    <section id="key-features" className="key-features-shell" aria-label="Key features">
      <div className="key-features-pattern" aria-hidden="true" />
      <h2>{t("Key Features")}</h2>

      <div className="key-features-list">
        {groups.map((group) => {
          const isOpen = openKey === group.key;
          const Icon = KEY_FEATURE_ICONS[group.key] ?? LayoutGrid;
          return (
            <div key={group.key} className={`key-features-row ${isOpen ? "open" : ""}`}>
              <button
                type="button"
                className="key-features-row-trigger"
                aria-expanded={isOpen}
                onClick={() => setOpenKey(isOpen ? null : group.key)}
              >
                <Icon className="h-6 w-6" aria-hidden="true" />
                <span>{group.label}</span>
                <ChevronDown className="key-features-chevron h-6 w-6" aria-hidden="true" />
              </button>
              {isOpen ? (
                <div className="key-features-row-body">
                  {group.items.map((item, index) => (
                    <span key={`${item.field}-${item.value}-${index}`} className="key-features-item">
                      {item.field ? <><span className="key-features-item-label">{item.field}:</span> {item.value}</> : item.value}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}

export function AmenitiesShowcaseSection({ amenities, gallery, heroImage, title = "Amenities" }: { amenities: Amenity[]; gallery: { label: string; image: string }[]; heroImage: string; title?: string }) {
  const { t } = useListingT();
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
      "Gated Community": "Controlled gated access with dedicated entry points adds an extra layer of security and privacy.",
      Beachfront: "Direct beachfront access puts the shoreline right at the edge of the property.",
      "Sea View": "Open sea views add lasting value and a standout setting for the parcel.",
    };

    return amenities.slice(0, 8).map((amenity) => {
      const imageMatch = gallery.find((item) => item.label.toLowerCase().includes(amenity.name.toLowerCase()));

      return {
        name: amenity.name,
        description: fallbackDescriptions[amenity.name] ?? "Thoughtfully planned amenity spaces enhance comfort and support modern urban living.",
        // No heroImage fallback on purpose — showing the building's exterior
        // shot for an amenity that has no real photo (e.g. "Security") would
        // misrepresent what that amenity actually looks like.
        image: imageMatch?.image ?? null,
      };
    });
  }, [amenities, gallery]);

  const [activeAmenityIndex, setActiveAmenityIndex] = useState(0);
  const activeAmenity = amenityItems[Math.max(0, Math.min(activeAmenityIndex, amenityItems.length - 1))];

  if (!amenityItems.length || !activeAmenity) {
    return null;
  }

  return (
    <section id="amenities" className="amenities-showcase-shell" aria-label={title}>
      <h2>{t(title)}</h2>

      <div className="amenities-showcase-grid">
        <figure className={`amenities-showcase-image-wrap${activeAmenity.image ? "" : " no-image"}`}>
          {activeAmenity.image ? (
            <Image
              src={activeAmenity.image}
              alt={`${activeAmenity.name} amenity`}
              width={1400}
              height={950}
              className="amenities-showcase-image"
            />
          ) : (
            <div className="amenities-showcase-image-placeholder" aria-hidden="true">
              <span>{activeAmenity.name}</span>
            </div>
          )}
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
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// Simpler sibling of AmenitiesShowcaseSection — commercial areas are named
// tenants with their own photo already paired (not generic tags matched
// against the gallery by name), so no fallback-description lookup is needed.
export function CommercialAreasSection({ commercialAreas, title = "Commercial Areas" }: { commercialAreas: { label: string; image: string }[]; title?: string }) {
  const { t } = useListingT();
  const [activeIndex, setActiveIndex] = useState(0);
  const active = commercialAreas[Math.max(0, Math.min(activeIndex, commercialAreas.length - 1))];

  if (!commercialAreas.length || !active) {
    return null;
  }

  return (
    <section id="commercial-areas" className="amenities-showcase-shell" aria-label={title}>
      <div className="key-features-pattern" aria-hidden="true" />
      <h2>{t(title)}</h2>

      <div className="amenities-showcase-grid">
        <figure className="amenities-showcase-image-wrap">
          <Image src={active.image} alt={active.label} width={1400} height={950} className="amenities-showcase-image" />
        </figure>

        <div className="amenities-showcase-list" role="list" aria-label="Commercial area details">
          {commercialAreas.map((area, index) => {
            const isActive = index === activeIndex;

            return (
              <button
                key={area.label}
                type="button"
                role="listitem"
                className={`amenities-showcase-item ${isActive ? "active" : ""}`.trim()}
                aria-pressed={isActive}
                onClick={() => setActiveIndex(index)}
              >
                <span className="amenities-showcase-item-icon" aria-hidden="true">✓</span>
                <span className="amenities-showcase-item-copy">
                  <strong>{area.label}</strong>
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export function ListingSidebarCard({ project, developer }: { project: Project; developer?: Developer }) {
  const [requestInfoOpen, setRequestInfoOpen] = useState(false);
  const contactName = developer?.name ?? project.contact.name;
  const phone = hasDisplayValue(project.contact?.phone) ? project.contact.phone : developer?.phone;
  const address = hasDisplayValue(developer?.location) ? developer!.location : project.location;
  const hoursLines = formatOfficeHours(developer?.officeHours);
  const socialEntries = Object.entries(developer?.socialLinks ?? {}).filter(([, url]) => hasDisplayValue(url)) as [string, string][];
  const salesWhatsAppHref = listingWhatsAppHref(developer?.socialLinks?.whatsapp, project.name);

  return (
    <div className="listing-sidebar-card">
      <Link href={developer ? `/developers/${developer.slug}` : `/projects/${project.slug}`} className="listing-sidebar-heading">
        {contactName}
      </Link>

      {hasDisplayValue(address) ? (
        <p className="listing-sidebar-info-address">
          <MapPin className="h-4 w-4" aria-hidden="true" /> {address}
        </p>
      ) : null}

      {hoursLines.length > 0 ? (
        <div className="listing-sidebar-hours">
          <span className="listing-sidebar-hours-title">Hours</span>
          {hoursLines.map((line) => (
            <div key={line.label} className="listing-sidebar-hours-row">
              <span>{line.label}</span>
              <span>{line.value}</span>
            </div>
          ))}
        </div>
      ) : null}

      {socialEntries.length > 0 ? (
        <div className="listing-sidebar-social-row" aria-label="Social media">
          {socialEntries.map(([platform, url]) => {
            const Icon = SOCIAL_ICON[platform];
            if (!Icon) return null;
            return (
              <a key={platform} href={url} target="_blank" rel="noreferrer noopener" aria-label={`Visit us on ${platform}`} className="listing-sidebar-social-link">
                <Icon className="h-4 w-4" />
              </a>
            );
          })}
        </div>
      ) : null}

      <button type="button" className="listing-sidebar-submit-btn" onClick={() => setRequestInfoOpen(true)}>
        Request info
      </button>

      {phone ? (
        <a
          href={`tel:${phone.replace(/[^+\d]/g, "")}`}
          className="listing-sidebar-call-line"
          onClick={() => logListingEvent("/api/events/phone-click", "click_phone", project.slug, project.name)}
        >
          <Phone className="h-4 w-4" aria-hidden="true" /> Call us {phone}
        </a>
      ) : null}

      {salesWhatsAppHref ? (
        <a
          href={salesWhatsAppHref}
          target="_blank"
          rel="noopener noreferrer"
          className="listing-sidebar-call-line listing-sidebar-whatsapp-line"
          onClick={() => logListingEvent("/api/events/whatsapp-click", "click_whatsapp", project.slug, project.name)}
        >
          <MessageCircle className="h-4 w-4" aria-hidden="true" /> Chat on WhatsApp
        </a>
      ) : null}

      <RequestInfoDialog open={requestInfoOpen} onClose={() => setRequestInfoOpen(false)} project={project} />
    </div>
  );
}

export function SalesCenterSection({ project, developer }: { project: Project; developer?: Developer }) {
  const { t } = useListingT();
  const [requestInfoOpen, setRequestInfoOpen] = useState(false);

  const socialEntries = Object.entries(developer?.socialLinks ?? {}).filter(([, url]) => hasDisplayValue(url)) as [string, string][];
  const hoursLines = formatOfficeHours(developer?.officeHours);
  const phone = hasDisplayValue(project.contact?.phone) ? project.contact.phone : "";

  return (
    <section className="sales-center-shell" aria-label="Sales center">
      <div className="sales-alert-card">
        <div className="sales-alert-top">
          <div className="sales-alert-columns">
            <div className="sales-alert-contact">
              {developer?.logo ? (
                <div className="sales-alert-logo">
                  <Image src={developer.logo} alt={developer.name} width={120} height={60} />
                </div>
              ) : null}
              <p className="sales-alert-center-label">{t("Sales Center")}</p>
              <h2 className="sales-alert-heading">{project.name}</h2>
              {phone ? (
                <p className="sales-alert-phone">
                  <Phone className="h-4 w-4" aria-hidden="true" />
                  {phone}
                </p>
              ) : null}
              <button type="button" className="sales-alert-request" onClick={() => setRequestInfoOpen(true)}>{t("Request info")}</button>
            </div>

            {hoursLines.length > 0 ? (
              <div className="sales-alert-hours" aria-label="Sales center hours">
                <span>Hours</span>
                {hoursLines.map((line) => (
                  <div key={line.label} className="sales-alert-hours-row">
                    <strong>{line.label}</strong>
                    <span>{line.value}</span>
                  </div>
                ))}
              </div>
            ) : null}

            {socialEntries.length > 0 ? (
              <div className="sales-alert-socials" aria-label="Sales center social media">
                {socialEntries.map(([platform, url]) => {
                  const Icon = SOCIAL_ICON[platform];
                  if (!Icon) return null;
                  return (
                    <a key={platform} href={url} target="_blank" rel="noreferrer noopener" aria-label={`Visit us on ${platform}`} className="sales-alert-social">
                      <Icon className="h-4 w-4" />
                    </a>
                  );
                })}
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <RequestInfoDialog open={requestInfoOpen} onClose={() => setRequestInfoOpen(false)} project={project} />
    </section>
  );
}

const DESCRIPTION_TRUNCATE_WORDS = 70;

// Shared by ProjectDescriptionSection below and the neighborhood page's
// Overview section — mobile-only truncation (see .project-description-full/
// -short in globals.css): desktop always shows the full text regardless of
// this button's state, no separate desktop word limit.
export function TruncatedDescription({ text }: { text: string }) {
  const { t } = useListingT();
  const [expanded, setExpanded] = useState(false);
  const words = text.trim().split(/\s+/);
  const isLong = words.length > DESCRIPTION_TRUNCATE_WORDS;
  const shortText = `${words.slice(0, DESCRIPTION_TRUNCATE_WORDS).join(" ")}…`;

  if (!isLong) return <p>{text}</p>;

  return (
    <>
      <p className="project-description-short">{expanded ? text : shortText}</p>
      <p className="project-description-full">{text}</p>
      <button type="button" className="project-description-toggle" onClick={() => setExpanded((value) => !value)}>
        {expanded ? t("View less") : t("View more")}
      </button>
    </>
  );
}

export function ProjectDescriptionSection({ project, floorPlan, headingOverride }: { project: Project; floorPlan?: FloorPlan; headingOverride?: string }) {
  const { t, language } = useListingT();
  // A specific floor plan has its own detail page (linked from the main
  // project page, which already shows the project-wide highlights/
  // description) — reusing that same project-level copy here would just
  // repeat it under a different heading. Build a short summary from the
  // plan's own facts (plus the project's construction status/move-in year,
  // since a plan doesn't track those itself) instead.
  if (floorPlan) {
    const facts = [
      floorPlan.bedrooms ? `${floorPlan.bedrooms} bedroom${floorPlan.bedrooms === 1 ? "" : "s"}` : "",
      floorPlan.bathrooms ? `${floorPlan.bathrooms} bathroom${floorPlan.bathrooms === 1 ? "" : "s"}` : "",
      floorPlan.floorAreaSqFt > 0 ? `${floorPlan.floorAreaSqFt} sq.ft. of floor area` : "",
    ].filter(Boolean).join(", ");

    const sentences = [
      facts ? `The ${floorPlan.planName} is a ${facts} home at ${project.name}.` : `The ${floorPlan.planName} is a home at ${project.name}.`,
      floorPlan.startingPriceLkr > 0 ? `Priced from ${formatLkr(floorPlan.startingPriceLkr)}.` : "",
      hasDisplayValue(floorPlan.availability) ? `Currently ${floorPlan.availability.toLowerCase()}.` : "",
      floorPlan.quickMoveIn ? "Available for quick move-in." : "",
      // "The project is completed, completed in 2022" read badly — a finished
      // building gets one clean sentence; anything else gets its status plus
      // a move-in year only when that year is still ahead.
      hasDisplayValue(project.constructionStatus)
        ? (/complete/i.test(project.constructionStatus) && project.completionYear > 0 && !isUpcomingMoveIn(project)
          ? `The project was completed in ${project.completionYear}.`
          : `The project is ${project.constructionStatus.toLowerCase()}${isUpcomingMoveIn(project) ? `, with move-in expected in ${project.completionYear}` : ""}.`)
        : "",
    ].filter(Boolean);

    // Sinhala/Tamil get their own sentence templates (word order differs);
    // English keeps the one above.
    const summaryText = language === "en"
      ? sentences.join(" ")
      : floorPlanSummarySentence(language, floorPlan, project, isUpcomingMoveIn(project));

    return (
      <section id="overview" className="project-description-shell" aria-label="Floor plan description">
        <h2>{headingOverride ? t(headingOverride) : `${floorPlan.planName} ${t("Details")}`}</h2>
        <p>{summaryText}</p>
      </section>
    );
  }

  // The Overview shows the description only. `summary` is the short teaser
  // for cards and the meta description — appending it here just repeated
  // the paragraph in miniature at the end (dropped 2026-09-07). It's still
  // the fallback when a project has no description at all.
  // Sinhala/Tamil prose comes from the project's Translations tab, field by
  // field, falling back to English.
  const copy = localizedProjectCopy(project, language);
  const fullText = hasDisplayValue(copy.description) ? copy.description : (copy.summary ?? "");
  const highlights = copy.highlights.filter(Boolean);

  return (
    <section id="overview" className="project-description-shell" aria-label="Project description">
      <h2>{t(headingOverride ?? "Overview")}</h2>
      {highlights.length > 0 ? (
        <ul className="project-description-highlights">
          {highlights.map((highlight) => (
            <li key={highlight}>{highlight}</li>
          ))}
        </ul>
      ) : null}
      <TruncatedDescription text={fullText} />
    </section>
  );
}


export function ProjectNarrativeDetails({ project }: { project: Project }) {
  const launchDate = project.launchDate ? new Date(project.launchDate) : null;
  const salesStarted = launchDate && !Number.isNaN(launchDate.getTime())
    ? launchDate.toLocaleDateString("en-US", { month: "short", year: "numeric" })
    : "";
  // Only a year is stored, so show only the year — the previous
  // `${year}-12-01` invented a month the developer never stated, and UTC-
  // midnight parsing then drifted it to "Nov" in western timezones.
  const completionMonth = project.completionYear > 0 ? String(project.completionYear) : "";
  const constructionStartDate = project.constructionStarted ? new Date(project.constructionStarted) : null;
  const constructionStarted = constructionStartDate && !Number.isNaN(constructionStartDate.getTime())
    ? constructionStartDate.toLocaleDateString("en-US", { month: "short", year: "numeric" })
    : "";

  const parkingSummary = hasDisplayValue(project.parking) ? project.parking : "";
  // "-" is the store's "not provided" placeholder — not a fact to list.
  const isFact = (value: unknown) => hasDisplayValue(value) && String(value).trim() !== "-";

  const incentives = (project.incentives ?? []).filter((item) => isFact(item));

  // The fact sheet is the full reference table. Row order is the one set on
  // 2026-09-07 (docs/design.md "Stats chips vs fact sheet"): type & status
  // → timeline → pricing → inventory → home size → building → utilities →
  // location, then the who's-who links. Headline facts (Beds, Baths, SqFt,
  // Listing status, Price range, Total units) deliberately repeat the hero
  // chips. Labels match the chip names exactly (one name per field — see
  // STAT_DISPLAY_LABEL). Every number here is developer-entered: unit
  // counts come from availableUnits/soldUnits (never from counting plan
  // types), the averages and price-per-sqft from their own fields — nothing
  // is computed (docs/supabase-workflow.md Standing Rule 4).
  const detailRows = [
    { label: "Property type", show: isFact(project.type), value: <Link href={`/projects?type=${encodeURIComponent(project.type)}`} className="overview-link">{project.type}</Link> },
    { label: "Listing status", show: isFact(project.status), value: project.status },
    { label: "Construction status", show: isFact(project.constructionStatus), value: project.constructionStatus },
    { label: "Sales started", show: isFact(salesStarted), value: salesStarted },
    // A year still ahead is a move-in date; a past one is simply when the
    // building was finished (rule of 2026-09-07 — no "Move in 2022").
    { label: isUpcomingMoveIn(project) ? "Move-in year" : "Completed in", show: isFact(completionMonth), value: completionMonth },
    { label: "Price range", show: project.startingPriceLkr > 0, value: `From ${formatLkr(project.startingPriceLkr)}` },
    { label: "Avg unit price", show: Boolean(project.averageUnitPriceLkr), value: project.averageUnitPriceLkr ? formatLkr(project.averageUnitPriceLkr) : "" },
    { label: "Per SqFt (Avg)", show: isFact(project.averagePricePerSqft), value: project.averagePricePerSqft ?? "" },
    { label: "Incentives", show: incentives.length > 0, value: incentives.join("; ") },
    { label: "Total units", show: project.units > 0, value: String(project.units) },
    { label: "Units available", show: (project.availableUnits ?? 0) > 0, value: String(project.availableUnits ?? 0) },
    { label: "Units sold", show: (project.soldUnits ?? 0) > 0, value: String(project.soldUnits ?? 0) },
    { label: "Floors", show: project.floors > 0, value: String(project.floors) },
    { label: "Floor plans", show: project.floorPlans.length > 0, value: String(project.floorPlans.length) },
    { label: "Beds", show: isFact(project.bedrooms), value: project.bedrooms },
    { label: "Baths", show: isFact(project.bathrooms), value: project.bathrooms },
    { label: "SqFt", show: isFact(project.floorAreaRange), value: `${project.floorAreaRange} SqFt` },
    { label: "Avg floor area", show: Boolean(project.averageFloorAreaSqFt), value: project.averageFloorAreaSqFt ? `${project.averageFloorAreaSqFt.toLocaleString("en-US")} SqFt` : "" },
    { label: "Ceilings", show: isFact(project.ceilingInfo), value: project.ceilingInfo ?? "" },
    { label: "Ownership", show: isFact(project.ownership), value: project.ownership },
    // Free-text parking note (e.g. "1 dedicated bay per residence").
    { label: "Parking", show: isFact(parkingSummary), value: parkingSummary },
    { label: "Carpark levels", show: (project.carparkLevels ?? 0) > 0, value: String(project.carparkLevels ?? 0) },
    { label: "Security", show: isFact(project.security), value: project.security },
    { label: "Electricity", show: isFact(project.electricity), value: project.electricity ?? "" },
    { label: "Tap water", show: isFact(project.tapWater), value: project.tapWater ?? "" },
    { label: "Address", show: isFact(project.location), value: project.location },
    { label: "Road", show: isFact(project.road), value: project.road ?? "" },
    { label: "Area", show: isFact(project.area), value: project.area ?? "" },
    {
      label: "Neighborhood",
      show: isFact(project.neighborhood),
      value: project.neighborhoodSlug
        ? renderEntityLink(project.neighborhood, project.neighborhoodSlug, "/neighborhoods", "overview-link")
        : <span className="overview-link">{project.neighborhood}</span>,
    },
    { label: "District", show: isFact(project.district), value: project.district },
    // Not in the ordered list above — kept after it so the links to the
    // company profile pages aren't lost.
    { label: "Construction started", show: isFact(constructionStarted), value: constructionStarted },
    { label: "Developer", show: isFact(project.developerName), value: renderEntityLink(project.developerName, project.developerSlug, "/developers", "overview-link") },
    { label: "Architect", show: isFact(project.architectName), value: renderEntityLink(project.architectName ?? "", project.architectSlug, "/architects", "overview-link") },
    { label: "Marketing company", show: isFact(project.marketingCompanyName), value: renderEntityLink(project.marketingCompanyName ?? "", project.marketingCompanySlug, "/marketing-companies", "overview-link") },
    { label: "Sales company", show: isFact(project.salesCompanyName), value: renderEntityLink(project.salesCompanyName ?? "", project.salesCompanySlug, "/sales-companies", "overview-link") },
    { label: "Interior designer", show: isFact(project.interiorDesignerName), value: renderEntityLink(project.interiorDesignerName ?? "", project.interiorDesignerSlug, "/interior-designers", "overview-link") },
  ].filter((row) => row.show);

  // Mobile shows a shorter list in its own order (set by the owner
  // 2026-09-07) — a subset of the desktop rows, so both tables are built
  // from the same detailRows and the CSS picks one per breakpoint (≤980px),
  // no JS/hydration involved.
  const byLabel = new Map(detailRows.map((row) => [row.label, row]));
  const mobileRows = MOBILE_FACT_SHEET_ORDER.map((label) => byLabel.get(label)).filter((row): row is (typeof detailRows)[number] => Boolean(row));

  return (
    <section className="project-narrative-shell" aria-label="Project details">
      <FactSheetTable rows={detailRows} className="project-fact-sheet project-fact-sheet-desktop" />
      <FactSheetTable rows={mobileRows} className="project-fact-sheet project-fact-sheet-mobile" />
    </section>
  );
}

// Fact-sheet rows shown on mobile, in order. Labels are the display names
// used in ProjectNarrativeDetails (one name per field).
const MOBILE_FACT_SHEET_ORDER = [
  "Property type",
  "Listing status",
  "Construction status",
  "Move-in year",
  "Completed in",
  "Price range",
  "Per SqFt (Avg)",
  "Beds",
  "Baths",
  "SqFt",
  "Total units",
  "Floors",
  "Ownership",
  "Parking",
  "Address",
  "Neighborhood",
  "District",
];

// Two columns filled top-to-bottom, not left-to-right: the first half of the
// ordered list runs down the LEFT column (highest priority), the second half
// down the RIGHT (lowest) — so the eye reads the list in priority order by
// scanning down, then across.
export function FactSheetTable({ rows, className }: { rows: { label: string; value: React.ReactNode }[]; className: string }) {
  const { t, tPrice } = useListingT();
  // Labels and plain-string values (statuses, types, "From Rs. …") are
  // translated; links/nodes and numbers pass through untouched.
  const show = (value: React.ReactNode) => (typeof value === "string" ? tPrice(t(value)) : value);
  if (!rows.length) return null;
  const split = Math.ceil(rows.length / 2);
  const left = rows.slice(0, split);
  const right = rows.slice(split);

  return (
    <table className={className}>
      <tbody>
        {left.map((leftRow, index) => {
          const rightRow = right[index];
          return (
            <tr key={leftRow.label}>
              <td><span className="project-fact-label">{t(leftRow.label)}:</span> {show(leftRow.value)}</td>
              {rightRow
                ? <td><span className="project-fact-label">{t(rightRow.label)}:</span> {show(rightRow.value)}</td>
                : <td aria-hidden="true" />}
            </tr>
          );
        })}
      </tbody>
    </table>
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

function MobileHomeIcon({ size = 22 }: { size?: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="#1f1f1f" width={size} height={size} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 21v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21m0 0h4.5V3.545M12.75 21h7.5V10.75M2.25 21h1.5m18 0h-18M2.25 9l4.5-1.636M18.75 3l-1.5.545m0 6.205 3 1m1.5.5-1.5-.5M6.75 7.364V3h-3v18m3-13.636 10.5-3.819" />
    </svg>
  );
}

function MobileBuildingIcon({ size = 22 }: { size?: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="#1f1f1f" width={size} height={size} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
    </svg>
  );
}

function MobileLandIcon({ size = 22 }: { size?: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="#1f1f1f" width={size} height={size} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 4.5v15m6-15v15m-10.875 0h15.75c.621 0 1.125-.504 1.125-1.125V5.625c0-.621-.504-1.125-1.125-1.125H4.125C3.504 4.5 3 5.004 3 5.625v12.75c0 .621.504 1.125 1.125 1.125Z" />
    </svg>
  );
}

export function Header() {
  const { language, setLanguage } = useLanguage();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openMobileGroup, setOpenMobileGroup] = useState<"homes" | "land" | null>(null);

  const labels: Record<SiteLanguage, { homes: string; company: string; login: string; signup: string; menu: string }> = {
    en: {
      homes: "New Homes for Sale",
      company: "Company",
      login: "Log in",
      signup: "Sign up",
      menu: "Menu",
    },
    ta: {
      homes: "விற்பனைக்கு புதிய வீடுகள்",
      company: "நிறுவனம்",
      login: "உள்நுழை",
      signup: "பதிவுபெறு",
      menu: "மெனு",
    },
    si: {
      homes: "විකිණීමට නව නිවාස",
      company: "සමාගම",
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
          <Link href="/" className="site-logo site-wordmark" aria-label="LankaNewHomes home">
            <span className="wordmark-line">Lanka</span>
            <span className="wordmark-line">NewHomes</span>
          </Link>
          <div className="language-segmented" role="group" aria-label="Language switcher">
            <button type="button" className={language === "en" ? "active" : undefined} onClick={() => setLanguage("en")}>EN</button>
            <button type="button" className={language === "si" ? "active" : undefined} onClick={() => setLanguage("si")}>සිංහල</button>
            <button type="button" className={language === "ta" ? "active" : undefined} onClick={() => setLanguage("ta")}>தமிழ்</button>
          </div>
        </div>
        <nav>
          <div className="nav-dropdown">
            <Link href="/projects">{text.homes}</Link>
            <div className="nav-dropdown-menu">
              <Link href="/projects?type=Condominium">Condominium</Link>
              <Link href="/projects?type=Apartments">Apartments</Link>
              <Link href="/projects?type=Villas">Villas</Link>
              <Link href="/projects?type=Mixed+Use">Mixed Use</Link>
              <Link href="/projects?type=Housing">Housing</Link>
              <Link href="/projects?type=Township+Developments">Township Developments</Link>
              <Link href="/projects?type=Private+Residence">Private Residence</Link>
              <Link href="/projects?type=Townhouse">Townhouse</Link>
              <Link href="/projects">All new homes</Link>
            </div>
          </div>
          <div className="nav-dropdown">
            <Link href="/land">Land</Link>
            <div className="nav-dropdown-menu">
              <Link href="/land?landUse=Residential">Residential</Link>
              <Link href="/land?landUse=Commercial">Commercial</Link>
              <Link href="/land?landUse=Agricultural">Agricultural</Link>
              <Link href="/land?landUse=Mixed+Use">Mixed Use</Link>
              <Link href="/land">All land</Link>
            </div>
          </div>
          <div className="nav-dropdown">
            <span className="nav-dropdown-label">{text.company}</span>
            <div className="nav-dropdown-menu">
              <Link href="/about">About</Link>
              <Link href="/contact">Contact</Link>
              <Link href="/blog">Blog</Link>
            </div>
          </div>
        </nav>
        <div className="header-actions">
          <AccountMenu loginLabel={text.login} signupLabel={text.signup} />
        </div>
        <button className="mobile-menu" onClick={() => setMobileMenuOpen((v) => !v)} aria-expanded={mobileMenuOpen} aria-label={text.menu}>
          {mobileMenuOpen ? <TablerX size={26} stroke={1} /> : <IconMenu2 size={26} stroke={1} />}
        </button>
      </div>
      <div className={`mobile-menu-panel${mobileMenuOpen ? " is-open" : ""}`}>
          <div className="mobile-menu-group mobile-menu-group-link">
            <Link href="/" onClick={() => setMobileMenuOpen(false)}>
              <MobileHomeIcon /> Home
            </Link>
          </div>
          <div className="mobile-menu-group">
            <button
              type="button"
              className={`mobile-menu-group-label mobile-menu-group-toggle${openMobileGroup === "homes" ? " is-open" : ""}`}
              aria-expanded={openMobileGroup === "homes"}
              onClick={() => setOpenMobileGroup(openMobileGroup === "homes" ? null : "homes")}
            >
              <span className="mobile-menu-group-toggle-label">
                <MobileBuildingIcon /> {text.homes}
              </span>
              <TablerChevronRight size={18} stroke={1} className="mobile-menu-group-chevron" aria-hidden="true" />
            </button>
            {openMobileGroup === "homes" ? (
              <>
                <Link href="/projects" onClick={() => setMobileMenuOpen(false)}>All new homes</Link>
                <Link href="/projects?type=Condominium" onClick={() => setMobileMenuOpen(false)}>Condominium</Link>
                <Link href="/projects?type=Apartments" onClick={() => setMobileMenuOpen(false)}>Apartments</Link>
                <Link href="/projects?type=Villas" onClick={() => setMobileMenuOpen(false)}>Villas</Link>
                <Link href="/projects?type=Mixed+Use" onClick={() => setMobileMenuOpen(false)}>Mixed Use</Link>
                <Link href="/projects?type=Housing" onClick={() => setMobileMenuOpen(false)}>Housing</Link>
                <Link href="/projects?type=Townhouse" onClick={() => setMobileMenuOpen(false)}>Townhouse</Link>
              </>
            ) : null}
          </div>
          <div className="mobile-menu-group">
            <button
              type="button"
              className={`mobile-menu-group-label mobile-menu-group-toggle${openMobileGroup === "land" ? " is-open" : ""}`}
              aria-expanded={openMobileGroup === "land"}
              onClick={() => setOpenMobileGroup(openMobileGroup === "land" ? null : "land")}
            >
              <span className="mobile-menu-group-toggle-label">
                <MobileLandIcon /> Lands
              </span>
              <TablerChevronRight size={18} stroke={1} className="mobile-menu-group-chevron" aria-hidden="true" />
            </button>
            {openMobileGroup === "land" ? (
              <>
                <Link href="/land" onClick={() => setMobileMenuOpen(false)}>All land</Link>
                <Link href="/land?landUse=Residential" onClick={() => setMobileMenuOpen(false)}>Residential</Link>
                <Link href="/land?landUse=Commercial" onClick={() => setMobileMenuOpen(false)}>Commercial</Link>
                <Link href="/land?landUse=Agricultural" onClick={() => setMobileMenuOpen(false)}>Agricultural</Link>
                <Link href="/land?landUse=Mixed+Use" onClick={() => setMobileMenuOpen(false)}>Mixed Use</Link>
              </>
            ) : null}
          </div>
          <div className="mobile-menu-actions">
            <AccountMenu loginLabel={text.login} signupLabel={text.signup} />
          </div>
          <div className="mobile-menu-language language-segmented" role="group" aria-label="Language switcher">
            <button type="button" className={language === "en" ? "active" : undefined} onClick={() => setLanguage("en")}>EN</button>
            <button type="button" className={language === "si" ? "active" : undefined} onClick={() => setLanguage("si")}>සිංහල</button>
            <button type="button" className={language === "ta" ? "active" : undefined} onClick={() => setLanguage("ta")}>தமிழ்</button>
          </div>
        </div>
    </header>
  );
}

// Footer brand is the plain-text wordmark (Lanka·New·Homes with "New" in
// brand orange), not /logo.svg — the old approach inverted the whole SVG to
// white for the dark background, which turned the orange house badge into a
// blank white square. The same wordmark exists as a standalone asset at
// public/logo-wordmark.svg / logo-wordmark-white.svg (Archivo 700 outlined
// to paths) for use outside the site.
export function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div className="footer-top">
          <div className="footer-brand">
            <Link href="/" className="footer-wordmark" aria-label="LankaNewHomes home">
              <span className="wordmark-line">Lanka</span>
              <span className="wordmark-line">NewHomes</span>
            </Link>
            <p className="footer-tagline">Find new homes, apartments and land for sale across Sri Lanka — with floor plans, pricing and developer details in one place.</p>
            <Link href="/developers/register" className="footer-cta">List your project</Link>
          </div>

          <div className="footer-columns">
            <div className="footer-column">
              <p className="footer-column-title">Explore</p>
              <Link href="/projects">New homes for sale</Link>
              <Link href="/land">Land for sale</Link>
              <Link href="/developers">Developers</Link>
              <Link href="/construction-companies">Construction companies</Link>
            </div>

            <div className="footer-column">
              <p className="footer-column-title">For developers</p>
              <Link href="/developers/register">List your project</Link>
              <Link href="/developers/login">Developer login</Link>
            </div>

            <div className="footer-column">
              <p className="footer-column-title">Company</p>
              <Link href="/about">About</Link>
              <Link href="/contact">Contact</Link>
              <Link href="/blog">Blog</Link>
            </div>

            <div className="footer-column">
              <p className="footer-column-title">Legal</p>
              <Link href="/privacy">Privacy Policy</Link>
              <Link href="/terms">Terms of Service</Link>
              <Link href="/sitemap">Sitemap</Link>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <p className="copyright">© {new Date().getFullYear()} LankaNewHomes. All rights reserved.</p>
          <Link href="/admin-login" className="footer-admin-link">Admin</Link>
        </div>
      </div>
    </footer>
  );
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
          {hasDisplayValue(project.completionYear) ? <p role="listitem"><strong>Completed in:</strong> {project.completionYear}</p> : null}
          {hasDisplayValue(project.developerName) ? (
            <p role="listitem">
              <strong>Builders:</strong> <Link href={`/developers/${project.developerSlug}`} className="overview-link">{project.developerName}</Link>
              {(project.coDevelopers ?? []).filter((entry) => entry.name).map((entry) => <span key={entry.name}>, {entry.name}</span>)}
            </p>
          ) : null}
          {hasDisplayValue(project.salesCompanyName) ? <p role="listitem"><strong>Sales company:</strong> {renderEntityLink(project.salesCompanyName ?? "", project.salesCompanySlug, "/sales-companies", "overview-link")}</p> : null}
          {hasDisplayValue(project.interiorDesignerName) ? <p role="listitem"><strong>Interior designer:</strong> {renderEntityLink(project.interiorDesignerName ?? "", project.interiorDesignerSlug, "/interior-designers", "overview-link")}</p> : null}
        </div>
      </div>
    </section>
  );
}

const NEARBY_CATEGORY_ICON: Record<NearbyPlace["category"], React.ComponentType<{ className?: string }>> = {
  School: Building2,
  Hospital: HeartPulse,
  Shopping: LayoutGrid,
  Restaurant: UtensilsCrossed,
  Transport: Navigation,
  Landmark: Landmark,
};

// Shared accordion UI — used both by NeighborhoodSection (the "Neighborhood"
// tab on a project page) and the standalone neighborhood guide page, so the
// two stay visually identical rather than drifting into two designs. Takes
// plain group data (from groupNearbyPlaces, a server-safe helper) and
// resolves icons here on the client — a resolved icon *component* can't
// itself be passed as a server->client prop.
export function NearbyPlacesAccordion({ groups }: { groups: ReturnType<typeof groupNearbyPlaces> }) {
  const [openKey, setOpenKey] = useState<string | null>(groups[0]?.key ?? null);

  if (groups.length === 0) return null;

  return (
    <div className="key-features-list">
      {groups.map((group) => {
        const isOpen = openKey === group.key;
        const Icon = NEARBY_CATEGORY_ICON[group.key];
        return (
          <div key={group.key} className={`key-features-row ${isOpen ? "open" : ""}`}>
            <button
              type="button"
              className="key-features-row-trigger"
              aria-expanded={isOpen}
              onClick={() => setOpenKey(isOpen ? null : group.key)}
            >
              <Icon className="h-6 w-6" aria-hidden="true" />
              <span>{group.label}</span>
              <ChevronDown className="key-features-chevron h-6 w-6" aria-hidden="true" />
            </button>
            {isOpen ? (
              <div className="key-features-row-body">
                {group.items.map((place) => (
                  <span key={place.name} className="key-features-item">
                    <span className="key-features-item-label">{place.name}:</span> {hasDisplayValue(place.distanceKm) ? formatDistanceKm(place.distanceKm ?? 0) : "Nearby"}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

export function NeighborhoodSection({ nearby, neighborhoodName, neighborhoodSlug, neighborhoodPageExists }: { nearby: NearbyPlace[]; neighborhoodName?: string; neighborhoodSlug?: string; neighborhoodPageExists?: boolean }) {
  const { t } = useListingT();
  const groups = groupNearbyPlaces(nearby);

  if (!hasDisplayValue(neighborhoodName) && groups.length === 0) return null;

  return (
    <section id="neighborhood" className="key-features-shell" aria-label="Neighborhood">
      <div className="key-features-pattern" aria-hidden="true" />
      <h2>{t("Neighborhood")}</h2>

      <NearbyPlacesAccordion groups={groups} />

      {hasDisplayValue(neighborhoodName) ? (
        <Link href={neighborhoodPageExists && neighborhoodSlug ? `/neighborhoods/${neighborhoodSlug}` : `/search?q=${encodeURIComponent(neighborhoodName!)}`} className="neighborhood-section-explore">
          View neighbourhood
        </Link>
      ) : null}
    </section>
  );
}

// Reuses AmenitiesShowcaseSection's exact click-to-swap card design
// (amenities-showcase-*) for the neighborhood page's landmark highlights —
// no per-landmark photos exist yet, so every entry shows the same
// text-only placeholder AmenitiesShowcaseSection already falls back to for
// an amenity with no matched gallery image, rather than inventing new CSS.
export function KnownLandmarksSection({ nearby, title = "Known Landmarks" }: { nearby: NearbyPlace[]; title?: string }) {
  const { t } = useListingT();
  const landmarkItems = useMemo(
    () => nearby.filter((place) => place.category !== "School" && place.category !== "Transport").slice(0, 8),
    [nearby],
  );

  const [activeIndex, setActiveIndex] = useState(0);
  const active = landmarkItems[Math.max(0, Math.min(activeIndex, landmarkItems.length - 1))];

  if (!landmarkItems.length || !active) return null;

  return (
    <section id="known-landmarks" className="amenities-showcase-shell" aria-label={title}>
      <h2>{t(title)}</h2>

      <div className="amenities-showcase-grid">
        <figure className="amenities-showcase-image-wrap no-image">
          <div className="amenities-showcase-image-placeholder" aria-hidden="true">
            <span>{active.name}</span>
          </div>
        </figure>

        <div className="amenities-showcase-list" role="list" aria-label="Landmark details">
          {landmarkItems.map((place, index) => {
            const isActive = index === activeIndex;

            return (
              <button
                key={place.name}
                type="button"
                role="listitem"
                className={`amenities-showcase-item ${isActive ? "active" : ""}`.trim()}
                aria-pressed={isActive}
                onClick={() => setActiveIndex(index)}
              >
                <span className="amenities-showcase-item-icon" aria-hidden="true">✓</span>
                <span className="amenities-showcase-item-copy">
                  <strong>{place.name}</strong>
                  {place.distanceKm ? ` — ${formatDistanceKm(place.distanceKm)} away` : ""}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
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
    <div className="flex flex-wrap items-center gap-2 border border-stone-200 bg-white p-3 text-sm">
      <Search className="h-4 w-4" aria-hidden="true" />
      <span>{count} {count === 1 ? "PROJECT" : "PROJECTS"}</span>
    </div>
  );
}

export function PriceTag({ amount }: { amount: number }) {
  return <span>{compactLkr(amount)}</span>;
}
