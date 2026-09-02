"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Award,
  Bell,
  Building2,
  GitCompare,
  HardHat,
  Heart,
  History,
  Home,
  LandPlot,
  Plus,
  Sparkles,
  Waves,
  X,
} from "lucide-react";
import { formatLkr } from "@/lib/format";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import { useCurrentUser } from "@/lib/use-current-user";
import { useCompare } from "@/lib/use-compare";
import { useSavedSearches } from "@/lib/use-saved-searches";
import { useRecentViews } from "@/lib/use-recent-views";
import { useAuthModal } from "@/components/auth/auth-modal-provider";
import type { Project } from "@/types";

type PanelId = "saved" | "recents" | "alerts" | "compare";

const QUICK_FILTERS: { label: string; href: string; icon: typeof Building2 }[] = [
  { label: "New Listings", href: "/projects", icon: Sparkles },
  { label: "Pre-Con", href: "/projects/pre-construction", icon: HardHat },
  { label: "Residences", href: "/projects/branded-residences", icon: Award },
  { label: "Villas", href: "/projects/villas", icon: Home },
  { label: "Waterfront", href: "/projects/beachfront", icon: Waves },
  { label: "Apartments", href: "/projects?type=Apartments", icon: Building2 },
  { label: "Lands", href: "/land", icon: LandPlot },
];

function ProjectRow({ project, right }: { project: Project; right?: React.ReactNode }) {
  return (
    <div className="map-sidebar-row">
      <Link href={`/projects/${project.slug}`} className="map-sidebar-row-thumb">
        <Image src={project.heroImage} alt={project.name} width={48} height={48} />
      </Link>
      <Link href={`/projects/${project.slug}`} className="map-sidebar-row-body">
        <span className="map-sidebar-row-title">{project.name}</span>
        <span className="map-sidebar-row-subtext">{project.startingPriceLkr > 0 ? formatLkr(project.startingPriceLkr) : project.location}</span>
      </Link>
      {right}
    </div>
  );
}

function SavedPanel() {
  const { user, loading } = useCurrentUser();
  const { openAuthModal } = useAuthModal();
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    if (!user) return;
    const supabase = createSupabaseBrowserClient();
    supabase
      .from("saved_listings")
      .select("project_slug, projects(data)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20)
      .then(({ data }) => {
        const rows = (data ?? [])
          .map((row) => (row as unknown as { projects: { data: Project } | null }).projects?.data)
          .filter((project): project is Project => Boolean(project));
        setProjects(rows);
      });
  }, [user]);

  const unsave = async (slug: string) => {
    if (!user) return;
    const supabase = createSupabaseBrowserClient();
    await supabase.from("saved_listings").delete().eq("user_id", user.id).eq("project_slug", slug);
    setProjects((prev) => prev.filter((project) => project.slug !== slug));
  };

  if (loading) return <div className="map-sidebar-panel-body" />;

  if (!user) {
    return (
      <div className="map-sidebar-panel-body">
        <h3 className="map-sidebar-panel-title">Saved</h3>
        <p className="map-sidebar-empty">Log in to see listings you&apos;ve saved.</p>
        <button type="button" className="map-sidebar-cta" onClick={() => openAuthModal({ mode: "login" })}>Log in</button>
      </div>
    );
  }

  return (
    <div className="map-sidebar-panel-body">
      <h3 className="map-sidebar-panel-title">Saved</h3>
      {projects.length === 0 ? (
        <p className="map-sidebar-empty">No saved listings yet — tap the heart on any listing.</p>
      ) : (
        projects.map((project) => (
          <ProjectRow
            key={project.slug}
            project={project}
            right={
              <button type="button" className="map-sidebar-row-remove" aria-label={`Remove ${project.name} from saved`} onClick={() => unsave(project.slug)}>
                <X className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            }
          />
        ))
      )}
    </div>
  );
}

function RecentsPanel() {
  const { projects, loading } = useRecentViews();

  return (
    <div className="map-sidebar-panel-body">
      <h3 className="map-sidebar-panel-title">Recents</h3>
      {loading ? null : projects.length === 0 ? (
        <p className="map-sidebar-empty">You haven&apos;t viewed any projects yet.</p>
      ) : (
        projects.map((project) => <ProjectRow key={project.slug} project={project} />)
      )}
    </div>
  );
}

function AlertsPanel() {
  const { userId, loading, searches, create, toggleActive, remove } = useSavedSearches();
  const { openAuthModal } = useAuthModal();
  const [name, setName] = useState("");

  if (loading) return <div className="map-sidebar-panel-body" />;

  if (!userId) {
    return (
      <div className="map-sidebar-panel-body">
        <h3 className="map-sidebar-panel-title">Alerts</h3>
        <p className="map-sidebar-empty">Log in to create saved-search alerts.</p>
        <button type="button" className="map-sidebar-cta" onClick={() => openAuthModal({ mode: "login" })}>Log in</button>
      </div>
    );
  }

  return (
    <div className="map-sidebar-panel-body">
      <h3 className="map-sidebar-panel-title">Alerts</h3>
      <p className="map-sidebar-note">Email alerts are saved for when this launches — for now, this just keeps a named alert on/off.</p>
      <form
        className="map-sidebar-create-alert"
        onSubmit={(event) => {
          event.preventDefault();
          if (!name.trim()) return;
          create(name.trim());
          setName("");
        }}
      >
        <input type="text" placeholder="Name this alert" value={name} onChange={(event) => setName(event.target.value)} aria-label="Alert name" />
        <button type="submit" aria-label="Create alert"><Plus className="h-4 w-4" aria-hidden="true" /></button>
      </form>
      {searches.length === 0 ? (
        <p className="map-sidebar-empty">No saved searches yet.</p>
      ) : (
        searches.map((search) => (
          <div key={search.id} className="map-sidebar-alert-row">
            <span className="map-sidebar-alert-name">{search.name}</span>
            <label className="map-sidebar-alert-toggle">
              <input type="checkbox" checked={search.isActive} onChange={(event) => toggleActive(search.id, event.target.checked)} />
              <span>Email notifications</span>
            </label>
            <button type="button" aria-label={`Delete ${search.name}`} onClick={() => remove(search.id)}>
              <X className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>
        ))
      )}
    </div>
  );
}

