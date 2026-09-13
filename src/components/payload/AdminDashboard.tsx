import type { AdminViewServerProps, Where } from "payload";
import Link from "next/link";
import { Building2, MapPin, MessageCircle, Plus } from "lucide-react";
import { LEAD_STATUS_OPTIONS } from "@/collections/Leads";
import { LeadAlertModeBanner } from "./LeadAlertModeBanner";
import { ListingTodoPanel } from "./ListingTodoPanel";

const LEAD_STATUS_BADGE: Record<string, string> = {
  new: "ln-badge-info",
  contacted: "ln-badge-warning",
  site_visit: "ln-badge-success",
  closed: "ln-badge-neutral",
};

function leadStatusLabel(value: string): string {
  return LEAD_STATUS_OPTIONS.find((o) => o.value === value)?.label ?? value;
}

function timeOfDayGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function relatedName(value: unknown, fallback = "—"): string {
  if (value && typeof value === "object" && "name" in value) return (value as { name?: string }).name || fallback;
  return fallback;
}

function relatedHref(collection: string, value: unknown): string | null {
  const id = value && typeof value === "object" && "id" in value ? (value as { id: string | number }).id : typeof value === "string" || typeof value === "number" ? value : null;
  return id ? `/cms/collections/${collection}/${id}` : null;
}

