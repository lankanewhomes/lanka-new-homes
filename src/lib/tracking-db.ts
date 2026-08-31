import { supabaseAdmin } from "@/lib/supabase";

type LeadInput = {
  name: string;
  email: string;
  phone: string;
  preferredContactMethod: "Email" | "Phone" | "WhatsApp" | "Text";
  message: string;
  projectSlug: string;
  developerSlug: string;
  marketingOptIn?: boolean;
};

type ViewInput = {
  projectSlug: string;
  developerSlug: string;
  sessionId: string;
};

const makeId = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

export async function insertLead(input: LeadInput) {
  const id = makeId();
  const createdAt = new Date().toISOString();

  const { error } = await supabaseAdmin.from("leads").insert({
    id,
    name: input.name.trim(),
    email: input.email.trim().toLowerCase(),
    phone: input.phone.trim(),
    preferred_contact_method: input.preferredContactMethod,
    message: input.message.trim(),
    project_slug: input.projectSlug,
    developer_slug: input.developerSlug,
    marketing_opt_in: input.marketingOptIn ?? false,
    created_at: createdAt,
  });
  if (error) throw new Error(`Failed to save lead: ${error.message}`);

  return { id, createdAt };
}

export async function trackProjectView(input: ViewInput) {
  const since = new Date(Date.now() - 30 * 60 * 1000).toISOString();

  const { data: existing, error: readError } = await supabaseAdmin
    .from("project_views")
    .select("id")
    .eq("project_slug", input.projectSlug)
    .eq("session_id", input.sessionId)
    .gte("viewed_at", since)
    .limit(1)
    .maybeSingle();
  if (readError) throw new Error(`Failed to check existing view: ${readError.message}`);

  if (existing) {
    return { inserted: false };
  }

  const { error } = await supabaseAdmin.from("project_views").insert({
    project_slug: input.projectSlug,
    developer_slug: input.developerSlug,
    session_id: input.sessionId,
    viewed_at: new Date().toISOString(),
  });
  if (error) throw new Error(`Failed to track view: ${error.message}`);

  return { inserted: true };
}

export async function getRecentSessionViews(sessionId: string, limit: number): Promise<string[]> {
  const { data, error } = await supabaseAdmin
    .from("project_views")
    .select("project_slug")
    .eq("session_id", sessionId)
    .eq("event_type", "view")
    .order("viewed_at", { ascending: false })
    .limit(50);
  if (error) throw new Error(`Failed to load recent views: ${error.message}`);

  const slugs: string[] = [];
  const seen = new Set<string>();
  for (const row of data ?? []) {
    if (seen.has(row.project_slug)) continue;
    seen.add(row.project_slug);
    slugs.push(row.project_slug);
    if (slugs.length >= limit) break;
  }
  return slugs;
}

export async function getDeveloperDashboardStats(developerSlug: string) {
  const today = new Date().toISOString().slice(0, 10);

  const [totalLeads, totalViews, newLeadsToday] = await Promise.all([
    supabaseAdmin.from("leads").select("id", { count: "exact", head: true }).eq("developer_slug", developerSlug),
    supabaseAdmin.from("project_views").select("id", { count: "exact", head: true }).eq("developer_slug", developerSlug),
    supabaseAdmin
      .from("leads")
      .select("id", { count: "exact", head: true })
      .eq("developer_slug", developerSlug)
      .gte("created_at", `${today}T00:00:00.000Z`)
      .lt("created_at", `${today}T23:59:59.999Z`),
  ]);

  if (totalLeads.error) throw new Error(`Failed to load lead stats: ${totalLeads.error.message}`);
  if (totalViews.error) throw new Error(`Failed to load view stats: ${totalViews.error.message}`);
  if (newLeadsToday.error) throw new Error(`Failed to load today's lead stats: ${newLeadsToday.error.message}`);

  return {
    totalLeads: totalLeads.count ?? 0,
    totalViews: totalViews.count ?? 0,
    newLeadsToday: newLeadsToday.count ?? 0,
  };
}

export async function getProjectPerformance(developerSlug: string) {
  const [viewsResult, leadsResult] = await Promise.all([
    supabaseAdmin.from("project_views").select("project_slug").eq("developer_slug", developerSlug),
    supabaseAdmin.from("leads").select("project_slug").eq("developer_slug", developerSlug),
  ]);

  if (viewsResult.error) throw new Error(`Failed to load view performance: ${viewsResult.error.message}`);
  if (leadsResult.error) throw new Error(`Failed to load lead performance: ${leadsResult.error.message}`);

  const viewsMap = new Map<string, number>();
  for (const row of viewsResult.data ?? []) {
    viewsMap.set(row.project_slug, (viewsMap.get(row.project_slug) ?? 0) + 1);
  }

  const leadsMap = new Map<string, number>();
  for (const row of leadsResult.data ?? []) {
    leadsMap.set(row.project_slug, (leadsMap.get(row.project_slug) ?? 0) + 1);
  }

  return { viewsMap, leadsMap };
}