function ComparePanel() {
  const { entries, remove, clear, max } = useCompare();
  const [items, setItems] = useState<(Project & { basePath: string })[]>([]);

  useEffect(() => {
    if (entries.length === 0) {
      setItems([]);
      return;
    }
    const projectSlugs = entries.filter((entry) => entry.basePath === "/projects").map((entry) => entry.slug);
    const landSlugs = entries.filter((entry) => entry.basePath === "/land").map((entry) => entry.slug);
    const params = new URLSearchParams();
    if (projectSlugs.length) params.set("projectSlugs", projectSlugs.join(","));
    if (landSlugs.length) params.set("landSlugs", landSlugs.join(","));
    fetch(`/api/compare?${params.toString()}`)
      .then((response) => response.json())
      .then((data) => {
        if (Array.isArray(data?.items)) setItems(data.items);
      })
      .catch(() => {});
  }, [entries]);

  return (
    <div className="map-sidebar-panel-body">
      <div className="map-sidebar-panel-title-row">
        <h3 className="map-sidebar-panel-title">Compare ({entries.length}/{max})</h3>
        {entries.length > 0 ? <button type="button" onClick={clear}>Clear all</button> : null}
      </div>
      {items.length === 0 ? (
        <p className="map-sidebar-empty">Add up to {max} listings to compare using the compare icon on any card.</p>
      ) : (
        items.map((item) => (
          <div key={item.slug} className="map-sidebar-compare-row">
            <Image src={item.heroImage} alt={item.name} width={48} height={48} className="map-sidebar-row-thumb-img" />
            <div className="map-sidebar-row-body">
              <span className="map-sidebar-row-title">{item.name}</span>
              <span className="map-sidebar-row-subtext">
                {item.startingPriceLkr > 0 ? formatLkr(item.startingPriceLkr) : item.status}
                {item.floorAreaRange && item.floorAreaRange !== "-" ? ` · ${item.floorAreaRange}` : ""}
                {item.bedrooms && item.bedrooms !== "-" ? ` · ${item.bedrooms} bd` : ""}
                {item.completionYear ? ` · ${item.completionYear}` : ""}
              </span>
            </div>
            <button type="button" className="map-sidebar-row-remove" aria-label={`Remove ${item.name} from compare`} onClick={() => remove(item.slug)}>
              <X className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>
        ))
      )}
    </div>
  );
}

// basePath is threaded through for future callers on other list+map pages
// (e.g. /developers, /construction-companies) that may want to tailor links
// per page — every current listing route resolves Saved/Recents/Alerts/
// Compare identically regardless of it, so it's only used for a data
// attribute today.
export function MapSidebar({ basePath }: { basePath: string }) {
  const [activePanel, setActivePanel] = useState<PanelId | null>(null);
  const { count } = useCompare();

  const openPanel = (panel: PanelId) => {
    setActivePanel((prev) => (prev === panel ? null : panel));
  };

  return (
    <div className="map-sidebar" data-base-path={basePath}>
      <div className="map-sidebar-rail">
        {QUICK_FILTERS.map((filter) => (
          <Link key={filter.href} href={filter.href} className="map-sidebar-icon-btn" title={filter.label}>
            <filter.icon className="h-5 w-5" aria-hidden="true" />
            <span>{filter.label}</span>
          </Link>
        ))}

        <div className="map-sidebar-spacer" />

        <div className="map-sidebar-divider" />

        <button type="button" className="map-sidebar-icon-btn" aria-label="Saved" aria-pressed={activePanel === "saved"} title="Saved" onClick={() => openPanel("saved")}>
          <Heart className="h-5 w-5" aria-hidden="true" />
          <span>Saved</span>
        </button>
        <button type="button" className="map-sidebar-icon-btn" aria-label="Recents" aria-pressed={activePanel === "recents"} title="Recents" onClick={() => openPanel("recents")}>
          <History className="h-5 w-5" aria-hidden="true" />
          <span>Recents</span>
        </button>
        <button type="button" className="map-sidebar-icon-btn" aria-label="Alerts" aria-pressed={activePanel === "alerts"} title="Alerts" onClick={() => openPanel("alerts")}>
          <Bell className="h-5 w-5" aria-hidden="true" />
          <span>Alerts</span>
        </button>
        <button type="button" className="map-sidebar-icon-btn" aria-label="Compare" aria-pressed={activePanel === "compare"} title="Compare" onClick={() => openPanel("compare")}>
          <GitCompare className="h-5 w-5" aria-hidden="true" />
          <span>Compare</span>
          {count > 0 ? <span className="map-sidebar-badge">{count}</span> : null}
        </button>
      </div>

      {activePanel ? (
        <div className="map-sidebar-panel" data-panel={activePanel}>
          <button type="button" className="map-sidebar-panel-close" aria-label="Close panel" onClick={() => setActivePanel(null)}>
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
          {activePanel === "saved" ? <SavedPanel /> : null}
          {activePanel === "recents" ? <RecentsPanel /> : null}
          {activePanel === "alerts" ? <AlertsPanel /> : null}
          {activePanel === "compare" ? <ComparePanel /> : null}
        </div>
      ) : null}
    </div>
  );
}