// Replaces Payload's default dashboard view entirely (admin.components.views.dashboard
// in payload.config.ts) — real counts/rows only, no hard-coded numbers. Renders
// LeadAlertModeBanner + ListingTodoPanel directly (they normally render via the
// `beforeDashboard` slot, which only the *default* dashboard view composes —
// replacing the view means composing them here instead, so nothing is lost).
// DashboardHeading (the old plain "Admin/Developer Dashboard" text) is
// deliberately superseded by the richer greeting below, not lost silently.
export async function AdminDashboard(props: AdminViewServerProps) {
  const { payload, user } = props;
  const role = (user as { role?: string } | null)?.role;
  const isAdmin = role === "admin";

  // Projects/Developers have public read access (the live site needs to
  // read published projects/the developer directory) — that's correct and
  // untouched, but it means a raw payload.count()/find() here would show
  // every developer's platform-wide numbers to a developer account too.
  // Scope this dashboard's own queries down to "my projects" the same way
  // MyBilling.tsx already does, so a developer sees their own activity,
  // not the whole platform's.
  let projectWhere: Where = {};
  let leadWhere: Where = {};
  let ownedDeveloperIds: (string | number)[] = [];
  if (!isAdmin && user) {
    const developersRes = await payload.find({ collection: "developers", where: { user: { equals: user.id } }, limit: 10, depth: 0, overrideAccess: true });
    ownedDeveloperIds = developersRes.docs.map((d) => d.id);
    projectWhere = { developer: { in: ownedDeveloperIds.length ? ownedDeveloperIds : ["__none__"] } };
    const ownedProjectsRes = ownedDeveloperIds.length
      ? await payload.find({ collection: "projects", where: projectWhere, limit: 500, depth: 0, overrideAccess: true })
      : { docs: [] };
    const projectIds = ownedProjectsRes.docs.map((p) => p.id);
    leadWhere = { project: { in: projectIds.length ? projectIds : ["__none__"] } };
  }

  const [totalProjects, publishedProjects, thirdStat, newLeadsCount, recentLeadsRes, recentProjectsRes] = await Promise.all([
    payload.count({ collection: "projects", where: projectWhere, overrideAccess: false, user: user ?? undefined }),
    payload.count({ collection: "projects", where: { ...projectWhere, isPublished: { equals: true } }, overrideAccess: false, user: user ?? undefined }),
    // Admin: platform-wide developer count. Developer: their own paid
    // (Featured/Premium) listings, from the real Subscriptions collection —
    // more relevant to them than "how many developers are on the platform."
    isAdmin
      ? payload.count({ collection: "developers", overrideAccess: false, user: user ?? undefined })
      : payload.count({ collection: "subscriptions", where: { developer: { in: ownedDeveloperIds.length ? ownedDeveloperIds : ["__none__"] }, status: { equals: "active" } }, overrideAccess: true }),
    payload.count({ collection: "leads", where: { ...leadWhere, status: { equals: "new" } }, overrideAccess: false, user: user ?? undefined }),
    payload.find({ collection: "leads", where: leadWhere, sort: "-createdAt", limit: 8, depth: 2, overrideAccess: false, user: user ?? undefined }),
    payload.find({ collection: "projects", where: projectWhere, sort: "-updatedAt", limit: 8, depth: 1, overrideAccess: false, user: user ?? undefined }),
  ]);

  const stats = [
    { label: isAdmin ? "Total Projects" : "My Projects", value: totalProjects.totalDocs },
    { label: "Published Projects", value: publishedProjects.totalDocs },
    { label: isAdmin ? "Developers" : "Active Paid Listings", value: thirdStat.totalDocs },
    { label: "New Leads", value: newLeadsCount.totalDocs },
  ];

  return (
    <div className="ln-dash">
      <p className="ln-dash-greeting">{timeOfDayGreeting()}</p>
      <h1 className="ln-dash-title">{isAdmin ? "LankaNewHomes Admin" : "LankaNewHomes Developer Dashboard"}</h1>

      <div className="ln-stat-grid">
        {stats.map((stat) => (
          <div className="ln-stat-card" key={stat.label}>
            <div className="ln-stat-card-value">{stat.value.toLocaleString()}</div>
            <div className="ln-stat-card-label">{stat.label}</div>
          </div>
        ))}
      </div>

      <LeadAlertModeBanner />

      <div className="ln-dash-section">
        <div className="ln-dash-section-head">
          <h2>Quick actions</h2>
        </div>
        <div className="ln-quick-actions">
          <Link href="/cms/collections/projects/create" className="ln-quick-action"><Plus size={15} /> Add Project</Link>
          {isAdmin ? (
            <>
              <Link href="/cms/collections/lands/create" className="ln-quick-action"><Plus size={15} /> Add Land</Link>
              <Link href="/cms/collections/developers/create" className="ln-quick-action"><Plus size={15} /> Add Developer</Link>
            </>
          ) : null}
          <Link href="/cms/collections/leads" className="ln-quick-action"><MessageCircle size={15} /> View Leads</Link>
        </div>
      </div>

      <div className="ln-dash-section">
        <div className="ln-dash-section-head">
          <h2>Recent leads</h2>
          <Link href="/cms/collections/leads">View all</Link>
        </div>
        {recentLeadsRes.docs.length === 0 ? (
          <div className="ln-empty">No leads yet.</div>
        ) : (
          <table className="ln-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Project</th>
                <th>Developer</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {recentLeadsRes.docs.map((lead) => {
                const project = lead.project as unknown;
                const developer = project && typeof project === "object" && "developer" in project ? (project as { developer?: unknown }).developer : null;
                const leadHref = `/cms/collections/leads/${lead.id}`;
                const projectHref = relatedHref("projects", project);
                return (
                  <tr key={lead.id}>
                    <td><Link href={leadHref}>{lead.name}</Link></td>
                    <td>{projectHref ? <Link href={projectHref}>{relatedName(project)}</Link> : relatedName(project)}</td>
                    <td>{relatedName(developer)}</td>
                    <td><span className={`ln-badge ${LEAD_STATUS_BADGE[lead.status as string] ?? "ln-badge-neutral"}`}>{leadStatusLabel(lead.status as string)}</span></td>
                    <td>{new Date(lead.createdAt).toLocaleDateString()}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <ListingTodoPanel />

      <div className="ln-dash-section">
        <div className="ln-dash-section-head">
          <h2>Recent projects</h2>
          <Link href="/cms/collections/projects">View all</Link>
        </div>
        {recentProjectsRes.docs.length === 0 ? (
          <div className="ln-empty">No projects yet.</div>
        ) : (
          <table className="ln-table">
            <thead>
              <tr>
                <th><Building2 size={12} style={{ verticalAlign: "-2px", marginRight: 4 }} />Project</th>
                <th>Developer</th>
                <th>Status</th>
                <th><MapPin size={12} style={{ verticalAlign: "-2px", marginRight: 4 }} />Location</th>
                <th>Updated</th>
              </tr>
            </thead>
            <tbody>
              {recentProjectsRes.docs.map((project) => (
                <tr key={project.id}>
                  <td><Link href={`/cms/collections/projects/${project.id}`}>{project.name || "Untitled"}</Link></td>
                  <td>{relatedName(project.developer)}</td>
                  <td><span className="ln-badge ln-badge-neutral">{String(project.status ?? "—")}</span></td>
                  <td>{project.location || "—"}</td>
                  <td>{new Date(project.updatedAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
